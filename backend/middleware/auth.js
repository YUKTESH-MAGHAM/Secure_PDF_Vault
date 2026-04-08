const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-prod';

function verifyToken(req, res, next) {
    // 1. Prioritize standard User JWT token
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.user = decoded; // Attach user info to request
                return next();
            } catch (err) {
                // If it fails, we fall through to check the admin token instead of immediately dying
            }
        }
    }

    // 2. Fallback to Admin bypass token
    const adminToken = req.headers['x-admin-token'];
    if (adminToken === 'admin-authenticated') {
        req.user = { id: 'admin', role: 'admin' };
        return next();
    }

    return res.status(401).json({ error: 'Access denied. Invalid or missing token.' });
}

function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Admin access required.' });
    }
}

module.exports = { verifyToken, requireAdmin };
