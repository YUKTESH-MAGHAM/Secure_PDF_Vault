const express = require('express');
const supabase = require('../supabase');

const router = express.Router();

// POST /access
router.post('/', async (req, res) => {
    try {
        const { pdf_id, secret_key } = req.body;

        if (!pdf_id || !secret_key) {
            return res.status(400).json({ error: 'PDF ID and Secret Key are required.' });
        }

        // Look up the file record
        const { data: file, error } = await supabase
            .from('files')
            .select('*')
            .eq('pdf_id', pdf_id.trim().toUpperCase())
            .single();

        if (error || !file) {
            return res.status(404).json({ error: 'File not found. Please check the PDF ID.' });
        }

        // Verify secret key
        if (file.secret_key !== secret_key) {
            return res.status(401).json({ error: 'Incorrect secret key. Access denied.' });
        }

        // Check expiry
        if (file.expires_at) {
            const expiryTime = new Date(file.expires_at);
            if (new Date() > expiryTime) {
                return res.status(410).json({ error: 'This file has expired and is no longer accessible.' });
            }
        }

        // Record download event
        await supabase.from('downloads').insert([{ file_id: file.id }]);

        return res.status(200).json({
            message: 'Access granted.',
            file_url: file.file_url,
            pdf_id: file.pdf_id,
            expires_at: file.expires_at,
            file_type: file.file_type || 'pdf',
            allow_edit: file.allow_edit,
            allow_download: file.allow_download
        });
    } catch (err) {
        console.error('Access error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// PUT /access/update - Allows text file edits for Notepad
router.put('/update', async (req, res) => {
    try {
        const { pdf_id, secret_key, text_content } = req.body;

        if (!pdf_id || !secret_key || text_content === undefined) {
            return res.status(400).json({ error: 'Missing parameters.' });
        }

        // Verify DB record
        const { data: file, error } = await supabase
            .from('files')
            .select('*')
            .eq('pdf_id', pdf_id.trim().toUpperCase())
            .single();

        if (error || !file) return res.status(404).json({ error: 'File not found.' });
        if (file.secret_key !== secret_key) return res.status(401).json({ error: 'Access denied.' });
        if (!file.allow_edit) return res.status(403).json({ error: 'Edit permission denied.' });
        
        // Extract fileName from file_url (e.g. https://.../public/pdfs/TXT-123-123.txt)
        const parts = file.file_url.split('/');
        const fileName = parts[parts.length - 1];

        // Overwrite the file in storage
        const fileBuffer = Buffer.from(text_content, 'utf8');
        const { error: uploadError } = await supabase.storage
            .from('pdfs')
            .upload(fileName, fileBuffer, {
                contentType: 'text/plain',
                upsert: true // Overwrite the existing file
            });

        if (uploadError) {
            console.error('Text update upload error:', uploadError);
            return res.status(500).json({ error: 'Failed to save changes to storage.' });
        }

        // Update file_size in DB to reflect new size
        await supabase.from('files').update({ file_size: fileBuffer.length }).eq('id', file.id);

        return res.status(200).json({ message: 'Saved successfully.' });
    } catch (err) {
        console.error('Update error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
