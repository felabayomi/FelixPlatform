const pool = require('../db');
const bcrypt = require('bcrypt');

/**
 * GET /api/waci-hub/grantees
 * List all users with role 'grantee'
 */
exports.listGrantees = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, created_at
             FROM users
             WHERE role = 'grantee'
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('listGrantees error:', err);
        res.status(500).json({ error: 'Failed to load grantees' });
    }
};

/**
 * POST /api/waci-hub/grantees
 * Create a new grantee account (admin only, no access code required)
 * Body: { name, email, password }
 */
exports.createGrantee = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        const existing = await pool.query(
            'SELECT id FROM users WHERE email = $1 LIMIT 1',
            [email.trim().toLowerCase()]
        );
        if (existing.rows.length) {
            return res.status(400).json({ error: 'A user with that email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, email, password, role)
             VALUES ($1, $2, $3, 'grantee')
             RETURNING id, name, email, role, created_at`,
            [name.trim(), email.trim().toLowerCase(), hashedPassword]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('createGrantee error:', err);
        res.status(500).json({ error: 'Failed to create grantee account' });
    }
};

/**
 * DELETE /api/waci-hub/grantees/:id
 * Remove grantee role (demote to customer, preserving account)
 */
exports.revokeGrantee = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            `UPDATE users SET role = 'customer' WHERE id = $1 AND role = 'grantee'`,
            [id]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('revokeGrantee error:', err);
        res.status(500).json({ error: 'Failed to revoke grantee' });
    }
};
