const express = require('express');
const supabase = require('../supabase');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Generate a short, readable File ID like PDF-8A2X1 or IMG-8A2X1
function generateFileId(type = 'pdf') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < 5; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const prefixes = {
        pdf: 'PDF',
        image: 'IMG',
        ppt: 'PPT',
        notepad: 'TXT'
    };
    const prefix = prefixes[type] || 'FILE';
    return `${prefix}-${suffix}`;
}

// Calculate expiry date based on user selection
function calculateExpiry(expiry) {
    if (expiry === 'never') return null;
    const now = new Date();
    if (expiry === '1h') now.setHours(now.getHours() + 1);
    else if (expiry === '24h') now.setHours(now.getHours() + 24);
    else if (expiry === '7d') now.setDate(now.getDate() + 7);
    return now.toISOString();
}

// POST /upload (Protected Route)
router.post('/', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { secret_key, expiry } = req.body;
        const file_type = req.body.file_type || 'pdf';
        const allow_edit = req.body.allow_edit === 'true';
        const allow_download = req.body.allow_download !== 'false'; // default true
        
        const file = req.file;
        const user_id = req.user.id;

        if (!file) return res.status(400).json({ error: 'No file uploaded.' });
        if (!secret_key || secret_key.trim() === '') {
            return res.status(400).json({ error: 'Secret key is required.' });
        }

        // Validate File Type
        if (file_type === 'pdf' && file.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: 'Please upload a valid PDF.' });
        } else if (file_type === 'image' && !file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Please upload a valid image file.' });
        } else if (file_type === 'ppt' && !file.mimetype.includes('powerpoint') && !file.mimetype.includes('presentation')) {
            return res.status(400).json({ error: 'Please upload a valid PPT/PPTX file.' });
        } else if (file_type === 'notepad' && file.mimetype !== 'text/plain') {
            return res.status(400).json({ error: 'Notepad must be text/plain.' });
        }

        // ---- STORAGE QUOTA CHECK ----
        let incomingFileSize = file.buffer.length;
        
        if (user_id !== 'admin') {
            // 1. Get user's limit
            const { data: userRecord, error: userErr } = await supabase
                .from('vault_users')
                .select('storage_limit_mb')
                .eq('id', user_id)
                .single();

            if (userErr || !userRecord) {
                return res.status(500).json({ error: 'Could not fetch user storage limit.' });
            }

            const storageLimitBytes = (userRecord.storage_limit_mb || 50) * 1024 * 1024;

        // 2. Get user's current total storage used
        const { data: userFiles, error: filesErr } = await supabase
            .from('files')
            .select('file_size')
            .eq('user_id', user_id);

        if (filesErr) {
            return res.status(500).json({ error: 'Could not calculate current storage usage.' });
        }

        const currentStorageUsed = (userFiles || []).reduce((sum, f) => sum + (f.file_size || 0), 0);

            if (currentStorageUsed + incomingFileSize > storageLimitBytes) {
                return res.status(403).json({
                    error: `Storage Quota Exceeded. You have a limit of ${userRecord.storage_limit_mb}MB. Please delete some files or contact the admin to increase your limit.`
                });
            }
        }
        // ---- END QUOTA CHECK ----

        // Generate a unique File ID
        let pdf_id;
        let isUnique = false;
        while (!isUnique) {
            pdf_id = generateFileId(file_type);
            const { data } = await supabase.from('files').select('id').eq('pdf_id', pdf_id).single();
            if (!data) isUnique = true;
        }

        // Retain original extension
        const objNameParts = file.originalname ? file.originalname.split('.') : [];
        const ext = objNameParts.length > 1 ? objNameParts.pop() : (file_type === 'notepad' ? 'txt' : 'bin');
        const fileName = `${pdf_id}-${Date.now()}.${ext}`;
        const expires_at = calculateExpiry(expiry || 'never');

        // Upload file to Supabase Storage
        const { error: storageError } = await supabase.storage
            .from('pdfs') // Keeping bucket name 'pdfs' for backward compatibility
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (storageError) {
            console.error('Storage error:', storageError);
            return res.status(500).json({ error: 'Failed to upload file to storage.' });
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(fileName);
        const file_url = urlData.publicUrl;

        // Insert metadata into database
        // The database column user_id expects a UUID. 'admin' is not a UUID, so we must insert null if the admin uploaded it.
        const dbUserId = user_id === 'admin' ? null : user_id;

        const { data: fileRecord, error: dbError } = await supabase
            .from('files')
            .insert([{ 
                pdf_id, 
                secret_key, 
                file_url, 
                expires_at, 
                user_id: dbUserId, 
                file_size: incomingFileSize,
                file_type,
                allow_edit,
                allow_download
            }])
            .select()
            .single();

        if (dbError) {
            console.error('DB error:', dbError);
            return res.status(500).json({ error: `Failed to save metadata. Supabase says: ${dbError.message}` });
        }

        return res.status(201).json({
            message: 'File uploaded successfully.',
            pdf_id: fileRecord.pdf_id,
            secret_key: fileRecord.secret_key,
            file_url: fileRecord.file_url,
            expires_at: fileRecord.expires_at,
        });
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
