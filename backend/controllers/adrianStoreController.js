const pool = require('../db');

const CONTENT_KEY = 'adrian_store_content';

const DEFAULT_CONTENT = {
    heroEyebrow: 'Adrian Store',
    heroTitle: 'Elegant kaftans for effortless statement style.',
    heroText: 'Discover bold, flowing silhouettes curated by Adrian — perfect for dinners, travel, special occasions, and everyday confidence.',
    heroPrimaryLabel: 'Shop the collection',
    heroPrimaryLink: '/shop',
    heroSecondaryLabel: 'Explore services',
    heroSecondaryLink: '/services',
    heroImageOne: '/products/chic-green-kaftan.svg',
    heroImageTwo: '/products/wild-elegance-leopard-kaftan.svg',
    heroImageThree: '',
    heroImageFour: '',
    featuredEyebrow: 'Featured pieces',
    featuredTitle: 'Fresh arrivals from Adrian Store',
    featuredText: 'Curated looks designed for comfort, movement, and standout style.',
    servicesEyebrow: 'Services',
    servicesTitle: 'Boutique styling support',
    servicesText: 'Adrian’s Styled Collection is more than a storefront — it is a curated fashion experience centered on effortless elegance.',
    services: [
        {
            id: 'style-curation',
            title: 'Style Curation',
            text: 'Get help selecting standout pieces and coordinated looks that match your event, mood, or travel plans.',
        },
        {
            id: 'wardrobe-refresh',
            title: 'Wardrobe Refresh',
            text: 'Build a fresh capsule of bold, confidence-first outfits with Adrian’s boutique eye and flowing silhouettes.',
        },
        {
            id: 'special-occasion-styling',
            title: 'Special Occasion Styling',
            text: 'Choose elegant kaftans and elevated statement looks for celebrations, dinners, gatherings, and getaways.',
        },
    ],
    successEyebrow: 'Thank you',
    successTitle: 'Your Adrian order is on its way',
    successText: 'Your checkout has been submitted successfully. We will send updates to the email address you used at checkout.',
    footerTitle: "Adrian's Styled Collection",
    footerText: 'Curated statement pieces, flowing silhouettes, and confidence-first style.',
    footerSubtext: "Powered by Felix Platform's shared storefront, checkout, and support tools.",
    supportEmail: 'order@shopwithadrian.com',
};

let ensureTablePromise = null;

const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_CONTENT));

const toText = (value, fallback = '') => {
    if (value === undefined || value === null) {
        return fallback;
    }

    const normalized = String(value).trim();
    return normalized || fallback;
};

const normalizeService = (service = {}, fallback = {}, index = 0) => ({
    id: toText(service.id, fallback.id || `service-${index + 1}`),
    title: toText(service.title, fallback.title || ''),
    text: toText(service.text, fallback.text || ''),
});

const normalizeContent = (content = {}) => {
    const defaults = cloneDefaults();
    const incomingServices = Array.isArray(content.services) && content.services.length
        ? content.services
        : defaults.services;
    const heroImageOne = toText(content.heroImageOne, defaults.heroImageOne);
    const heroImageTwo = toText(content.heroImageTwo, defaults.heroImageTwo);
    const heroImageThree = toText(content.heroImageThree, defaults.heroImageThree);
    const heroImageFour = toText(content.heroImageFour, defaults.heroImageFour);
    const heroImages = [heroImageOne, heroImageTwo, heroImageThree, heroImageFour]
        .filter(Boolean)
        .filter((value, index, items) => items.indexOf(value) === index);

    return {
        heroEyebrow: toText(content.heroEyebrow, defaults.heroEyebrow),
        heroTitle: toText(content.heroTitle, defaults.heroTitle),
        heroText: toText(content.heroText, defaults.heroText),
        heroPrimaryLabel: toText(content.heroPrimaryLabel, defaults.heroPrimaryLabel),
        heroPrimaryLink: toText(content.heroPrimaryLink, defaults.heroPrimaryLink),
        heroSecondaryLabel: toText(content.heroSecondaryLabel, defaults.heroSecondaryLabel),
        heroSecondaryLink: toText(content.heroSecondaryLink, defaults.heroSecondaryLink),
        heroImageOne,
        heroImageTwo,
        heroImageThree,
        heroImageFour,
        heroImages,
        featuredEyebrow: toText(content.featuredEyebrow, defaults.featuredEyebrow),
        featuredTitle: toText(content.featuredTitle, defaults.featuredTitle),
        featuredText: toText(content.featuredText, defaults.featuredText),
        servicesEyebrow: toText(content.servicesEyebrow, defaults.servicesEyebrow),
        servicesTitle: toText(content.servicesTitle, defaults.servicesTitle),
        servicesText: toText(content.servicesText, defaults.servicesText),
        services: defaults.services.map((defaultService, index) => normalizeService(incomingServices[index] || defaultService, defaultService, index)),
        successEyebrow: toText(content.successEyebrow, defaults.successEyebrow),
        successTitle: toText(content.successTitle, defaults.successTitle),
        successText: toText(content.successText, defaults.successText),
        footerTitle: toText(content.footerTitle, defaults.footerTitle),
        footerText: toText(content.footerText, defaults.footerText),
        footerSubtext: toText(content.footerSubtext, defaults.footerSubtext),
        supportEmail: toText(content.supportEmail, defaults.supportEmail),
    };
};

const getFallbackRecord = () => ({
    content: normalizeContent(cloneDefaults()),
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

const readContentRecord = async (allowFallback = false) => {
    try {
        await ensurePlatformContentTable();

        let result = await pool.query(
            'SELECT content, updated_by_email, updated_at FROM platform_content WHERE content_key = $1 LIMIT 1',
            [CONTENT_KEY]
        );

        if (!result.rows.length) {
            const defaults = normalizeContent(cloneDefaults());
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
            content: normalizeContent(row.content || {}),
            updatedByEmail: row.updated_by_email || null,
            updatedAt: row.updated_at || null,
        };
    } catch (error) {
        if (allowFallback) {
            console.warn('Falling back to default Adrian Store content.', error.message || error);
            return getFallbackRecord();
        }

        throw error;
    }
};

exports.getPublicStoreContent = async (_req, res) => {
    try {
        const record = await readContentRecord(true);
        res.set('Cache-Control', 'no-store, max-age=0');
        res.json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load Adrian Store content.' });
    }
};

exports.getAdminStoreContent = async (_req, res) => {
    try {
        const record = await readContentRecord(true);
        res.set('Cache-Control', 'no-store, max-age=0');
        res.json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load Adrian Store admin content.' });
    }
};

exports.updateStoreContent = async (req, res) => {
    try {
        const normalizedContent = normalizeContent(req.body || {});
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
            content: normalizeContent(result.rows[0]?.content || normalizedContent),
            updatedByEmail: result.rows[0]?.updated_by_email || updatedByEmail,
            updatedAt: result.rows[0]?.updated_at || new Date().toISOString(),
            message: 'Adrian Store content updated successfully.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to update Adrian Store content.' });
    }
};
