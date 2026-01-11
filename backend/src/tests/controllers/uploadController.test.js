const { uploadFile } = require('../../controllers/uploadController');
const { createClientWithToken, supabase } = require('../../config/supabaseClient');

jest.mock('../../config/supabaseClient', () => ({
  createClientWithToken: jest.fn(),
  supabase: {
    storage: {
      from: jest.fn()
    }
  }
}));

describe('Upload Controller', () => {
  let req, res, mockClient;

  beforeEach(() => {
    req = {
      user: { id: 'test-user-id' },
      file: {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1234
      },
      headers: {
        authorization: 'Bearer test-token'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockClient = {
      storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn(),
        getPublicUrl: jest.fn()
      }
    };

    createClientWithToken.mockReturnValue(mockClient);

    // Silence console output during tests
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should return 400 if no file is provided', async () => {
    req.file = undefined;
    await uploadFile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
  });

  it('should upload file successfully using user token', async () => {
    mockClient.storage.upload.mockResolvedValue({ data: { path: 'path/to/file' }, error: null });
    mockClient.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/file.jpg' } });

    await uploadFile(req, res);

    expect(createClientWithToken).toHaveBeenCalledWith('test-token');
    expect(mockClient.storage.from).toHaveBeenCalledWith('Attachments');
    expect(mockClient.storage.upload).toHaveBeenCalledWith(
      expect.stringContaining('test-user-id/'),
      expect.any(Buffer),
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'File uploaded successfully',
      file: expect.objectContaining({
        url: 'http://example.com/file.jpg'
      })
    }));
  });

  it('should handle upload error from Supabase', async () => {
    mockClient.storage.upload.mockResolvedValue({ data: null, error: { message: 'Storage error' } });

    await uploadFile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to upload file to storage' }));
  });

  it('should handle exception', async () => {
    createClientWithToken.mockImplementation(() => { throw new Error('Client error'); });
    await uploadFile(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error during upload' });
  });
});
