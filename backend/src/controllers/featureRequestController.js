const { supabase } = require('../config/supabaseClient');

const createFeatureRequest = async (req, res) => {
    try {
        const { description, type, priority = 'Medium' } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        if (!['bug', 'help', 'feature'].includes(type)) {
            return res.status(400).json({ error: 'Invalid type. Must be bug, help, or feature' });
        }

        // Use authenticated client if available (to satisfy RLS), otherwise default client
        const client = req.supabase || supabase;
        let query = client
            .from('feature_requests')
            .insert([
                {
                    user_id: userId,
                    description,
                    type,
                    priority
                }
            ]);

        // Only select returned data if we have an authenticated user (to avoid RLS SELECT violation for anon)
        if (userId) {
            query = query.select();
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error creating feature request:', error);
            return res.status(500).json({ error: 'Failed to create feature request', message: error.message });
        }

        // Return the created object if available, otherwise return success
        if (data && data.length > 0) {
            res.status(201).json(data[0]);
        } else {
            res.status(201).json({ message: 'Feature request submitted successfully' });
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getFeatureRequests = async (req, res) => {
    try {
        const userId = req.user.id; // Only authenticated users can see their own

        const { data, error } = await supabase
            .from('feature_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching feature requests:', error);
            return res.status(500).json({ error: 'Failed to fetch feature requests' });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createFeatureRequest,
    getFeatureRequests
};
