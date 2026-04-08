const express = require('express');
const supabase = require('../supabase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /my-files - list files for logged in user
router.get('/my-files', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('files')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('DB error fetching my files:', error);
            return res.status(500).json({ error: 'Failed to fetch your files.' });
        }

        return res.status(200).json({ files: data });
    } catch (err) {
        console.error('My-files error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /files - list all files (admin)
router.get('/', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required.' });
        }
        const { data, error } = await supabase
            .from('files')
            .select(`
                *,
                vault_users ( email )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('DB error:', error);
            return res.status(500).json({ error: 'Failed to fetch files.' });
        }

        return res.status(200).json({ files: data });
    } catch (err) {
        console.error('Files error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// DELETE /file/:id - delete a specific file
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch file metadata first
        const { data: file, error: fetchError } = await supabase
            .from('files')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !file) {
            return res.status(404).json({ error: 'File not found.' });
        }

        // Verify ownership or Admin role
        if (req.user.role !== 'admin' && file.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You are not authorized to delete this file.' });
        }

        // Extract filename from URL
        const urlParts = file.file_url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        // Delete from Supabase Storage
        const { error: storageError } = await supabase.storage.from('pdfs').remove([fileName]);
        if (storageError) {
            console.warn('Storage delete warning:', storageError.message);
        }

        // Delete from database (cascades to downloads)
        const { error: dbError } = await supabase.from('files').delete().eq('id', id);
        if (dbError) {
            console.error('DB delete error:', dbError);
            return res.status(500).json({ error: 'Failed to delete file from database.' });
        }

        return res.status(200).json({ message: 'File deleted successfully.' });
    } catch (err) {
        console.error('Delete error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
