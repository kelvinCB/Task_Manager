import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIService, openaiService } from '../../services/openaiService';

// Mock environment variables
const mockEnv = {
  // Secure key simulation
  OPENAI_API_KEY: 'test-api-key',
  VITE_OPENAI_BASE_URL: 'https://api.openai.com/v1',
  VITE_OPENAI_MODEL: 'gpt-4o'
};

// Mock fetch
global.fetch = vi.fn();

// Mock import.meta.env at module level
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: mockEnv
    }
  },
  configurable: true
});

describe('OpenAIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with proxy URL', () => {
      const service = new OpenAIService();
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('generateTaskDescription', () => {
    let service: OpenAIService;

    beforeEach(() => {
      service = new OpenAIService();
    });

    it('should generate task description successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated task description for implementing user authentication'
            }
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.generateTaskDescription('Implement user authentication');

      expect(result).toBe('Generated task description for implementing user authentication');
      expect(fetch).toHaveBeenCalledWith(
        '/api/ai/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('FORMATTING RULES')
        })
      );

      const fetchCall = (fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemMessage = requestBody.messages.find((m: any) => m.role === 'system');

      expect(systemMessage.content).toContain('Use Markdown for formatting');
    });

    it('should handle O4 model parameters', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated task description'
            }
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await service.generateTaskDescription('Test task', 'o4-mini');

      const fetchCall = (fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.model).toBe('o4-mini');
      expect(requestBody.max_completion_tokens).toBe(4500);
    });

    it('should handle standard GPT model parameters', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated task description'
            }
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await service.generateTaskDescription('Test task', 'gpt-4');

      const fetchCall = (fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.model).toBe('gpt-4');
      expect(requestBody.max_tokens).toBe(500);
      expect(requestBody.temperature).toBe(0.7);
    });

    it('should throw error for empty task title', async () => {
      await expect(service.generateTaskDescription('')).rejects.toThrow(
        'Task title is required to generate description'
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only task title', async () => {
      await expect(service.generateTaskDescription('   ')).rejects.toThrow(
        'Task title is required to generate description'
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle API error responses', async () => {
      const mockErrorResponse = {
        error: {
          message: 'Invalid API key'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockErrorResponse)
      });

      await expect(service.generateTaskDescription('Test task')).rejects.toThrow(
        'Invalid API key'
      );
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.generateTaskDescription('Test task')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle empty choices in response', async () => {
      const mockResponse = {
        choices: []
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.generateTaskDescription('Test task');
      expect(result).toBe('');
    });

    it('should handle alternative response structures', async () => {
      const mockResponse = {
        choices: [
          {
            text: 'Generated from text field'
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.generateTaskDescription('Test task');
      expect(result).toBe('Generated from text field');
    });

    it('should handle empty response content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '   '
            }
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.generateTaskDescription('Test task');
      expect(result).toBe('');
    });

    it('should support streaming response', async () => {
      const streamChunks = [
        'data: ' + JSON.stringify({ choices: [{ delta: { content: 'Chunk 1' } }] }) + '\n',
        'data: ' + JSON.stringify({ choices: [{ delta: { content: 'Chunk 2' } }] }) + '\n',
        'data: [DONE]\n'
      ];

      const mockStream = new ReadableStream({
        start(controller) {
          streamChunks.forEach(chunk => controller.enqueue(new TextEncoder().encode(chunk)));
          controller.close();
        }
      });

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        body: mockStream
      });

      const onToken = vi.fn();
      const result = await service.generateTaskDescription('Test task', 'gpt-4o', onToken);

      expect(result).toBe('Chunk 1Chunk 2');
      expect(onToken).toHaveBeenCalledTimes(2);
      expect(onToken).toHaveBeenCalledWith('Chunk 1');
      expect(onToken).toHaveBeenCalledWith('Chunk 2');
    });

    it('should handle malformed stream chunks gracefully', async () => {
      const streamChunks = [
        'data: invalid-json\n',
        'data: ' + JSON.stringify({ choices: [{ delta: { content: 'Valid' } }] }) + '\n',
        'data: [DONE]\n'
      ];

      const mockStream = new ReadableStream({
        start(controller) {
          streamChunks.forEach(chunk => controller.enqueue(new TextEncoder().encode(chunk)));
          controller.close();
        }
      });

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        body: mockStream
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      const result = await service.generateTaskDescription('Test task', 'gpt-4o', vi.fn());

      expect(result).toBe('Valid');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('isConfigured', () => {
    it('should return true as it depends on backend configuration', () => {
      const service = new OpenAIService();
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('improveGrammar', () => {
    let service: OpenAIService;

    beforeEach(() => {
      service = new OpenAIService();
    });

    it('should improve grammar successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Corrected text'
            }
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.improveGrammar('bad text');

      expect(result).toBe('Corrected text');
      expect(fetch).toHaveBeenCalledWith(
        '/api/ai/chat',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Improve this text')
        })
      );
    });

    it('should throw error for empty text', async () => {
      await expect(service.improveGrammar('')).rejects.toThrow('Text is required to improve grammar');
    });

    it('should handle API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'API Error' } })
      });

      await expect(service.improveGrammar('text')).rejects.toThrow('API Error');
    });
  });
});
