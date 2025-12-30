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
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.baseUrl = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';

    if (!this.apiKey || this.apiKey === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
    }
  }

  /**
   * Generate a task description based on the task title
   */
  /**
   * Generate a task description based on the task title
   * Supports streaming if onToken callback is provided
   */
  async generateTaskDescription(
    taskTitle: string,
    model: string = 'gpt-4o',
    onToken?: (token: string) => void
  ): Promise<string> {
    if (!taskTitle.trim()) {
      throw new Error('Task title is required to generate description');
    }

    // Check if it's an O4 or GPT-5 model (o4-mini, o4-preview, gpt-5-*)
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
      // Build request body based on model type
      const requestBody: any = {
        model,
        messages,
        stream: !!onToken
      };

      // New models (O4, GPT-5) use different parameters
      if (isNewModel) {
        // Newer models use max_completion_tokens instead of max_tokens
        // Increased to 4500 to account for reasoning tokens in newer models
        requestBody.max_completion_tokens = 4500;
      } else {
        // Standard GPT models
        requestBody.max_tokens = 500; // Increased for thinking tags
        requestBody.temperature = 0.7;
        requestBody.top_p = 1;
        requestBody.frequency_penalty = 0;
        requestBody.presence_penalty = 0;
        // removed stop sequences to allow full generation including tags
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData: OpenAIError = await response.json();
        console.error('OpenAI API Error:', errorData);
        throw new Error(`OpenAI API Error: ${errorData.error.message}`);
      }

      // Handle Streaming Response
      if (onToken && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

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
                console.warn('Error parsing stream chunk:', e);
              }
            }
          }
        }
        return fullContent;
      }

      // Handle Non-Streaming Response (Legacy/Fallback)
      const data: OpenAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        console.error('No choices in response:', data);
        throw new Error('No response received from OpenAI API');
      }

      const choice = data.choices[0];

      // Try different response structures
      let content: string | null = null;

      // Standard structure: choice.message.content (handle empty strings too)
      if (choice.message && choice.message.content !== undefined) {
        content = choice.message.content;

        // If content is empty and finish_reason is 'length', try with more tokens
        if (!content.trim() && choice.finish_reason === 'length') {
          console.warn('Empty content with finish_reason=length, might need more tokens');
          throw new Error('Response was cut off due to token limit. Try using a model with higher token capacity.');
        }
      }
      // Alternative structure: choice.text (for some models)
      else if (choice.text) {
        content = choice.text;
      }
      // Alternative structure: choice.content (direct content)
      else if (choice.content) {
        content = choice.content;
      }
      // Alternative structure: choice.message.text
      else if (choice.message && choice.message.text) {
        content = choice.message.text;
      }

      if (!content) {
        console.error('No content found in any expected structure. Choice object:', JSON.stringify(choice, null, 2));
        throw new Error('Invalid response structure from OpenAI API - no content found');
      }

      const generatedDescription = content.trim();

      if (!generatedDescription) {
        console.error('Empty content after trim:', content);
        throw new Error('Empty response received from OpenAI API');
      }

      return generatedDescription;

    } catch (error) {
      if (error instanceof Error) {
        // Re-throw known errors
        throw error;
      } else {
        // Handle unknown errors
        throw new Error('Failed to connect to OpenAI API. Please check your internet connection and try again.');
      }
    }
  }

  /**
   * Improve the grammar and flow of a text
   * Supports streaming if onToken callback is provided
   */
  async improveGrammar(
    text: string,
    model: string = 'gpt-4o',
    onToken?: (token: string) => void
  ): Promise<string> {
    if (!text.trim()) {
      throw new Error('Text is required to improve grammar');
    }

    // Check if it's an O4 or GPT-5 model
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
        requestBody.max_tokens = 2000; // Increased for thinking tags and potential text length
        requestBody.temperature = 0.3; // Lower temperature for grammar correction
        requestBody.top_p = 1;
        requestBody.frequency_penalty = 0;
        requestBody.presence_penalty = 0;
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData: OpenAIError = await response.json();
        console.error('OpenAI API Error:', errorData);
        throw new Error(`OpenAI API Error: ${errorData.error.message}`);
      }

      // Handle Streaming Response
      if (onToken && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

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
                console.warn('Error parsing stream chunk:', e);
              }
            }
          }
        }
        return fullContent;
      }

      // Handle Non-Streaming Response
      const data: OpenAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response received from OpenAI API');
      }

      const choice = data.choices[0];
      let content: string | null = null;

      if (choice.message && choice.message.content !== undefined) {
        content = choice.message.content;
      } else if (choice.text) {
        content = choice.text;
      } else if (choice.content) {
        content = choice.content;
      } else if (choice.message && choice.message.text) {
        content = choice.message.text;
      }

      if (!content) {
        throw new Error('Invalid response structure from OpenAI API - no content found');
      }

      return content.trim();

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to connect to OpenAI API.');
      }
    }
  }

  /**
   * Check if the OpenAI service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== 'your-openai-api-key-here');
  }
}

// Create a singleton instance
export const openaiService = new OpenAIService();
