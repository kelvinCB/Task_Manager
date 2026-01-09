const request = require('supertest');
const express = require('express');
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
    });

    afterEach(() => {
        delete process.env.OPENAI_API_KEY;
    });

    describe('POST /api/ai/chat', () => {
        it('should return 400 if model parameter is missing', async () => {
            // Mock OpenAI returning 400 for missing model
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
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('chat/completions'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-api-key'
                    })
                })
            );
        });

        it('should handle OpenAI API errors', async () => {
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
        });
    });
});
