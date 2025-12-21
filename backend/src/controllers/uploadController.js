const { createClientWithToken, supabase } = require('../config/supabaseClient');

/**
 * Upload a file to Supabase Storage
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${userId}/${fileName}`;

    // Get a client with the user's token for RLS if needed, 
    // BUT for Storage, we often use the service role or authenticated client.
    // Since our 'createClientWithToken' relies on RLS, we should use it if the bucket has RLS policies.
    // For now, we'll try with the user-scoped client if available, or fall back to standard client.
    
    // Note: The standard 'supabase' client in config might not have user context.
    // If the bucket is public or has generic policies, it works.
    // If it requires auth.uid(), we need the user token.
    
    // We assume 'req.headers.authorization' contains the Bearer token.
    const token = req.headers.authorization?.split(' ')[1];
    const userClient = token ? createClientWithToken(token) : supabase;

    console.log(`Uploading file ${filePath} for user ${userId} size ${file.size}`);

    const { data, error } = await userClient
      .storage
      .from('Attachments') // Ensure this bucket exists in Supabase
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage Error:', error);
      return res.status(500).json({ error: 'Failed to upload file to storage', details: error.message });
    }

    // Get public URL (if bucket is public) or signed URL
    // For simplicity, let's try getting public URL first
    const { data: publicUrlData } = userClient
      .storage
      .from('Attachments')
      .getPublicUrl(filePath);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        name: file.originalname,
        path: data.path, // Supabase path
        fullPath: data.fullPath,
        url: publicUrlData.publicUrl,
        size: file.size,
        mimetype: file.mimetype
      }
    });

  } catch (err) {
    console.error('Upload Controller Error:', err);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
};

module.exports = {
  uploadFile
};
