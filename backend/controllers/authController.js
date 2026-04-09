const pool = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { hasDocumentFormatterAccess } = require('../services/accessControl');
const { sendEmail } = require('../services/resendEmail');

const getJwtSecret = () => process.env.SECRET_KEY || 'secretkey';

let ensurePasswordResetTablePromise = null;

const sanitizeUser = async (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    document_formatter_access: await hasDocumentFormatterAccess(user),
});

const ensurePasswordResetTable = async () => {
    if (!ensurePasswordResetTablePromise) {
        ensurePasswordResetTablePromise = pool.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMPTZ NOT NULL,
                used_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `).catch((error) => {
            ensurePasswordResetTablePromise = null;
            throw error;
        });
    }

    await ensurePasswordResetTablePromise;
};

const buildResetBaseUrl = (value = '') => {
    const configuredUrl = String(process.env.ADMIN_RESET_BASE_URL || '').trim();
    const providedUrl = String(value || '').trim();

    if (/^https?:\/\//i.test(providedUrl)) {
        return providedUrl;
    }

    if (/^https?:\/\//i.test(configuredUrl)) {
        return configuredUrl;
    }

    return 'https://admin.felixplatforms.com/login';
};

const createPasswordResetToken = async (userId) => {
    await ensurePasswordResetTable();

    await pool.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [userId]
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + (1000 * 60 * 30));

    await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [userId, tokenHash, expiresAt.toISOString()]
    );

    return rawToken;
};

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
        const safeUser = await sanitizeUser(user);
        const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

        res.json({
            token,
            user: safeUser,
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
        const safeUser = await sanitizeUser(user);

        res.json({ token, user: safeUser });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logging in');
    }
};

exports.forgotPassword = async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
        return res.status(400).send('Email is required');
    }

    try {
        await ensurePasswordResetTable();

        const result = await pool.query(
            'SELECT id, name, email FROM users WHERE email = $1 LIMIT 1',
            [email]
        );

        if (result.rows.length) {
            const user = result.rows[0];
            const rawToken = await createPasswordResetToken(user.id);
            const resetBaseUrl = buildResetBaseUrl(req.body?.resetBaseUrl || req.body?.reset_base_url);
            const separator = resetBaseUrl.includes('?') ? '&' : '?';
            const resetUrl = `${resetBaseUrl}${separator}resetToken=${encodeURIComponent(rawToken)}`;

            await sendEmail({
                to: user.email,
                appName: 'Felix Admin',
                storefrontKey: 'admin-dashboard',
                subject: 'Reset your Felix Admin password',
                text: [
                    `Hello ${user.name || 'there'},`,
                    '',
                    'We received a request to reset your Felix Admin password.',
                    'Use the link below to choose a new password:',
                    resetUrl,
                    '',
                    'This link expires in 30 minutes.',
                    'If you did not request this, you can safely ignore this email.',
                ].join('\n'),
                html: `
                    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                        <h2 style="margin-bottom:8px;">Reset your Felix Admin password</h2>
                        <p>Hello ${user.name ? String(user.name).replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'there'},</p>
                        <p>We received a request to reset your Felix Admin password.</p>
                        <p>
                            <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;">
                                Choose a new password
                            </a>
                        </p>
                        <p style="word-break:break-all;">If the button does not work, use this link:<br />${resetUrl}</p>
                        <p>This link expires in 30 minutes.</p>
                    </div>
                `,
            });
        }

        return res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Unable to start password reset right now');
    }
};

exports.resetPassword = async (req, res) => {
    const token = String(req.body?.token || req.body?.resetToken || '').trim();
    const password = String(req.body?.password || '').trim();

    if (!token || !password) {
        return res.status(400).send('Reset token and new password are required');
    }

    if (password.length < 8) {
        return res.status(400).send('Password must be at least 8 characters long');
    }

    try {
        await ensurePasswordResetTable();
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const result = await pool.query(
            `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at
             FROM password_reset_tokens prt
             WHERE prt.token_hash = $1
             LIMIT 1`,
            [tokenHash]
        );

        if (!result.rows.length) {
            return res.status(400).send('This reset link is invalid or has expired');
        }

        const resetRecord = result.rows[0];

        if (resetRecord.used_at || new Date(resetRecord.expires_at).getTime() < Date.now()) {
            return res.status(400).send('This reset link is invalid or has expired');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, resetRecord.user_id]);
        await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [resetRecord.id]);

        return res.json({ message: 'Password reset successful. You can now sign in.' });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Unable to reset password right now');
    }
};

exports.getCurrentUser = async (req, res) => {
    res.json({ user: req.user });
};
