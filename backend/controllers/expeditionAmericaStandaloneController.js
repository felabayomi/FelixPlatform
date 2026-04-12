'use strict';

const crypto = require('crypto');
const pool = require('../db');

const TABLE_NAME = 'expedition_america_standalone_sections';

let _tableReady = null;
async function ensureTable() {
    if (_tableReady) {
        return _tableReady;
    }

    _tableReady = pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
            id VARCHAR PRIMARY KEY,
            page_key TEXT NOT NULL,
            section_key TEXT NOT NULL,
            title TEXT NOT NULL,
            subtitle TEXT,
            body TEXT,
            cta_label TEXT,
            cta_url TEXT,
            image_url TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(page_key, section_key)
        );

        CREATE INDEX IF NOT EXISTS expedition_america_standalone_sections_page_idx
            ON ${TABLE_NAME} (page_key, sort_order, updated_at DESC);
    `);

    return _tableReady;
}

const normalizeText = (value, fallback = '') => {
    if (value === undefined || value === null) {
        return fallback;
    }
    const text = String(value).trim();
    return text || fallback;
};

const normalizeInt = (value, fallback = 0) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.trunc(parsed);
};

const mapRow = (row) => ({
    id: row.id,
    pageKey: row.page_key,
    sectionKey: row.section_key,
    title: row.title,
    subtitle: row.subtitle || '',
    body: row.body || '',
    ctaLabel: row.cta_label || '',
    ctaUrl: row.cta_url || '',
    imageUrl: row.image_url || '',
    sortOrder: Number(row.sort_order || 0),
    updatedAt: row.updated_at,
});

exports.getPublicContent = async (_req, res) => {
    try {
        await ensureTable();
        const result = await pool.query(
            `SELECT * FROM ${TABLE_NAME} ORDER BY page_key ASC, sort_order ASC, updated_at DESC`
        );
        return res.json(result.rows.map(mapRow));
    } catch (error) {
        console.error('[ExpeditionAmericaStandalone] getPublicContent:', error);
        return res.status(500).json({ error: 'Failed to fetch standalone content' });
    }
};

exports.getAdminContent = async (_req, res) => {
    try {
        await ensureTable();
        const result = await pool.query(
            `SELECT * FROM ${TABLE_NAME} ORDER BY page_key ASC, sort_order ASC, updated_at DESC`
        );
        return res.json(result.rows.map(mapRow));
    } catch (error) {
        console.error('[ExpeditionAmericaStandalone] getAdminContent:', error);
        return res.status(500).json({ error: 'Failed to fetch standalone content' });
    }
};

exports.createSection = async (req, res) => {
    try {
        await ensureTable();

        const pageKey = normalizeText(req.body?.pageKey);
        const sectionKey = normalizeText(req.body?.sectionKey);
        const title = normalizeText(req.body?.title);

        if (!pageKey || !sectionKey || !title) {
            return res.status(400).json({ error: 'pageKey, sectionKey and title are required' });
        }

        const result = await pool.query(
            `INSERT INTO ${TABLE_NAME} (
                id, page_key, section_key, title, subtitle, body, cta_label, cta_url, image_url, sort_order
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
            ON CONFLICT (page_key, section_key)
            DO UPDATE SET
                title = EXCLUDED.title,
                subtitle = EXCLUDED.subtitle,
                body = EXCLUDED.body,
                cta_label = EXCLUDED.cta_label,
                cta_url = EXCLUDED.cta_url,
                image_url = EXCLUDED.image_url,
                sort_order = EXCLUDED.sort_order,
                updated_at = NOW()
            RETURNING *`,
            [
                crypto.randomUUID(),
                pageKey,
                sectionKey,
                title,
                normalizeText(req.body?.subtitle),
                normalizeText(req.body?.body),
                normalizeText(req.body?.ctaLabel),
                normalizeText(req.body?.ctaUrl),
                normalizeText(req.body?.imageUrl),
                normalizeInt(req.body?.sortOrder, 0),
            ]
        );

        return res.status(201).json(mapRow(result.rows[0]));
    } catch (error) {
        console.error('[ExpeditionAmericaStandalone] createSection:', error);
        return res.status(500).json({ error: 'Failed to save section' });
    }
};

exports.updateSection = async (req, res) => {
    try {
        await ensureTable();

        const updates = [];
        const values = [];

        const set = (column, value) => {
            values.push(value);
            updates.push(`${column} = $${values.length}`);
        };

        if (req.body?.pageKey !== undefined) {
            set('page_key', normalizeText(req.body.pageKey));
        }
        if (req.body?.sectionKey !== undefined) {
            set('section_key', normalizeText(req.body.sectionKey));
        }
        if (req.body?.title !== undefined) {
            set('title', normalizeText(req.body.title));
        }
        if (req.body?.subtitle !== undefined) {
            set('subtitle', normalizeText(req.body.subtitle));
        }
        if (req.body?.body !== undefined) {
            set('body', normalizeText(req.body.body));
        }
        if (req.body?.ctaLabel !== undefined) {
            set('cta_label', normalizeText(req.body.ctaLabel));
        }
        if (req.body?.ctaUrl !== undefined) {
            set('cta_url', normalizeText(req.body.ctaUrl));
        }
        if (req.body?.imageUrl !== undefined) {
            set('image_url', normalizeText(req.body.imageUrl));
        }
        if (req.body?.sortOrder !== undefined) {
            set('sort_order', normalizeInt(req.body.sortOrder, 0));
        }

        if (!updates.length) {
            return res.status(400).json({ error: 'No fields provided for update' });
        }

        updates.push('updated_at = NOW()');
        values.push(req.params.id);

        const result = await pool.query(
            `UPDATE ${TABLE_NAME}
             SET ${updates.join(', ')}
             WHERE id = $${values.length}
             RETURNING *`,
            values
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Section not found' });
        }

        return res.json(mapRow(result.rows[0]));
    } catch (error) {
        console.error('[ExpeditionAmericaStandalone] updateSection:', error);
        return res.status(500).json({ error: 'Failed to update section' });
    }
};

exports.deleteSection = async (req, res) => {
    try {
        await ensureTable();

        const result = await pool.query(`DELETE FROM ${TABLE_NAME} WHERE id = $1 RETURNING id`, [req.params.id]);
        if (!result.rows.length) {
            return res.status(404).json({ error: 'Section not found' });
        }

        return res.status(204).send();
    } catch (error) {
        console.error('[ExpeditionAmericaStandalone] deleteSection:', error);
        return res.status(500).json({ error: 'Failed to delete section' });
    }
};
