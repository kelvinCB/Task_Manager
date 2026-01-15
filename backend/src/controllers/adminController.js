const { supabase } = require('../config/supabaseClient');

/**
 * Middleware to verify Admin Secret
 */
const verifyAdminSecret = (req, res, next) => {
    const adminSecret = req.headers['x-admin-secret'];
    if (!adminSecret || adminSecret !== process.env.ADMIN_API_SECRET) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Admin Secret' });
    }
    next();
};

/**
 * Get credits for a specific user
 */
const getUserCredits = async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch usage', details: error.message });
        }

        // Default to 5 if undefined in DB
        const credits = data?.credits !== undefined ? data.credits : 5;
        res.status(200).json({ userId, credits });

    } catch (err) {
        console.error('Admin Get Credits Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Add (or subtract) credits for a user
 * Body: { userId, amount } (amount can be negative)
 */
const addUserCredits = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || amount === undefined) {
            return res.status(400).json({ error: 'userId and amount are required' });
        }

        // 1. Get current credits
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (fetchError) {
            return res.status(500).json({ error: 'Failed to find user', details: fetchError.message });
        }

        const currentCredits = profile.credits !== undefined ? profile.credits : 5;
        const newCredits = Math.max(0, currentCredits + parseInt(amount));

        // 2. Update credits
        const { data: updated, error: updateError } = await supabase
            .from('profiles')
            .update({ credits: newCredits, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            return res.status(500).json({ error: 'Failed to update credits', details: updateError.message });
        }

        res.status(200).json({
            message: 'Credits updated successfully',
            previous: currentCredits,
            added: amount,
            current: updated.credits
        });

    } catch (err) {
        console.error('Admin Add Credits Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Set exact credits for a user
 * Body: { userId, amount }
 */
const setUserCredits = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || amount === undefined) {
            return res.status(400).json({ error: 'userId and amount are required' });
        }

        const newCredits = Math.max(0, parseInt(amount));

        const { data: updated, error } = await supabase
            .from('profiles')
            .update({ credits: newCredits, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select();

        if (error) {
            return res.status(500).json({ error: 'Failed to set credits', details: error.message });
        }

        if (!updated || updated.length === 0) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        res.status(200).json({
            message: 'Credits set successfully',
            current: updated[0].credits
        });

    } catch (err) {
        console.error('Admin Set Credits Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    verifyAdminSecret,
    getUserCredits,
    addUserCredits,
    setUserCredits
};
