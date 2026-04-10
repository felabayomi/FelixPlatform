const Stripe = require('stripe');
const pool = require('../db');
const { sendSupportRequestNotification, sendEmail } = require('../services/resendEmail');

const WACI_APP_NAME = 'WACI';
const WACI_STOREFRONT_KEY = 'waci';
const PROGRAMS_CONTENT_KEY = 'waci_programs';
const STORIES_CONTENT_KEY = 'waci_stories';
const PARTNERS_CONTENT_KEY = 'waci_partner_options';
const DONORS_CONTENT_KEY = 'waci_donor_options';
const WACI_PAYOUT_METHODS = {
    stripe_express: {
        id: 'stripe_express',
        label: 'Stripe Express',
        minAmountCents: 100,
        feeRate: 0.0025,
        speed: 'Within 24 hours',
    },
    bank_transfer: {
        id: 'bank_transfer',
        label: 'Bank Transfer',
        minAmountCents: 500,
        feeRate: 0,
        speed: '3-5 business days',
    },
    paypal: {
        id: 'paypal',
        label: 'PayPal',
        minAmountCents: 100,
        feeRate: 0.029,
        speed: '1-2 business days',
    },
    check_by_mail: {
        id: 'check_by_mail',
        label: 'Check by Mail',
        minAmountCents: 2500,
        feeRate: 0,
        speed: '7-14 business days',
    },
};
const PAID_PAYOUT_STATUSES = ['completed', 'paid'];
const PENDING_PAYOUT_STATUSES = ['created', 'pending', 'processing', 'approved', 'scheduled'];
const WACI_STORY_STATUS_OPTIONS = ['pending', 'published', 'rejected', 'archived'];
const WACI_REWARD_RECALC_INTERVAL_MS = 60 * 60 * 1000;
const WACI_TIER_RANK = {
    Bronze: 0,
    Silver: 1,
    Gold: 2,
    Platinum: 3,
};
const WACI_DONATION_CURRENCY = String(process.env.WACI_STRIPE_CURRENCY || process.env.STRIPE_CURRENCY || 'usd').toLowerCase();

let waciStripeClient = null;
let waciRewardSchedulerStarted = false;
let lastWaciRewardsRecalcAt = 0;

const DEFAULT_PROGRAMS = [
    {
        id: 'habitat-restoration',
        title: 'Habitat restoration',
        text: 'Rebuild ecosystems, restore degraded land, and improve conditions for native species to recover.',
        status: 'active',
        region: 'Priority landscapes',
    },
    {
        id: 'wildlife-protection',
        title: 'Wildlife protection',
        text: 'Support ranger readiness, species monitoring, rescue networks, and rapid field response capacity.',
        status: 'active',
        region: 'Protected habitats',
    },
    {
        id: 'community-conservation',
        title: 'Community conservation',
        text: 'Co-design practical solutions with local leaders so conservation supports shared prosperity.',
        status: 'active',
        region: 'Community-led initiatives',
    },
    {
        id: 'education-and-advocacy',
        title: 'Education and advocacy',
        text: 'Equip schools, youth leaders, and partners with conservation knowledge and compelling public storytelling.',
        status: 'active',
        region: 'Schools and public outreach',
    },
];

const DEFAULT_STORIES = [
    {
        id: 'ranger-readiness',
        title: 'Ranger readiness in priority habitats',
        summary: 'WACI supports field readiness, monitoring coordination, and practical conservation logistics where rapid response matters most.',
        location: 'East Africa',
        publishedAt: '2026-04-01',
    },
    {
        id: 'youth-conservation',
        title: 'Growing youth conservation leadership',
        summary: 'Education and storytelling programs are helping young advocates connect biodiversity protection with long-term community stewardship.',
        location: 'West Africa',
        publishedAt: '2026-03-21',
    },
    {
        id: 'community-partnerships',
        title: 'Community partnerships that last',
        summary: 'Local collaboration remains central to how WACI turns conservation plans into practical, measurable action on the ground.',
        location: 'Southern Africa',
        publishedAt: '2026-03-08',
    },
];

const DEFAULT_PARTNERS = [
    {
        id: 'field-logistics',
        title: 'Field logistics partners',
        text: 'Support transport, equipment, safety, and on-the-ground delivery for conservation programs.',
    },
    {
        id: 'education-partners',
        title: 'Education partners',
        text: 'Collaborate with schools, youth networks, and outreach teams to expand conservation awareness.',
    },
    {
        id: 'brand-sponsors',
        title: 'Campaign and brand sponsors',
        text: 'Co-fund storytelling, advocacy, and impact campaigns that align with wildlife protection goals.',
    },
];

const DEFAULT_DONORS = [
    {
        id: 'monthly-giving',
        title: 'Monthly giving',
        text: 'Provide steady recurring support for conservation fieldwork and community-led programs.',
    },
    {
        id: 'campaign-support',
        title: 'Campaign support',
        text: 'Back a specific WACI campaign focused on restoration, wildlife protection, or education.',
    },
    {
        id: 'institutional-giving',
        title: 'Institutional giving',
        text: 'Fund larger-scale initiatives, sponsorships, or matched impact opportunities.',
    },
];

let ensurePlatformContentTablePromise = null;
let ensureSupportRequestsTablePromise = null;
let ensureNewsletterSubscribersTablePromise = null;
let ensureWaciResourceTablesPromise = null;

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const toNullableText = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized ? normalized : null;
};

const toText = (value, fallback = '') => toNullableText(value) || fallback;

const toStringArray = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => toNullableText(item)).filter(Boolean);
    }

    if (typeof value === 'string') {
        return value
            .split(/[;,]/)
            .map((item) => toNullableText(item))
            .filter(Boolean);
    }

    const single = toNullableText(value);
    return single ? [single] : [];
};

const toSlug = (value, fallback = 'item') => {
    const normalized = String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalized || fallback;
};

const toSortOrder = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const normalizeStoryStatus = (value, fallback = 'pending') => {
    const normalized = String(value || fallback || 'pending').trim().toLowerCase();

    if (normalized === 'live') {
        return 'published';
    }

    if (normalized === 'declined') {
        return 'rejected';
    }

    return WACI_STORY_STATUS_OPTIONS.includes(normalized) ? normalized : fallback;
};

const getRequestIp = (req = {}) => {
    const forwarded = String(req.headers?.['x-forwarded-for'] || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)[0];

    return toNullableText(forwarded || req.ip || req.socket?.remoteAddress || null);
};

const toCount = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
};

const toCurrencyCents = (value, fallback = null) => {
    if (value === '' || value === null || value === undefined) {
        return fallback;
    }

    const normalized = Number(String(value).replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(normalized)) {
        return fallback;
    }

    const textValue = String(value).trim();
    return textValue.includes('.') || normalized < 1000
        ? Math.round(normalized * 100)
        : Math.round(normalized);
};

const formatMoneyFromCents = (value) => `$${(toCount(value, 0) / 100).toFixed(2)}`;

const normalizePayoutMethod = (value) => {
    const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    switch (normalized) {
        case 'stripe':
        case 'stripe_express':
        case 'stripeexpress':
            return 'stripe_express';
        case 'bank':
        case 'bank_transfer':
        case 'banktransfer':
            return 'bank_transfer';
        case 'paypal':
            return 'paypal';
        case 'check':
        case 'check_mail':
        case 'check_by_mail':
        case 'mail_check':
            return 'check_by_mail';
        default:
            return null;
    }
};

const getPayoutMethodConfig = (value) => {
    const normalized = normalizePayoutMethod(value);
    return normalized ? WACI_PAYOUT_METHODS[normalized] : null;
};

const getWaciStripeClient = () => {
    const secretKey = process.env.WACI_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
        return null;
    }

    if (!waciStripeClient) {
        waciStripeClient = new Stripe(secretKey);
    }

    return waciStripeClient;
};

const getWaciBaseAppUrl = (req) => {
    const origin = toNullableText(req.get('origin'));

    if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
        return origin;
    }

    return process.env.WACI_PUBLIC_SITE_URL || process.env.WACI_APP_BASE_URL || 'https://www.wildlifeafrica.org';
};

const ensurePlatformContentTable = async () => {
    if (!ensurePlatformContentTablePromise) {
        ensurePlatformContentTablePromise = pool.query(`
            CREATE TABLE IF NOT EXISTS platform_content (
                content_key TEXT PRIMARY KEY,
                content JSONB NOT NULL DEFAULT '{}'::jsonb,
                updated_by_email TEXT,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `).catch((error) => {
            ensurePlatformContentTablePromise = null;
            throw error;
        });
    }

    await ensurePlatformContentTablePromise;
};

const ensureSupportRequestsTable = async () => {
    if (!ensureSupportRequestsTablePromise) {
        ensureSupportRequestsTablePromise = pool.query(`
            CREATE TABLE IF NOT EXISTS support_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                app_name TEXT NOT NULL DEFAULT 'Felix Platform',
                storefront_key TEXT,
                contact_name TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                contact_phone TEXT,
                subject TEXT NOT NULL DEFAULT 'Support request',
                message TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'new',
                admin_notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `).catch((error) => {
            ensureSupportRequestsTablePromise = null;
            throw error;
        });
    }

    await ensureSupportRequestsTablePromise;
};

const ensureNewsletterSubscribersTable = async () => {
    if (!ensureNewsletterSubscribersTablePromise) {
        ensureNewsletterSubscribersTablePromise = (async () => {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_newsletter_subscribers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    app_name TEXT NOT NULL DEFAULT 'WACI',
                    storefront_key TEXT NOT NULL DEFAULT 'waci',
                    full_name TEXT,
                    email TEXT NOT NULL,
                    interests JSONB NOT NULL DEFAULT '[]'::jsonb,
                    source TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS waci_newsletter_subscribers_app_email_idx
                ON waci_newsletter_subscribers (app_name, LOWER(email))
            `);
        })().catch((error) => {
            ensureNewsletterSubscribersTablePromise = null;
            throw error;
        });
    }

    await ensureNewsletterSubscribersTablePromise;
};

const ensureWaciResourceTables = async () => {
    if (!ensureWaciResourceTablesPromise) {
        ensureWaciResourceTablesPromise = (async () => {
            await ensureNewsletterSubscribersTable();

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_programs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    slug TEXT UNIQUE,
                    title TEXT NOT NULL,
                    summary TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'active',
                    region TEXT,
                    image_url TEXT,
                    cta_label TEXT,
                    cta_link TEXT,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_stories (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    slug TEXT UNIQUE,
                    title TEXT NOT NULL,
                    summary TEXT NOT NULL DEFAULT '',
                    location TEXT,
                    status TEXT NOT NULL DEFAULT 'published',
                    published_at DATE,
                    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    reviewed_at TIMESTAMPTZ,
                    reviewed_by TEXT,
                    review_notes TEXT,
                    image_url TEXT,
                    link TEXT,
                    featured BOOLEAN NOT NULL DEFAULT TRUE,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS author_name TEXT`);
            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS author_email TEXT`);
            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS external_story_id TEXT`);
            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'admin'`);
            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'`);
            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ`);
            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS reviewed_by TEXT`);
            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS review_notes TEXT`);
            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0`);
            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0`);
            await pool.query(`ALTER TABLE waci_stories ADD COLUMN IF NOT EXISTS share_count INTEGER NOT NULL DEFAULT 0`);
            await pool.query(`UPDATE waci_stories SET status = 'published' WHERE status IS NULL OR BTRIM(status) = ''`);
            await pool.query(`CREATE INDEX IF NOT EXISTS waci_stories_author_email_idx ON waci_stories (LOWER(author_email))`);
            await pool.query(`CREATE INDEX IF NOT EXISTS waci_stories_status_idx ON waci_stories (status, sort_order, created_at DESC)`);
            await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS waci_stories_external_story_id_idx ON waci_stories (external_story_id) WHERE external_story_id IS NOT NULL`);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_story_engagement_events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    story_id UUID NOT NULL REFERENCES waci_stories(id) ON DELETE CASCADE,
                    event_type TEXT NOT NULL,
                    ip_address TEXT,
                    session_id TEXT,
                    user_agent TEXT,
                    platform TEXT,
                    view_seconds INTEGER NOT NULL DEFAULT 0,
                    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`CREATE INDEX IF NOT EXISTS waci_story_engagement_story_idx ON waci_story_engagement_events (story_id, created_at DESC)`);
            await pool.query(`CREATE INDEX IF NOT EXISTS waci_story_engagement_event_idx ON waci_story_engagement_events (event_type, created_at DESC)`);
            await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS waci_story_like_ip_idx ON waci_story_engagement_events (story_id, ip_address) WHERE event_type = 'like' AND ip_address IS NOT NULL`);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_author_rewards (
                    author_email TEXT PRIMARY KEY,
                    author_name TEXT,
                    total_views INTEGER NOT NULL DEFAULT 0,
                    total_likes INTEGER NOT NULL DEFAULT 0,
                    total_shares INTEGER NOT NULL DEFAULT 0,
                    total_stories INTEGER NOT NULL DEFAULT 0,
                    pending_stories INTEGER NOT NULL DEFAULT 0,
                    rejected_stories INTEGER NOT NULL DEFAULT 0,
                    published_stories INTEGER NOT NULL DEFAULT 0,
                    featured_stories INTEGER NOT NULL DEFAULT 0,
                    base_points INTEGER NOT NULL DEFAULT 0,
                    share_bonus_points INTEGER NOT NULL DEFAULT 0,
                    campaign_bonus_points INTEGER NOT NULL DEFAULT 0,
                    multiplier NUMERIC NOT NULL DEFAULT 1,
                    total_points INTEGER NOT NULL DEFAULT 0,
                    weekly_points INTEGER NOT NULL DEFAULT 0,
                    monthly_points INTEGER NOT NULL DEFAULT 0,
                    tier TEXT NOT NULL DEFAULT 'Bronze',
                    tier_bonus_rate NUMERIC NOT NULL DEFAULT 0,
                    base_earnings_cents INTEGER NOT NULL DEFAULT 0,
                    tier_bonus_cents INTEGER NOT NULL DEFAULT 0,
                    total_earnings_cents INTEGER NOT NULL DEFAULT 0,
                    paid_out_cents INTEGER NOT NULL DEFAULT 0,
                    pending_payout_cents INTEGER NOT NULL DEFAULT 0,
                    available_earnings_cents INTEGER NOT NULL DEFAULT 0,
                    payout_request_count INTEGER NOT NULL DEFAULT 0,
                    points_approximation BOOLEAN NOT NULL DEFAULT FALSE,
                    last_recalculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    last_tier_email_sent TEXT,
                    last_tier_email_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_story_payout_requests (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    author_email TEXT NOT NULL,
                    author_name TEXT,
                    payout_method TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'created',
                    requested_amount_cents INTEGER NOT NULL DEFAULT 0,
                    fee_amount_cents INTEGER NOT NULL DEFAULT 0,
                    net_amount_cents INTEGER NOT NULL DEFAULT 0,
                    total_points INTEGER NOT NULL DEFAULT 0,
                    payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
                    stats_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
                    admin_notes TEXT,
                    stripe_reference_id TEXT,
                    last_event_type TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`CREATE INDEX IF NOT EXISTS waci_story_payout_requests_author_email_idx ON waci_story_payout_requests (LOWER(author_email), created_at DESC)`);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_media (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title TEXT NOT NULL,
                    media_type TEXT NOT NULL DEFAULT 'image',
                    file_url TEXT,
                    alt_text TEXT,
                    caption TEXT,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_volunteers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT,
                    area_of_interest TEXT,
                    availability TEXT,
                    preferred_contact TEXT,
                    notes TEXT,
                    status TEXT NOT NULL DEFAULT 'new',
                    source TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_partners (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    contact_name TEXT NOT NULL,
                    organization TEXT,
                    email TEXT NOT NULL,
                    phone TEXT,
                    partnership_type TEXT,
                    preferred_contact TEXT,
                    notes TEXT,
                    status TEXT NOT NULL DEFAULT 'new',
                    source TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_donors (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    full_name TEXT NOT NULL,
                    organization TEXT,
                    email TEXT NOT NULL,
                    phone TEXT,
                    support_type TEXT,
                    amount_text TEXT,
                    preferred_contact TEXT,
                    notes TEXT,
                    status TEXT NOT NULL DEFAULT 'new',
                    source TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            const programCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM waci_programs');
            if (!Number(programCountResult.rows[0]?.count || 0)) {
                for (const [index, program] of DEFAULT_PROGRAMS.entries()) {
                    await pool.query(
                        `INSERT INTO waci_programs (slug, title, summary, status, region, sort_order)
                         VALUES ($1,$2,$3,$4,$5,$6)`,
                        [program.id, program.title, program.text, program.status, program.region, index],
                    );
                }
            }

            const storyCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM waci_stories');
            if (!Number(storyCountResult.rows[0]?.count || 0)) {
                for (const [index, story] of DEFAULT_STORIES.entries()) {
                    await pool.query(
                        `INSERT INTO waci_stories (slug, title, summary, location, published_at, sort_order)
                         VALUES ($1,$2,$3,$4,$5,$6)`,
                        [story.id, story.title, story.summary, story.location, story.publishedAt || null, index],
                    );
                }
            }
        })().catch((error) => {
            ensureWaciResourceTablesPromise = null;
            throw error;
        });
    }

    await ensureWaciResourceTablesPromise;
};

const readProgramsFromTable = async () => {
    await ensureWaciResourceTables();
    const result = await pool.query(
        `SELECT
            id::text AS id,
            slug,
            title,
            summary AS text,
            status,
            region,
            image_url AS image,
            cta_label AS "ctaLabel",
            cta_link AS "ctaLink"
         FROM waci_programs
         ORDER BY sort_order ASC, created_at ASC`
    );

    return result.rows.map((item, index) => normalizeProgram(item, index));
};

const readStoriesFromTable = async ({ includeAllStatuses = false } = {}) => {
    await ensureWaciResourceTables();
    const whereClause = includeAllStatuses ? '' : `WHERE status = 'published'`;
    const result = await pool.query(
        `SELECT
            id::text AS id,
            slug,
            title,
            summary,
            location,
            status,
            COALESCE(TO_CHAR(published_at, 'YYYY-MM-DD'), '') AS "publishedAt",
            submitted_at AS "submittedAt",
            reviewed_at AS "reviewedAt",
            reviewed_by AS "reviewedBy",
            review_notes AS "reviewNotes",
            image_url AS image,
            link,
            featured,
            author_name AS "authorName",
            author_email AS "authorEmail",
            external_story_id AS "externalStoryId",
            source,
            view_count AS "viewCount",
            like_count AS "likeCount",
            share_count AS "shareCount",
            sort_order AS "sortOrder"
         FROM waci_stories
         ${whereClause}
         ORDER BY CASE status
             WHEN 'pending' THEN 0
             WHEN 'published' THEN 1
             WHEN 'rejected' THEN 2
             ELSE 3
         END ASC, sort_order ASC, created_at DESC`
    );

    return result.rows.map((item, index) => normalizeStory(item, index));
};

const readMediaFromTable = async () => {
    await ensureWaciResourceTables();
    const result = await pool.query(
        `SELECT
            id::text AS id,
            title,
            media_type,
            file_url,
            alt_text,
            caption,
            sort_order,
            created_at,
            updated_at
         FROM waci_media
         ORDER BY sort_order ASC, created_at DESC`
    );

    return result.rows.map((item, index) => normalizeMediaItem(item, index));
};

const readInterestRows = async (tableName) => {
    await ensureWaciResourceTables();
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
    return result.rows;
};

const readPayoutRequests = async () => {
    await ensureWaciResourceTables();
    const result = await pool.query(
        `SELECT
            id::text AS id,
            author_email,
            author_name,
            payout_method,
            status,
            requested_amount_cents,
            fee_amount_cents,
            net_amount_cents,
            total_points,
            payment_details,
            stats_snapshot,
            admin_notes,
            stripe_reference_id,
            last_event_type,
            created_at,
            updated_at
         FROM waci_story_payout_requests
         ORDER BY created_at DESC`
    );

    return result.rows.map((row) => normalizePayoutRequest(row));
};

const readAuthorRewards = async () => {
    await ensureWaciResourceTables();
    const result = await pool.query(
        `SELECT
            author_email,
            author_name,
            total_views,
            total_likes,
            total_shares,
            total_stories,
            pending_stories,
            rejected_stories,
            published_stories,
            featured_stories,
            base_points,
            share_bonus_points,
            campaign_bonus_points,
            multiplier,
            total_points,
            weekly_points,
            monthly_points,
            tier,
            tier_bonus_rate,
            base_earnings_cents,
            tier_bonus_cents,
            total_earnings_cents,
            paid_out_cents,
            pending_payout_cents,
            available_earnings_cents,
            payout_request_count,
            points_approximation,
            last_recalculated_at,
            last_tier_email_sent,
            last_tier_email_at,
            created_at,
            updated_at
         FROM waci_author_rewards
         ORDER BY total_points DESC, total_earnings_cents DESC, author_email ASC`
    );

    return result.rows.map((row) => normalizeAuthorReward(row));
};

const buildRewardWindowMap = (stories = [], engagementRows = []) => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const storyMap = new Map();
    const ensureEntry = (map, authorEmail) => {
        if (!map.has(authorEmail)) {
            map.set(authorEmail, {
                weekly: {
                    totalViews: 0,
                    totalLikes: 0,
                    totalShares: 0,
                    publishedStories: 0,
                    featuredStories: 0,
                },
                monthly: {
                    totalViews: 0,
                    totalLikes: 0,
                    totalShares: 0,
                    publishedStories: 0,
                    featuredStories: 0,
                },
            });
        }

        return map.get(authorEmail);
    };

    stories.map((story) => normalizeStory(story)).forEach((story) => {
        const authorEmail = toText(story.authorEmail, '').toLowerCase();
        if (!authorEmail || normalizeStoryStatus(story.status, story.publishedAt ? 'published' : 'pending') !== 'published') {
            return;
        }

        storyMap.set(story.id, { ...story, authorEmail });
    });

    const authorWindows = new Map();

    storyMap.forEach((story) => {
        const entry = ensureEntry(authorWindows, story.authorEmail);
        const publishedAtTime = story.publishedAt ? new Date(story.publishedAt).getTime() : null;

        if (publishedAtTime && !Number.isNaN(publishedAtTime)) {
            if (publishedAtTime >= sevenDaysAgo) {
                entry.weekly.publishedStories += 1;
                entry.weekly.featuredStories += story.featured ? 1 : 0;
            }

            if (publishedAtTime >= thirtyDaysAgo) {
                entry.monthly.publishedStories += 1;
                entry.monthly.featuredStories += story.featured ? 1 : 0;
            }
        }
    });

    engagementRows.forEach((row) => {
        const story = storyMap.get(String(row.story_id || ''));
        if (!story) {
            return;
        }

        const createdAtTime = row.created_at ? new Date(row.created_at).getTime() : 0;
        if (!createdAtTime || Number.isNaN(createdAtTime)) {
            return;
        }

        const entry = ensureEntry(authorWindows, story.authorEmail);
        const targets = [];

        if (createdAtTime >= sevenDaysAgo) {
            targets.push(entry.weekly);
        }

        if (createdAtTime >= thirtyDaysAgo) {
            targets.push(entry.monthly);
        }

        targets.forEach((target) => {
            if (row.event_type === 'view') {
                target.totalViews += 1;
            } else if (row.event_type === 'like') {
                target.totalLikes += 1;
            } else if (row.event_type === 'share') {
                target.totalShares += 1;
            }
        });
    });

    return Object.fromEntries(authorWindows.entries());
};

const sendTierUpgradeEmail = async (reward = {}) => {
    const authorEmail = toText(reward.authorEmail, '').toLowerCase();

    if (!authorEmail) {
        return { admin: { sent: false, skipped: true }, author: { sent: false, skipped: true } };
    }

    const authorName = reward.authorName || 'there';
    const totalPointsText = `${toCount(reward.totalPoints, 0).toLocaleString()} points`;
    const availableText = formatMoneyFromCents(reward.availableEarningsCents);
    const subject = `Your WACI contributor tier is now ${reward.tier}`;
    const text = [
        `Hello ${authorName},`,
        '',
        `Congratulations — your WACI contributor tier is now ${reward.tier}.`,
        `Total points: ${totalPointsText}`,
        `Available earnings: ${availableText}`,
        '',
        'Keep sharing conservation stories and impact updates. Your rewards dashboard will continue to refresh automatically.',
    ].join('\n');

    const [admin, author] = await Promise.all([
        sendEmail({
            to: getPayoutNotificationRecipients(),
            appName: WACI_APP_NAME,
            storefrontKey: WACI_STOREFRONT_KEY,
            subject: `WACI tier upgrade: ${authorName} → ${reward.tier}`,
            text: [
                `${authorName} has moved into the ${reward.tier} contributor tier.`,
                `Email: ${authorEmail}`,
                `Points: ${totalPointsText}`,
                `Available earnings: ${availableText}`,
            ].join('\n'),
        }),
        sendEmail({
            to: authorEmail,
            appName: WACI_APP_NAME,
            storefrontKey: WACI_STOREFRONT_KEY,
            subject,
            text,
        }),
    ]);

    return { admin, author };
};

const recalculateAuthorRewards = async ({ force = false, reason = 'manual' } = {}) => {
    await ensureWaciResourceTables();

    const lastCalculatedResult = await pool.query('SELECT MAX(last_recalculated_at) AS last_recalculated_at FROM waci_author_rewards');
    const lastCalculatedAt = lastCalculatedResult.rows[0]?.last_recalculated_at
        ? new Date(lastCalculatedResult.rows[0].last_recalculated_at).getTime()
        : 0;

    if (!force && lastCalculatedAt && (Date.now() - lastCalculatedAt) < WACI_REWARD_RECALC_INTERVAL_MS) {
        lastWaciRewardsRecalcAt = lastCalculatedAt;
        return readAuthorRewards();
    }

    const [stories, payoutRequests, engagementResult, existingRewards] = await Promise.all([
        readStoriesFromTable({ includeAllStatuses: true }),
        readPayoutRequests(),
        pool.query(`SELECT story_id::text AS story_id, event_type, platform, view_seconds, ip_address, session_id, created_at FROM waci_story_engagement_events ORDER BY created_at DESC`),
        readAuthorRewards(),
    ]);

    const rewardWindows = buildRewardWindowMap(stories, engagementResult.rows || []);
    const summaries = buildAuthorAttributionSummaries(stories, payoutRequests, rewardWindows);
    const existingRewardMap = new Map(existingRewards.map((item) => [item.authorEmail, item]));

    for (const summary of summaries) {
        const previousReward = existingRewardMap.get(summary.authorEmail) || null;
        const previousTier = previousReward?.tier || 'Bronze';

        await pool.query(
            `INSERT INTO waci_author_rewards (
                author_email,
                author_name,
                total_views,
                total_likes,
                total_shares,
                total_stories,
                pending_stories,
                rejected_stories,
                published_stories,
                featured_stories,
                base_points,
                share_bonus_points,
                campaign_bonus_points,
                multiplier,
                total_points,
                weekly_points,
                monthly_points,
                tier,
                tier_bonus_rate,
                base_earnings_cents,
                tier_bonus_cents,
                total_earnings_cents,
                paid_out_cents,
                pending_payout_cents,
                available_earnings_cents,
                payout_request_count,
                points_approximation,
                last_recalculated_at,
                last_tier_email_sent,
                last_tier_email_at,
                updated_at
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                $21,$22,$23,$24,$25,$26,$27,NOW(),$28,$29,NOW()
            )
            ON CONFLICT (author_email) DO UPDATE SET
                author_name = EXCLUDED.author_name,
                total_views = EXCLUDED.total_views,
                total_likes = EXCLUDED.total_likes,
                total_shares = EXCLUDED.total_shares,
                total_stories = EXCLUDED.total_stories,
                pending_stories = EXCLUDED.pending_stories,
                rejected_stories = EXCLUDED.rejected_stories,
                published_stories = EXCLUDED.published_stories,
                featured_stories = EXCLUDED.featured_stories,
                base_points = EXCLUDED.base_points,
                share_bonus_points = EXCLUDED.share_bonus_points,
                campaign_bonus_points = EXCLUDED.campaign_bonus_points,
                multiplier = EXCLUDED.multiplier,
                total_points = EXCLUDED.total_points,
                weekly_points = EXCLUDED.weekly_points,
                monthly_points = EXCLUDED.monthly_points,
                tier = EXCLUDED.tier,
                tier_bonus_rate = EXCLUDED.tier_bonus_rate,
                base_earnings_cents = EXCLUDED.base_earnings_cents,
                tier_bonus_cents = EXCLUDED.tier_bonus_cents,
                total_earnings_cents = EXCLUDED.total_earnings_cents,
                paid_out_cents = EXCLUDED.paid_out_cents,
                pending_payout_cents = EXCLUDED.pending_payout_cents,
                available_earnings_cents = EXCLUDED.available_earnings_cents,
                payout_request_count = EXCLUDED.payout_request_count,
                points_approximation = EXCLUDED.points_approximation,
                last_recalculated_at = EXCLUDED.last_recalculated_at,
                last_tier_email_sent = COALESCE(EXCLUDED.last_tier_email_sent, waci_author_rewards.last_tier_email_sent),
                last_tier_email_at = COALESCE(EXCLUDED.last_tier_email_at, waci_author_rewards.last_tier_email_at),
                updated_at = NOW()`,
            [
                summary.authorEmail,
                summary.authorName || null,
                summary.totalViews,
                summary.totalLikes,
                summary.totalShares,
                summary.totalStories,
                summary.pendingStories,
                summary.rejectedStories,
                summary.publishedStories,
                summary.featuredStories,
                summary.basePoints,
                summary.shareBonusPoints,
                summary.campaignBonusPoints,
                summary.multiplier,
                summary.totalPoints,
                summary.weeklyPoints,
                summary.monthlyPoints,
                summary.tier,
                summary.tierBonusRate,
                summary.baseEarningsCents,
                summary.tierBonusCents,
                summary.totalEarningsCents,
                summary.paidOutCents,
                summary.pendingPayoutCents,
                summary.availableEarningsCents,
                summary.payoutRequestCount,
                Boolean(summary.pointsApproximation),
                previousReward?.lastTierEmailSent || null,
                previousReward?.lastTierEmailAt || null,
            ],
        );

        if ((WACI_TIER_RANK[summary.tier] || 0) > (WACI_TIER_RANK[previousTier] || 0)) {
            await sendTierUpgradeEmail(summary);
            await pool.query(
                `UPDATE waci_author_rewards
                 SET last_tier_email_sent = $1,
                     last_tier_email_at = NOW(),
                     updated_at = NOW()
                 WHERE author_email = $2`,
                [summary.tier, summary.authorEmail],
            );
        }
    }

    lastWaciRewardsRecalcAt = Date.now();
    if (!summaries.length && reason) {
        console.info(`WACI rewards recalculation completed with no eligible published stories (${reason}).`);
    }

    return readAuthorRewards();
};

const getPayoutNotificationRecipients = () => (
    process.env.WACI_SUPPORT_NOTIFICATION_EMAIL
    || process.env.SUPPORT_NOTIFICATION_EMAIL
    || 'hello@wildlifeafrica.org'
);

const sendPayoutStatusEmails = async (request = {}, eventType = 'created') => {
    const normalizedRequest = normalizePayoutRequest(request);
    const eventLabel = ['completed', 'paid'].includes(eventType)
        ? 'completed'
        : (eventType === 'failed'
            ? 'failed'
            : (eventType === 'processing' ? 'processing' : 'created'));
    const statusTitle = eventLabel === 'completed'
        ? 'completed'
        : (eventLabel === 'failed'
            ? 'failed'
            : (eventLabel === 'processing' ? 'processing' : 'received'));
    const payoutMethod = getPayoutMethodConfig(normalizedRequest.payoutMethod) || { label: normalizedRequest.payoutMethodLabel || 'Selected payout method' };
    const authorName = normalizedRequest.authorName || 'there';
    const amountText = formatMoneyFromCents(normalizedRequest.requestedAmountCents);
    const feeText = formatMoneyFromCents(normalizedRequest.feeAmountCents);
    const netText = formatMoneyFromCents(normalizedRequest.netAmountCents);
    const pointsText = `${toCount(normalizedRequest.totalPoints, 0).toLocaleString()} points`;
    const notesText = toText(normalizedRequest.adminNotes, 'No additional notes were provided.');

    const [admin, author] = await Promise.all([
        sendEmail({
            to: getPayoutNotificationRecipients(),
            appName: WACI_APP_NAME,
            storefrontKey: WACI_STOREFRONT_KEY,
            subject: `WACI payout ${statusTitle}: ${authorName}`,
            text: [
                `A WACI payout request has been ${statusTitle}.`,
                `Author: ${authorName}`,
                `Email: ${normalizedRequest.authorEmail || 'Not provided'}`,
                `Method: ${payoutMethod.label}`,
                `Requested amount: ${amountText}`,
                `Fee: ${feeText}`,
                `Net amount: ${netText}`,
                `Points: ${pointsText}`,
                `Status: ${normalizedRequest.status}`,
                `Notes: ${notesText}`,
            ].join('\n'),
        }),
        normalizedRequest.authorEmail
            ? sendEmail({
                to: normalizedRequest.authorEmail,
                appName: WACI_APP_NAME,
                storefrontKey: WACI_STOREFRONT_KEY,
                subject: `Your WACI payout request has been ${statusTitle}`,
                text: [
                    `Hello ${authorName},`,
                    '',
                    `Your payout request has been ${statusTitle}.`,
                    `Method: ${payoutMethod.label}`,
                    `Requested amount: ${amountText}`,
                    `Fee: ${feeText}`,
                    `Net amount: ${netText}`,
                    `Points snapshot: ${pointsText}`,
                    `Status: ${normalizedRequest.status}`,
                    `Notes: ${notesText}`,
                ].join('\n'),
            })
            : Promise.resolve({ sent: false, skipped: true, reason: 'Author email was not provided' }),
    ]);

    return { admin, author };
};

const insertInterestRecord = async ({
    formType,
    contactName,
    contactEmail,
    contactPhone,
    organization,
    areaOfInterest,
    availability,
    contributionType,
    preferredContact,
    amount,
    notes,
    source,
}) => {
    await ensureWaciResourceTables();

    if (formType === 'Volunteer') {
        const result = await pool.query(
            `INSERT INTO waci_volunteers (
                full_name,
                email,
                phone,
                area_of_interest,
                availability,
                preferred_contact,
                notes,
                source
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *`,
            [contactName, contactEmail, contactPhone, areaOfInterest, availability, preferredContact, notes, source],
        );
        return result.rows[0];
    }

    if (formType === 'Partner') {
        const result = await pool.query(
            `INSERT INTO waci_partners (
                contact_name,
                organization,
                email,
                phone,
                partnership_type,
                preferred_contact,
                notes,
                source
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *`,
            [contactName, organization, contactEmail, contactPhone, contributionType, preferredContact, notes, source],
        );
        return result.rows[0];
    }

    if (formType === 'Donor') {
        const result = await pool.query(
            `INSERT INTO waci_donors (
                full_name,
                organization,
                email,
                phone,
                support_type,
                amount_text,
                preferred_contact,
                notes,
                source
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *`,
            [contactName, organization, contactEmail, contactPhone, contributionType, amount, preferredContact, notes, source],
        );
        return result.rows[0];
    }

    return null;
};

const normalizeProgram = (item = {}, index = 0) => ({
    id: toText(item.id, `program-${index + 1}`),
    slug: toText(item.slug, ''),
    title: toText(item.title, `Program ${index + 1}`),
    text: toText(item.text || item.description, ''),
    status: toText(item.status, 'active'),
    region: toText(item.region, ''),
    image: toText(item.image, ''),
    ctaLabel: toText(item.ctaLabel, ''),
    ctaLink: toText(item.ctaLink, ''),
    sortOrder: toSortOrder(item.sortOrder ?? item.sort_order, index),
});

const normalizeStory = (item = {}, index = 0) => ({
    id: toText(item.id, `story-${index + 1}`),
    slug: toText(item.slug, ''),
    title: toText(item.title, `Story ${index + 1}`),
    summary: toText(item.summary || item.text || item.description, ''),
    location: toText(item.location, ''),
    status: normalizeStoryStatus(item.status, item.publishedAt || item.published_at ? 'published' : 'pending'),
    publishedAt: toText(item.publishedAt || item.date, ''),
    submittedAt: item.submittedAt || item.submitted_at || null,
    reviewedAt: item.reviewedAt || item.reviewed_at || null,
    reviewedBy: toText(item.reviewedBy || item.reviewed_by, ''),
    reviewNotes: toText(item.reviewNotes || item.review_notes, ''),
    image: toText(item.image, ''),
    link: toText(item.link, ''),
    featured: typeof item.featured === 'boolean' ? item.featured : toBoolean(item.featured, true),
    authorName: toText(item.authorName || item.author_name, ''),
    authorEmail: toText(item.authorEmail || item.author_email, '').toLowerCase(),
    externalStoryId: toText(item.externalStoryId || item.external_story_id, ''),
    source: toText(item.source, 'admin'),
    viewCount: toCount(item.viewCount ?? item.view_count, 0),
    likeCount: toCount(item.likeCount ?? item.like_count, 0),
    shareCount: toCount(item.shareCount ?? item.share_count, 0),
    sortOrder: toSortOrder(item.sortOrder ?? item.sort_order, index),
});

const normalizeMediaItem = (item = {}, index = 0) => ({
    id: toText(item.id, `resource-${index + 1}`),
    title: toText(item.title, `Resource ${index + 1}`),
    media_type: toText(item.media_type || item.mediaType, 'image'),
    mediaType: toText(item.mediaType || item.media_type, 'image'),
    file_url: toText(item.file_url || item.fileUrl || item.url, ''),
    fileUrl: toText(item.fileUrl || item.file_url || item.url, ''),
    alt_text: toText(item.alt_text || item.altText, ''),
    altText: toText(item.altText || item.alt_text, ''),
    caption: toText(item.caption, ''),
    sort_order: toSortOrder(item.sort_order ?? item.sortOrder, index),
    sortOrder: toSortOrder(item.sortOrder ?? item.sort_order, index),
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
});

const normalizePayoutRequest = (item = {}) => {
    const payoutMethod = getPayoutMethodConfig(item.payout_method || item.payoutMethod) || { id: normalizePayoutMethod(item.payout_method || item.payoutMethod) || 'manual', label: toText(item.payout_method || item.payoutMethod, 'Manual payout'), speed: 'To be confirmed' };
    const requestedAmountCents = toCount(item.requested_amount_cents ?? item.requestedAmountCents, 0);
    const feeAmountCents = toCount(item.fee_amount_cents ?? item.feeAmountCents, 0);
    const netAmountCents = toCount(item.net_amount_cents ?? item.netAmountCents, Math.max(requestedAmountCents - feeAmountCents, 0));

    return {
        id: toText(item.id, ''),
        authorEmail: toText(item.author_email || item.authorEmail, '').toLowerCase(),
        authorName: toText(item.author_name || item.authorName, ''),
        payoutMethod: payoutMethod.id,
        payoutMethodLabel: payoutMethod.label,
        payoutSpeed: payoutMethod.speed,
        status: toText(item.status, 'created').toLowerCase(),
        requestedAmountCents,
        requestedAmountUsd: Number((requestedAmountCents / 100).toFixed(2)),
        feeAmountCents,
        feeAmountUsd: Number((feeAmountCents / 100).toFixed(2)),
        netAmountCents,
        netAmountUsd: Number((netAmountCents / 100).toFixed(2)),
        totalPoints: toCount(item.total_points ?? item.totalPoints, 0),
        paymentDetails: item.payment_details || item.paymentDetails || {},
        statsSnapshot: item.stats_snapshot || item.statsSnapshot || {},
        adminNotes: toText(item.admin_notes || item.adminNotes, ''),
        stripeReferenceId: toText(item.stripe_reference_id || item.stripeReferenceId, ''),
        lastEventType: toText(item.last_event_type || item.lastEventType, ''),
        createdAt: item.created_at || item.createdAt || null,
        updatedAt: item.updated_at || item.updatedAt || null,
    };
};

const normalizeAuthorReward = (item = {}) => ({
    authorEmail: toText(item.author_email || item.authorEmail, '').toLowerCase(),
    authorName: toText(item.author_name || item.authorName, ''),
    totalViews: toCount(item.total_views ?? item.totalViews, 0),
    totalLikes: toCount(item.total_likes ?? item.totalLikes, 0),
    totalShares: toCount(item.total_shares ?? item.totalShares, 0),
    totalStories: toCount(item.total_stories ?? item.totalStories, 0),
    pendingStories: toCount(item.pending_stories ?? item.pendingStories, 0),
    rejectedStories: toCount(item.rejected_stories ?? item.rejectedStories, 0),
    publishedStories: toCount(item.published_stories ?? item.publishedStories, 0),
    featuredStories: toCount(item.featured_stories ?? item.featuredStories, 0),
    basePoints: toCount(item.base_points ?? item.basePoints, 0),
    shareBonusPoints: toCount(item.share_bonus_points ?? item.shareBonusPoints, 0),
    campaignBonusPoints: toCount(item.campaign_bonus_points ?? item.campaignBonusPoints, 0),
    multiplier: Number(item.multiplier ?? 1) || 1,
    totalPoints: toCount(item.total_points ?? item.totalPoints, 0),
    weeklyPoints: toCount(item.weekly_points ?? item.weeklyPoints ?? item.weeklyPointsEstimate, 0),
    monthlyPoints: toCount(item.monthly_points ?? item.monthlyPoints ?? item.monthlyPointsEstimate, 0),
    weeklyPointsEstimate: toCount(item.weekly_points ?? item.weeklyPoints ?? item.weeklyPointsEstimate, 0),
    monthlyPointsEstimate: toCount(item.monthly_points ?? item.monthlyPoints ?? item.monthlyPointsEstimate, 0),
    pointsApproximation: toBoolean(item.points_approximation ?? item.pointsApproximation, false),
    tier: toText(item.tier, 'Bronze'),
    tierBonusRate: Number(item.tier_bonus_rate ?? item.tierBonusRate ?? 0) || 0,
    baseEarningsCents: toCount(item.base_earnings_cents ?? item.baseEarningsCents, 0),
    baseEarningsUsd: Number((toCount(item.base_earnings_cents ?? item.baseEarningsCents, 0) / 100).toFixed(2)),
    tierBonusCents: toCount(item.tier_bonus_cents ?? item.tierBonusCents, 0),
    tierBonusUsd: Number((toCount(item.tier_bonus_cents ?? item.tierBonusCents, 0) / 100).toFixed(2)),
    totalEarningsCents: toCount(item.total_earnings_cents ?? item.totalEarningsCents, 0),
    totalEarningsUsd: Number((toCount(item.total_earnings_cents ?? item.totalEarningsCents, 0) / 100).toFixed(2)),
    paidOutCents: toCount(item.paid_out_cents ?? item.paidOutCents, 0),
    paidOutUsd: Number((toCount(item.paid_out_cents ?? item.paidOutCents, 0) / 100).toFixed(2)),
    pendingPayoutCents: toCount(item.pending_payout_cents ?? item.pendingPayoutCents, 0),
    pendingPayoutUsd: Number((toCount(item.pending_payout_cents ?? item.pendingPayoutCents, 0) / 100).toFixed(2)),
    availableEarningsCents: toCount(item.available_earnings_cents ?? item.availableEarningsCents, 0),
    availableEarningsUsd: Number((toCount(item.available_earnings_cents ?? item.availableEarningsCents, 0) / 100).toFixed(2)),
    payoutRequestCount: toCount(item.payout_request_count ?? item.payoutRequestCount, 0),
    lastTierEmailSent: toText(item.last_tier_email_sent || item.lastTierEmailSent, ''),
    lastTierEmailAt: item.last_tier_email_at || item.lastTierEmailAt || null,
    lastRecalculatedAt: item.last_recalculated_at || item.lastRecalculatedAt || null,
});

const calculatePointsBreakdown = ({ totalViews = 0, totalLikes = 0, totalShares = 0, publishedStories = 0, featuredStories = 0 }) => {
    const normalizedViews = toCount(totalViews, 0);
    const normalizedLikes = toCount(totalLikes, 0);
    const normalizedShares = toCount(totalShares, 0);
    const normalizedPublishedStories = toCount(publishedStories, 0);
    const normalizedFeaturedStories = toCount(featuredStories, 0);
    const basePoints = normalizedViews
        + (normalizedLikes * 10)
        + (normalizedShares * 20)
        + (normalizedPublishedStories * 100)
        + (normalizedFeaturedStories * 500);
    const shareBonusPoints = normalizedShares * 50;
    const campaignBonusPoints = normalizedShares > 5 ? 200 : 0;
    const multiplier = normalizedShares > 10 ? 2 : 1;
    const totalPoints = (basePoints + shareBonusPoints + campaignBonusPoints) * multiplier;

    return {
        basePoints,
        shareBonusPoints,
        campaignBonusPoints,
        multiplier,
        totalPoints,
    };
};

const calculateTierFromTotals = ({ totalPoints = 0, baseEarningsCents = 0 }) => {
    if (baseEarningsCents >= 50000 || totalPoints >= 500000) {
        return { name: 'Platinum', bonusRate: 0.30 };
    }

    if (baseEarningsCents >= 20000 || totalPoints >= 200000) {
        return { name: 'Gold', bonusRate: 0.20 };
    }

    if (baseEarningsCents >= 5000 || totalPoints >= 50000) {
        return { name: 'Silver', bonusRate: 0.10 };
    }

    return { name: 'Bronze', bonusRate: 0 };
};

const buildAuthorAttributionSummaries = (stories = [], payoutRequests = [], rewardWindows = {}) => {
    const authorMap = new Map();

    stories.forEach((story) => {
        const normalizedStory = normalizeStory(story);
        const authorEmail = toText(normalizedStory.authorEmail, '').toLowerCase();

        if (!authorEmail) {
            return;
        }

        if (!authorMap.has(authorEmail)) {
            authorMap.set(authorEmail, {
                authorEmail,
                authorName: normalizedStory.authorName || '',
                totalViews: 0,
                totalLikes: 0,
                totalShares: 0,
                publishedStories: 0,
                pendingStories: 0,
                rejectedStories: 0,
                featuredStories: 0,
                totalStories: 0,
            });
        }

        const summary = authorMap.get(authorEmail);
        const storyStatus = normalizeStoryStatus(normalizedStory.status, normalizedStory.publishedAt ? 'published' : 'pending');

        summary.authorName = summary.authorName || normalizedStory.authorName || '';
        summary.totalStories += 1;

        if (storyStatus === 'pending') {
            summary.pendingStories += 1;
            return;
        }

        if (storyStatus === 'rejected' || storyStatus === 'archived') {
            summary.rejectedStories += 1;
            return;
        }

        summary.totalViews += toCount(normalizedStory.viewCount, 0);
        summary.totalLikes += toCount(normalizedStory.likeCount, 0);
        summary.totalShares += toCount(normalizedStory.shareCount, 0);
        summary.publishedStories += 1;
        summary.featuredStories += normalizedStory.featured ? 1 : 0;
    });

    const payoutMap = new Map();
    payoutRequests.map((request) => normalizePayoutRequest(request)).forEach((request) => {
        const authorEmail = request.authorEmail;
        if (!authorEmail) {
            return;
        }

        if (!payoutMap.has(authorEmail)) {
            payoutMap.set(authorEmail, { paidOutCents: 0, pendingPayoutCents: 0, requests: 0 });
        }

        const summary = payoutMap.get(authorEmail);
        summary.requests += 1;

        if (PAID_PAYOUT_STATUSES.includes(request.status)) {
            summary.paidOutCents += request.netAmountCents;
        } else if (PENDING_PAYOUT_STATUSES.includes(request.status)) {
            summary.pendingPayoutCents += request.netAmountCents;
        }
    });

    return Array.from(authorMap.values())
        .map((summary) => {
            const totalsBreakdown = calculatePointsBreakdown(summary);
            const weeklyBreakdown = calculatePointsBreakdown(rewardWindows[summary.authorEmail]?.weekly || {});
            const monthlyBreakdown = calculatePointsBreakdown(rewardWindows[summary.authorEmail]?.monthly || {});
            const baseEarningsUsd = (summary.totalViews * 0.0025)
                + (summary.totalLikes * 0.125)
                + (summary.totalShares * 0.25)
                + (summary.publishedStories * 0.50);
            const baseEarningsCents = Math.round(baseEarningsUsd * 100);
            const tier = calculateTierFromTotals({ totalPoints: totalsBreakdown.totalPoints, baseEarningsCents });
            const tierBonusCents = Math.round(baseEarningsCents * tier.bonusRate);
            const totalEarningsCents = baseEarningsCents + tierBonusCents;
            const payoutTotals = payoutMap.get(summary.authorEmail) || { paidOutCents: 0, pendingPayoutCents: 0, requests: 0 };

            return {
                ...summary,
                ...totalsBreakdown,
                totalPoints: totalsBreakdown.totalPoints,
                weeklyPoints: weeklyBreakdown.totalPoints,
                monthlyPoints: monthlyBreakdown.totalPoints,
                weeklyPointsEstimate: weeklyBreakdown.totalPoints,
                monthlyPointsEstimate: monthlyBreakdown.totalPoints,
                pointsApproximation: false,
                tier: tier.name,
                tierBonusRate: tier.bonusRate,
                baseEarningsCents,
                baseEarningsUsd: Number((baseEarningsCents / 100).toFixed(2)),
                tierBonusCents,
                tierBonusUsd: Number((tierBonusCents / 100).toFixed(2)),
                totalEarningsCents,
                totalEarningsUsd: Number((totalEarningsCents / 100).toFixed(2)),
                paidOutCents: payoutTotals.paidOutCents,
                pendingPayoutCents: payoutTotals.pendingPayoutCents,
                paidOutUsd: Number((payoutTotals.paidOutCents / 100).toFixed(2)),
                pendingPayoutUsd: Number((payoutTotals.pendingPayoutCents / 100).toFixed(2)),
                availableEarningsCents: Math.max(totalEarningsCents - payoutTotals.paidOutCents - payoutTotals.pendingPayoutCents, 0),
                availableEarningsUsd: Number((Math.max(totalEarningsCents - payoutTotals.paidOutCents - payoutTotals.pendingPayoutCents, 0) / 100).toFixed(2)),
                payoutRequestCount: payoutTotals.requests,
            };
        })
        .sort((left, right) => right.totalPoints - left.totalPoints || right.totalEarningsCents - left.totalEarningsCents || left.authorEmail.localeCompare(right.authorEmail));
};

const normalizeSimpleCard = (item = {}, index = 0, fallbackPrefix = 'item') => ({
    id: toText(item.id, `${fallbackPrefix}-${index + 1}`),
    title: toText(item.title, `${fallbackPrefix} ${index + 1}`),
    text: toText(item.text || item.description, ''),
    link: toText(item.link, ''),
});

const readCollection = async (contentKey, defaults, normalizer) => {
    try {
        await ensurePlatformContentTable();
        const result = await pool.query(
            'SELECT content FROM platform_content WHERE content_key = $1 LIMIT 1',
            [contentKey],
        );

        const storedContent = result.rows[0]?.content;
        const storedItems = Array.isArray(storedContent?.items)
            ? storedContent.items
            : (Array.isArray(storedContent) ? storedContent : []);

        const itemsToUse = storedItems.length ? storedItems : defaults;
        return itemsToUse.map((item, index) => normalizer(item, index));
    } catch (error) {
        console.warn(`Unable to load ${contentKey}; falling back to defaults.`, error.message || error);
        return cloneValue(defaults).map((item, index) => normalizer(item, index));
    }
};

const createWaciSupportRequest = async ({ contactName, contactEmail, contactPhone, subject, message }) => {
    await ensureSupportRequestsTable();

    const createdResult = await pool.query(
        `INSERT INTO support_requests (
            app_name,
            storefront_key,
            contact_name,
            contact_email,
            contact_phone,
            subject,
            message
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *`,
        [
            WACI_APP_NAME,
            WACI_STOREFRONT_KEY,
            contactName,
            contactEmail,
            contactPhone,
            subject,
            message,
        ],
    );

    return createdResult.rows[0];
};

const submitInterestForm = async (req, res, { formType, defaultSubject }) => {
    const contactName = toNullableText(req.body.contact_name || req.body.name);
    const contactEmail = toNullableText(req.body.contact_email || req.body.email);
    const contactPhone = toNullableText(req.body.contact_phone || req.body.phone);
    const organization = toNullableText(req.body.organization);
    const areaOfInterest = toNullableText(req.body.area_of_interest || req.body.interest_area || req.body.interest);
    const availability = toNullableText(req.body.availability);
    const contributionType = toNullableText(req.body.contribution_type || req.body.support_type || req.body.partnership_type);
    const preferredContact = toNullableText(req.body.preferred_contact);
    const amount = toNullableText(req.body.amount || req.body.donation_amount);
    const notes = toNullableText(req.body.notes || req.body.message);
    const source = toNullableText(req.body.source) || 'website';
    const subject = toNullableText(req.body.subject) || defaultSubject;

    if (!contactName) {
        return res.status(400).json({ message: 'Name is required.' });
    }

    if (!contactEmail) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    const message = [
        `Form type: ${formType}`,
        organization ? `Organization: ${organization}` : null,
        areaOfInterest ? `Area of interest: ${areaOfInterest}` : null,
        availability ? `Availability: ${availability}` : null,
        contributionType ? `Contribution type: ${contributionType}` : null,
        amount ? `Amount: ${amount}` : null,
        preferredContact ? `Preferred contact: ${preferredContact}` : null,
        `Notes: ${notes || 'Not provided'}`,
    ].filter(Boolean).join('\n');

    try {
        const record = await insertInterestRecord({
            formType,
            contactName,
            contactEmail,
            contactPhone,
            organization,
            areaOfInterest,
            availability,
            contributionType,
            preferredContact,
            amount,
            notes,
            source,
        });

        const supportRequest = await createWaciSupportRequest({
            contactName,
            contactEmail,
            contactPhone,
            subject,
            message,
        });

        const emailResult = await sendSupportRequestNotification({
            ...supportRequest,
            app_name: WACI_APP_NAME,
            storefront_key: WACI_STOREFRONT_KEY,
            contact_name: contactName,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            subject,
            message,
        });

        return res.status(201).json({
            submitted: true,
            type: formType,
            app_name: WACI_APP_NAME,
            storefront_key: WACI_STOREFRONT_KEY,
            record,
            support_request: supportRequest,
            admin_email_sent: Boolean(emailResult.admin?.sent),
            contact_email_sent: Boolean(emailResult.customer?.sent),
            contact_email_recipient: emailResult.customer?.recipient || contactEmail || null,
            customer_email_sent: Boolean(emailResult.customer?.sent),
            customer_email_recipient: emailResult.customer?.recipient || contactEmail || null,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: `Unable to submit ${formType.toLowerCase()} form.` });
    }
};

exports.createDonationCheckoutSession = async (req, res) => {
    const stripe = getWaciStripeClient();

    if (!stripe) {
        return res.status(503).json({ message: 'Stripe is not configured for WACI donations yet.' });
    }

    const contactName = toNullableText(req.body?.contact_name || req.body?.name);
    const contactEmail = toNullableText(req.body?.contact_email || req.body?.email);
    const contactPhone = toNullableText(req.body?.contact_phone || req.body?.phone);
    const organization = toNullableText(req.body?.organization);
    const amountInput = req.body?.amount ?? req.body?.donation_amount ?? req.body?.amount_cents ?? req.body?.amountCents;
    const donationMode = toText(req.body?.mode || req.body?.donationMode, 'suggested').toLowerCase();
    const source = toNullableText(req.body?.source) || `website-${donationMode}`;
    const preferredContact = toNullableText(req.body?.preferred_contact || req.body?.preferredContact);
    const notes = toNullableText(req.body?.notes)
        || `Started a ${donationMode === 'custom' ? 'custom' : 'suggested'} Stripe donation checkout for WACI.`;
    const contributionType = toNullableText(req.body?.support_type || req.body?.supportType)
        || (donationMode === 'custom' ? 'Custom donation' : 'Suggested donation');
    const amountCents = toCurrencyCents(amountInput, donationMode === 'suggested' ? 5000 : null);

    if (!Number.isFinite(amountCents) || amountCents < 100) {
        return res.status(400).json({ message: 'Donation amount must be at least $1.00.' });
    }

    const baseAppUrl = getWaciBaseAppUrl(req);
    const successUrl = toNullableText(req.body?.success_url || req.body?.successUrl)
        || `${baseAppUrl}/?donation=success&session_id={CHECKOUT_SESSION_ID}#join`;
    const cancelUrl = toNullableText(req.body?.cancel_url || req.body?.cancelUrl)
        || `${baseAppUrl}/?donation=cancelled#join`;

    try {
        let donorRecord = null;

        if (contactName && contactEmail) {
            try {
                donorRecord = await insertInterestRecord({
                    formType: 'Donor',
                    contactName,
                    contactEmail,
                    contactPhone,
                    organization,
                    contributionType,
                    preferredContact,
                    amount: formatMoneyFromCents(amountCents),
                    notes,
                    source,
                });

                const supportRequest = await createWaciSupportRequest({
                    contactName,
                    contactEmail,
                    contactPhone,
                    subject: 'WACI Stripe donation checkout started',
                    message: [
                        `Donation mode: ${donationMode}`,
                        `Contribution type: ${contributionType}`,
                        `Amount: ${formatMoneyFromCents(amountCents)}`,
                        `Source: ${source}`,
                        `Notes: ${notes}`,
                    ].join('\n'),
                });

                await sendSupportRequestNotification({
                    ...supportRequest,
                    app_name: WACI_APP_NAME,
                    storefront_key: WACI_STOREFRONT_KEY,
                    contact_name: contactName,
                    contact_email: contactEmail,
                    contact_phone: contactPhone,
                    subject: 'WACI Stripe donation checkout started',
                    message: [
                        `Donation mode: ${donationMode}`,
                        `Contribution type: ${contributionType}`,
                        `Amount: ${formatMoneyFromCents(amountCents)}`,
                        `Source: ${source}`,
                        `Notes: ${notes}`,
                    ].join('\n'),
                });
            } catch (recordError) {
                console.warn('Unable to save WACI donor interest before checkout:', recordError.message || recordError);
            }
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            submit_type: 'donate',
            billing_address_collection: 'auto',
            customer_email: contactEmail || undefined,
            success_url: successUrl,
            cancel_url: cancelUrl,
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: WACI_DONATION_CURRENCY,
                        unit_amount: amountCents,
                        product_data: {
                            name: 'Support WACI',
                            description: donationMode === 'custom'
                                ? 'Custom donation supporting wildlife conservation across Africa.'
                                : 'Suggested donation supporting wildlife conservation across Africa.',
                        },
                    },
                },
            ],
            metadata: {
                app_name: WACI_APP_NAME,
                storefront_key: WACI_STOREFRONT_KEY,
                source,
                donation_mode: donationMode,
                donor_name: contactName || '',
                donor_email: contactEmail || '',
                amount_cents: String(amountCents),
            },
        });

        return res.status(201).json({
            checkoutUrl: session.url,
            sessionId: session.id,
            amountCents,
            amountUsd: Number((amountCents / 100).toFixed(2)),
            currency: WACI_DONATION_CURRENCY,
            donorRecord,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message || 'Unable to start the WACI donation checkout.' });
    }
};

exports.subscribeNewsletter = async (req, res) => {
    const email = toNullableText(req.body.email || req.body.contact_email);
    const fullName = toNullableText(req.body.full_name || req.body.name || req.body.contact_name);
    const source = toNullableText(req.body.source) || 'website';
    const interests = toStringArray(req.body.interests || req.body.interest);

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        await ensureNewsletterSubscribersTable();

        const existingResult = await pool.query(
            `SELECT *
             FROM waci_newsletter_subscribers
             WHERE app_name = $1
               AND LOWER(email) = LOWER($2)
             LIMIT 1`,
            [WACI_APP_NAME, email],
        );

        let subscriber;
        let alreadySubscribed = false;

        if (existingResult.rows.length) {
            alreadySubscribed = true;
            const updateResult = await pool.query(
                `UPDATE waci_newsletter_subscribers
                 SET full_name = COALESCE($1, full_name),
                     interests = CASE WHEN $2::jsonb = '[]'::jsonb THEN interests ELSE $2::jsonb END,
                     source = COALESCE($3, source),
                     updated_at = NOW()
                 WHERE id = $4
                 RETURNING *`,
                [fullName, JSON.stringify(interests), source, existingResult.rows[0].id],
            );
            subscriber = updateResult.rows[0];
        } else {
            const insertResult = await pool.query(
                `INSERT INTO waci_newsletter_subscribers (
                    app_name,
                    storefront_key,
                    full_name,
                    email,
                    interests,
                    source
                ) VALUES ($1,$2,$3,$4,$5::jsonb,$6)
                RETURNING *`,
                [
                    WACI_APP_NAME,
                    WACI_STOREFRONT_KEY,
                    fullName,
                    email,
                    JSON.stringify(interests),
                    source,
                ],
            );
            subscriber = insertResult.rows[0];
        }

        const details = [
            'Newsletter signup received.',
            fullName ? `Name: ${fullName}` : null,
            `Email: ${email}`,
            interests.length ? `Interests: ${interests.join(', ')}` : null,
            `Source: ${source}`,
        ].filter(Boolean).join('\n');

        const emailResult = await sendSupportRequestNotification({
            app_name: WACI_APP_NAME,
            storefront_key: WACI_STOREFRONT_KEY,
            contact_name: fullName || 'Newsletter subscriber',
            contact_email: email,
            subject: 'Newsletter signup',
            message: details,
        });

        return res.status(alreadySubscribed ? 200 : 201).json({
            subscribed: true,
            alreadySubscribed,
            subscriber,
            admin_email_sent: Boolean(emailResult.admin?.sent),
            contact_email_sent: Boolean(emailResult.customer?.sent),
            contact_email_recipient: emailResult.customer?.recipient || email || null,
            customer_email_sent: Boolean(emailResult.customer?.sent),
            customer_email_recipient: emailResult.customer?.recipient || email || null,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to subscribe to the newsletter.' });
    }
};

exports.submitVolunteerForm = async (req, res) => submitInterestForm(req, res, {
    formType: 'Volunteer',
    defaultSubject: 'WACI volunteer interest',
});

exports.submitPartnerForm = async (req, res) => submitInterestForm(req, res, {
    formType: 'Partner',
    defaultSubject: 'WACI partnership enquiry',
});

exports.submitDonorForm = async (req, res) => submitInterestForm(req, res, {
    formType: 'Donor',
    defaultSubject: 'WACI donor enquiry',
});

exports.getPrograms = async (_req, res) => {
    try {
        const items = await readProgramsFromTable();
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.json({ app_name: WACI_APP_NAME, storefront_key: WACI_STOREFRONT_KEY, items });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load WACI programs.' });
    }
};

exports.getStories = async (req, res) => {
    try {
        const items = await readStoriesFromTable({ includeAllStatuses: Boolean(req.user) });
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.json({ app_name: WACI_APP_NAME, storefront_key: WACI_STOREFRONT_KEY, items });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load WACI stories.' });
    }
};

exports.getStory = async (req, res) => {
    try {
        await ensureWaciResourceTables();
        const identifier = toText(req.params.storyId || req.params.slug, '');

        if (!identifier) {
            return res.status(400).json({ success: false, message: 'Story identifier is required.' });
        }

        const result = await pool.query(
            `SELECT
                id::text AS id,
                slug,
                title,
                summary,
                location,
                status,
                COALESCE(TO_CHAR(published_at, 'YYYY-MM-DD'), '') AS "publishedAt",
                submitted_at AS "submittedAt",
                reviewed_at AS "reviewedAt",
                reviewed_by AS "reviewedBy",
                review_notes AS "reviewNotes",
                image_url AS image,
                link,
                featured,
                author_name AS "authorName",
                author_email AS "authorEmail",
                external_story_id AS "externalStoryId",
                source,
                view_count AS "viewCount",
                like_count AS "likeCount",
                share_count AS "shareCount",
                sort_order AS "sortOrder"
             FROM waci_stories
             WHERE (id::text = $1 OR slug = $1)
               AND ($2::boolean = TRUE OR status = 'published')
             LIMIT 1`,
            [identifier, Boolean(req.user)],
        );

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'WACI story not found.' });
        }

        return res.json({ success: true, item: normalizeStory(result.rows[0]) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to load the WACI story.' });
    }
};

exports.getPartners = async (_req, res) => {
    const items = await readCollection(PARTNERS_CONTENT_KEY, DEFAULT_PARTNERS, (item, index) => normalizeSimpleCard(item, index, 'partner'));
    res.set('Cache-Control', 'no-store, max-age=0');
    return res.json({ app_name: WACI_APP_NAME, storefront_key: WACI_STOREFRONT_KEY, items });
};

exports.getDonors = async (_req, res) => {
    const items = await readCollection(DONORS_CONTENT_KEY, DEFAULT_DONORS, (item, index) => normalizeSimpleCard(item, index, 'donor'));
    res.set('Cache-Control', 'no-store, max-age=0');
    return res.json({ app_name: WACI_APP_NAME, storefront_key: WACI_STOREFRONT_KEY, items });
};

exports.getResources = async (_req, res) => {
    try {
        const items = await readMediaFromTable();
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.json({ success: true, app_name: WACI_APP_NAME, storefront_key: WACI_STOREFRONT_KEY, items });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to load WACI resources.' });
    }
};

const getNextSortOrder = async (tableName) => {
    const result = await pool.query(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order FROM ${tableName}`);
    return Number(result.rows[0]?.next_sort_order || 0);
};

exports.createProgram = async (req, res) => {
    try {
        await ensureWaciResourceTables();

        const title = toText(req.body?.title, 'Untitled program');
        const slug = toSlug(req.body?.slug || title || `program-${Date.now()}`, `program-${Date.now()}`);
        const sortOrder = (req.body?.sortOrder === undefined && req.body?.sort_order === undefined)
            ? await getNextSortOrder('waci_programs')
            : toSortOrder(req.body?.sortOrder ?? req.body?.sort_order, 0);

        const result = await pool.query(
            `INSERT INTO waci_programs (slug, title, summary, status, region, image_url, cta_label, cta_link, sort_order, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
             RETURNING id::text AS id, slug, title, summary AS text, status, region, image_url AS image, cta_label AS "ctaLabel", cta_link AS "ctaLink", sort_order AS "sortOrder"`,
            [
                slug,
                title,
                toText(req.body?.text || req.body?.summary, ''),
                toText(req.body?.status, 'active'),
                toNullableText(req.body?.region),
                toNullableText(req.body?.image || req.body?.image_url || req.body?.imageUrl),
                toNullableText(req.body?.ctaLabel || req.body?.cta_label),
                toNullableText(req.body?.ctaLink || req.body?.cta_link),
                sortOrder,
            ],
        );

        return res.status(201).json({ success: true, item: normalizeProgram(result.rows[0], sortOrder) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to create WACI program.' });
    }
};

exports.updateProgram = async (req, res) => {
    try {
        await ensureWaciResourceTables();
        const currentResult = await pool.query('SELECT * FROM waci_programs WHERE id = $1 LIMIT 1', [req.params.id]);

        if (!currentResult.rows.length) {
            return res.status(404).json({ success: false, message: 'WACI program not found.' });
        }

        const current = currentResult.rows[0];
        const title = req.body?.title === undefined ? current.title : toText(req.body.title, current.title);
        const slug = req.body?.slug === undefined
            ? current.slug
            : toSlug(req.body.slug || title, current.slug || `program-${Date.now()}`);

        const result = await pool.query(
            `UPDATE waci_programs
             SET slug = $1,
                 title = $2,
                 summary = $3,
                 status = $4,
                 region = $5,
                 image_url = $6,
                 cta_label = $7,
                 cta_link = $8,
                 sort_order = $9,
                 updated_at = NOW()
             WHERE id = $10
             RETURNING id::text AS id, slug, title, summary AS text, status, region, image_url AS image, cta_label AS "ctaLabel", cta_link AS "ctaLink", sort_order AS "sortOrder"`,
            [
                slug,
                title,
                req.body?.text === undefined && req.body?.summary === undefined ? current.summary : toText(req.body?.text || req.body?.summary, ''),
                req.body?.status === undefined ? current.status : toText(req.body.status, current.status || 'active'),
                req.body?.region === undefined ? current.region : toNullableText(req.body.region),
                req.body?.image === undefined && req.body?.image_url === undefined && req.body?.imageUrl === undefined
                    ? current.image_url
                    : toNullableText(req.body?.image || req.body?.image_url || req.body?.imageUrl),
                req.body?.ctaLabel === undefined && req.body?.cta_label === undefined ? current.cta_label : toNullableText(req.body?.ctaLabel || req.body?.cta_label),
                req.body?.ctaLink === undefined && req.body?.cta_link === undefined ? current.cta_link : toNullableText(req.body?.ctaLink || req.body?.cta_link),
                req.body?.sortOrder === undefined && req.body?.sort_order === undefined ? current.sort_order : toSortOrder(req.body?.sortOrder ?? req.body?.sort_order, current.sort_order),
                req.params.id,
            ],
        );

        return res.json({ success: true, item: normalizeProgram(result.rows[0]) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to update WACI program.' });
    }
};

exports.deleteProgram = async (req, res) => {
    try {
        await ensureWaciResourceTables();
        const result = await pool.query('DELETE FROM waci_programs WHERE id = $1 RETURNING id::text AS id', [req.params.id]);

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'WACI program not found.' });
        }

        return res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to delete WACI program.' });
    }
};

exports.createStory = async (req, res) => {
    try {
        await ensureWaciResourceTables();

        const title = toText(req.body?.title, 'Untitled story');
        const slug = toSlug(req.body?.slug || title || `story-${Date.now()}`, `story-${Date.now()}`);
        const sortOrder = (req.body?.sortOrder === undefined && req.body?.sort_order === undefined)
            ? await getNextSortOrder('waci_stories')
            : toSortOrder(req.body?.sortOrder ?? req.body?.sort_order, 0);
        const requestedPublishedAt = toNullableText(req.body?.publishedAt || req.body?.published_at);
        const status = normalizeStoryStatus(req.body?.status, requestedPublishedAt ? 'published' : 'published');
        const publishedAt = status === 'published'
            ? (requestedPublishedAt || new Date().toISOString().slice(0, 10))
            : null;
        const submittedAt = toNullableText(req.body?.submittedAt || req.body?.submitted_at) || new Date().toISOString();
        const reviewedAt = status === 'pending' ? null : new Date().toISOString();
        const reviewedBy = status === 'pending' ? null : toNullableText(req.body?.reviewedBy || req.body?.reviewed_by || req.user?.email);
        const reviewNotes = toNullableText(req.body?.reviewNotes || req.body?.review_notes || req.body?.adminNotes || req.body?.notes);

        const result = await pool.query(
            `INSERT INTO waci_stories (
                slug,
                title,
                summary,
                location,
                status,
                published_at,
                submitted_at,
                reviewed_at,
                reviewed_by,
                review_notes,
                image_url,
                link,
                featured,
                author_name,
                author_email,
                external_story_id,
                source,
                view_count,
                like_count,
                share_count,
                sort_order,
                updated_at
            )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW())
             RETURNING id::text AS id, slug, title, summary, location, status, COALESCE(TO_CHAR(published_at, 'YYYY-MM-DD'), '') AS "publishedAt", submitted_at AS "submittedAt", reviewed_at AS "reviewedAt", reviewed_by AS "reviewedBy", review_notes AS "reviewNotes", image_url AS image, link, featured, author_name AS "authorName", author_email AS "authorEmail", external_story_id AS "externalStoryId", source, view_count AS "viewCount", like_count AS "likeCount", share_count AS "shareCount", sort_order AS "sortOrder"`,
            [
                slug,
                title,
                toText(req.body?.summary || req.body?.text, ''),
                toNullableText(req.body?.location),
                status,
                publishedAt,
                submittedAt,
                reviewedAt,
                reviewedBy,
                reviewNotes,
                toNullableText(req.body?.image || req.body?.image_url || req.body?.imageUrl),
                toNullableText(req.body?.link),
                toBoolean(req.body?.featured, true),
                toNullableText(req.body?.authorName || req.body?.author_name || req.body?.contact_name),
                toNullableText(req.body?.authorEmail || req.body?.author_email || req.body?.contact_email),
                toNullableText(req.body?.externalStoryId || req.body?.external_story_id),
                toNullableText(req.body?.source) || 'admin',
                toCount(req.body?.viewCount ?? req.body?.view_count ?? req.body?.views, 0),
                toCount(req.body?.likeCount ?? req.body?.like_count ?? req.body?.likes, 0),
                toCount(req.body?.shareCount ?? req.body?.share_count ?? req.body?.shares, 0),
                sortOrder,
            ],
        );

        await recalculateAuthorRewards({ force: true, reason: 'admin-create-story' });
        return res.status(201).json({ success: true, item: normalizeStory(result.rows[0], sortOrder) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to create WACI story.' });
    }
};

exports.updateStory = async (req, res) => {
    try {
        await ensureWaciResourceTables();
        const currentResult = await pool.query('SELECT * FROM waci_stories WHERE id = $1 LIMIT 1', [req.params.id]);

        if (!currentResult.rows.length) {
            return res.status(404).json({ success: false, message: 'WACI story not found.' });
        }

        const current = currentResult.rows[0];
        const title = req.body?.title === undefined ? current.title : toText(req.body.title, current.title);
        const slug = req.body?.slug === undefined
            ? current.slug
            : toSlug(req.body.slug || title, current.slug || `story-${Date.now()}`);
        const nextStatus = req.body?.status === undefined
            ? normalizeStoryStatus(current.status, current.published_at ? 'published' : 'pending')
            : normalizeStoryStatus(req.body.status, normalizeStoryStatus(current.status, current.published_at ? 'published' : 'pending'));
        const explicitPublishedAt = req.body?.publishedAt === undefined && req.body?.published_at === undefined
            ? undefined
            : toNullableText(req.body?.publishedAt || req.body?.published_at);
        const publishedAt = nextStatus === 'published'
            ? (explicitPublishedAt === undefined ? (current.published_at || new Date().toISOString().slice(0, 10)) : explicitPublishedAt || new Date().toISOString().slice(0, 10))
            : null;
        const reviewNotes = req.body?.reviewNotes === undefined && req.body?.review_notes === undefined && req.body?.adminNotes === undefined && req.body?.notes === undefined
            ? current.review_notes
            : toNullableText(req.body?.reviewNotes || req.body?.review_notes || req.body?.adminNotes || req.body?.notes);
        const reviewedAt = nextStatus === 'pending'
            ? null
            : (current.reviewed_at || new Date().toISOString());
        const reviewedBy = nextStatus === 'pending'
            ? null
            : (toNullableText(req.body?.reviewedBy || req.body?.reviewed_by || req.user?.email) || current.reviewed_by || null);

        const result = await pool.query(
            `UPDATE waci_stories
             SET slug = $1,
                 title = $2,
                 summary = $3,
                 location = $4,
                 status = $5,
                 published_at = $6,
                 reviewed_at = $7,
                 reviewed_by = $8,
                 review_notes = $9,
                 image_url = $10,
                 link = $11,
                 featured = $12,
                 author_name = $13,
                 author_email = $14,
                 external_story_id = $15,
                 source = $16,
                 view_count = $17,
                 like_count = $18,
                 share_count = $19,
                 sort_order = $20,
                 updated_at = NOW()
             WHERE id = $21
             RETURNING id::text AS id, slug, title, summary, location, status, COALESCE(TO_CHAR(published_at, 'YYYY-MM-DD'), '') AS "publishedAt", submitted_at AS "submittedAt", reviewed_at AS "reviewedAt", reviewed_by AS "reviewedBy", review_notes AS "reviewNotes", image_url AS image, link, featured, author_name AS "authorName", author_email AS "authorEmail", external_story_id AS "externalStoryId", source, view_count AS "viewCount", like_count AS "likeCount", share_count AS "shareCount", sort_order AS "sortOrder"`,
            [
                slug,
                title,
                req.body?.summary === undefined && req.body?.text === undefined ? current.summary : toText(req.body?.summary || req.body?.text, ''),
                req.body?.location === undefined ? current.location : toNullableText(req.body.location),
                nextStatus,
                publishedAt,
                reviewedAt,
                reviewedBy,
                reviewNotes,
                req.body?.image === undefined && req.body?.image_url === undefined && req.body?.imageUrl === undefined
                    ? current.image_url
                    : toNullableText(req.body?.image || req.body?.image_url || req.body?.imageUrl),
                req.body?.link === undefined ? current.link : toNullableText(req.body.link),
                req.body?.featured === undefined ? current.featured : toBoolean(req.body.featured, current.featured),
                req.body?.authorName === undefined && req.body?.author_name === undefined && req.body?.contact_name === undefined
                    ? current.author_name
                    : toNullableText(req.body?.authorName || req.body?.author_name || req.body?.contact_name),
                req.body?.authorEmail === undefined && req.body?.author_email === undefined && req.body?.contact_email === undefined
                    ? current.author_email
                    : toNullableText(req.body?.authorEmail || req.body?.author_email || req.body?.contact_email),
                req.body?.externalStoryId === undefined && req.body?.external_story_id === undefined
                    ? current.external_story_id
                    : toNullableText(req.body?.externalStoryId || req.body?.external_story_id),
                req.body?.source === undefined ? current.source : (toNullableText(req.body.source) || current.source || 'admin'),
                req.body?.viewCount === undefined && req.body?.view_count === undefined && req.body?.views === undefined
                    ? toCount(current.view_count, 0)
                    : toCount(req.body?.viewCount ?? req.body?.view_count ?? req.body?.views, 0),
                req.body?.likeCount === undefined && req.body?.like_count === undefined && req.body?.likes === undefined
                    ? toCount(current.like_count, 0)
                    : toCount(req.body?.likeCount ?? req.body?.like_count ?? req.body?.likes, 0),
                req.body?.shareCount === undefined && req.body?.share_count === undefined && req.body?.shares === undefined
                    ? toCount(current.share_count, 0)
                    : toCount(req.body?.shareCount ?? req.body?.share_count ?? req.body?.shares, 0),
                req.body?.sortOrder === undefined && req.body?.sort_order === undefined ? current.sort_order : toSortOrder(req.body?.sortOrder ?? req.body?.sort_order, current.sort_order),
                req.params.id,
            ],
        );

        await recalculateAuthorRewards({ force: true, reason: 'admin-update-story' });
        return res.json({ success: true, item: normalizeStory(result.rows[0]) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to update WACI story.' });
    }
};

exports.deleteStory = async (req, res) => {
    try {
        await ensureWaciResourceTables();
        const result = await pool.query('DELETE FROM waci_stories WHERE id = $1 RETURNING id::text AS id', [req.params.id]);

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'WACI story not found.' });
        }

        await recalculateAuthorRewards({ force: true, reason: 'delete-story' });
        return res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to delete WACI story.' });
    }
};

const recordStoryEngagement = async (req, res, eventType) => {
    try {
        await ensureWaciResourceTables();
        const identifier = toText(req.params.storyId || req.params.slug, '');

        if (!identifier) {
            return res.status(400).json({ success: false, message: 'Story identifier is required.' });
        }

        const storyResult = await pool.query(
            `SELECT * FROM waci_stories WHERE (id::text = $1 OR slug = $1) LIMIT 1`,
            [identifier],
        );

        if (!storyResult.rows.length) {
            return res.status(404).json({ success: false, message: 'WACI story not found.' });
        }

        const story = storyResult.rows[0];
        const storyStatus = normalizeStoryStatus(story.status, story.published_at ? 'published' : 'pending');

        if (storyStatus !== 'published') {
            return res.status(400).json({ success: false, message: 'Only published stories can receive engagement events.' });
        }

        const ipAddress = getRequestIp(req);
        const sessionId = toNullableText(req.body?.sessionId || req.body?.session_id || req.get('x-session-id'));
        const platform = toNullableText(req.body?.platform || req.body?.sharePlatform || req.body?.share_platform);
        const viewSeconds = toCount(req.body?.secondsOnPage ?? req.body?.seconds_on_page ?? req.body?.duration ?? 0, 0);

        if (eventType === 'like' && viewSeconds < 5) {
            return res.status(400).json({ success: false, message: 'Likes are unlocked after at least 5 seconds on the story page.' });
        }

        if (eventType === 'like' && ipAddress) {
            const existingLikeResult = await pool.query(
                `SELECT id FROM waci_story_engagement_events WHERE story_id = $1 AND event_type = 'like' AND ip_address = $2 LIMIT 1`,
                [story.id, ipAddress],
            );

            if (existingLikeResult.rows.length) {
                return res.status(409).json({ success: false, duplicate: true, message: 'This IP address has already liked this story.' });
            }
        }

        await pool.query(
            `INSERT INTO waci_story_engagement_events (
                story_id,
                event_type,
                ip_address,
                session_id,
                user_agent,
                platform,
                view_seconds,
                metadata
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
            [
                story.id,
                eventType,
                ipAddress,
                sessionId,
                toNullableText(req.get('user-agent')),
                platform,
                viewSeconds,
                JSON.stringify({
                    source: toNullableText(req.body?.source) || 'website',
                    event: eventType,
                    route: req.originalUrl,
                }),
            ],
        );

        const counterColumn = eventType === 'view' ? 'view_count' : (eventType === 'like' ? 'like_count' : 'share_count');
        const updatedStoryResult = await pool.query(
            `UPDATE waci_stories
             SET ${counterColumn} = COALESCE(${counterColumn}, 0) + 1,
                 updated_at = NOW()
             WHERE id = $1
             RETURNING id::text AS id, slug, title, summary, location, status, COALESCE(TO_CHAR(published_at, 'YYYY-MM-DD'), '') AS "publishedAt", submitted_at AS "submittedAt", reviewed_at AS "reviewedAt", reviewed_by AS "reviewedBy", review_notes AS "reviewNotes", image_url AS image, link, featured, author_name AS "authorName", author_email AS "authorEmail", external_story_id AS "externalStoryId", source, view_count AS "viewCount", like_count AS "likeCount", share_count AS "shareCount", sort_order AS "sortOrder"`,
            [story.id],
        );

        const updatedStory = normalizeStory(updatedStoryResult.rows[0]);
        const authorSummary = (await getAuthorAttributionItems({ forceRefresh: true }))
            .find((summary) => summary.authorEmail === toText(updatedStory.authorEmail, '').toLowerCase()) || null;

        return res.json({
            success: true,
            eventType,
            item: updatedStory,
            authorSummary,
        });
    } catch (error) {
        if (error?.code === '23505' && eventType === 'like') {
            return res.status(409).json({ success: false, duplicate: true, message: 'This IP address has already liked this story.' });
        }

        console.error(error);
        return res.status(500).json({ success: false, message: `Unable to record the WACI story ${eventType}.` });
    }
};

exports.trackStoryViewComplete = async (req, res) => recordStoryEngagement(req, res, 'view');
exports.trackStoryLike = async (req, res) => recordStoryEngagement(req, res, 'like');
exports.trackStoryShare = async (req, res) => recordStoryEngagement(req, res, 'share');

exports.recalculateAuthorRewardsNow = async (_req, res) => {
    try {
        const items = await getAuthorAttributionItems({ forceRefresh: true });
        return res.json({ success: true, items, recalculatedAt: new Date().toISOString() });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to recalculate WACI author rewards.' });
    }
};

exports.startWaciRewardsScheduler = () => {
    if (waciRewardSchedulerStarted) {
        return;
    }

    waciRewardSchedulerStarted = true;

    const timer = setInterval(() => {
        recalculateAuthorRewards({ force: true, reason: 'hourly-scheduler' }).catch((error) => {
            console.error('WACI hourly rewards recalculation failed.', error);
        });
    }, WACI_REWARD_RECALC_INTERVAL_MS);

    if (typeof timer.unref === 'function') {
        timer.unref();
    }

    recalculateAuthorRewards({ force: false, reason: 'scheduler-startup' }).catch((error) => {
        console.error('Initial WACI rewards recalculation failed.', error);
    });
};

const upsertStoryRecord = async (payload = {}, { defaultSource = 'website', actorEmail = null } = {}) => {
    await ensureWaciResourceTables();

    const externalStoryId = toNullableText(payload.externalStoryId || payload.external_story_id || payload.storyId || payload.story_id);
    const requestedId = toNullableText(payload.id);
    const currentResult = externalStoryId
        ? await pool.query('SELECT * FROM waci_stories WHERE external_story_id = $1 LIMIT 1', [externalStoryId])
        : (/^[0-9a-f-]{36}$/i.test(String(requestedId || ''))
            ? await pool.query('SELECT * FROM waci_stories WHERE id = $1 LIMIT 1', [requestedId])
            : { rows: [] });

    const current = currentResult.rows[0] || null;
    const title = current && payload.title === undefined ? current.title : toText(payload.title, current?.title || 'Untitled story');
    const slug = payload.slug === undefined
        ? (current?.slug || toSlug(title, `story-${Date.now()}`))
        : toSlug(payload.slug || title, current?.slug || `story-${Date.now()}`);
    const sortOrder = (payload.sortOrder === undefined && payload.sort_order === undefined)
        ? (current ? toSortOrder(current.sort_order, 0) : await getNextSortOrder('waci_stories'))
        : toSortOrder(payload.sortOrder ?? payload.sort_order, current?.sort_order || 0);
    const derivedFallbackStatus = current?.status || ((current?.published_at || payload.publishedAt || payload.published_at) ? 'published' : 'pending');
    const status = payload.status === undefined
        ? normalizeStoryStatus(derivedFallbackStatus, derivedFallbackStatus)
        : normalizeStoryStatus(payload.status, derivedFallbackStatus);
    const explicitPublishedAt = payload.publishedAt === undefined && payload.published_at === undefined
        ? undefined
        : toNullableText(payload.publishedAt || payload.published_at);
    const publishedAt = status === 'published'
        ? (explicitPublishedAt === undefined ? (current?.published_at || new Date().toISOString().slice(0, 10)) : explicitPublishedAt || new Date().toISOString().slice(0, 10))
        : null;
    const submittedAt = payload.submittedAt === undefined && payload.submitted_at === undefined
        ? (current?.submitted_at || new Date().toISOString())
        : (toNullableText(payload.submittedAt || payload.submitted_at) || new Date().toISOString());
    const reviewNotes = payload.reviewNotes === undefined && payload.review_notes === undefined && payload.adminNotes === undefined && payload.notes === undefined
        ? (current?.review_notes || null)
        : toNullableText(payload.reviewNotes || payload.review_notes || payload.adminNotes || payload.notes);
    const reviewedAt = status === 'pending'
        ? null
        : (payload.reviewedAt || payload.reviewed_at || current?.reviewed_at || new Date().toISOString());
    const reviewedBy = status === 'pending'
        ? null
        : (toNullableText(payload.reviewedBy || payload.reviewed_by || actorEmail) || current?.reviewed_by || null);
    const values = {
        slug,
        title,
        summary: payload.summary === undefined && payload.text === undefined ? (current?.summary || '') : toText(payload.summary || payload.text, ''),
        location: payload.location === undefined ? (current?.location || null) : toNullableText(payload.location),
        status,
        publishedAt,
        submittedAt,
        reviewedAt,
        reviewedBy,
        reviewNotes,
        image: payload.image === undefined && payload.image_url === undefined && payload.imageUrl === undefined
            ? (current?.image_url || null)
            : toNullableText(payload.image || payload.image_url || payload.imageUrl),
        link: payload.link === undefined ? (current?.link || null) : toNullableText(payload.link),
        featured: payload.featured === undefined ? toBoolean(current?.featured, true) : toBoolean(payload.featured, true),
        authorName: payload.authorName === undefined && payload.author_name === undefined && payload.contact_name === undefined
            ? (current?.author_name || null)
            : toNullableText(payload.authorName || payload.author_name || payload.contact_name),
        authorEmail: payload.authorEmail === undefined && payload.author_email === undefined && payload.contact_email === undefined
            ? (current?.author_email || null)
            : toNullableText(payload.authorEmail || payload.author_email || payload.contact_email),
        externalStoryId: externalStoryId || current?.external_story_id || null,
        source: payload.source === undefined ? (current?.source || defaultSource) : (toNullableText(payload.source) || defaultSource),
        viewCount: payload.viewCount === undefined && payload.view_count === undefined && payload.views === undefined
            ? toCount(current?.view_count, 0)
            : toCount(payload.viewCount ?? payload.view_count ?? payload.views, 0),
        likeCount: payload.likeCount === undefined && payload.like_count === undefined && payload.likes === undefined
            ? toCount(current?.like_count, 0)
            : toCount(payload.likeCount ?? payload.like_count ?? payload.likes, 0),
        shareCount: payload.shareCount === undefined && payload.share_count === undefined && payload.shares === undefined
            ? toCount(current?.share_count, 0)
            : toCount(payload.shareCount ?? payload.share_count ?? payload.shares, 0),
        sortOrder,
    };

    const result = current
        ? await pool.query(
            `UPDATE waci_stories
             SET slug = $1,
                 title = $2,
                 summary = $3,
                 location = $4,
                 status = $5,
                 published_at = $6,
                 submitted_at = $7,
                 reviewed_at = $8,
                 reviewed_by = $9,
                 review_notes = $10,
                 image_url = $11,
                 link = $12,
                 featured = $13,
                 author_name = $14,
                 author_email = $15,
                 external_story_id = $16,
                 source = $17,
                 view_count = $18,
                 like_count = $19,
                 share_count = $20,
                 sort_order = $21,
                 updated_at = NOW()
             WHERE id = $22
             RETURNING id::text AS id, slug, title, summary, location, status, COALESCE(TO_CHAR(published_at, 'YYYY-MM-DD'), '') AS "publishedAt", submitted_at AS "submittedAt", reviewed_at AS "reviewedAt", reviewed_by AS "reviewedBy", review_notes AS "reviewNotes", image_url AS image, link, featured, author_name AS "authorName", author_email AS "authorEmail", external_story_id AS "externalStoryId", source, view_count AS "viewCount", like_count AS "likeCount", share_count AS "shareCount", sort_order AS "sortOrder"`,
            [
                values.slug,
                values.title,
                values.summary,
                values.location,
                values.status,
                values.publishedAt,
                values.submittedAt,
                values.reviewedAt,
                values.reviewedBy,
                values.reviewNotes,
                values.image,
                values.link,
                values.featured,
                values.authorName,
                values.authorEmail,
                values.externalStoryId,
                values.source,
                values.viewCount,
                values.likeCount,
                values.shareCount,
                values.sortOrder,
                current.id,
            ],
        )
        : await pool.query(
            `INSERT INTO waci_stories (
                slug,
                title,
                summary,
                location,
                status,
                published_at,
                submitted_at,
                reviewed_at,
                reviewed_by,
                review_notes,
                image_url,
                link,
                featured,
                author_name,
                author_email,
                external_story_id,
                source,
                view_count,
                like_count,
                share_count,
                sort_order,
                updated_at
            )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW())
             RETURNING id::text AS id, slug, title, summary, location, status, COALESCE(TO_CHAR(published_at, 'YYYY-MM-DD'), '') AS "publishedAt", submitted_at AS "submittedAt", reviewed_at AS "reviewedAt", reviewed_by AS "reviewedBy", review_notes AS "reviewNotes", image_url AS image, link, featured, author_name AS "authorName", author_email AS "authorEmail", external_story_id AS "externalStoryId", source, view_count AS "viewCount", like_count AS "likeCount", share_count AS "shareCount", sort_order AS "sortOrder"`,
            [
                values.slug,
                values.title,
                values.summary,
                values.location,
                values.status,
                values.publishedAt,
                values.submittedAt,
                values.reviewedAt,
                values.reviewedBy,
                values.reviewNotes,
                values.image,
                values.link,
                values.featured,
                values.authorName,
                values.authorEmail,
                values.externalStoryId,
                values.source,
                values.viewCount,
                values.likeCount,
                values.shareCount,
                values.sortOrder,
            ],
        );

    return normalizeStory(result.rows[0], values.sortOrder);
};

const getAuthorAttributionItems = async ({ forceRefresh = false } = {}) => {
    const items = await recalculateAuthorRewards({ force: forceRefresh, reason: forceRefresh ? 'forced-read' : 'read-attribution' });
    return Array.isArray(items) ? items : [];
};

exports.submitStory = async (req, res) => {
    const title = toNullableText(req.body?.title);
    const authorEmail = toNullableText(req.body?.authorEmail || req.body?.author_email || req.body?.contact_email || req.body?.email);
    const authorName = toText(req.body?.authorName || req.body?.author_name || req.body?.contact_name || req.body?.name, 'there');

    if (!title) {
        return res.status(400).json({ success: false, message: 'Story title is required.' });
    }

    if (!authorEmail) {
        return res.status(400).json({ success: false, message: 'Author email is required for attribution.' });
    }

    try {
        const item = await upsertStoryRecord({
            ...req.body,
            status: 'pending',
            publishedAt: null,
            submittedAt: req.body?.submittedAt || req.body?.submitted_at || new Date().toISOString(),
            featured: false,
        }, {
            defaultSource: toNullableText(req.body?.source) || 'website-submit-story',
        });

        await Promise.all([
            sendEmail({
                to: getPayoutNotificationRecipients(),
                appName: WACI_APP_NAME,
                storefrontKey: WACI_STOREFRONT_KEY,
                subject: `New WACI story submission: ${item.title}`,
                text: [
                    'A new WACI story has been submitted and is now pending review.',
                    `Title: ${item.title}`,
                    `Author: ${authorName}`,
                    `Email: ${authorEmail}`,
                    `Location: ${item.location || 'Not provided'}`,
                ].join('\n'),
            }),
            sendEmail({
                to: authorEmail,
                appName: WACI_APP_NAME,
                storefrontKey: WACI_STOREFRONT_KEY,
                subject: 'Your WACI story is now pending review',
                text: [
                    `Hello ${authorName},`,
                    '',
                    'Thanks for sending your story to WACI.',
                    'It has been saved as pending and the WACI editorial team will review it before publishing.',
                    '',
                    `Story title: ${item.title}`,
                ].join('\n'),
            }),
        ]);

        return res.status(201).json({
            success: true,
            item,
            authorSummary: null,
            message: 'Story submitted successfully and saved as pending review.',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to submit WACI story.' });
    }
};

exports.handleWaciHubWebhook = async (req, res) => {
    const expectedSecret = toText(process.env.WACI_WACIHUB_WEBHOOK_SECRET, '');
    const providedSecret = toText(
        req.get('x-waci-webhook-secret')
        || req.get('x-wacihub-secret')
        || (req.get('authorization') || '').replace(/^Bearer\s+/i, '')
        || req.body?.secret,
        '',
    );

    if (expectedSecret && providedSecret !== expectedSecret) {
        return res.status(401).json({ success: false, message: 'Invalid WACIHub webhook secret.' });
    }

    try {
        const storyPayload = req.body?.story || req.body?.data || req.body || {};
        const mergedPayload = {
            ...storyPayload,
            views: req.body?.metrics?.views ?? storyPayload.views,
            likes: req.body?.metrics?.likes ?? storyPayload.likes,
            shares: req.body?.metrics?.shares ?? storyPayload.shares,
            status: storyPayload.status || req.body?.status || storyPayload.story_status,
            source: storyPayload.source || req.body?.source || 'wacihub',
        };

        if (!toNullableText(mergedPayload.title) || !toNullableText(mergedPayload.authorEmail || mergedPayload.author_email || mergedPayload.contact_email || mergedPayload.email)) {
            return res.status(400).json({ success: false, message: 'Webhook payload must include a story title and author email.' });
        }

        const item = await upsertStoryRecord(mergedPayload, { defaultSource: 'wacihub' });
        const authorSummary = (await getAuthorAttributionItems({ forceRefresh: true })).find((summary) => summary.authorEmail === toText(item.authorEmail, '').toLowerCase()) || null;

        return res.json({ success: true, event: toText(req.body?.type, 'story.updated'), item, authorSummary });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to process WACIHub webhook.' });
    }
};

exports.getStoryAttribution = async (req, res) => {
    try {
        const authorEmail = toText(req.query?.author_email || req.query?.authorEmail, '').toLowerCase();
        const items = await getAuthorAttributionItems();
        const filteredItems = authorEmail
            ? items.filter((item) => item.authorEmail === authorEmail)
            : items;

        return res.json({
            success: true,
            methods: Object.values(WACI_PAYOUT_METHODS),
            items: filteredItems,
            note: 'Author rewards are stored in WACI author rewards and refreshed automatically every hour, with immediate refresh after story moderation and engagement events.',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to load WACI story attribution.' });
    }
};

exports.requestStoryPayout = async (req, res) => {
    try {
        await ensureWaciResourceTables();

        const authorEmail = toText(req.body?.author_email || req.body?.authorEmail || req.body?.email, '').toLowerCase();
        const authorName = toText(req.body?.author_name || req.body?.authorName || req.body?.name, '');
        const payoutMethod = getPayoutMethodConfig(req.body?.payout_method || req.body?.payoutMethod || req.body?.method);

        if (!authorEmail) {
            return res.status(400).json({ success: false, message: 'Author email is required.' });
        }

        if (!payoutMethod) {
            return res.status(400).json({ success: false, message: 'A valid payout method is required.' });
        }

        const authorSummary = (await getAuthorAttributionItems()).find((item) => item.authorEmail === authorEmail);

        if (!authorSummary) {
            return res.status(404).json({ success: false, message: 'No attributed story earnings were found for this author yet.' });
        }

        const requestedAmountCents = req.body?.amount_cents !== undefined
            ? toCount(req.body.amount_cents, 0)
            : (req.body?.amount !== undefined ? toCurrencyCents(req.body.amount, authorSummary.availableEarningsCents) : authorSummary.availableEarningsCents);

        if (!requestedAmountCents || requestedAmountCents <= 0) {
            return res.status(400).json({ success: false, message: 'There are no available earnings to request right now.' });
        }

        if (requestedAmountCents > authorSummary.availableEarningsCents) {
            return res.status(400).json({ success: false, message: `Requested amount exceeds the currently available balance of ${formatMoneyFromCents(authorSummary.availableEarningsCents)}.` });
        }

        if (requestedAmountCents < payoutMethod.minAmountCents) {
            return res.status(400).json({ success: false, message: `${payoutMethod.label} has a minimum payout of ${formatMoneyFromCents(payoutMethod.minAmountCents)}.` });
        }

        const feeAmountCents = Math.round(requestedAmountCents * payoutMethod.feeRate);
        const netAmountCents = Math.max(requestedAmountCents - feeAmountCents, 0);
        const paymentDetails = {
            stripeAccountId: toNullableText(req.body?.stripe_account_id || req.body?.stripeAccountId),
            paypalEmail: toNullableText(req.body?.paypal_email || req.body?.paypalEmail),
            bankAccountName: toNullableText(req.body?.bank_account_name || req.body?.bankAccountName),
            bankReference: toNullableText(req.body?.bank_reference || req.body?.bankReference),
            mailingAddress: toNullableText(req.body?.mailing_address || req.body?.mailingAddress),
        };

        const result = await pool.query(
            `INSERT INTO waci_story_payout_requests (
                author_email,
                author_name,
                payout_method,
                status,
                requested_amount_cents,
                fee_amount_cents,
                net_amount_cents,
                total_points,
                payment_details,
                stats_snapshot,
                admin_notes,
                updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,NOW())
            RETURNING id::text AS id, author_email, author_name, payout_method, status, requested_amount_cents, fee_amount_cents, net_amount_cents, total_points, payment_details, stats_snapshot, admin_notes, stripe_reference_id, last_event_type, created_at, updated_at`,
            [
                authorEmail,
                authorName || authorSummary.authorName || null,
                payoutMethod.id,
                'created',
                requestedAmountCents,
                feeAmountCents,
                netAmountCents,
                authorSummary.totalPoints,
                JSON.stringify(paymentDetails),
                JSON.stringify(authorSummary),
                toNullableText(req.body?.notes),
            ],
        );

        const item = normalizePayoutRequest(result.rows[0]);
        const emailResult = await sendPayoutStatusEmails(item, 'created');

        return res.status(201).json({
            success: true,
            item,
            authorSummary,
            admin_email_sent: Boolean(emailResult.admin?.sent),
            author_email_sent: Boolean(emailResult.author?.sent),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to create WACI payout request.' });
    }
};

exports.getPayoutRequests = async (_req, res) => {
    try {
        const items = await readPayoutRequests();
        return res.json({ success: true, items, methods: Object.values(WACI_PAYOUT_METHODS) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to load WACI payout requests.' });
    }
};

exports.updatePayoutRequestStatus = async (req, res) => {
    try {
        await ensureWaciResourceTables();
        const currentResult = await pool.query('SELECT * FROM waci_story_payout_requests WHERE id = $1 LIMIT 1', [req.params.id]);

        if (!currentResult.rows.length) {
            return res.status(404).json({ success: false, message: 'WACI payout request not found.' });
        }

        const current = currentResult.rows[0];
        const nextStatus = toText(req.body?.status, current.status || 'created').toLowerCase();
        const allowedStatuses = ['created', 'pending', 'processing', 'approved', 'scheduled', 'completed', 'paid', 'failed', 'cancelled'];

        if (!allowedStatuses.includes(nextStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid payout status.' });
        }

        const result = await pool.query(
            `UPDATE waci_story_payout_requests
             SET status = $1,
                 admin_notes = $2,
                 stripe_reference_id = COALESCE($3, stripe_reference_id),
                 last_event_type = COALESCE($4, last_event_type),
                 updated_at = NOW()
             WHERE id = $5
             RETURNING id::text AS id, author_email, author_name, payout_method, status, requested_amount_cents, fee_amount_cents, net_amount_cents, total_points, payment_details, stats_snapshot, admin_notes, stripe_reference_id, last_event_type, created_at, updated_at`,
            [
                nextStatus,
                req.body?.notes === undefined ? current.admin_notes : toNullableText(req.body.notes),
                toNullableText(req.body?.stripe_reference_id || req.body?.stripeReferenceId),
                toNullableText(req.body?.event_type || req.body?.eventType),
                req.params.id,
            ],
        );

        const item = normalizePayoutRequest(result.rows[0]);
        const shouldNotify = nextStatus !== String(current.status || '').toLowerCase() && ['created', 'processing', 'completed', 'paid', 'failed'].includes(nextStatus);
        const emailResult = shouldNotify
            ? await sendPayoutStatusEmails(item, nextStatus === 'paid' ? 'completed' : nextStatus)
            : { admin: { sent: false, skipped: true }, author: { sent: false, skipped: true } };

        return res.json({
            success: true,
            item,
            admin_email_sent: Boolean(emailResult.admin?.sent),
            author_email_sent: Boolean(emailResult.author?.sent),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to update WACI payout request.' });
    }
};

exports.handlePayoutWebhook = async (req, res) => {
    const stripe = getWaciStripeClient();
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.WACI_STRIPE_PAYOUT_WEBHOOK_SECRET || process.env.WACI_STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret) {
        return res.status(503).json({ message: 'WACI payout webhook handling is not configured.' });
    }

    if (!signature) {
        return res.status(400).send('Missing Stripe signature header.');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
        console.error('WACI payout webhook signature verification failed:', error.message || error);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        const payload = event.data?.object || {};
        const payoutRequestId = toNullableText(payload.metadata?.payoutRequestId || payload.metadata?.payout_request_id);

        if (payoutRequestId) {
            const currentResult = await pool.query('SELECT * FROM waci_story_payout_requests WHERE id = $1 LIMIT 1', [payoutRequestId]);

            if (currentResult.rows.length) {
                const nextStatus = /failed|canceled/.test(event.type)
                    ? 'failed'
                    : (/paid|completed|succeeded/.test(event.type) ? 'completed' : 'processing');
                const updatedResult = await pool.query(
                    `UPDATE waci_story_payout_requests
                     SET status = $1,
                         stripe_reference_id = COALESCE($2, stripe_reference_id),
                         last_event_type = $3,
                         updated_at = NOW()
                     WHERE id = $4
                     RETURNING id::text AS id, author_email, author_name, payout_method, status, requested_amount_cents, fee_amount_cents, net_amount_cents, total_points, payment_details, stats_snapshot, admin_notes, stripe_reference_id, last_event_type, created_at, updated_at`,
                    [nextStatus, toNullableText(payload.id), event.type, payoutRequestId],
                );

                if (['completed', 'failed'].includes(nextStatus)) {
                    await sendPayoutStatusEmails(updatedResult.rows[0], nextStatus);
                }
            }
        }

        return res.json({ received: true, type: event.type });
    } catch (error) {
        console.error('WACI payout webhook processing failed:', error);
        return res.status(500).json({ message: 'Unable to process WACI payout webhook.' });
    }
};

exports.createResource = async (req, res) => {
    try {
        await ensureWaciResourceTables();

        const sortOrder = (req.body?.sortOrder === undefined && req.body?.sort_order === undefined)
            ? await getNextSortOrder('waci_media')
            : toSortOrder(req.body?.sortOrder ?? req.body?.sort_order, 0);

        const result = await pool.query(
            `INSERT INTO waci_media (title, media_type, file_url, alt_text, caption, sort_order, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,NOW())
             RETURNING id::text AS id, title, media_type, file_url, alt_text, caption, sort_order, created_at, updated_at`,
            [
                toText(req.body?.title, 'Untitled resource'),
                toText(req.body?.media_type || req.body?.mediaType, 'image'),
                toNullableText(req.body?.file_url || req.body?.fileUrl || req.body?.url),
                toNullableText(req.body?.alt_text || req.body?.altText),
                toNullableText(req.body?.caption),
                sortOrder,
            ],
        );

        return res.status(201).json({ success: true, item: normalizeMediaItem(result.rows[0], sortOrder) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to create WACI resource.' });
    }
};

exports.updateResource = async (req, res) => {
    try {
        await ensureWaciResourceTables();
        const currentResult = await pool.query('SELECT * FROM waci_media WHERE id = $1 LIMIT 1', [req.params.id]);

        if (!currentResult.rows.length) {
            return res.status(404).json({ success: false, message: 'WACI resource not found.' });
        }

        const current = currentResult.rows[0];
        const result = await pool.query(
            `UPDATE waci_media
             SET title = $1,
                 media_type = $2,
                 file_url = $3,
                 alt_text = $4,
                 caption = $5,
                 sort_order = $6,
                 updated_at = NOW()
             WHERE id = $7
             RETURNING id::text AS id, title, media_type, file_url, alt_text, caption, sort_order, created_at, updated_at`,
            [
                req.body?.title === undefined ? current.title : toText(req.body.title, current.title),
                req.body?.media_type === undefined && req.body?.mediaType === undefined ? current.media_type : toText(req.body?.media_type || req.body?.mediaType, current.media_type || 'image'),
                req.body?.file_url === undefined && req.body?.fileUrl === undefined && req.body?.url === undefined
                    ? current.file_url
                    : toNullableText(req.body?.file_url || req.body?.fileUrl || req.body?.url),
                req.body?.alt_text === undefined && req.body?.altText === undefined ? current.alt_text : toNullableText(req.body?.alt_text || req.body?.altText),
                req.body?.caption === undefined ? current.caption : toNullableText(req.body.caption),
                req.body?.sortOrder === undefined && req.body?.sort_order === undefined ? current.sort_order : toSortOrder(req.body?.sortOrder ?? req.body?.sort_order, current.sort_order),
                req.params.id,
            ],
        );

        return res.json({ success: true, item: normalizeMediaItem(result.rows[0]) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to update WACI resource.' });
    }
};

exports.deleteResource = async (req, res) => {
    try {
        await ensureWaciResourceTables();
        const result = await pool.query('DELETE FROM waci_media WHERE id = $1 RETURNING id::text AS id', [req.params.id]);

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'WACI resource not found.' });
        }

        return res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to delete WACI resource.' });
    }
};

exports.getAdminOverview = async (_req, res) => {
    try {
        await ensureWaciResourceTables();
        await ensureNewsletterSubscribersTable();

        const [newsletterResult, volunteerResult, partnerResult, donorResult, programResult, storyResult, resourceResult] = await Promise.all([
            pool.query(`SELECT COUNT(*)::int AS count FROM waci_newsletter_subscribers WHERE app_name = $1`, [WACI_APP_NAME]),
            pool.query('SELECT COUNT(*)::int AS count FROM waci_volunteers'),
            pool.query('SELECT COUNT(*)::int AS count FROM waci_partners'),
            pool.query('SELECT COUNT(*)::int AS count FROM waci_donors'),
            pool.query('SELECT COUNT(*)::int AS count FROM waci_programs'),
            pool.query('SELECT COUNT(*)::int AS count FROM waci_stories'),
            pool.query('SELECT COUNT(*)::int AS count FROM waci_media'),
        ]);

        res.set('Cache-Control', 'no-store, max-age=0');
        return res.json({
            success: true,
            overview: {
                newsletterSubscribers: newsletterResult.rows[0]?.count || 0,
                volunteerApplications: volunteerResult.rows[0]?.count || 0,
                partnerInquiries: partnerResult.rows[0]?.count || 0,
                donors: donorResult.rows[0]?.count || 0,
                programs: programResult.rows[0]?.count || 0,
                stories: storyResult.rows[0]?.count || 0,
                resources: resourceResult.rows[0]?.count || 0,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to load WACI admin overview.' });
    }
};

exports.getNewsletterSubscribers = async (_req, res) => {
    try {
        await ensureNewsletterSubscribersTable();
        const result = await pool.query(
            `SELECT id::text AS id, full_name, email, interests, source, created_at, updated_at
             FROM waci_newsletter_subscribers
             WHERE app_name = $1
             ORDER BY created_at DESC`,
            [WACI_APP_NAME],
        );

        return res.json(result.rows.map((row) => ({
            ...row,
            interests: Array.isArray(row.interests) ? row.interests : [],
        })));
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load WACI newsletter subscribers.' });
    }
};

exports.getVolunteers = async (_req, res) => {
    try {
        return res.json(await readInterestRows('waci_volunteers'));
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load WACI volunteers.' });
    }
};

exports.getPartnerRequests = async (_req, res) => {
    try {
        return res.json(await readInterestRows('waci_partners'));
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load WACI partner requests.' });
    }
};

exports.getDonorRequests = async (_req, res) => {
    try {
        return res.json(await readInterestRows('waci_donors'));
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load WACI donor records.' });
    }
};

exports.getMedia = async (_req, res) => {
    try {
        const items = await readMediaFromTable();
        return res.json({ app_name: WACI_APP_NAME, storefront_key: WACI_STOREFRONT_KEY, items });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load WACI media.' });
    }
};
