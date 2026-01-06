interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message?: {
      content?: string;
      text?: string;
    };
    text?: string;
    content?: string;
    [key: string]: any; // Allow for unknown properties
  }[];
  [key: string]: any; // Allow for unknown properties at root level
}

interface OpenAIError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export class OpenAIService {
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor() {
    // Look for VITE_API_BASE_URL (for proxying) or use absolute path
    // In dev mode with Vite proxy, '/api/ai' will point to localhost:3001
    this.baseUrl = '/api/ai';
    
    // API Key is handled by the backend proxy if possible
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    // Fallback logic for direct browser calls (kept for backward compatibility, but discouraged)
    const directBaseUrl = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
    
    // If apiKey is 'your-openai-api-key-here', don't warn yet as backend might have it
    if (this.apiKey === 'your-openai-api-key-here') {
      this.apiKey = undefined;
    }
  }

  /**
   * Helper to handle streaming responses
   */
  private async handleStreamingResponse(response: Response, onToken: (token: string) => void): Promise<string> {
    if (!response.body) return '';
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last partial line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
        
        if (trimmedLine.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmedLine.slice(6));
            const deltaContent = json.choices[0]?.delta?.content || json.choices[0]?.text || '';

            if (deltaContent) {
              fullContent += deltaContent;
              onToken(deltaContent);
            }
          } catch (e) {
            // If it's not valid JSON, it might be split across lines despite our split('\n')
            // This is less likely with correctly formatted SSE, but good to handle
            console.warn('Error parsing stream chunk:', e, 'Line:', trimmedLine);
          }
        }
      }
    }
    return fullContent;
  }

  /**
   * Generate a task description based on the task title
   */
  async generateTaskDescription(
    taskTitle: string,
    model: string = 'gpt-4o',
    onToken?: (token: string) => void
  ): Promise<string> {
    if (!taskTitle.trim()) {
      throw new Error('Task title is required to generate description');
    }

    const isNewModel = model.startsWith('o4-') || model.startsWith('gpt-5');
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are an expert task management assistant. Your job is to create detailed, actionable task descriptions based on task titles. 

Guidelines:
- Create clear, concise, and actionable descriptions
- Include specific steps or objectives when possible
- Keep descriptions between 50-150 words
- Focus on what needs to be accomplished
- Use professional but friendly tone
- If the task is technical, include relevant technical details
- If the task is creative, suggest approaches or considerations

FORMATTING RULES:
- Use Markdown for formatting
- Use "##" for section headers
- Use "-" for bullet points
- excessive usage of bolding or italics should be avoided, but use them when necessary
- Ensure clear separation between sections with newlines

IMPORTANT:
- First, outline your step-by-step approach or plan for this task.
- Wrap this initial approach in <thinking>...</thinking> tags.
- After the closing tag, provide the final detailed task description.
- This approach helps ensure accuracy and structured output.`
      },
      {
        role: 'user',
        content: `Generate a detailed task description for: "${taskTitle}"`
      }
    ];

    try {
      const requestBody: any = {
        model,
        messages,
        stream: !!onToken
      };

      if (isNewModel) {
        requestBody.max_completion_tokens = 4500;
      } else {
        requestBody.max_tokens = 500;
        requestBody.temperature = 0.7;
      }

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMsg = 'AI API Error';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error?.message || errorData.message || errorMsg;
        } catch (e) {
          errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
      }

      if (onToken) {
        return this.handleStreamingResponse(response, onToken);
      }

      const data = await response.json();
      return (data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '').trim();

    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to connect to AI Service');
    }
  }

  /**
   * Improve the grammar and flow of a text
   */
  async improveGrammar(
    text: string,
    model: string = 'gpt-4o',
    onToken?: (token: string) => void
  ): Promise<string> {
    if (!text.trim()) {
      throw new Error('Text is required to improve grammar');
    }

    const isNewModel = model.startsWith('o4-') || model.startsWith('gpt-5');
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are an expert editor. Your job is to improve the grammar, spelling, and flow of the text provided.
        
Guidelines:
- Fix grammar and spelling errors
- Improve sentence flow and clarity
- Maintain the original meaning and tone
- Use Markdown for formatting if appropriate

IMPORTANT:
- First, outline your step-by-step approach or plan for improving this text.
- Wrap this initial approach in <thinking>...</thinking> tags.
- After the closing tag, provide ONLY the corrected text, no explanations or conversational filler`
      },
      {
        role: 'user',
        content: `Improve this text: "${text}"`
      }
    ];

    try {
      const requestBody: any = {
        model,
        messages,
        stream: !!onToken
      };

      if (isNewModel) {
        requestBody.max_completion_tokens = 4500;
      } else {
        requestBody.max_tokens = 2000;
        requestBody.temperature = 0.3;
      }

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMsg = 'AI API Error';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error?.message || errorData.message || errorMsg;
        } catch (e) {
          errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
      }

      if (onToken) {
        return this.handleStreamingResponse(response, onToken);
      }

      const data = await response.json();
      return (data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '').trim();

    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to connect to AI Service');
    }
  }

  isConfigured(): boolean {
    // If using proxy, we assume it's configured on the server side
    return true;
  }
}

export const openaiService = new OpenAIService();
