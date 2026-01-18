const supabaseClient = require('../config/supabaseClient');

/**
 * Create a new task
 * Automatically assigns the authenticated user's ID to the task
 */
const createTask = async (req, res) => {
  try {
    const { title, description, status, due_date, parent_id, total_time_ms, estimation, responsible } = req.body;
    const user_id = req.user.id;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Title is required'
      });
    }

    // Validate status if provided
    const validStatuses = ['Open', 'In Progress', 'Done'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid status. Must be one of: Open, In Progress, Done'
      });
    }

    // If parent_id is provided, verify it exists and belongs to the user
    if (parent_id) {
      const { data: parentTask, error: parentError } = await supabaseClient.supabase
        .from('tasks')
        .select('id, user_id')
        .eq('id', parent_id)
        .eq('user_id', user_id)
        .single();

      if (parentError || !parentTask) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Parent task not found or does not belong to you'
        });
      }
    }

    // Choose RLS-aware client if available
    const db = req.supabase || supabaseClient.supabase;

    // Create the task
    const { data, error } = await db
      .from('tasks')
      .insert([{
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'Open',
        due_date: due_date || null,
        parent_id: parent_id || null,
        user_id,
        total_time_ms: total_time_ms ?? 0,
        estimation: estimation || null,
        responsible: responsible || null
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ task: data });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create task'
    });
  }
};

/**
 * Get all tasks for the authenticated user
 * Supports optional filtering by status
 */
const getTasks = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status } = req.query;

    const db = req.supabase || supabaseClient.supabase;

    let query = db
      .from('tasks')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      const validStatuses = ['Open', 'In Progress', 'Done'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid status filter'
        });
      }
      query = query.eq('status', status);
    }

    const { data: tasks, error } = await query;

    if (error) {
      throw error;
    }

    // Fetch active time entries for this user to inject into tasks
    const { data: activeEntries, error: activeErr } = await db
      .from('time_entries')
      .select('task_id, start_time')
      .eq('user_id', user_id)
      .is('end_time', null);

    const activeMap = new Map();
    if (!activeErr && activeEntries) {
      activeEntries.forEach(entry => {
        activeMap.set(entry.task_id, entry.start_time);
      });
    }

    const tasksWithActiveInfo = (tasks || []).map(task => ({
      ...task,
      active_start_time: activeMap.get(task.id) || null
    }));

    res.status(200).json({ tasks: tasksWithActiveInfo });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch tasks'
    });
  }
};

/**
 * Get a specific task by ID
 * Only returns the task if it belongs to the authenticated user
 */
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Validate ID format
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid task ID'
      });
    }

    const db = req.supabase || supabaseClient.supabase;
    const { data, error } = await db
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Task not found'
      });
    }

    // Check if there is an active timer for this specific task
    const { data: activeEntry } = await db
      .from('time_entries')
      .select('start_time')
      .eq('task_id', id)
      .eq('user_id', user_id)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    const taskWithActiveInfo = {
      ...data,
      active_start_time: activeEntry ? activeEntry.start_time : null
    };

    res.status(200).json({ task: taskWithActiveInfo });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch task'
    });
  }
};

/**
 * Update a task
 * Only allows updates to tasks that belong to the authenticated user
 */
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const { title, description, status, due_date, parent_id, total_time_ms, estimation, responsible } = req.body;

    // Validate ID format
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid task ID'
      });
    }

    // Check if task exists and belongs to user
    const db = req.supabase || supabaseClient.supabase;
    const { data: existingTask, error: fetchError } = await db
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !existingTask) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Task not found'
      });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['Open', 'In Progress', 'Done'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid status. Must be one of: Open, In Progress, Done'
        });
      }
    }

    // If parent_id is being changed, verify it exists and belongs to the user
    if (parent_id !== undefined && parent_id !== existingTask.parent_id) {
      if (parent_id === null) {
        // Removing parent is allowed
      } else if (parseInt(parent_id) === parseInt(id)) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'A task cannot be its own parent'
        });
      } else {
        const { data: parentTask, error: parentError } = await (req.supabase || supabaseClient.supabase)
          .from('tasks')
          .select('id, user_id')
          .eq('id', parent_id)
          .eq('user_id', user_id)
          .single();

        if (parentError || !parentTask) {
          return res.status(404).json({
            error: 'Not found',
            message: 'Parent task not found or does not belong to you'
          });
        }
      }
    }

    // Build update object with only provided fields
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (status !== undefined) updates.status = status;
    if (due_date !== undefined) updates.due_date = due_date;
    if (parent_id !== undefined) updates.parent_id = parent_id;
    if (total_time_ms !== undefined) updates.total_time_ms = total_time_ms;
    if (estimation !== undefined) updates.estimation = estimation;
    if (responsible !== undefined) updates.responsible = responsible;

    // Validate that at least one field is being updated
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'No fields to update'
      });
    }

    // Validate title if it's being updated
    if (updates.title !== undefined && !updates.title) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Title cannot be empty'
      });
    }

    // Update the task
    const { data, error } = await (req.supabase || supabaseClient.supabase)
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({ task: data });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update task'
    });
  }
};

/**
 * Delete a task
 * Only allows deletion of tasks that belong to the authenticated user
 * Also deletes all child tasks (cascading delete is handled by database)
 */
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Validate ID format
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid task ID'
      });
    }

    // Check if task exists and belongs to user
    const { data: existingTask, error: fetchError } = await (req.supabase || supabaseClient.supabase)
      .from('tasks')
      .select('id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !existingTask) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Task not found'
      });
    }

    // Delete the task (child tasks will be deleted by CASCADE)
    const { error } = await (req.supabase || supabaseClient.supabase)
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: 'Task deleted successfully',
      task_id: id
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete task'
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
};
