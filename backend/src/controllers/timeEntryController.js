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

    const { data, error } = await db
      .from('time_entries')
      .insert([{ task_id, user_id, start_time: start_time || new Date().toISOString(), end_time: null }])
      .select()
      .single();

    if (error) throw error;
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

module.exports = { startEntry, stopEntry, getSummary };

