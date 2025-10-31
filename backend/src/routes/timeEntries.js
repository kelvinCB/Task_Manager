const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/authMiddleware');
const { startEntry, stopEntry, getSummary, completeEntry } = require('../controllers/timeEntryController');

router.use(authenticateUser);

// Start a time entry
router.post('/start', startEntry);

// Stop a time entry
router.post('/stop', stopEntry);

// Get summary for a period: ?start=ISO&end=ISO
router.get('/summary', getSummary);

// Record a single summary row when task is completed
router.post('/complete', completeEntry);

module.exports = router;
