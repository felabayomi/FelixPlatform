const pool = require('../db');

const CONTENT_KEY = 'felix_platform_homepage';

const DEFAULT_HOMEPAGE_CONTENT = {
    heroTitle: 'Digital tools, services, and logistics solutions',
    heroText: 'Discover the Felix Platforms ecosystem — from Document Formatter, to Felix Store across web and mobile, to A & F Laundry across its web app, brand site, and iOS experience.',
    sectionTitle: 'Our Apps & Services',
    sectionText: 'The main site is your entry point. Each card below separates the live web apps, branded sites, and upcoming App Store destinations so customers land exactly where they need to go.',
    cards: [
        {
            id: 'document-formatter',
            title: 'Document Formatter',
            description: 'Turn messy text into polished academic papers, business reports, and export-ready documents with the Felix Platform formatter.',
            imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Request Formatter Access',
            buttonLink: 'mailto:support@felixplatforms.com?subject=Document%20Formatter%20Access',
            note: 'Private web tool with Word, PDF, and text export workflows',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'felix-store-web',
            title: 'Felix Store Web App',
            description: 'Open the live Felix Store web app for browsing products, services, subscriptions, and quote-based requests.',
            imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Open Felix Store Web App',
            buttonLink: 'https://storeapp.felixplatforms.com/',
            note: 'Live at storeapp.felixplatforms.com',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'felix-store-mobile',
            title: 'Felix Store Mobile App',
            description: 'The iOS version of Felix Store will be linked here once App Store approval is complete.',
            imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'App Store link coming soon',
            buttonLink: '',
            note: 'Apple link will be attached after approval',
            comingSoon: true,
            appleBadge: true,
        },
        {
            id: 'aflaundry-webapp',
            title: 'A & F Laundry Web App',
            description: 'Use the dedicated laundry web app for booking, quote requests, service tracking, and customer actions.',
            imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Open Laundry Web App',
            buttonLink: 'https://laundryapp.felixplatforms.com/',
            note: 'Live at laundryapp.felixplatforms.com',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'aflaundry-site',
            title: 'A & F Laundry at aflaundry.com',
            description: 'Visit the branded A & F Laundry site for the public-facing service experience, contact details, and business information.',
            imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit aflaundry.com',
            buttonLink: 'https://aflaundry.com/',
            note: 'Branded laundry site at aflaundry.com',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'aflaundry-mobile',
            title: 'A & F Laundry Mobile App',
            description: 'The A & F Laundry iOS app will be linked here once it clears App Store review and goes live.',
            imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'App Store link coming soon',
            buttonLink: '',
            note: 'Apple link will be attached after approval',
            comingSoon: true,
            appleBadge: true,
        },
    ],
};

let ensureTablePromise = null;

const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_CONTENT));

const toText = (value, fallback = '') => {
    if (value === undefined || value === null) {
        return fallback;
    }

    const normalized = String(value).trim();
    return normalized || fallback;
};

const toBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') {
        return value;
    }

    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const normalizeCard = (card = {}, fallback = {}, index = 0) => ({
    id: toText(card.id, fallback.id || `card-${index + 1}`),
    title: toText(card.title, fallback.title || ''),
    description: toText(card.description, fallback.description || ''),
    imageUrl: toText(card.imageUrl, fallback.imageUrl || ''),
    buttonLabel: toText(card.buttonLabel, fallback.buttonLabel || ''),
    buttonLink: toText(card.buttonLink, fallback.buttonLink || ''),
    note: toText(card.note, fallback.note || ''),
    comingSoon: toBoolean(card.comingSoon, fallback.comingSoon || false),
    appleBadge: toBoolean(card.appleBadge, fallback.appleBadge || false),
});

const normalizeHomepageContent = (content = {}) => {
    const defaults = cloneDefaults();
    const incomingCards = Array.isArray(content.cards) && content.cards.length ? content.cards : defaults.cards;

    return {
        heroTitle: toText(content.heroTitle, defaults.heroTitle),
        heroText: toText(content.heroText, defaults.heroText),
        sectionTitle: toText(content.sectionTitle, defaults.sectionTitle),
        sectionText: toText(content.sectionText, defaults.sectionText),
        cards: defaults.cards.map((defaultCard, index) => normalizeCard(incomingCards[index] || defaultCard, defaultCard, index)),
    };
};

const getFallbackRecord = () => ({
    content: normalizeHomepageContent(cloneDefaults()),
    updatedByEmail: 'system-default',
    updatedAt: null,
});

const ensurePlatformContentTable = async () => {
    if (!ensureTablePromise) {
        ensureTablePromise = pool.query(`
            CREATE TABLE IF NOT EXISTS platform_content (
                content_key TEXT PRIMARY KEY,
                content JSONB NOT NULL DEFAULT '{}'::jsonb,
                updated_by_email TEXT,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `).catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }

    await ensureTablePromise;
};

const readHomepageRecord = async (allowFallback = false) => {
    try {
        await ensurePlatformContentTable();

        let result = await pool.query(
            'SELECT content, updated_by_email, updated_at FROM platform_content WHERE content_key = $1 LIMIT 1',
            [CONTENT_KEY]
        );

        if (!result.rows.length) {
            const defaults = normalizeHomepageContent(cloneDefaults());
            await pool.query(
                `INSERT INTO platform_content (content_key, content, updated_by_email, updated_at)
                 VALUES ($1, $2::jsonb, $3, NOW())`,
                [CONTENT_KEY, JSON.stringify(defaults), 'system-default']
            );

            result = await pool.query(
                'SELECT content, updated_by_email, updated_at FROM platform_content WHERE content_key = $1 LIMIT 1',
                [CONTENT_KEY]
            );
        }

        const row = result.rows[0] || {};
        return {
            content: normalizeHomepageContent(row.content || {}),
            updatedByEmail: row.updated_by_email || null,
            updatedAt: row.updated_at || null,
        };
    } catch (error) {
        if (allowFallback) {
            console.warn('Falling back to default Felix Platforms homepage content.', error.message || error);
            return getFallbackRecord();
        }

        throw error;
    }
};

exports.getPublicHomepageContent = async (_req, res) => {
    try {
        const record = await readHomepageRecord(true);
        res.set('Cache-Control', 'no-store, max-age=0');
        res.json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load Felix Platforms homepage content.' });
    }
};

exports.getAdminHomepageContent = async (_req, res) => {
    try {
        const record = await readHomepageRecord(true);
        res.set('Cache-Control', 'no-store, max-age=0');
        res.json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load admin homepage content settings.' });
    }
};

exports.updateHomepageContent = async (req, res) => {
    try {
        const normalizedContent = normalizeHomepageContent(req.body || {});
        const updatedByEmail = req.user?.email || 'admin';

        const result = await pool.query(
            `INSERT INTO platform_content (content_key, content, updated_by_email, updated_at)
             VALUES ($1, $2::jsonb, $3, NOW())
             ON CONFLICT (content_key)
             DO UPDATE SET content = EXCLUDED.content,
                           updated_by_email = EXCLUDED.updated_by_email,
                           updated_at = NOW()
             RETURNING content, updated_by_email, updated_at`,
            [CONTENT_KEY, JSON.stringify(normalizedContent), updatedByEmail]
        );

        res.json({
            content: normalizeHomepageContent(result.rows[0]?.content || normalizedContent),
            updatedByEmail: result.rows[0]?.updated_by_email || updatedByEmail,
            updatedAt: result.rows[0]?.updated_at || new Date().toISOString(),
            message: 'Felix Platforms homepage content updated successfully.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to update Felix Platforms homepage content.' });
    }
};
