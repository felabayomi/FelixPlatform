const pool = require('../db');

const ADMIN_ROLES = new Set(['admin', 'superadmin']);
const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'paid', 'trialing', 'approved', 'current'];

async function hasDocumentFormatterAccess(user = {}) {
    const role = String(user.role || '').toLowerCase();

    if (ADMIN_ROLES.has(role)) {
        return true;
    }

    if (!user.id) {
        return false;
    }

    try {
        const result = await pool.query(
            `SELECT EXISTS (
                SELECT 1
                FROM subscriptions s
                WHERE s.user_id = $1
                  AND LOWER(COALESCE(s.status, '')) = ANY($2::text[])
                  AND (s.end_date IS NULL OR s.end_date >= CURRENT_DATE)
            ) AS has_access`,
            [user.id, ACTIVE_SUBSCRIPTION_STATUSES],
        );

        return Boolean(result.rows[0]?.has_access);
    } catch (error) {
        console.error('Failed to check document formatter access:', error);
        return false;
    }
}

module.exports = {
    ADMIN_ROLES,
    ACTIVE_SUBSCRIPTION_STATUSES,
    hasDocumentFormatterAccess,
};
