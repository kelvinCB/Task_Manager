const express = require('express');
const router = express.Router();

router.post('/chat', async (req, res) => {
  const { model, messages, stream, ...rest } = req.body;
  const apiKey = process.env.VITE_OPENAI_API_KEY;
  const baseUrl = process.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';

  if (!apiKey) {
    return res.status(500).json({ error: { message: 'OpenAI API key not configured on server.' } });
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
        ...rest
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    // Handle streaming
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('AI Proxy Error:', error);
    res.status(500).json({ error: { message: 'Failed to connect to OpenAI via proxy' } });
  }
});

module.exports = router;
