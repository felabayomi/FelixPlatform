const pool = require('../db');

const CONTENT_KEY = 'felix_platform_homepage';

const DEFAULT_HOMEPAGE_CONTENT = {
    heroTitle: 'Digital tools, services, and logistics solutions',
    heroText: 'Felix Platforms powers 20+ digital products across conservation, travel, commerce, and community — from Document Formatter and Felix Store to Wildlife of Africa, Expedition America, and beyond.',
    sectionTitle: 'Our Apps & Services',
    sectionText: 'Explore the full Felix Platforms ecosystem — Core Platform services, Conservation & Wildlife tools, Travel & Discovery experiences, and Community platforms.',

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
            description: 'Download the Felix Store iOS app to browse products, request quotes, and manage your orders on the go.',
            imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Download on App Store',
            buttonLink: 'https://apps.apple.com/us/app/felix-store/id1567050617',
            note: 'Live on iOS App Store',
            comingSoon: false,
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
            description: 'Download the A & F Laundry iOS app to book services, track appointments, and manage your laundry requests on the go.',
            imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Download on App Store',
            buttonLink: 'https://apps.apple.com/us/app/aflaundry/id1596646806',
            note: 'Live on iOS App Store',
            comingSoon: false,
            appleBadge: true,
        },
        {
            id: 'waci',
            title: 'Wildlife of Africa Conservation Initiative',
            description: 'WACI connects communities, data, and policy to protect Africa\'s biodiversity through conservation programs, storytelling, and field projects.',
            imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit wildlifeafrica.org',
            buttonLink: 'https://www.wildlifeafrica.org/',
            note: 'Live at wildlifeafrica.org',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'wildlife-pedia',
            title: 'Wildlife-Pedia',
            description: 'Browse the crowdsourced wildlife encyclopedia — species profiles, habitat maps, community sightings, and active conservation projects.',
            imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit wildlife-pedia.com',
            buttonLink: 'https://www.wildlife-pedia.com/',
            note: 'Live at wildlife-pedia.com',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'waci-project-hub',
            title: 'WACI Project Hub',
            description: 'Manage WACI pilot projects, volunteer assignments, grant offers, and field reports in one place — the conservation project management platform.',
            imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit Project Hub',
            buttonLink: 'https://projecthub.wildlifeafrica.org/',
            note: 'Live at projecthub.wildlifeafrica.org',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'expedition-america',
            title: 'Expedition America',
            description: 'Explore all 50 US states — curated travel stories, city guides, and AI-powered discovery powered by the 50USAStates platform.',
            imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit expeditionamerica.online',
            buttonLink: 'https://expeditionamerica.online/',
            note: 'Live at expeditionamerica.online',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'expedition-america-standalone',
            title: 'Expedition America App',
            description: 'The standalone Expedition America app experience — independent AI travel articles, state guides, and destination highlights at expeditionamerica.us.',
            imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit expeditionamerica.us',
            buttonLink: 'https://expeditionamerica.us/',
            note: 'Live at expeditionamerica.us',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'city-tour-hub',
            title: 'City Tour Hub',
            description: 'Book guided tours for cities across the USA and beyond — powered by the CityDiscoverer platform.',
            imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit City Tour Hub',
            buttonLink: 'https://tours.citydiscoverer.guide/',
            note: 'Live at tours.citydiscoverer.guide',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'citydayint',
            title: 'CityDayInt International',
            description: 'Discover international city destinations — daily curated city profiles and travel insights from around the world.',
            imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit CityDayInt',
            buttonLink: 'https://international.citydiscoverer.guide/',
            note: 'Live at international.citydiscoverer.guide',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'cityofday',
            title: 'CityOfDay Daily',
            description: 'Your daily USA city spotlight — new city, new story, every day on the CityOfDay Daily platform.',
            imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit CityOfDay',
            buttonLink: 'https://daily.citydiscoverer.guide/',
            note: 'Live at daily.citydiscoverer.guide',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'felitrips',
            title: 'FeliTrips',
            description: 'Group travel made easy — plan, book, and manage group tours through the FeliTrips platform at grouptours.citydiscoverer.guide.',
            imageUrl: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit FeliTrips',
            buttonLink: 'https://grouptours.citydiscoverer.guide/',
            note: 'Live at grouptours.citydiscoverer.guide',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'felix-travel-tv',
            title: 'Felix Travel TV',
            description: 'Stream travel stories, destination highlights, and video guides from the Felix Travel TV editorial team.',
            imageUrl: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit Felix Travel TV',
            buttonLink: 'https://felix-travel-tv.netlify.app/',
            note: 'Live at felix-travel-tv.netlify.app',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'adrian-store',
            title: 'Adrian Store',
            description: 'Shop curated products and services at Adrian Store — browse, request a quote, and order online at shopwithadrian.com.',
            imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit shopwithadrian.com',
            buttonLink: 'https://shopwithadrian.com/',
            note: 'Live at shopwithadrian.com',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'dailyfelix-wordofday',
            title: 'DailyFelix Word of Day',
            description: 'Start each day with a word, a reflection, and a purpose — the DailyFelix Word of Day daily faith platform.',
            imageUrl: 'https://images.unsplash.com/photo-1499728603263-13726abce5fd?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit faithhouse.app',
            buttonLink: 'https://faithhouse.app/',
            note: 'Live at faithhouse.app',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'tfcgchat',
            title: 'TFCG Chat',
            description: 'The TFCG community chat platform — discussion spaces, messaging, and collaborative engagement for members.',
            imageUrl: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit TFCG Chat',
            buttonLink: 'https://tfcgchat.felixconsult.co/',
            note: 'Live at tfcgchat.felixconsult.co',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'election-predictor',
            title: 'Election Predictor',
            description: 'Track, model, and visualize election race outcomes with the Election Predictor analysis and forecasting platform.',
            imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit electionpredictor.net',
            buttonLink: 'https://electionpredictor.net/',
            note: 'Live at electionpredictor.net',
            comingSoon: false,
            appleBadge: false,
        },
        {
            id: 'wildfilm-tracker',
            title: 'WildFilm Tracker',
            description: 'Discover, catalog, and track wildlife films and documentaries from festivals, conservation organizations, and independent filmmakers.',
            imageUrl: 'https://images.unsplash.com/photo-1489749798305-4fea3ba63d60?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Download on App Store',
            buttonLink: 'https://apps.apple.com/us/app/wildlifefilms/id6758022608',
            note: 'iOS app with web companion at api.wildfilms.app',
            comingSoon: false,
            appleBadge: true,
        },
        {
            id: 'praxis-nexus',
            title: 'Praxis Nexus',
            description: 'EdD academic inquiry journal exploring AI, ecology, and conservation through scholarly research and reflective practice.',
            imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f5?auto=format&fit=crop&w=900&q=80',
            buttonLabel: 'Visit Praxis Nexus',
            buttonLink: 'https://praxis-nexus.vercel.app/',
            note: 'Academic portfolio and research platform',
            comingSoon: false,
            appleBadge: false,
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
    // Use incoming cards when present; fall back to full defaults when empty
    const incoming = Array.isArray(content.cards) && content.cards.length
        ? content.cards
        : defaults.cards;

    return {
        heroTitle: toText(content.heroTitle, defaults.heroTitle),
        heroText: toText(content.heroText, defaults.heroText),
        sectionTitle: toText(content.sectionTitle, defaults.sectionTitle),
        sectionText: toText(content.sectionText, defaults.sectionText),
        // Variable-length: normalise each card against its matching default (or empty) as fallback
        cards: incoming.map((card, index) => normalizeCard(card, defaults.cards[index] || {}, index)),
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
        const savedCards = Array.isArray(row.content?.cards) ? row.content.cards : [];
        const defaults = cloneDefaults();

        // Auto-fill: if saved cards exist but are fewer than the current defaults,
        // append missing defaults so new apps appear without a manual admin reset.
        if (savedCards.length > 0 && savedCards.length < defaults.cards.length) {
            row.content = {
                ...row.content,
                cards: [...savedCards, ...defaults.cards.slice(savedCards.length)],
            };
        }

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
