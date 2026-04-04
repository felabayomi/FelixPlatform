const jwt = require('jsonwebtoken');
const pool = require('../db');

const getJwtSecret = () => process.env.SECRET_KEY || 'secretkey';

exports.authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).send('Access token required');
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret());
        const result = await pool.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = $1 LIMIT 1',
            [decoded.id]
        );

        if (!result.rows.length) {
            return res.status(401).send('User not found for token');
        }

        req.user = result.rows[0];
        next();
    } catch (err) {
        console.error(err);
        res.status(401).send('Invalid or expired token');
    }
};

exports.requireAdmin = (req, res, next) => {
    const role = req.user?.role;

    if (role !== 'admin' && role !== 'superadmin') {
        return res.status(403).send('Admin access required');
    }

    next();
};
