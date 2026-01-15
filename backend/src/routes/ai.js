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
      res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in some proxies
      res.flushHeaders();

      for await (const chunk of response.body) {
        res.write(chunk);
        if (res.flush) res.flush();
      }
      res.write('\n\n');
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

router.post('/generate-image', authenticateUser, async (req, res) => {
  const { prompt, model = 'dall-e-3', quality = 'hd', ...rest } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';

  if (!apiKey) {
    return res.status(500).json({ error: { message: 'OpenAI API key not configured on server.' } });
  }

  const userId = req.user.id;
  const token = req.headers.authorization?.split(' ')[1];
  const userClient = token ? createClientWithToken(token) : supabase;
  const COST_PER_IMAGE = 3;

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

    if (!profile || profile.credits < COST_PER_IMAGE) {
      return res.status(403).json({ error: { message: `Insufficient credits. This feature requires ${COST_PER_IMAGE} credits.` } });
    }

    // 2. Call OpenAI Image Generation
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: "1024x1024",
        quality,
        ...rest
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI Image API Error:', errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    // 3. Deduct Credits
    const { error: deductionError } = await userClient
      .from('profiles')
      .update({ credits: profile.credits - COST_PER_IMAGE })
      .eq('id', userId);

    if (deductionError) {
      console.warn('Failed to deduct credits for image generation:', userId, deductionError);
    }

    res.json(data);

  } catch (error) {
    console.error('AI Image Proxy Error:', error);
    res.status(500).json({ error: { message: 'Failed to connect to OpenAI via proxy' } });
  }
});
