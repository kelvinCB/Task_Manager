const request = require('supertest');
const express = require('express');

jest.mock('../../middlewares/authMiddleware', () => ({
    authenticateUser: (req, res, next) => {
        req.user = { id: 'test-user-id' };
        next();
    }
}));

jest.mock('../../config/supabaseClient', () => {
    // --- Mock Functions ---
    const mockSingle = jest.fn();
    const mockSelectEq = jest.fn();
    const mockSelect = jest.fn();
    const mockFrom = jest.fn();

    const mockUpdateEq = jest.fn();
    const mockUpdate = jest.fn();

    // --- Chains ---

    // 1. Select Chain ( returned by .select() )
    // Flow: .select(...) -> returns selectChain -> .eq(...) -> returns selectChain -> .single() -> returns Promise
    const selectChain = {
        eq: mockSelectEq,
        single: mockSingle
    };
    // Wire up:
    mockSelectEq.mockImplementation(() => selectChain);

    // 2. Update Chain ( returned by .update() )
    // Flow: .update(...) -> returns updateChain -> .eq(...) -> returns Promise
    const updateChain = {
        eq: mockUpdateEq
    };
    // (mockUpdateEq returns Promise by default via mockResolvedValue later)

    // 3. Initial Builder ( returned by .from() )
    // Flow: .from(...) -> returns builder -> .select() OR .update()
    const initialBuilder = {
        select: mockSelect,
        update: mockUpdate
    };
    // Wire up:
    mockSelect.mockImplementation(() => selectChain);
    mockUpdate.mockImplementation(() => updateChain);

    // 4. Client ( returned by createClientWithToken )
    // Flow: client.from(...)
    const client = {
        from: mockFrom
    };
    // Wire up:
    mockFrom.mockImplementation(() => initialBuilder);


    return {
        createClientWithToken: jest.fn(() => client),
        supabase: client,
        _mocks: {
            mockSingle, mockSelectEq, mockSelect, mockFrom,
            mockUpdate, mockUpdateEq,
            selectChain, updateChain, initialBuilder, client
        }
    };
});

const { _mocks } = require('../../config/supabaseClient');
const aiRoutes = require('../../routes/ai');

// Mock fetch globally
global.fetch = jest.fn();

const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);

describe('AI Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.OPENAI_API_KEY = 'test-api-key';

        // Restore implementations (important if clear/reset touches them)
        _mocks.mockFrom.mockImplementation(() => _mocks.initialBuilder);
        _mocks.mockSelect.mockImplementation(() => _mocks.selectChain);
        _mocks.mockSelectEq.mockImplementation(() => _mocks.selectChain);
        _mocks.mockUpdate.mockImplementation(() => _mocks.updateChain);

        // Default Success Responses
        _mocks.mockSingle.mockResolvedValue({
            data: { id: 'test-user-id', credits: 5 },
            error: null
        });

        // Update.eq(...) should resolve to success
        _mocks.mockUpdateEq.mockResolvedValue({ error: null });
    });

    afterEach(() => {
        delete process.env.OPENAI_API_KEY;
    });

    describe('POST /api/ai/chat', () => {
        it('should return 400 if model parameter is missing', async () => {
            _mocks.mockSingle.mockResolvedValue({
                data: { credits: 5 },
                error: null
            });

            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: { message: 'you must provide a model parameter' } })
            });

            const res = await request(app)
                .post('/api/ai/chat')
                .send({
                    messages: [{ role: 'user', content: 'hello' }]
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should return 500 if API key is not configured', async () => {
            delete process.env.OPENAI_API_KEY;

            const res = await request(app)
                .post('/api/ai/chat')
                .send({
                    model: 'gpt-4',
                    messages: [{ role: 'user', content: 'hello' }]
                });

            expect(res.statusCode).toBe(500);
            expect(res.body.error.message).toContain('not configured');
        });

        it('should proxy request to OpenAI and return result', async () => {
            const mockOpenAIResponse = {
                choices: [{ message: { content: 'AI response' } }]
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockOpenAIResponse
            });

            const res = await request(app)
                .post('/api/ai/chat')
                .send({
                    model: 'gpt-4',
                    messages: [{ role: 'user', content: 'test' }]
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockOpenAIResponse);

            // Check credit verification
            expect(_mocks.mockFrom).toHaveBeenCalledWith('profiles');
            expect(_mocks.mockSelect).toHaveBeenCalledWith('credits');
            expect(_mocks.mockSelectEq).toHaveBeenCalledWith('id', 'test-user-id');

            // Check credit deduction
            expect(_mocks.mockUpdate).toHaveBeenCalledWith({ credits: 4 });
            expect(_mocks.mockUpdateEq).toHaveBeenCalledWith('id', 'test-user-id');
        });

        it('should return 403 if user has no credits', async () => {
            _mocks.mockSingle.mockResolvedValue({
                data: { credits: 0 },
                error: null
            });

            const res = await request(app)
                .post('/api/ai/chat')
                .send({
                    model: 'gpt-4',
                    messages: [{ role: 'user', content: 'test' }]
                });

            expect(res.statusCode).toBe(403);
            expect(res.body.error.message).toContain('no credits left');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should handle OpenAI API errors', async () => {
            _mocks.mockSingle.mockResolvedValue({
                data: { credits: 5 },
                error: null
            });

            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ error: { message: 'Invalid key' } })
            });

            const res = await request(app)
                .post('/api/ai/chat')
                .send({
                    model: 'gpt-4',
                    messages: [{ role: 'user', content: 'test' }]
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.error.message).toBe('Invalid key');

            // Should NOT deduct credit on error
            expect(_mocks.mockUpdate).not.toHaveBeenCalled();
        });
    });
});
