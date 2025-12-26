# AI Integration Documentation

## Overview

TaskFlow integrates with OpenAI's API to provide intelligent task description generation. This document covers the technical implementation, configuration, and usage of the AI features.

## Architecture

### Service Layer (`src/services/openaiService.ts`)

The OpenAI integration is implemented as a service class that handles:
- API key management and validation
- Request/response formatting
- Error handling and retries
- Model-specific parameter configuration
- **Real-time streaming** via Server-Sent Events (SSE)
- **Chain of Thought** parsing using `<thinking>` tags

### Key Components

```typescript
class OpenAIService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  
  generateTaskDescription(taskTitle: string, model?: string, onToken?: (token: string) => void): Promise<string>
  improveGrammar(text: string, model?: string): Promise<string>
  isConfigured(): boolean
}
```

## Configuration

### Environment Variables

| Variable | Description | Default Value | Required |
|----------|-------------|---------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | - | Yes (for AI features) |
| `VITE_OPENAI_MODEL` | Default model to use | `gpt-4o` | No |
| `VITE_OPENAI_BASE_URL` | API base URL | `https://api.openai.com/v1` | No |

### Model Support

#### Standard GPT Models
- Uses `temperature`, `top_p`, `frequency_penalty`, `presence_penalty`
- Limited to `max_tokens` (default: 300)
- Supports stop sequences

#### O4 Series Models  
- Uses `max_completion_tokens` instead of `max_tokens`
- No temperature or other sampling parameters
- Different request structure

## Implementation Details

### Request Flow

1. **Validation**: Check if task title is provided and non-empty
2. **Model Detection**: Determine if using O4 series or standard GPT model
3. **Request Building**: Construct appropriate request body based on model type
4. **API Call**: Send request to OpenAI API with proper headers
5. **Response Parsing**: Extract content from various possible response structures
6. **Error Handling**: Handle API errors, network issues, and malformed responses

### Error Handling

The service handles several error scenarios:
- **Missing API Key**: Throws configuration error during initialization
- **Empty Task Title**: Validates input before making API call
- **API Errors**: Parses OpenAI error responses and provides meaningful messages
- **Network Errors**: Catches fetch errors and provides user-friendly messages
- **Empty Responses**: Handles cases where API returns empty or malformed content
- **Token Limits**: Detects when responses are cut off due to token limits

### Response Structure Handling

The service supports multiple response formats:
```typescript
// Standard structure
{
  choices: [{
    message: { content: "generated text" }
  }]
}

// Alternative structures
{
  choices: [{
    text: "generated text"  // Legacy format
  }]
}

{
  choices: [{
    content: "generated text"  // Direct content
  }]
}
```

## UI Integration

### TaskForm Component Updates

The AI functionality is integrated into the task form with:
- AI icon button next to description field
- Expandable AI options panel
- Loading states during generation
- Error feedback to users

### User Experience Flow

1. User enters task title
2. Clicks AI assistant icon
3. AI options panel appears
4. User clicks "Generate Description"
5. **Real-time Streaming**:
    - "Thinking Process" accordion appears and populates with AI reasoning.
    - Description field populates incrementally after the thinking process.
6. User can edit or regenerate as needed

## Testing

### Unit Tests

Comprehensive test coverage includes:
- Service initialization and configuration
- Model parameter handling (GPT vs O4)
- Request/response formatting
- Error scenarios and edge cases
- Component integration tests

### Test Files
- `src/test/services/openaiService.test.ts`
- `src/test/components/TaskForm.test.tsx`

### Running Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test openaiService.test.ts
npm test TaskForm.test.tsx

# Run with coverage
npm run test:coverage
```

## Security Considerations

### API Key Protection
- API keys are stored in environment variables
- Keys are not exposed in client-side code bundles
- Validation prevents placeholder keys from being used

### Request Sanitization
- User input is validated before sending to API
- Requests are properly formatted to prevent injection
- Error messages don't expose sensitive information

## Future Enhancements

### Completed Features
- [x] AI Description Generation (with Streaming & CoT)
- [x] AI Grammar Improvement

### Planned Features
- [ ] Task title suggestions based on description
- [ ] Multi-language support
- [ ] Custom prompt templates
- [ ] Batch processing for multiple tasks

### Extension Points
- Additional AI providers (Anthropic, Cohere, etc.)
- Custom model fine-tuning
- Advanced prompt engineering
- Task categorization and tagging

## Troubleshooting

### Common Issues

1. **"API key not configured" error**
   - Ensure `OPENAI_API_KEY` is set in `.env` file
   - Verify the key is not the placeholder value

2. **"Failed to connect to OpenAI API" error**
   - Check internet connection
   - Verify `VITE_OPENAI_BASE_URL` if using custom endpoint
   - Check if API key has proper permissions

3. **"Empty response received" error**
   - Try using a different model
   - Check if the task title is descriptive enough
   - Verify API quota/rate limits

4. **"Response was cut off due to token limit" error**
   - Use a model with higher token capacity
   - Reduce the complexity of the task title

### Debug Mode

Enable additional logging by setting:
```env
VITE_DEBUG_AI=true
```

This will log request/response details to the browser console for debugging.

## Performance Considerations

### Request Optimization
- Requests are debounced to prevent spam
- Response caching could be implemented for repeated requests
- Token limits are optimized per model type

### User Experience
- Loading states prevent user confusion
- Async processing doesn't block UI
- Error states provide clear feedback

## API Usage and Costs

### Token Usage
- Typical request: ~200-300 tokens
- Typical response: ~100-200 tokens
- Total per generation: ~300-500 tokens

### Cost Estimation
Based on OpenAI pricing (as of 2024):
- GPT-4: ~$0.015-0.025 per description
- GPT-4 Turbo: ~$0.003-0.005 per description
- GPT-3.5 Turbo: ~$0.0005-0.001 per description

### Rate Limits
- Respect OpenAI's rate limits
- Implement exponential backoff for retries
- Consider user-based rate limiting for production
