const express = require('express');
const router = express.Router();
const {
    verifyAdminSecret,
    getUserCredits,
    addUserCredits,
    setUserCredits
} = require('../controllers/adminController');

// Apply Admin Secret verification to all routes in this router
router.use(verifyAdminSecret);

// GET /api/admin/credits/:userId
router.get('/credits/:userId', getUserCredits);

// POST /api/admin/credits/add
router.post('/credits/add', addUserCredits);

// POST /api/admin/credits/set
router.post('/credits/set', setUserCredits);

module.exports = router;
