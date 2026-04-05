const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.SECRET_KEY || 'secretkey';

const sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at
});

exports.register = async (req, res) => {
    const { name, email, password, setupAccessCode, setup_access_code } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    const expectedSetupAccessCode = String(process.env.ADMIN_SETUP_ACCESS_CODE || '').trim();
    const providedSetupAccessCode = String(setupAccessCode ?? setup_access_code ?? '').trim();

    if (!expectedSetupAccessCode) {
        return res.status(403).send('Admin setup is disabled.');
    }

    if (providedSetupAccessCode !== expectedSetupAccessCode) {
        return res.status(403).send('Invalid admin setup access code');
    }

    try {
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email.trim().toLowerCase()]);

        if (existingUser.rows.length) {
            return res.status(400).send('User already exists');
        }

        const adminCountResult = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role IN ('admin', 'superadmin')");
        const isFirstAdmin = adminCountResult.rows[0]?.count === 0;
        const role = isFirstAdmin ? 'admin' : 'customer';
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role, created_at',
            [name?.trim() || 'Admin User', email.trim().toLowerCase(), hashedPassword, role]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

        res.json({
            token,
            user,
            message: isFirstAdmin
                ? 'First account created with admin access.'
                : 'Account created successfully. Admin access is granted separately.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering user');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email=$1', [email.trim().toLowerCase()]);

        if (result.rows.length === 0) {
            return res.status(401).send('User not found');
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).send('Invalid password');
        }

        const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

        res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logging in');
    }
};

exports.getCurrentUser = async (req, res) => {
    res.json({ user: req.user });
};
