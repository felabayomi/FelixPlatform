const pool = require('../db');
const { sendSupportRequestNotification } = require('../services/resendEmail');

const WACI_APP_NAME = 'WACI';
const WACI_STOREFRONT_KEY = 'waci';
const PROGRAMS_CONTENT_KEY = 'waci_programs';
const STORIES_CONTENT_KEY = 'waci_stories';
const PARTNERS_CONTENT_KEY = 'waci_partner_options';
const DONORS_CONTENT_KEY = 'waci_donor_options';

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
                    published_at DATE,
                    image_url TEXT,
                    link TEXT,
                    featured BOOLEAN NOT NULL DEFAULT TRUE,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

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

const readStoriesFromTable = async () => {
    await ensureWaciResourceTables();
    const result = await pool.query(
        `SELECT
            id::text AS id,
            slug,
            title,
            summary,
            location,
            COALESCE(TO_CHAR(published_at, 'YYYY-MM-DD'), '') AS "publishedAt",
            image_url AS image,
            link,
            featured,
            sort_order AS "sortOrder"
         FROM waci_stories
         ORDER BY sort_order ASC, created_at DESC`
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
    publishedAt: toText(item.publishedAt || item.date, ''),
    image: toText(item.image, ''),
    link: toText(item.link, ''),
    featured: typeof item.featured === 'boolean' ? item.featured : toBoolean(item.featured, true),
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

exports.getStories = async (_req, res) => {
    try {
        const items = await readStoriesFromTable();
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.json({ app_name: WACI_APP_NAME, storefront_key: WACI_STOREFRONT_KEY, items });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load WACI stories.' });
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
        const publishedAt = toNullableText(req.body?.publishedAt || req.body?.published_at);

        const result = await pool.query(
            `INSERT INTO waci_stories (slug, title, summary, location, published_at, image_url, link, featured, sort_order, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
             RETURNING id::text AS id, slug, title, summary, location, COALESCE(TO_CHAR(published_at, 'YYYY-MM-DD'), '') AS "publishedAt", image_url AS image, link, featured, sort_order AS "sortOrder"`,
            [
                slug,
                title,
                toText(req.body?.summary || req.body?.text, ''),
                toNullableText(req.body?.location),
                publishedAt,
                toNullableText(req.body?.image || req.body?.image_url || req.body?.imageUrl),
                toNullableText(req.body?.link),
                toBoolean(req.body?.featured, true),
                sortOrder,
            ],
        );

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
        const publishedAt = req.body?.publishedAt === undefined && req.body?.published_at === undefined
            ? current.published_at
            : toNullableText(req.body?.publishedAt || req.body?.published_at);

        const result = await pool.query(
            `UPDATE waci_stories
             SET slug = $1,
                 title = $2,
                 summary = $3,
                 location = $4,
                 published_at = $5,
                 image_url = $6,
                 link = $7,
                 featured = $8,
                 sort_order = $9,
                 updated_at = NOW()
             WHERE id = $10
             RETURNING id::text AS id, slug, title, summary, location, COALESCE(TO_CHAR(published_at, 'YYYY-MM-DD'), '') AS "publishedAt", image_url AS image, link, featured, sort_order AS "sortOrder"`,
            [
                slug,
                title,
                req.body?.summary === undefined && req.body?.text === undefined ? current.summary : toText(req.body?.summary || req.body?.text, ''),
                req.body?.location === undefined ? current.location : toNullableText(req.body.location),
                publishedAt,
                req.body?.image === undefined && req.body?.image_url === undefined && req.body?.imageUrl === undefined
                    ? current.image_url
                    : toNullableText(req.body?.image || req.body?.image_url || req.body?.imageUrl),
                req.body?.link === undefined ? current.link : toNullableText(req.body.link),
                req.body?.featured === undefined ? current.featured : toBoolean(req.body.featured, current.featured),
                req.body?.sortOrder === undefined && req.body?.sort_order === undefined ? current.sort_order : toSortOrder(req.body?.sortOrder ?? req.body?.sort_order, current.sort_order),
                req.params.id,
            ],
        );

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

        return res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Unable to delete WACI story.' });
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
