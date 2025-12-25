const { createClientWithToken, supabase } = require('../config/supabaseClient');

/**
 * Upload a profile avatar to Supabase Storage
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.id;
        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const token = req.headers.authorization?.split(' ')[1];
        const userClient = token ? createClientWithToken(token) : supabase;

        console.log(`Uploading avatar ${filePath} for user ${userId} size ${file.size}`);

        // Upload to 'Avatars' bucket
        const { data, error } = await userClient
            .storage
            .from('Avatars')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) {
            console.error('Supabase Storage Error (Avatar):', error);
            let errorMessage = 'Failed to upload avatar to storage';
            if (error.message === 'Bucket not found' || error.status === 404) {
                errorMessage = 'Storage bucket "Avatars" not found. Please ensure it is created in Supabase.';
            } else if (error.message === 'new row violates row-level security policy') {
                errorMessage = 'Permission denied to upload to "Avatars" bucket. Please check RLS policies.';
            }
            return res.status(500).json({ error: errorMessage, details: error.message });
        }

        // Get public URL
        const { data: publicUrlData } = userClient
            .storage
            .from('Avatars')
            .getPublicUrl(filePath);

        const avatarUrl = publicUrlData.publicUrl;

        // Update profile in database
        const { data: profileData, error: profileError } = await userClient
            .from('profiles')
            .update({
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (profileError) {
            console.error('Supabase Database Error (Profile Update):', profileError);
            return res.status(500).json({ error: 'Failed to update profile with avatar URL', details: profileError.message });
        }

        res.status(200).json({
            message: 'Avatar uploaded and profile updated successfully',
            avatarUrl,
            profile: profileData
        });

    } catch (err) {
        console.error('Profile Controller Error:', err);
        res.status(500).json({ error: 'Internal server error during avatar upload' });
    }
};

/**
 * Delete a profile avatar from Supabase Storage and update database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        const token = req.headers.authorization?.split(' ')[1];
        const userClient = token ? createClientWithToken(token) : supabase;

        // Get current profile to find the avatar URL
        const { data: profile, error: fetchError } = await userClient
            .from('profiles')
            .select('avatar_url')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            console.error('Error fetching profile for deletion:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch profile', details: fetchError?.message });
        }

        if (!profile.avatar_url) {
            return res.status(400).json({ error: 'No avatar to delete' });
        }

        // Extract filename from URL - handle both public URLs and storage paths
        // Example: .../storage/v1/object/public/Avatars/userId/fileName.jpg
        const urlParts = profile.avatar_url.split('/');
        const fileNameWithUser = urlParts.slice(-2).join('/'); // Includes userId folder

        if (fileNameWithUser) {
            console.log(`Deleting avatar ${fileNameWithUser} for user ${userId}`);
            const { error: storageError } = await userClient
                .storage
                .from('Avatars')
                .remove([fileNameWithUser]);

            if (storageError) {
                console.warn('Warning: Failed to delete file from storage (continuing DB update):', storageError);
            }
        }

        // Update profile in database set avatar_url to null
        const { data: profileData, error: profileError } = await userClient
            .from('profiles')
            .update({
                avatar_url: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (profileError) {
            console.error('Supabase Database Error (Profile Update on Deletion):', profileError);
            return res.status(500).json({ error: 'Failed to update profile after avatar deletion', details: profileError.message });
        }

        res.status(200).json({
            message: 'Avatar deleted successfully',
            profile: profileData
        });

    } catch (err) {
        console.error('Delete Avatar Controller Error:', err);
        res.status(500).json({ error: 'Internal server error during avatar deletion' });
    }
};

module.exports = {
    uploadAvatar,
    deleteAvatar
};
