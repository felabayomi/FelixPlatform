const pool = require('../db');

const DEFAULT_CONFIG_BY_KEY = {
    'adrian-store': {
        contentKey: 'adrian_store_content',
        label: 'Adrian Store',
        defaults: {
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
                    image: '',
                },
                {
                    id: 'wardrobe-refresh',
                    title: 'Wardrobe Refresh',
                    text: 'Build a fresh capsule of bold, confidence-first outfits with Adrian’s boutique eye and flowing silhouettes.',
                    image: '',
                },
                {
                    id: 'special-occasion-styling',
                    title: 'Special Occasion Styling',
                    text: 'Choose elegant kaftans and elevated statement looks for celebrations, dinners, gatherings, and getaways.',
                    image: '',
                },
            ],
            successEyebrow: 'Thank you',
            successTitle: 'Your Adrian order is on its way',
            successText: 'Your checkout has been submitted successfully. We will send updates to the email address you used at checkout.',
            footerTitle: "Adrian's Styled Collection",
            footerText: 'Curated statement pieces, flowing silhouettes, and confidence-first style.',
            footerSubtext: "Powered by Felix Platform's shared storefront, checkout, and support tools.",
            supportEmail: 'order@shopwithadrian.com',
        },
    },
    waci: {
        contentKey: 'waci_storefront_content',
        label: 'WACI',
        defaults: {
            heroEyebrow: 'A home for Africans and friends of Africa who care about wildlife',
            heroTitle: 'Inspiring a growing generation for Africa’s wildlife.',
            heroText: 'Wildlife Africa Conservation Initiative (WACI) brings together local communities, conservation partners, and practical action to protect biodiversity for the long term.',
            heroPrimaryLabel: 'Join the Movement',
            heroPrimaryLink: '#join',
            heroSecondaryLabel: 'Explore Wildlife',
            heroSecondaryLink: '#learn',
            headerLogoUrl: 'https://mediahost.app/api/media/serve/a6a6a62c2c5d3698ffa2674ef586907e?w=400&h=400&fit=crop&crop=center&q=80',
            heroImageOne: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
            heroImageTwo: 'https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=1200&q=80',
            heroImageThree: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
            heroImageFour: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1200&q=80',
            heroWildPlacesTitle: 'Wild places',
            heroWildPlacesText: 'Savannas, forests, wetlands, mountains, and all the life they hold.',
            heroWhyTitle: 'Why WACI',
            heroWhyText: 'Wildlife protection becomes stronger when curiosity, community, and practical action meet.',
            heroVisionTitle: 'Vision',
            heroVisionText: 'A future where African biodiversity thrives because enough people stood up to protect it.',
            heroMissionTitle: 'Mission',
            heroMissionText: 'Bridge the gap between passion and practical action through learning, collaboration, and community.',
            whoWeAreEyebrow: 'Who We Are',
            whoWeAreTitle: 'A platform for wildlife people',
            whoWeAreText: 'WACI was born from a simple truth: Africa’s wildlife needs more people who care, and those people need a place to connect, learn, and act. We exist to make conservation more inclusive, more informed, and more community-driven.',
            whoWeAreItems: [
                {
                    id: 'community-inclusion',
                    title: 'Community & Inclusion',
                    text: 'Conservation belongs to everyone. We welcome professionals, students, creators, local communities, and global allies.',
                    icon: 'users',
                },
                {
                    id: 'knowledge-curiosity',
                    title: 'Knowledge & Curiosity',
                    text: 'We foster understanding of species, ecosystems, and conservation challenges so people can act with clarity.',
                    icon: 'trees',
                },
                {
                    id: 'action-accountability',
                    title: 'Action & Accountability',
                    text: 'We believe awareness matters, but measurable action for wildlife and habitats matters more.',
                    icon: 'shield',
                },
            ],
            featuredEyebrow: 'Priority campaigns',
            featuredTitle: 'Where WACI is focusing now',
            featuredText: 'Highlight live WACI campaigns, updates, and initiatives here through the shared Felix content system.',
            storiesEyebrow: 'Stories & Media',
            storiesTitle: 'Conservation comes alive when people can see it, hear it, and feel it',
            storiesText: 'WACI uses storytelling to connect people to real ecosystems, real communities, and real conservation work across Africa.',
            featuredStoryEyebrow: 'Featured Story',
            featuredStoryTitle: 'Why WACI exists: turning admiration into action',
            featuredStoryText: 'Africa’s wildlife faces habitat loss, climate pressure, poaching, pollution, and human-wildlife conflict. WACI exists to help more people move from caring deeply about these realities to doing something meaningful about them.',
            featuredStoryImage: '',
            featuredStoryImageTwo: '',
            featuredStoryImageThree: '',
            featuredStoryImageFour: '',
            featuredStoryImages: [],
            featuredStoryAlt: 'African landscape with wildlife',
            featuredStoryCtaLabel: 'Join Our Movement',
            featuredStoryCtaLink: '#join',
            servicesEyebrow: 'Our Work',
            servicesTitle: 'Five pillars that turn care into conservation action',
            servicesText: 'Through education, community engagement, research, storytelling, and collaboration, WACI helps people move from admiration of wildlife to active stewardship.',
            services: [
                {
                    id: 'education-awareness',
                    title: 'Education & Awareness',
                    text: 'School outreach, youth wildlife clubs, community workshops, and digital learning experiences that make conservation practical and inspiring.',
                    image: '',
                },
                {
                    id: 'community-conservation',
                    title: 'Community Conservation',
                    text: 'Projects that elevate local voices, strengthen capacity, and support communities living alongside wildlife and wild places.',
                    image: '',
                },
                {
                    id: 'research-citizen-science',
                    title: 'Research & Citizen Science',
                    text: 'Field data, student research, citizen science, and ecosystem knowledge that help improve conservation decisions across Africa.',
                    image: '',
                },
                {
                    id: 'storytelling-media',
                    title: 'Storytelling & Media',
                    text: 'Documentaries, podcasts, blogs, and photo stories that move hearts, shape public understanding, and inspire action.',
                    image: '',
                },
                {
                    id: 'professional-network',
                    title: 'Professional Network',
                    text: 'A growing cross-border community connecting rangers, researchers, students, NGOs, artists, and supporters of African wildlife.',
                    image: '',
                },
            ],
            successEyebrow: 'Thank you',
            successTitle: 'Your message has reached WACI',
            successText: 'A WACI team member will follow up shortly.',
            footerTitle: 'Wildlife Africa Conservation Initiative',
            footerText: 'Protecting species, restoring habitats, and inspiring lasting stewardship.',
            footerSubtext: "Powered by Felix Platform's shared admin, support, and email infrastructure.",
            supportEmail: 'hello@wildlifeafrica.org',
        },
    },
};

const DEFAULT_CONFIG_BY_APP_NAME = {
    'adrian store': DEFAULT_CONFIG_BY_KEY['adrian-store'],
    waci: DEFAULT_CONFIG_BY_KEY.waci,
    'wildlife africa conservation initiative': DEFAULT_CONFIG_BY_KEY.waci,
};

const DEFAULT_CONFIG = DEFAULT_CONFIG_BY_KEY['adrian-store'];

let ensureTablePromise = null;

const cloneDefaults = (defaults = DEFAULT_CONFIG.defaults) => JSON.parse(JSON.stringify(defaults));

const toText = (value, fallback = '') => {
    if (value === undefined || value === null) {
        return fallback;
    }

    const normalized = String(value).trim();
    return normalized || fallback;
};

const resolveContentConfig = (req = {}) => {
    const storefrontKey = toText(req.query?.storefront_key || req.body?.storefront_key || req.body?.storefrontKey, '').toLowerCase();
    const appName = toText(req.query?.app_name || req.body?.app_name || req.body?.appName, '').toLowerCase();

    return DEFAULT_CONFIG_BY_KEY[storefrontKey]
        || DEFAULT_CONFIG_BY_APP_NAME[appName]
        || DEFAULT_CONFIG;
};

const normalizeService = (service = {}, fallback = {}, index = 0) => ({
    id: toText(service.id, fallback.id || `service-${index + 1}`),
    title: toText(service.title, fallback.title || ''),
    text: toText(service.text, fallback.text || ''),
    image: toText(service.image, fallback.image || ''),
});

const normalizeInfoCard = (item = {}, fallback = {}, index = 0) => ({
    id: toText(item.id, fallback.id || `info-card-${index + 1}`),
    title: toText(item.title, fallback.title || ''),
    text: toText(item.text, fallback.text || ''),
    icon: toText(item.icon, fallback.icon || 'users'),
});

const normalizeContent = (content = {}, defaultsSource = DEFAULT_CONFIG.defaults) => {
    const defaults = cloneDefaults(defaultsSource);
    const incomingServices = Array.isArray(content.services) && content.services.length
        ? content.services
        : defaults.services;
    const incomingWhoWeAreItems = Array.isArray(content.whoWeAreItems) && content.whoWeAreItems.length
        ? content.whoWeAreItems
        : (Array.isArray(defaults.whoWeAreItems) ? defaults.whoWeAreItems : []);
    const heroImageOne = toText(content.heroImageOne, defaults.heroImageOne);
    const heroImageTwo = toText(content.heroImageTwo, defaults.heroImageTwo);
    const heroImageThree = toText(content.heroImageThree, defaults.heroImageThree);
    const heroImageFour = toText(content.heroImageFour, defaults.heroImageFour);
    const heroImages = [heroImageOne, heroImageTwo, heroImageThree, heroImageFour]
        .filter(Boolean)
        .filter((value, index, items) => items.indexOf(value) === index);
    const featuredStoryImage = toText(content.featuredStoryImage, defaults.featuredStoryImage || '');
    const featuredStoryImageTwo = toText(content.featuredStoryImageTwo, defaults.featuredStoryImageTwo || '');
    const featuredStoryImageThree = toText(content.featuredStoryImageThree, defaults.featuredStoryImageThree || '');
    const featuredStoryImageFour = toText(content.featuredStoryImageFour, defaults.featuredStoryImageFour || '');
    const featuredStoryImages = [
        ...(Array.isArray(content.featuredStoryImages) ? content.featuredStoryImages : []),
        featuredStoryImage,
        featuredStoryImageTwo,
        featuredStoryImageThree,
        featuredStoryImageFour,
    ]
        .map((value) => toText(value, ''))
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
        headerLogoUrl: toText(content.headerLogoUrl, defaults.headerLogoUrl || ''),
        heroImageOne,
        heroImageTwo,
        heroImageThree,
        heroImageFour,
        heroImages,
        heroWildPlacesTitle: toText(content.heroWildPlacesTitle, defaults.heroWildPlacesTitle),
        heroWildPlacesText: toText(content.heroWildPlacesText, defaults.heroWildPlacesText),
        heroWhyTitle: toText(content.heroWhyTitle, defaults.heroWhyTitle),
        heroWhyText: toText(content.heroWhyText, defaults.heroWhyText),
        heroVisionTitle: toText(content.heroVisionTitle, defaults.heroVisionTitle),
        heroVisionText: toText(content.heroVisionText, defaults.heroVisionText),
        heroMissionTitle: toText(content.heroMissionTitle, defaults.heroMissionTitle),
        heroMissionText: toText(content.heroMissionText, defaults.heroMissionText),
        whoWeAreEyebrow: toText(content.whoWeAreEyebrow, defaults.whoWeAreEyebrow || ''),
        whoWeAreTitle: toText(content.whoWeAreTitle, defaults.whoWeAreTitle || ''),
        whoWeAreText: toText(content.whoWeAreText, defaults.whoWeAreText || ''),
        whoWeAreItems: (() => {
            const normalizedItems = incomingWhoWeAreItems
                .map((item, index) => normalizeInfoCard(item, defaults.whoWeAreItems?.[index] || {}, index))
                .filter((item) => item.title || item.text);

            return normalizedItems.length
                ? normalizedItems
                : (defaults.whoWeAreItems || []).map((item, index) => normalizeInfoCard(item, item, index));
        })(),
        featuredEyebrow: toText(content.featuredEyebrow, defaults.featuredEyebrow),
        featuredTitle: toText(content.featuredTitle, defaults.featuredTitle),
        featuredText: toText(content.featuredText, defaults.featuredText),
        storiesEyebrow: toText(content.storiesEyebrow, defaults.storiesEyebrow || ''),
        storiesTitle: toText(content.storiesTitle, defaults.storiesTitle || ''),
        storiesText: toText(content.storiesText, defaults.storiesText || ''),
        featuredStoryEyebrow: toText(content.featuredStoryEyebrow, defaults.featuredStoryEyebrow || ''),
        featuredStoryTitle: toText(content.featuredStoryTitle, defaults.featuredStoryTitle || ''),
        featuredStoryText: toText(content.featuredStoryText, defaults.featuredStoryText || ''),
        featuredStoryImage: featuredStoryImage || featuredStoryImages[0] || '',
        featuredStoryImageTwo,
        featuredStoryImageThree,
        featuredStoryImageFour,
        featuredStoryImages,
        featuredStoryAlt: toText(content.featuredStoryAlt, defaults.featuredStoryAlt || ''),
        featuredStoryCtaLabel: toText(content.featuredStoryCtaLabel, defaults.featuredStoryCtaLabel || ''),
        featuredStoryCtaLink: toText(content.featuredStoryCtaLink, defaults.featuredStoryCtaLink || ''),
        servicesEyebrow: toText(content.servicesEyebrow, defaults.servicesEyebrow),
        servicesTitle: toText(content.servicesTitle, defaults.servicesTitle),
        servicesText: toText(content.servicesText, defaults.servicesText),
        services: (() => {
            const normalizedServices = incomingServices
                .map((service, index) => normalizeService(service, defaults.services[index] || {}, index))
                .filter((service) => service.title || service.text || service.image);

            return normalizedServices.length
                ? normalizedServices
                : defaults.services.map((defaultService, index) => normalizeService(defaultService, defaultService, index));
        })(),
        successEyebrow: toText(content.successEyebrow, defaults.successEyebrow),
        successTitle: toText(content.successTitle, defaults.successTitle),
        successText: toText(content.successText, defaults.successText),
        footerTitle: toText(content.footerTitle, defaults.footerTitle),
        footerText: toText(content.footerText, defaults.footerText),
        footerSubtext: toText(content.footerSubtext, defaults.footerSubtext),
        supportEmail: toText(content.supportEmail, defaults.supportEmail),
    };
};

const getFallbackRecord = (defaultsSource = DEFAULT_CONFIG.defaults) => ({
    content: normalizeContent(cloneDefaults(defaultsSource), defaultsSource),
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

const readContentRecord = async (config = DEFAULT_CONFIG, allowFallback = false) => {
    try {
        await ensurePlatformContentTable();

        let result = await pool.query(
            'SELECT content, updated_by_email, updated_at FROM platform_content WHERE content_key = $1 LIMIT 1',
            [config.contentKey]
        );

        if (!result.rows.length) {
            const defaults = normalizeContent(cloneDefaults(config.defaults), config.defaults);
            await pool.query(
                `INSERT INTO platform_content (content_key, content, updated_by_email, updated_at)
                 VALUES ($1, $2::jsonb, $3, NOW())`,
                [config.contentKey, JSON.stringify(defaults), 'system-default']
            );

            result = await pool.query(
                'SELECT content, updated_by_email, updated_at FROM platform_content WHERE content_key = $1 LIMIT 1',
                [config.contentKey]
            );
        }

        const row = result.rows[0] || {};
        return {
            content: normalizeContent(row.content || {}, config.defaults),
            updatedByEmail: row.updated_by_email || null,
            updatedAt: row.updated_at || null,
        };
    } catch (error) {
        if (allowFallback) {
            console.warn(`Falling back to default ${config.label} content.`, error.message || error);
            return getFallbackRecord(config.defaults);
        }

        throw error;
    }
};

exports.getPublicStoreContent = async (req, res) => {
    try {
        const config = resolveContentConfig(req);
        const record = await readContentRecord(config, true);
        res.set('Cache-Control', 'no-store, max-age=0');
        res.json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load site content.' });
    }
};

exports.getAdminStoreContent = async (req, res) => {
    try {
        const config = resolveContentConfig(req);
        const record = await readContentRecord(config, true);
        res.set('Cache-Control', 'no-store, max-age=0');
        res.json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load site content settings.' });
    }
};

exports.updateStoreContent = async (req, res) => {
    try {
        const config = resolveContentConfig(req);
        const { app_name, appName, storefront_key, storefrontKey, ...contentPayload } = req.body || {};
        const normalizedContent = normalizeContent(contentPayload, config.defaults);
        const updatedByEmail = req.user?.email || 'admin';

        const result = await pool.query(
            `INSERT INTO platform_content (content_key, content, updated_by_email, updated_at)
             VALUES ($1, $2::jsonb, $3, NOW())
             ON CONFLICT (content_key)
             DO UPDATE SET content = EXCLUDED.content,
                           updated_by_email = EXCLUDED.updated_by_email,
                           updated_at = NOW()
             RETURNING content, updated_by_email, updated_at`,
            [config.contentKey, JSON.stringify(normalizedContent), updatedByEmail]
        );

        res.json({
            content: normalizeContent(result.rows[0]?.content || normalizedContent, config.defaults),
            updatedByEmail: result.rows[0]?.updated_by_email || updatedByEmail,
            updatedAt: result.rows[0]?.updated_at || new Date().toISOString(),
            message: `${config.label} content updated successfully.`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to update site content.' });
    }
};
