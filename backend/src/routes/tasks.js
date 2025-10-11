const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/authMiddleware');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

// Apply authentication middleware to all task routes
router.use(authenticateUser);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private (requires authentication)
 * @body    { title, description?, status?, due_date?, parent_id? }
 */
router.post('/', createTask);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for authenticated user
 * @access  Private (requires authentication)
 * @query   status? - Filter tasks by status (todo|in_progress|done)
 */
router.get('/', getTasks);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a specific task by ID
 * @access  Private (requires authentication, user must own the task)
 * @params  id - Task ID
 */
router.get('/:id', getTaskById);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 * @access  Private (requires authentication, user must own the task)
 * @params  id - Task ID
 * @body    { title?, description?, status?, due_date?, parent_id? }
 */
router.put('/:id', updateTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private (requires authentication, user must own the task)
 * @params  id - Task ID
 */
router.delete('/:id', deleteTask);

module.exports = router;
