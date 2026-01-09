const { createFeatureRequest, getFeatureRequests } = require('../../controllers/featureRequestController');
const { supabase } = require('../../config/supabaseClient');

jest.mock('../../config/supabaseClient', () => ({
    supabase: {
        from: jest.fn()
    }
}));

describe('Feature Request Controller', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            body: {},
            user: { id: 'user-123' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('createFeatureRequest', () => {
        it('should create a feature request successfully', async () => {
            mockReq.body = { description: 'New idea', type: 'feature', priority: 'High' };
            const mockData = { id: 'req-1', ...mockReq.body, user_id: 'user-123' };

            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({ data: [mockData], error: null })
                })
            });

            await createFeatureRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(mockData);
        });

        it('should return 400 if description is missing', async () => {
            mockReq.body = { type: 'feature' };

            await createFeatureRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Description is required' });
        });

        it('should return 400 if type is invalid', async () => {
            mockReq.body = { description: 'Valid', type: 'invalid' };

            await createFeatureRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid type. Must be bug, help, or feature' });
        });
    });

    describe('getFeatureRequests', () => {
        it('should fetch user requests successfully', async () => {
            const mockData = [{ id: 'req-1', description: 'Test' }];

            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
                    })
                })
            });

            await getFeatureRequests(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockData);
        });
    });
});
