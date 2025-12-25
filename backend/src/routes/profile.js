const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// POST /api/profile/avatar - Upload profile avatar
router.post('/avatar', authenticateUser, upload.single('avatar'), profileController.uploadAvatar);

// DELETE /api/profile/avatar - Delete profile avatar
router.delete('/avatar', authenticateUser, profileController.deleteAvatar);

module.exports = router;
