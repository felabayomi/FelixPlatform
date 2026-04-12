'use strict';

const crypto = require('crypto');
const pool = require('../db');

const TABLE_NAME = 'expedition_america_standalone_sections';

const PAGE_MAPPER = {
    pages: [
        {
            key: 'home',
            label: 'Home',
            sections: [
                { key: 'hero', label: 'Hero Banner', sortOrder: 0 },
                { key: 'featured-cities-heading', label: 'Featured Cities Heading', sortOrder: 10 },
                { key: 'city-new-york', label: 'City Card - New York', sortOrder: 20 },
                { key: 'city-chicago', label: 'City Card - Chicago', sortOrder: 30 },
            ],
        },
        {
            key: 'about',
            label: 'About',
            sections: [
                { key: 'about-hero', label: 'About Hero', sortOrder: 0 },
                { key: 'mission', label: 'Mission Section', sortOrder: 10 },
            ],
        },
        {
            key: 'cities',
            label: 'Cities',
            sections: [
                { key: 'cities-hero', label: 'Cities Hero', sortOrder: 0 },
                { key: 'city-grid-intro', label: 'City Grid Intro', sortOrder: 10 },
            ],
        },
        {
            key: 'experiences',
            label: 'Experiences',
            sections: [
                { key: 'experiences-hero', label: 'Experiences Hero', sortOrder: 0 },
                { key: 'experience-list-intro', label: 'Experience List Intro', sortOrder: 10 },
            ],
        },
        {
            key: 'events',
            label: 'Events',
            sections: [
                { key: 'events-hero', label: 'Events Hero', sortOrder: 0 },
                { key: 'events-calendar-intro', label: 'Events Calendar Intro', sortOrder: 10 },
            ],
        },
        {
            key: 'deals',
            label: 'Deals',
            sections: [
                { key: 'deals-hero', label: 'Deals Hero', sortOrder: 0 },
                { key: 'deals-grid-intro', label: 'Deals Grid Intro', sortOrder: 10 },
            ],
        },
        {
            key: 'contact',
            label: 'Contact',
            sections: [
                { key: 'contact-hero', label: 'Contact Hero', sortOrder: 0 },
                { key: 'contact-details', label: 'Contact Details', sortOrder: 10 },
            ],
        },
    ],
};

const STARTER_SECTIONS = [
    {
        pageKey: 'home',
        sectionKey: 'hero',
        title: 'Explore America One Great City At A Time',
        subtitle: 'Plan city-first trips with practical guidance and fresh weekly inspiration.',
        body: 'Use this hero section for your main campaign message. Keep it short, clear, and specific to current city offers.',
        ctaLabel: 'Explore Deals',
        ctaUrl: '/deals',
        imageUrl: '',
        sortOrder: 0,
    },
    {
        pageKey: 'home',
        sectionKey: 'featured-cities-heading',
        title: 'Featured Cities',
        subtitle: 'Start with these high-interest city guides.',
        body: '',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 10,
    },
    {
        pageKey: 'home',
        sectionKey: 'city-new-york',
        title: 'New York',
        subtitle: 'Discover skyline energy, borough culture, food, nightlife.',
        body: 'Use this card to highlight current deal windows, key neighborhoods, and seasonal event hooks.',
        ctaLabel: 'View New York',
        ctaUrl: '/cities/new-york',
        imageUrl: '',
        sortOrder: 20,
    },
    {
        pageKey: 'home',
        sectionKey: 'city-chicago',
        title: 'Chicago',
        subtitle: 'Experience lakefront neighborhoods, architecture, deep flavor, music.',
        body: 'Use this card for route ideas, neighborhood picks, and upcoming city highlights.',
        ctaLabel: 'View Chicago',
        ctaUrl: '/cities/chicago',
        imageUrl: '',
        sortOrder: 30,
    },
    {
        pageKey: 'about',
        sectionKey: 'about-hero',
        title: 'About Expedition America',
        subtitle: 'A city travel platform built for modern explorers.',
        body: 'Share your mission, editorial voice, and what makes this standalone project distinct from the 50USAStates publication.',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 0,
    },
    {
        pageKey: 'about',
        sectionKey: 'mission',
        title: 'Our Mission',
        subtitle: 'Make city exploration practical, exciting, and easy to plan.',
        body: 'Use this section to explain the project story, editorial standards, and travel philosophy.',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 10,
    },
    {
        pageKey: 'cities',
        sectionKey: 'cities-hero',
        title: 'City Guides',
        subtitle: 'Browse destination coverage by city, theme, and season.',
        body: '',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 0,
    },
    {
        pageKey: 'cities',
        sectionKey: 'city-grid-intro',
        title: 'Browse Featured Cities',
        subtitle: 'Find destination highlights, neighborhood picks, and travel timing notes.',
        body: '',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 10,
    },
    {
        pageKey: 'experiences',
        sectionKey: 'experiences-hero',
        title: 'Experiences',
        subtitle: 'From food and music to design and nature, curate memorable moments.',
        body: '',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 0,
    },
    {
        pageKey: 'experiences',
        sectionKey: 'experience-list-intro',
        title: 'Top Experiences',
        subtitle: 'Map food, culture, nightlife, and local adventures for each city.',
        body: '',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 10,
    },
    {
        pageKey: 'events',
        sectionKey: 'events-hero',
        title: 'Events',
        subtitle: 'Promote upcoming events with clear dates and city context.',
        body: '',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 0,
    },
    {
        pageKey: 'events',
        sectionKey: 'events-calendar-intro',
        title: 'Upcoming Events',
        subtitle: 'Spotlight city events with clear dates, venue details, and ticket links.',
        body: '',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 10,
    },
    {
        pageKey: 'deals',
        sectionKey: 'deals-hero',
        title: 'Travel Deals',
        subtitle: 'Highlight current offers, booking windows, and savings.',
        body: '',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 0,
    },
    {
        pageKey: 'deals',
        sectionKey: 'deals-grid-intro',
        title: 'Current Deal Picks',
        subtitle: 'Present live offers with booking windows and expected savings.',
        body: '',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 10,
    },
    {
        pageKey: 'contact',
        sectionKey: 'contact-hero',
        title: 'Contact Expedition America',
        subtitle: 'Reach our team for partnerships, city submissions, and support.',
        body: '',
        ctaLabel: 'Contact Team',
        ctaUrl: '/contact',
        imageUrl: '',
        sortOrder: 0,
    },
    {
        pageKey: 'contact',
        sectionKey: 'contact-details',
        title: 'Get In Touch',
        subtitle: 'Partnerships, media, and traveler support.',
        body: 'Email: hello@expeditionamerica.online\nUse this section for support channels, response times, and office hours.',
        ctaLabel: '',
        ctaUrl: '',
        imageUrl: '',
        sortOrder: 10,
    },
];

const ensureStarterSections = async ({ overwrite = false } = {}) => {
    for (const starter of STARTER_SECTIONS) {
        if (overwrite) {
            await pool.query(
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
                    updated_at = NOW()`,
                [
                    crypto.randomUUID(),
                    starter.pageKey,
                    starter.sectionKey,
                    starter.title,
                    starter.subtitle,
                    starter.body,
                    starter.ctaLabel,
                    starter.ctaUrl,
                    starter.imageUrl,
                    starter.sortOrder,
                ]
            );
        } else {
            await pool.query(
                `INSERT INTO ${TABLE_NAME} (
                    id, page_key, section_key, title, subtitle, body, cta_label, cta_url, image_url, sort_order
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                )
                ON CONFLICT (page_key, section_key) DO NOTHING`,
                [
                    crypto.randomUUID(),
                    starter.pageKey,
                    starter.sectionKey,
                    starter.title,
                    starter.subtitle,
                    starter.body,
                    starter.ctaLabel,
                    starter.ctaUrl,
                    starter.imageUrl,
                    starter.sortOrder,
                ]
            );
        }
    }
};

const buildPageExport = (rows) => {
    const byPage = {};

    rows.forEach((row) => {
        const key = row.pageKey || 'unassigned';
        if (!byPage[key]) {
            byPage[key] = {
                pageKey: key,
                sections: {},
                ordered: [],
            };
        }

        byPage[key].sections[row.sectionKey] = row;
        byPage[key].ordered.push(row);
    });

    Object.values(byPage).forEach((page) => {
        page.ordered.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    });

    return {
        generatedAt: new Date().toISOString(),
        pages: byPage,
    };
};

let _tableReady = null;
async function ensureTable() {
    if (_tableReady) {
        return _tableReady;
    }

    _tableReady = (async () => {
        await pool.query(`
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

        await ensureStarterSections();
    })();

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

exports.getMapperContract = async (_req, res) => {
    return res.json(PAGE_MAPPER);
};

exports.syncStarterSections = async (req, res) => {
    try {
        await ensureTable();
        const overwrite = Boolean(req.body?.overwrite);
        await ensureStarterSections({ overwrite });

        const result = await pool.query(
            `SELECT * FROM ${TABLE_NAME} ORDER BY page_key ASC, sort_order ASC, updated_at DESC`
        );

        return res.json({
            ok: true,
            overwrite,
            sections: result.rows.map(mapRow),
        });
    } catch (error) {
        console.error('[ExpeditionAmericaStandalone] syncStarterSections:', error);
        return res.status(500).json({ error: 'Failed to sync starter sections' });
    }
};

exports.getContentExport = async (_req, res) => {
    try {
        await ensureTable();
        const result = await pool.query(
            `SELECT * FROM ${TABLE_NAME} ORDER BY page_key ASC, sort_order ASC, updated_at DESC`
        );
        const mapped = result.rows.map(mapRow);
        return res.json(buildPageExport(mapped));
    } catch (error) {
        console.error('[ExpeditionAmericaStandalone] getContentExport:', error);
        return res.status(500).json({ error: 'Failed to export standalone content' });
    }
};

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
