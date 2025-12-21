const express = require('express');
const router = express.Router();
console.log('LOADING UPLOAD ROUTES MODULE');
const { authenticateUser } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const uploadController = require('../controllers/uploadController');

// Route: POST /api/upload
// Description: Upload a file (Docs, Images, Media)
// Access: Private (Authenticated users only)
router.post('/', authenticateUser, upload.single('file'), uploadController.uploadFile);

router.get('/test', (req, res) => {
    res.json({ message: 'Upload route is working' });
});

module.exports = router;
