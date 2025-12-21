const multer = require('multer');
const path = require('path');

// Configure storage (memory storage for handling files before Supabase upload)
const storage = multer.memoryStorage();

// File filter to validate allowed types
const fileFilter = (req, file, cb) => {
  // Allowed extensions/MIME types
  // Images: PNG, JPG, JPEG
  // Documents: Word, PPT, Excel, CSV
  // Media: MP3, MP4
  
  const allowedMimes = [
    'image/jpeg', 
    'image/png', 
    'image/jpg',
    'application/msword', // doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-excel', // xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-powerpoint', // ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'text/csv',
    'audio/mpeg', // mp3
    'video/mp4'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Check key extensions if mimetype is generic (e.g. application/octet-stream sometimes happens)
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.mp3', '.mp4'];
    
    if (allowedExts.includes(ext)) {
       cb(null, true);
    } else {
       cb(new Error('Invalid file type. Allowed types: Word, Excel, PPT, CSV, PNG, JPG, MP3, MP4'), false);
    }
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

module.exports = upload;
