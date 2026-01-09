const express = require('express');
const router = express.Router();
const featureRequestController = require('../controllers/featureRequestController');
const { authenticateUser } = require('../middlewares/authMiddleware');

// Optional authentication for creating requests (allows anonymous feedback)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        return authenticateUser(req, res, next);
    }
    next();
};

// Route to create a new feature request / bug report / help query
router.post('/', optionalAuth, featureRequestController.createFeatureRequest);

// Route to get current user's requests (requires auth)
router.get('/my', authenticateUser, featureRequestController.getFeatureRequests);

module.exports = router;
