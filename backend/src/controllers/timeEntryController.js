const { supabase } = require('../config/supabaseClient');

// Start a time entry for a task
const startEntry = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { task_id, start_time } = req.body;

    if (!task_id) {
      return res.status(400).json({ error: 'Validation error', message: 'task_id is required' });
    }

    const db = req.supabase || supabase;

    // 1. Check if an active timer already exists for this task
    const { data: existingEntry, error: checkErr } = await db
      .from('time_entries')
      .select('*')
      .eq('task_id', task_id)
      .eq('user_id', user_id)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingEntry) {
      return res.status(200).json({
        message: 'A timer is already active for this task',
        entry: existingEntry
      });
    }

    // 2. Ensure task belongs to user and update status if needed
    const { data: task, error: taskErr } = await db
      .from('tasks')
      .select('id, user_id, status')
      .eq('id', task_id)
      .eq('user_id', user_id)
      .single();

    if (taskErr || !task) {
      return res.status(404).json({ error: 'Not found', message: 'Task not found' });
    }

    // Automatically move task to 'In Progress' if it's not already
    if (task.status !== 'In Progress') {
      await db
        .from('tasks')
        .update({ status: 'In Progress' })
        .eq('id', task_id)
        .eq('user_id', user_id);
    }

    const { data, error } = await db
      .from('time_entries')
      .insert([{ task_id, user_id, start_time: start_time || new Date().toISOString(), end_time: null }])
      .select()
      .single();

    res.status(201).json({ entry: data });
  } catch (error) {
    console.error('Start time entry error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Failed to start time entry' });
  }
};

// Stop an existing time entry (by id) or the latest open entry for a task
const stopEntry = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { entry_id, task_id, end_time } = req.body;
    const db = req.supabase || supabase;

    // Find entry
    let entryQuery = db.from('time_entries').select('*').eq('user_id', user_id).is('end_time', null);
    if (entry_id) entryQuery = entryQuery.eq('id', entry_id);
    if (task_id) entryQuery = entryQuery.eq('task_id', task_id);

    const { data: entry, error: findErr } = await entryQuery.order('start_time', { ascending: false }).limit(1).single();
    if (findErr || !entry) {
      return res.status(404).json({ error: 'Not found', message: 'Open time entry not found' });
    }

    const { data, error } = await (req.supabase || supabase)
      .from('time_entries')
      .update({ end_time: end_time || new Date().toISOString() })
      .eq('id', entry.id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;

    // Sync task's total_time_ms
    await syncTaskTotalTime(db, entry.task_id, user_id);

    res.status(200).json({ entry: data });
  } catch (error) {
    console.error('Stop time entry error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Failed to stop time entry' });
  }
};

// Summary for a period
const getSummary = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { start, end } = req.query; // ISO strings
    const db = req.supabase || supabase;

    let query = db
      .from('time_entries')
      .select('id, task_id, start_time, end_time')
      .eq('user_id', user_id);

    if (start) query = query.gte('start_time', start);
    if (end) query = query.lte('start_time', end);

    const { data: entries, error } = await query;
    if (error) throw error;

    // Aggregate durations client-side
    const totals = new Map();
    for (const e of entries) {
      const startTime = new Date(e.start_time).getTime();
      const endTime = e.end_time ? new Date(e.end_time).getTime() : Date.now();
      const dur = Math.max(0, endTime - startTime);
      totals.set(e.task_id, (totals.get(e.task_id) || 0) + dur);
    }

    // Join with tasks for titles
    const taskIds = Array.from(totals.keys());
    let tasks = [];
    if (taskIds.length) {
      const { data: tdata, error: terr } = await db
        .from('tasks')
        .select('id, title, status')
        .in('id', taskIds)
        .eq('user_id', user_id);
      if (terr) throw terr;
      tasks = tdata || [];
    }

    const result = tasks.map(t => ({ id: String(t.id), title: t.title, status: t.status, timeSpent: totals.get(t.id) }));
    res.status(200).json({ stats: result });
  } catch (error) {
    console.error('Get time summary error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Failed to fetch time stats' });
  }
};

// record a single summary row when a task is completed/stopped with a specific duration
const completeEntry = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { task_id, duration_ms } = req.body;

    if (!task_id || duration_ms === undefined) {
      return res.status(400).json({ error: 'Validation error', message: 'task_id and duration_ms are required' });
    }

    const db = req.supabase || supabase;

    // Ensure task belongs to user
    const { data: task, error: taskErr } = await db
      .from('tasks')
      .select('id, user_id')
      .eq('id', task_id)
      .eq('user_id', user_id)
      .single();

    if (taskErr || !task) {
      return res.status(404).json({ error: 'Not found', message: 'Task not found' });
    }

    const end = new Date();
    const start = new Date(end.getTime() - Math.max(0, Number(duration_ms)));

    const { data, error } = await db
      .from('time_entries')
      .insert([{ task_id, user_id, start_time: start.toISOString(), end_time: end.toISOString() }])
      .select()
      .single();

    if (error) throw error;

    // Sync task's total_time_ms
    await syncTaskTotalTime(db, task_id, user_id);

    res.status(201).json({ entry: data });
  } catch (error) {
    console.error('Complete time entry error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Failed to record time summary' });
  }
};

const syncTaskTotalTime = async (db, task_id, user_id) => {
  try {
    // 1. Get all time entries for this task
    const { data: entries, error: entriesErr } = await db
      .from('time_entries')
      .select('start_time, end_time')
      .eq('task_id', task_id)
      .eq('user_id', user_id);

    if (entriesErr) throw entriesErr;

    // 2. Calculate sum of durations
    let total_ms = 0;
    for (const e of entries || []) {
      const start = new Date(e.start_time).getTime();
      // Only include entries that have an end_time (completed sessions)
      if (e.end_time) {
        const end = new Date(e.end_time).getTime();
        total_ms += Math.max(0, end - start);
      }
    }

    // 3. Update the tasks table
    const { error: updateErr } = await db
      .from('tasks')
      .update({ total_time_ms: total_ms })
      .eq('id', task_id)
      .eq('user_id', user_id);

    if (updateErr) throw updateErr;

    return total_ms;
  } catch (err) {
    console.error(`Error syncing total time for task ${task_id}:`, err);
    return null;
  }
};

module.exports = { startEntry, stopEntry, getSummary, completeEntry };
