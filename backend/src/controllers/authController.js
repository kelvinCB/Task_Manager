const supabase = require('../config/supabaseClient');

const register = async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Normalize email first
  const normalizedEmail = email.toLowerCase().trim();

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ user: data.user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Normalize email first
  const normalizedEmail = email.toLowerCase().trim();

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.status(200).json({ session: data.session, user: data.user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Input validation
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Normalize email first
  const normalizedEmail = email.toLowerCase().trim();

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`,
      }
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Always return success to prevent email enumeration attacks
    res.status(200).json({ 
      message: 'If your email is in our system, you will receive a password reset link' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  const { password } = req.body;
  const accessToken = req.headers.authorization?.replace('Bearer ', '');

  // Input validation
  if (!password) {
    return res.status(400).json({ error: 'New password is required' });
  }

  if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Create a Supabase client with the access token
    const { createClient } = require('@supabase/supabase-js');
    const supabaseWithAuth = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );

    const { error } = await supabaseWithAuth.auth.updateUser({
      password: password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
