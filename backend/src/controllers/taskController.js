const supabaseClient = require('../config/supabaseClient');

const VALID_STATUSES = ['Open', 'In Progress', 'Review', 'Done'];
const VALID_ESTIMATIONS = [1, 2, 3, 5, 8, 13];

const parseEstimationOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || !VALID_ESTIMATIONS.includes(parsed)) {
    return { error: `Invalid estimation. Must be one of: ${VALID_ESTIMATIONS.join(', ')}` };
  }
  return { value: parsed };
};

const handleTaskDbError = (res, error, actionMessage) => {
  // Common Postgres/Supabase validation errors that should not bubble as 500
  if (error?.code === '23514' || error?.code === '22P02' || error?.code === '23502') {
    return res.status(400).json({
      error: 'Validation error',
      message: error.message || actionMessage
    });
  }

  console.error(actionMessage, error);
  return res.status(500).json({
    error: 'Internal server error',
    message: actionMessage.includes('Create') ? 'Failed to create task' : 'Failed to update task'
  });
};

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
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid status. Must be one of: Open, In Progress, Review, Done'
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

    const parsedEstimation = parseEstimationOrNull(estimation);
    if (parsedEstimation?.error) {
      return res.status(400).json({
        error: 'Validation error',
        message: parsedEstimation.error
      });
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
        estimation: parsedEstimation?.value ?? null,
        responsible: responsible || null
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ task: data });
  } catch (error) {
    return handleTaskDbError(res, error, 'Create task error');
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
      const validStatuses = ['Open', 'In Progress', 'Review', 'Done'];
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
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid status. Must be one of: Open, In Progress, Review, Done'
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

    const parsedEstimation = parseEstimationOrNull(estimation);
    if (parsedEstimation?.error) {
      return res.status(400).json({
        error: 'Validation error',
        message: parsedEstimation.error
      });
    }

    // Build update object with only provided fields
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (status !== undefined) updates.status = status;
    if (due_date !== undefined) updates.due_date = due_date;
    if (parent_id !== undefined) updates.parent_id = parent_id;
    if (total_time_ms !== undefined) updates.total_time_ms = total_time_ms;
    if (estimation !== undefined) updates.estimation = parsedEstimation?.value ?? null;
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
    return handleTaskDbError(res, error, 'Update task error');
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

/**
 * Get all comments for a specific task
 */
const getComments = async (req, res) => {
  try {
    const { id: task_id } = req.params;
    const user_id = req.user.id;
    const rawLimit = Number.parseInt(String(req.query.limit ?? '50'), 10);
    const rawOffset = Number.parseInt(String(req.query.offset ?? '0'), 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
    const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

    if (!Number.isSafeInteger(offset + limit - 1)) {
      return res.status(400).json({ error: 'Invalid pagination range' });
    }

    const db = req.supabase || supabaseClient.supabase;

    // Verify task belongs to user
    const { data: task, error: taskErr } = await db
      .from('tasks')
      .select('id')
      .eq('id', task_id)
      .eq('user_id', user_id)
      .single();

    if (taskErr || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { data: comments, error } = await db
      .from('task_comments')
      .select('id, task_id, user_id, author_name, author_avatar, content, created_at')
      .eq('task_id', task_id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const MAX_COMMENT_LENGTH = 2000;
const COMMENT_COOLDOWN_MS = 1500;

const sanitizeCommentContent = (value = '') => {
  const escaped = String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
    .replace(/\u0000/g, '');

  return escaped.replace(/\s+/g, ' ').trim();
};

/**
 * Add a new comment to a task
 */
const addComment = async (req, res) => {
  try {
    const { id: task_id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }

    const sanitized = sanitizeCommentContent(content);
    if (!sanitized) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (sanitized.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: `Content exceeds max length (${MAX_COMMENT_LENGTH})` });
    }

    const db = req.supabase || supabaseClient.supabase;

    // Verify task belongs to user
    const { data: task, error: taskErr } = await db
      .from('tasks')
      .select('id')
      .eq('id', task_id)
      .eq('user_id', user_id)
      .single();

    if (taskErr || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // DB-backed cooldown (multi-instance safe)
    const cooldownSince = new Date(Date.now() - COMMENT_COOLDOWN_MS).toISOString();
    const { data: latestOwnComment } = await db
      .from('task_comments')
      .select('created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestOwnComment?.created_at && latestOwnComment.created_at > cooldownSince) {
      const elapsedMs = Date.now() - new Date(latestOwnComment.created_at).getTime();
      const retryAfterSeconds = Math.max(1, Math.ceil((COMMENT_COOLDOWN_MS - elapsedMs) / 1000));
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        error: `Please wait ${retryAfterSeconds}s before posting another comment.`,
        retry_after_seconds: retryAfterSeconds,
      });
    }

    // Get user profile for author info
    const { data: profile } = await db
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', user_id)
      .maybeSingle();

    const author_name = profile?.display_name || profile?.username || 'User';
    const author_avatar = profile?.avatar_url || null;

    const { data: comment, error } = await db
      .from('task_comments')
      .insert([{
        task_id,
        user_id,
        author_name,
        author_avatar,
        content: sanitized
      }])
      .select('id, task_id, user_id, author_name, author_avatar, content, created_at')
      .single();

    if (error) throw error;

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateComment = async (req, res) => {
  try {
    const { id: task_id, commentId } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }

    const sanitized = sanitizeCommentContent(content);
    if (!sanitized) return res.status(400).json({ error: 'Content is required' });
    if (sanitized.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: `Content exceeds max length (${MAX_COMMENT_LENGTH})` });
    }

    const db = req.supabase || supabaseClient.supabase;

    const { data: updated, error } = await db
      .from('task_comments')
      .update({ content: sanitized })
      .eq('id', commentId)
      .eq('task_id', task_id)
      .eq('user_id', user_id)
      .select('id, task_id, user_id, author_name, author_avatar, content, created_at')
      .single();

    if (error || !updated) {
      return res.status(404).json({ error: 'Comment not found or not allowed' });
    }

    res.status(200).json({ comment: updated });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id: task_id, commentId } = req.params;
    const user_id = req.user.id;
    const db = req.supabase || supabaseClient.supabase;

    const { data: deleted, error } = await db
      .from('task_comments')
      .delete()
      .eq('id', commentId)
      .eq('task_id', task_id)
      .eq('user_id', user_id)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Delete comment DB error:', error);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Comment not found or not allowed' });
    }

    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getComments,
  addComment,
  updateComment,
  deleteComment
};
