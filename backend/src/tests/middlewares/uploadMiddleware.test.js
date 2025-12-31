const upload = require('../../middlewares/uploadMiddleware');

describe('Upload Middleware', () => {
  describe('upload configuration', () => {
    it('should be a multer instance', () => {
      expect(upload).toBeDefined();
      expect(typeof upload).toBe('object');
    });

    it('should enforce 10MB file size limit', () => {
      // Check that limits are configured
      expect(upload.limits).toBeDefined();
      expect(upload.limits.fileSize).toBe(10 * 1024 * 1024); // 10MB in bytes
    });

    it('should use memory storage', () => {
      // Check that storage is configured (memory storage)
      expect(upload.storage).toBeDefined();
    });
  });

  describe('fileFilter functionality', () => {
    let req, file, cb;

    beforeEach(() => {
      req = {};
      cb = jest.fn();
    });

    const testFileAcceptance = (filename, mimetype, shouldAccept = true) => {
      file = { originalname: filename, mimetype };
      // Execute the fileFilter from the multer configuration
      if (upload.fileFilter) {
        upload.fileFilter(req, file, cb);
        if (shouldAccept) {
          expect(cb).toHaveBeenCalledWith(null, true);
        } else {
          expect(cb).toHaveBeenCalledWith(
            expect.objectContaining({
              message: expect.stringContaining('Invalid file type')
            }),
            false
          );
        }
      }
    };

    it('should accept valid JPEG files', () => {
      testFileAcceptance('test.jpg', 'image/jpeg', true);
    });

    it('should accept valid PNG files', () => {
      testFileAcceptance('test.png', 'image/png', true);
    });

    it('should accept valid JPG files', () => {
      testFileAcceptance('test.jpg', 'image/jpg', true);
    });

    it('should accept valid DOCX files', () => {
      testFileAcceptance('document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', true);
    });

    it('should accept valid XLSX files', () => {
      testFileAcceptance('spreadsheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true);
    });

    it('should accept valid PPTX files', () => {
      testFileAcceptance('presentation.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', true);
    });

    it('should accept valid CSV files', () => {
      testFileAcceptance('data.csv', 'text/csv', true);
    });

    it('should accept valid MP3 files', () => {
      testFileAcceptance('audio.mp3', 'audio/mpeg', true);
    });

    it('should accept valid MP4 files', () => {
      testFileAcceptance('video.mp4', 'video/mp4', true);
    });

    it('should reject invalid file types by MIME', () => {
      testFileAcceptance('file.exe', 'application/x-msdownload', false);
    });

    it('should accept files with valid extension even if MIME is generic', () => {
      testFileAcceptance('document.docx', 'application/octet-stream', true);
    });

    it('should reject files with invalid extension and generic MIME', () => {
      testFileAcceptance('malicious.exe', 'application/octet-stream', false);
    });

    it('should reject files with no valid extension', () => {
      testFileAcceptance('noextension', 'application/unknown', false);
    });

    it('should accept DOC files', () => {
      testFileAcceptance('document.doc', 'application/msword', true);
    });

    it('should accept XLS files', () => {
      testFileAcceptance('spreadsheet.xls', 'application/vnd.ms-excel', true);
    });

    it('should accept PPT files', () => {
      testFileAcceptance('presentation.ppt', 'application/vnd.ms-powerpoint', true);
    });
  });
});
