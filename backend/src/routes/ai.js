const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/authMiddleware');
const { createClientWithToken, supabase } = require('../config/supabaseClient');

router.post('/chat', authenticateUser, async (req, res) => {
  const { model, messages, stream, ...rest } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';

  if (!apiKey) {
    return res.status(500).json({ error: { message: 'OpenAI API key not configured on server.' } });
  }

  const userId = req.user.id;
  const token = req.headers.authorization?.split(' ')[1];
  const userClient = token ? createClientWithToken(token) : supabase;

  try {
    // 1. Check Credits
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error verifying credits:', profileError);
      return res.status(500).json({ error: { message: 'Failed to verify credits.' } });
    }

    if (!profile || profile.credits <= 0) {
      return res.status(403).json({ error: { message: 'You have no credits left.' } });
    }

    // 2. Call OpenAI
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

    // 3. Deduct Credit
    const { error: deductionError } = await userClient
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', userId);

    if (deductionError) {
      console.warn('Failed to deduct credit for user:', userId, deductionError);
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
