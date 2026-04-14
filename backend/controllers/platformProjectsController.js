const pool = require('../db');
const { ensurePlatformProjectsSchema } = require('../services/ensurePlatformProjectsSchema');

const VALID_STATUSES = new Set(['draft', 'in_development', 'ready', 'launched', 'archived']);

const toNullableText = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized || null;
};

const toBoolean = (value, fallback = false) => {
    if (value === undefined || value === null) {
        return fallback;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const toInteger = (value, fallback = 0) => {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    const normalized = Number(value);
    return Number.isNaN(normalized) ? fallback : Math.round(normalized);
};

const normalizeStatus = (value, fallback = 'draft') => {
    const normalized = toNullableText(value);
    if (!normalized) {
        return fallback;
    }

    const candidate = normalized.toLowerCase();
    return VALID_STATUSES.has(candidate) ? candidate : null;
};

exports.listProjects = async (req, res) => {
    try {
        await ensurePlatformProjectsSchema();

        const status = normalizeStatus(req.query.status, null);
        if (req.query.status && !status) {
            return res.status(400).json({ error: 'Invalid status filter.' });
        }

        const includeArchived = toBoolean(req.query.include_archived, false);
        const values = [];
        const whereParts = [];

        if (status) {
            values.push(status);
            whereParts.push(`status = $${values.length}`);
        } else if (!includeArchived) {
            values.push('archived');
            whereParts.push(`status <> $${values.length}`);
        }

        const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

        const result = await pool.query(
            `SELECT *
             FROM platform_projects
             ${whereClause}
             ORDER BY sort_order ASC, sidebar_label ASC, created_at ASC`,
            values
        );

        res.json(result.rows);
    } catch (error) {
        console.error('[PlatformProjects:listProjects]', error);
        res.status(500).json({ error: 'Failed to load platform projects.' });
    }
};

exports.listLaunchedProjects = async (_req, res) => {
    try {
        await ensurePlatformProjectsSchema();

        const result = await pool.query(
            `SELECT *
             FROM platform_projects
             WHERE status = 'launched'
             ORDER BY sort_order ASC, sidebar_label ASC, created_at ASC`
        );

        res.set('Cache-Control', 'no-store, max-age=0');
        res.json(result.rows);
    } catch (error) {
        console.error('[PlatformProjects:listLaunchedProjects]', error);
        res.status(500).json({ error: 'Failed to load launched platform projects.' });
    }
};

exports.createProject = async (req, res) => {
    try {
        await ensurePlatformProjectsSchema();

        const payload = req.body || {};
        const name = toNullableText(payload.name);
        const slug = toNullableText(payload.slug);
        const adminPath = toNullableText(payload.admin_path);
        const sidebarLabel = toNullableText(payload.sidebar_label);
        const status = normalizeStatus(payload.status, 'draft');

        if (!name || !slug || !adminPath || !sidebarLabel) {
            return res.status(400).json({
                error: 'name, slug, admin_path, and sidebar_label are required.',
            });
        }

        if (!status) {
            return res.status(400).json({ error: 'Invalid status value.' });
        }

        const result = await pool.query(
            `INSERT INTO platform_projects (
                name,
                slug,
                app_path,
                public_url,
                admin_path,
                sidebar_label,
                quick_access_label,
                icon_name,
                category,
                status,
                show_in_sidebar,
                show_in_quick_access,
                sort_order
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            RETURNING *`,
            [
                name,
                slug,
                toNullableText(payload.app_path),
                toNullableText(payload.public_url),
                adminPath,
                sidebarLabel,
                toNullableText(payload.quick_access_label),
                toNullableText(payload.icon_name),
                toNullableText(payload.category),
                status,
                toBoolean(payload.show_in_sidebar, false),
                toBoolean(payload.show_in_quick_access, false),
                toInteger(payload.sort_order, 0),
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('[PlatformProjects:createProject]', error);

        if (error?.code === '23505') {
            return res.status(409).json({ error: 'A project with this slug already exists.' });
        }

        res.status(500).json({ error: 'Failed to create platform project.' });
    }
};

exports.updateProject = async (req, res) => {
    try {
        await ensurePlatformProjectsSchema();

        const { id } = req.params;
        const payload = req.body || {};

        const statusProvided = Object.prototype.hasOwnProperty.call(payload, 'status');
        const status = statusProvided ? normalizeStatus(payload.status, null) : null;

        if (statusProvided && !status) {
            return res.status(400).json({ error: 'Invalid status value.' });
        }

        const result = await pool.query(
            `UPDATE platform_projects
             SET
                name = COALESCE($1, name),
                slug = COALESCE($2, slug),
                app_path = COALESCE($3, app_path),
                public_url = COALESCE($4, public_url),
                admin_path = COALESCE($5, admin_path),
                sidebar_label = COALESCE($6, sidebar_label),
                quick_access_label = COALESCE($7, quick_access_label),
                icon_name = COALESCE($8, icon_name),
                category = COALESCE($9, category),
                status = COALESCE($10, status),
                show_in_sidebar = COALESCE($11, show_in_sidebar),
                show_in_quick_access = COALESCE($12, show_in_quick_access),
                sort_order = COALESCE($13, sort_order),
                updated_at = NOW()
             WHERE id = $14
             RETURNING *`,
            [
                toNullableText(payload.name),
                toNullableText(payload.slug),
                toNullableText(payload.app_path),
                toNullableText(payload.public_url),
                toNullableText(payload.admin_path),
                toNullableText(payload.sidebar_label),
                toNullableText(payload.quick_access_label),
                toNullableText(payload.icon_name),
                toNullableText(payload.category),
                status,
                Object.prototype.hasOwnProperty.call(payload, 'show_in_sidebar') ? toBoolean(payload.show_in_sidebar, false) : null,
                Object.prototype.hasOwnProperty.call(payload, 'show_in_quick_access') ? toBoolean(payload.show_in_quick_access, false) : null,
                Object.prototype.hasOwnProperty.call(payload, 'sort_order') ? toInteger(payload.sort_order, 0) : null,
                id,
            ]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Platform project not found.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('[PlatformProjects:updateProject]', error);

        if (error?.code === '23505') {
            return res.status(409).json({ error: 'A project with this slug already exists.' });
        }

        res.status(500).json({ error: 'Failed to update platform project.' });
    }
};
