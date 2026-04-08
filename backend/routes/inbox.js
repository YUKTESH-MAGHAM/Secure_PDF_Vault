const express = require('express');
const supabase = require('../supabase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/admin-inbox (User sending message to admin)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message cannot be empty.' });
        }

        const { data, error } = await supabase
            .from('admin_inbox')
            .insert([{ user_id: req.user.id, message }])
            .select();

        if (error) throw error;

        return res.status(201).json({ message: 'Message sent securely to the admin.', data });
    } catch (err) {
        console.error('Inbox insert error:', err);
        return res.status(500).json({ error: 'Failed to send message.' });
    }
});

// GET /api/admin-inbox (Admin reading all messages)
router.get('/', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required.' });
        }

        // We use a join using supabase relational syntax 
        // to grab the email from vault_users table.
        const { data, error } = await supabase
            .from('admin_inbox')
            .select(`
                *,
                vault_users ( email )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch inbox error:', error);
            return res.status(500).json({ error: 'Failed to fetch inbox.' });
        }

        // Map it nicely for the frontend
        const formattedData = (data || []).map(item => ({
            id: item.id,
            user_id: item.user_id,
            email: item.vault_users?.email || 'Unknown User',
            message: item.message,
            is_read: item.is_read,
            created_at: item.created_at
        }));

        return res.status(200).json(formattedData);
    } catch (err) {
        console.error('Inbox fetching error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// PUT /api/admin-inbox/:id/read (Admin marking message as read)
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required.' });
        }

        const { id } = req.params;
        const { is_read } = req.body;

        const { data, error } = await supabase
            .from('admin_inbox')
            .update({ is_read })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({ message: 'Message read status updated.', data });
    } catch (err) {
        console.error('Update read status error:', err);
        return res.status(500).json({ error: 'Failed to update message.' });
    }
});

module.exports = router;
