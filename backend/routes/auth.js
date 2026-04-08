const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-prod';

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('vault_users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert new user
        const { data: newUser, error: insertError } = await supabase
            .from('vault_users')
            .insert([{ email, password_hash }])
            .select('id, email, status, pending_message, created_at')
            .single();

        if (insertError) {
            console.error('Supabase Insert error details:', insertError);
            return res.status(500).json({ error: insertError.message || 'Failed to create user in database' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, status: newUser.status },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                status: newUser.status,
                pendingMessage: newUser.pending_message
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const { data: user, error } = await supabase
            .from('vault_users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if suspended
        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'Account is suspended' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, status: user.status },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                status: user.status,
                pendingMessage: user.pending_message
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/accept-message
// Endpoint for users to acknowledge a message with their password
router.post('/accept-message', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const { data: user, error } = await supabase
            .from('vault_users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Clear the pending message
        const { error: updateError } = await supabase
            .from('vault_users')
            .update({ pending_message: null })
            .eq('id', user.id);

        if (updateError) {
            return res.status(500).json({ error: 'Failed to clear message' });
        }

        return res.status(200).json({ message: 'Message acknowledged successfully' });
    } catch (err) {
        console.error('Accept message error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
