// Set API key for tests before anything else
process.env.OPENAI_API_KEY = 'test-key';

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Mock setup
// We mock the client module completely
jest.mock('../../config/supabaseClient', () => {
    // Define mock functions for the chain
    const mockSelect = jest.fn();
    const mockUpdate = jest.fn();
    const mockFrom = jest.fn(() => ({
        select: mockSelect,
        update: mockUpdate
    }));

    const mockSupabase = {
        from: mockFrom,
        storage: { from: jest.fn() }
    };

    return {
        createClientWithToken: () => mockSupabase,
        supabase: mockSupabase,
        // Expose mocks for test manipulation
        _mocks: {
            select: mockSelect,
            update: mockUpdate,
            from: mockFrom
        }
    };
});

jest.mock('../../middlewares/authMiddleware', () => ({
    authenticateUser: (req, res, next) => {
        req.user = { id: 'test-user-id' };
        next();
    }
}));

// Import AFTER mocks
const aiRouter = require('../../routes/ai');
const { _mocks } = require('../../config/supabaseClient');

const app = express();
app.use(bodyParser.json());
app.use('/api/ai', aiRouter);

describe('AI Routes - Image Generation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Just in case
        process.env.OPENAI_API_KEY = 'test-key';
    });

    test('POST /generate-image should return 403 if insufficient credits', async () => {
        // Setup mock: profile with 2 credits
        // userClient.from().select().eq().single()
        const mockSingle = jest.fn().mockResolvedValue({ data: { credits: 2 }, error: null });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        _mocks.select.mockReturnValue({ eq: mockEq });

        const res = await request(app)
            .post('/api/ai/generate-image')
            .send({ prompt: 'A test image' });

        expect(res.statusCode).toBe(403);
        expect(res.body.error.message).toContain('Insufficient credits');
    });

    test('POST /generate-image should deduct 3 credits and return success', async () => {
        // 1. Check Credits
        const mockSingleSelect = jest.fn().mockResolvedValue({ data: { credits: 10 }, error: null });
        const mockEqSelect = jest.fn().mockReturnValue({ single: mockSingleSelect });
        _mocks.select.mockReturnValue({ eq: mockEqSelect });

        // 2. Deduct Credits
        // userClient.from().update().eq()
        const mockEqUpdate = jest.fn().mockResolvedValue({ data: { credits: 7 }, error: null });
        _mocks.update.mockReturnValue({ eq: mockEqUpdate });

        // Mock fetch for OpenAI
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                created: 1234567890,
                data: [{ url: 'https://example.com/image.png' }]
            })
        });

        const res = await request(app)
            .post('/api/ai/generate-image')
            .send({ prompt: 'A cool landscape' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data[0].url).toBe('https://example.com/image.png');

        // Check deduction call: update({ credits: 10 - 3 })
        expect(_mocks.update).toHaveBeenCalledWith({ credits: 7 });
    });
});
