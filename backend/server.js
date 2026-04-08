require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoute = require('./routes/auth');
const uploadRoute = require('./routes/upload');
const accessRoute = require('./routes/access');
const filesRoute = require('./routes/files');
const usersRoute = require('./routes/users');
const analyticsRoute = require('./routes/analytics');
const inboxRoute = require('./routes/inbox');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/access', accessRoute);
app.use('/api/files', filesRoute);
app.use('/api/file', filesRoute);   // DELETE /api/file/:id resolves via the same router
app.use('/api/users', usersRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/inbox', inboxRoute);

// Health check
app.get('/api/', (req, res) => {
    res.json({ status: 'ok', message: 'Secure PDF Vault API is running.' });
});

// Start local dev server if not in Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel Serverless Function
module.exports = app;
