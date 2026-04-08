const express = require('express');
const supabase = require('../supabase');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Protect all user routes so only the Admin can access them
router.use(verifyToken, requireAdmin);

// GET /users
router.get('/', async (req, res) => {
    try {
        // Get all users
        const { data: users, error: usersError } = await supabase
            .from('vault_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        // Get file counts and sizes for each user
        const { data: files, error: filesError } = await supabase
            .from('files')
            .select('user_id, file_size');

        if (filesError) throw filesError;

        const fileStats = (files || []).reduce((acc, file) => {
            if (file.user_id) {
                if (!acc[file.user_id]) {
                    acc[file.user_id] = { count: 0, sizeBytes: 0 };
                }
                acc[file.user_id].count += 1;
                acc[file.user_id].sizeBytes += (file.file_size || 0);
            }
            return acc;
        }, {});

        const usersWithStats = (users || []).map(u => ({
            id: u.id,
            email: u.email,
            status: u.status,
            joined: u.created_at,
            files: fileStats[u.id] ? fileStats[u.id].count : 0,
            storageUsedMB: fileStats[u.id] ? (fileStats[u.id].sizeBytes / (1024 * 1024)) : 0,
            storageLimitMB: u.storage_limit_mb || 50,
            pendingMessage: u.pending_message,
            passwordHash: u.password_hash
        }));

        return res.status(200).json(usersWithStats);
    } catch (err) {
        console.error('Fetch users error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// PUT /users/:id/limit (Admin set storage limit)
router.put('/:id/limit', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit_mb } = req.body;

        if (limit_mb === undefined || isNaN(limit_mb)) {
            return res.status(400).json({ error: 'Valid limit_mb is required' });
        }

        const { data, error } = await supabase
            .from('vault_users')
            .update({ storage_limit_mb: parseInt(limit_mb) })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({ message: `Storage limit updated to ${limit_mb}MB`, user: data });
    } catch (err) {
        console.error('Update limit error:', err);
        return res.status(500).json({ error: 'Failed to update storage limit.' });
    }
});

// PUT /users/:id/reset-password (Admin reset a user's password)
router.put('/:id/reset-password', async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;

        if (!new_password || new_password.trim().length < 4) {
            return res.status(400).json({ error: 'New password must be at least 4 characters.' });
        }

        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(new_password, salt);

        const { error } = await supabase
            .from('vault_users')
            .update({ password_hash })
            .eq('id', id);

        if (error) throw error;

        return res.status(200).json({ message: 'Password reset successfully.' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ error: 'Failed to reset password.' });
    }
});

// POST /users/:id/message (Admin Messaging)
router.post('/:id/message', async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const { data, error } = await supabase
            .from('vault_users')
            .update({ pending_message: message || null })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({ message: 'Message sent successfully.', user: data });
    } catch (err) {
        console.error('Send message error:', err);
        return res.status(500).json({ error: 'Failed to send message.' });
    }
});

// PUT /users/:id/suspend
router.put('/:id/suspend', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active' or 'suspended'

        const { data, error } = await supabase
            .from('vault_users')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({ message: `User status updated to ${status}`, user: data });
    } catch (err) {
        console.error('Suspend user error:', err);
        return res.status(500).json({ error: 'Failed to update user status.' });
    }
});

// DELETE /users/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('vault_users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return res.status(200).json({ message: 'User deleted successfully.' });
    } catch (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({ error: 'Failed to delete user.' });
    }
});

module.exports = router;
