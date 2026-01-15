const { uploadAvatar, deleteAvatar, getProfile } = require('../../controllers/profileController');
const { createClientWithToken, supabase } = require('../../config/supabaseClient');

jest.mock('../../config/supabaseClient', () => ({
    createClientWithToken: jest.fn(),
    supabase: {
        storage: {
            from: jest.fn()
        },
        from: jest.fn()
    }
}));

describe('Profile Controller', () => {
    let req, res, mockClient;

    beforeEach(() => {
        req = {
            user: { id: 'test-user-id' },
            file: {
                originalname: 'avatar.png',
                mimetype: 'image/png',
                buffer: Buffer.from('fake-image-data'),
                size: 5000
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
                getPublicUrl: jest.fn(),
                remove: jest.fn()
            },
            from: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn()
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

    describe('getProfile', () => {
        it('should get profile successfully', async () => {
            mockClient.single.mockResolvedValue({
                data: { id: 'test-user-id', username: 'testuser', credits: 5 },
                error: null
            });

            await getProfile(req, res);

            expect(createClientWithToken).toHaveBeenCalledWith('test-token');
            expect(mockClient.from).toHaveBeenCalledWith('profiles');
            expect(mockClient.select).toHaveBeenCalledWith('*');
            expect(mockClient.eq).toHaveBeenCalledWith('id', 'test-user-id');
            expect(mockClient.single).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'test-user-id', username: 'testuser', credits: 5 });
        });

        it('should handle get profile error', async () => {
            mockClient.single.mockResolvedValue({
                data: null,
                error: { message: 'DB error' }
            });

            await getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to fetch profile' }));
        });

        it('should use default client if no token provided', async () => {
            req.headers.authorization = undefined;
            // When no token, it should use generic supabase client which we mocked in top
            // But getProfile code uses `createClientWithToken` only if token exists, else `supabase`.
            // Let's verify that path.

            // Mock default supabase client behavior
            supabase.from.mockReturnValue(mockClient); // Reuse the chain structure

            await getProfile(req, res);

            expect(createClientWithToken).not.toHaveBeenCalled();
            expect(supabase.from).toHaveBeenCalledWith('profiles');
        });
    });

    it('should return 400 if no file is provided', async () => {
        req.file = undefined;
        await uploadAvatar(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
    });

    it('should upload avatar and update profile successfully', async () => {
        mockClient.storage.upload.mockResolvedValue({ data: { path: 'test-user-id/avatar.png' }, error: null });
        mockClient.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://example.com/avatar.png' } });
        mockClient.single.mockResolvedValue({
            data: { id: 'test-user-id', username: 'testuser', avatar_url: 'http://example.com/avatar.png' },
            error: null
        });

        await uploadAvatar(req, res);

        expect(createClientWithToken).toHaveBeenCalledWith('test-token');
        expect(mockClient.storage.from).toHaveBeenCalledWith('Avatars');
        expect(mockClient.storage.upload).toHaveBeenCalledWith(
            expect.stringContaining('test-user-id/avatar_test-user-id_'),
            req.file.buffer,
            expect.objectContaining({ contentType: 'image/png', upsert: true })
        );

        expect(mockClient.from).toHaveBeenCalledWith('profiles');
        expect(mockClient.update).toHaveBeenCalledWith(expect.objectContaining({
            avatar_url: 'http://example.com/avatar.png'
        }));
        expect(mockClient.eq).toHaveBeenCalledWith('id', 'test-user-id');

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Avatar uploaded and profile updated successfully',
            avatarUrl: 'http://example.com/avatar.png'
        }));
    });

    it('should handle storage upload error', async () => {
        mockClient.storage.upload.mockResolvedValue({ data: null, error: { message: 'Storage error' } });

        await uploadAvatar(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to upload avatar to storage' }));
    });

    it('should handle database update error', async () => {
        mockClient.storage.upload.mockResolvedValue({ data: { path: '...' }, error: null });
        mockClient.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: '...' } });
        mockClient.single.mockResolvedValue({ data: null, error: { message: 'Db error' } });

        await uploadAvatar(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to update profile with avatar URL' }));
    });

    describe('deleteAvatar', () => {
        it('should return 400 if user has no avatar', async () => {
            mockClient.single.mockResolvedValue({
                data: { avatar_url: null },
                error: null
            });

            await deleteAvatar(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'No avatar to delete' });
        });

        it('should delete avatar successfully', async () => {
            mockClient.single.mockResolvedValueOnce({
                data: { avatar_url: 'http://example.com/Avatars/test-user-id/avatar.jpg' },
                error: null
            });
            mockClient.storage.from.mockReturnThis();
            mockClient.storage.remove.mockResolvedValue({ data: [], error: null });
            mockClient.single.mockResolvedValueOnce({
                data: { id: 'test-user-id', avatar_url: null },
                error: null
            });

            await deleteAvatar(req, res);

            expect(mockClient.storage.from).toHaveBeenCalledWith('Avatars');
            expect(mockClient.storage.remove).toHaveBeenCalledWith(['test-user-id/avatar.jpg']);
            expect(mockClient.update).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: null }));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Avatar deleted successfully' }));
        });

        it('should handle partial failure (storage delete fails but DB updates)', async () => {
            mockClient.single.mockResolvedValueOnce({
                data: { avatar_url: 'http://example.com/Avatars/test-user-id/avatar.jpg' },
                error: null
            });
            mockClient.storage.from.mockReturnThis();
            mockClient.storage.remove.mockResolvedValue({ data: null, error: { message: 'Storage error' } });
            mockClient.single.mockResolvedValueOnce({
                data: { id: 'test-user-id', avatar_url: null },
                error: null
            });

            await deleteAvatar(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Avatar deleted successfully' }));
        });
    });
});
