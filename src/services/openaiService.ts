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
  private defaultModel: string;

  constructor() {
    this.apiKey = import.meta.env.OPENAI_API_KEY;
    this.baseUrl = import.meta.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.defaultModel = import.meta.env.OPENAI_MODEL || 'gpt-4o';
    
    if (!this.apiKey || this.apiKey === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
    }
  }

  /**
   * Generate a task description based on the task title
   */
  async generateTaskDescription(taskTitle: string, model: string = 'gpt-4o'): Promise<string> {
    if (!taskTitle.trim()) {
      throw new Error('Task title is required to generate description');
    }

    // Check if it's an O4 model (o4-mini, o4-preview, etc.)
    const isO4Model = model.startsWith('o4-');

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

Generate a description that would help someone understand exactly what needs to be done to complete this task.`
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
        messages
      };

      // O4 models use different parameters
      if (isO4Model) {
        // O4 models don't support these parameters and use max_completion_tokens instead of max_tokens
        requestBody.max_completion_tokens = 800;
      } else {
        // Standard GPT models
        requestBody.max_tokens = 300;
        requestBody.temperature = 0.7;
        requestBody.top_p = 1;
        requestBody.frequency_penalty = 0;
        requestBody.presence_penalty = 0;
        requestBody.stop = ["\n\n", "\n"];
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
   * Check if the OpenAI service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== 'your-openai-api-key-here');
  }
}

// Create a singleton instance
export const openaiService = new OpenAIService();
