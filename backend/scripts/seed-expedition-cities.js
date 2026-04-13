'use strict';

// Direct DB seed script - inserts missing city sections for Expedition America Standalone
// Run with: node backend/scripts/seed-expedition-cities.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const TABLE_NAME = 'expedition_america_standalone_sections';

const NEW_CITIES = [
    {
        pageKey: 'home',
        sectionKey: 'city-miami',
        title: 'Miami',
        subtitle: 'Chase coastal vibes, art, rhythms, flavors, nightlife.',
        body: 'Use this card to highlight beachfront culture, art districts, and seasonal travel windows.',
        ctaLabel: 'View Miami',
        ctaUrl: 'https://view.citydiscoverer.ai/guide/guide-1773625213797-hg5yh4mbw',
        imageUrl: 'https://mediahost.app/api/media/serve/2c9188045dd02cf3e6ee1f82a13d430d?w=1200&h=800&fit=fill&q=80',
        sortOrder: 40,
    },
    {
        pageKey: 'home',
        sectionKey: 'city-los-angeles',
        title: 'Los Angeles',
        subtitle: 'Find creative districts, sunshine, cuisine, style, scenes.',
        body: 'Use this card for coastal culture, studio neighborhoods, and weekend trip ideas.',
        ctaLabel: 'View Los Angeles',
        ctaUrl: 'https://view.citydiscoverer.ai/guide/guide-1773625446163-4ftgk5mz7',
        imageUrl: 'https://mediahost.app/api/media/serve/ec2141f74c0deb143ae805870ed8b76a?w=1200&h=800&fit=fill&q=80',
        sortOrder: 50,
    },
    {
        pageKey: 'home',
        sectionKey: 'city-austin',
        title: 'Austin',
        subtitle: 'Dive into live music, tacos, trails, culture.',
        body: 'Use this card to showcase music venues, food trucks, and outdoor activity picks.',
        ctaLabel: 'View Austin',
        ctaUrl: 'https://view.citydiscoverer.ai/guide/guide-1773625820913-ykaxhij5s',
        imageUrl: 'https://mediahost.app/api/media/serve/88c385abd6bb06057665592faf9040c0?w=1200&h=800&fit=fill&q=80',
        sortOrder: 60,
    },
    {
        pageKey: 'home',
        sectionKey: 'city-nashville',
        title: 'Nashville',
        subtitle: 'Feel honky-tonks, heritage, hot chicken, creative spirit.',
        body: 'Use this card for Broadway strips, food neighborhoods, and live music highlights.',
        ctaLabel: 'View Nashville',
        ctaUrl: 'https://view.citydiscoverer.ai/guide/guide-1773625659740-u6qg2k8cf',
        imageUrl: 'https://mediahost.app/api/media/serve/bc393f73bf155047848fb16a6b1505eb?w=1200&h=800&fit=fill&q=80',
        sortOrder: 70,
    },
    {
        pageKey: 'home',
        sectionKey: 'city-cumberland',
        title: 'Cumberland, MD',
        subtitle: 'Explore mountain charm, history, trails, shops, culture.',
        body: 'Use this card for scenic railways, Main Street culture, and trail access highlights.',
        ctaLabel: 'View Cumberland',
        ctaUrl: 'https://view.citydiscoverer.ai/guide/guide-1773626074863-be7bkjcxs',
        imageUrl: 'https://mediahost.app/api/media/serve/b8d6aefbb772dcb526e4524418064f58?w=1200&h=800&fit=fill&q=80',
        sortOrder: 80,
    },
    {
        pageKey: 'home',
        sectionKey: 'city-morgantown',
        title: 'Morgantown, WV',
        subtitle: 'Enjoy college energy, river views, food, events.',
        body: 'Use this card to highlight campus culture, riverfront spots, and local events.',
        ctaLabel: 'View Morgantown',
        ctaUrl: 'https://view.citydiscoverer.ai/guide/guide-1773626265200-2uqm13sef',
        imageUrl: 'https://mediahost.app/api/media/serve/f6a3fcbb68bd45ce352c8df5974c8f7a?w=1200&h=800&fit=fill&q=80',
        sortOrder: 90,
    },
];

async function run() {
    console.log('Connecting to database...');

    // Insert 6 new cities (ON CONFLICT DO NOTHING to preserve any admin edits)
    for (const city of NEW_CITIES) {
        const result = await pool.query(
            `INSERT INTO ${TABLE_NAME} (
                id, page_key, section_key, title, subtitle, body, cta_label, cta_url, image_url, sort_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (page_key, section_key) DO NOTHING
            RETURNING id`,
            [
                crypto.randomUUID(),
                city.pageKey,
                city.sectionKey,
                city.title,
                city.subtitle,
                city.body,
                city.ctaLabel,
                city.ctaUrl,
                city.imageUrl,
                city.sortOrder,
            ]
        );
        if (result.rows.length > 0) {
            console.log(`  Inserted: ${city.sectionKey}`);
        } else {
            console.log(`  Skipped (already exists): ${city.sectionKey}`);
        }
    }

    // Update Chicago separately to add imageUrl/ctaUrl without overwriting New York's admin image
    const chicagoUpdate = await pool.query(
        `UPDATE ${TABLE_NAME}
         SET image_url = $1,
             cta_url   = $2,
             sort_order = 30,
             updated_at = NOW()
         WHERE page_key = 'home' AND section_key = 'city-chicago'
           AND (image_url IS NULL OR image_url = '')
         RETURNING id`,
        [
            'https://mediahost.app/api/media/serve/724f5fd545aa4192d0a7daeb6702cd4b?w=1200&h=800&fit=fill&q=80',
            'https://view.citydiscoverer.ai/guide/guide-1773624777197-m7ubf4xfb',
        ]
    );
    if (chicagoUpdate.rows.length > 0) {
        console.log('  Updated Chicago imageUrl and ctaUrl');
    } else {
        console.log('  Chicago already has an image — skipped update');
    }

    // Verify what's in the DB now
    const verify = await pool.query(
        `SELECT section_key, title, image_url, cta_url
         FROM ${TABLE_NAME}
         WHERE page_key = 'home'
         ORDER BY sort_order ASC`
    );

    console.log('\nHome page sections now in DB:');
    verify.rows.forEach((r) => {
        const hasImg = r.image_url ? '✓ img' : '  no img';
        console.log(`  ${hasImg}  ${r.section_key}: ${r.title}`);
    });

    await pool.end();
    console.log('\nDone.');
}

run().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
