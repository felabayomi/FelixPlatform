const pool = require('../db');
const { sendSupportRequestNotification } = require('../services/resendEmail');

const APP_NAME = 'Wildlife-Pedia';
const STOREFRONT_KEY = 'wildlife-pedia';
const SITE_CONTENT_KEY = 'wildlife_pedia_site_content';

let ensurePlatformContentTablePromise = null;
let ensureSupportRequestsTablePromise = null;
let ensureWildlifePediaTablesPromise = null;

const DEFAULT_SITE_CONTENT = {
    heroEyebrow: 'Nature intelligence for everyday people',
    heroTitle: 'Wildlife-Pedia turns curiosity into coexistence.',
    heroText:
        'Explore species profiles, habitat guides, warning signs, and action pathways that help people understand wildlife and protect it with the A & F Wildlife Foundation.',
    heroPrimaryLabel: 'Explore Species',
    heroPrimaryLink: '/species',
    heroSecondaryLabel: 'Report a Sighting',
    heroSecondaryLink: '/report',
    supportEmail: 'hello@afwildlifefoundation.org',
    footerTitle: 'Wildlife-Pedia',
    footerText:
        'A modern public knowledge hub for species discovery, safer human–wildlife coexistence, and conservation participation.',
    footerSubtext:
        'Built on the Felix Platform and connected to A & F Wildlife Foundation action.',
};

const DEFAULT_SPECIES = [
    {
        id: 'african-elephant',
        slug: 'african-elephant',
        name: 'African Elephant',
        scientificName: 'Loxodonta africana',
        summary:
            'Africa’s largest land mammal, essential for shaping ecosystems through movement, feeding, and seed dispersal.',
        body:
            'African elephants are ecosystem engineers. By opening paths through vegetation, digging for water, and dispersing seeds across wide distances, they help maintain the health of savannas and forests. Yet they are increasingly pressured by habitat fragmentation, shrinking migration corridors, and conflict near farms and settlements.\n\nWildlife-Pedia promotes practical coexistence by helping communities and visitors understand elephant behavior, avoid risky encounters, and support long-term corridor protection. Safe distances, calm observation, and respect for movement routes are all essential parts of responsible human–elephant coexistence.',
        habitat: 'Savannas, forests, and river corridors',
        rangeText: 'Sub-Saharan Africa',
        diet: 'Herbivore',
        conservationStatus: 'Endangered',
        riskLevel: 'High near farms and migration routes',
        coexistenceTips:
            'Give elephants wide space, never block movement paths, and avoid approaching calves or herds near water sources.',
        image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        sortOrder: 1,
    },
    {
        id: 'black-rhinoceros',
        slug: 'black-rhinoceros',
        name: 'Black Rhinoceros',
        scientificName: 'Diceros bicornis',
        summary:
            'A browsing giant whose survival depends on anti-poaching protection, habitat security, and long-term recovery work.',
        body:
            'Black rhinos once ranged widely across much of sub-Saharan Africa, but poaching and habitat pressure caused devastating declines. Recovery efforts now depend on close monitoring, well-protected reserves, translocation programs, and sustained public support for conservation teams on the ground.\n\nWildlife-Pedia uses the black rhino to show that conservation is often quiet, difficult, and long-term. Protecting iconic species requires patience, resources, and a public that understands why that work matters.',
        habitat: 'Dry bushland, savanna, and thorn scrub',
        rangeText: 'Eastern and Southern Africa',
        diet: 'Herbivore',
        conservationStatus: 'Critically Endangered',
        riskLevel: 'Moderate in protected landscapes',
        coexistenceTips:
            'Stay inside designated routes in rhino areas, never approach on foot, and report suspicious activity near protected zones.',
        image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        sortOrder: 2,
    },
    {
        id: 'african-lion',
        slug: 'african-lion',
        name: 'African Lion',
        scientificName: 'Panthera leo',
        summary:
            'An apex predator whose survival depends on healthy prey populations, connected landscapes, and reduced retaliatory killing.',
        body:
            'Lions are powerful social carnivores that play a vital role in ecological balance. They are also one of the species most affected by human–wildlife conflict, especially where livestock and predators share the same landscape.\n\nConservation solutions increasingly focus on predator-safe livestock enclosures, early warning systems, community partnerships, and incentives that make coexistence more viable. Wildlife-Pedia highlights both the ecological importance of lions and the practical safety steps needed when people live close to carnivores.',
        habitat: 'Savannas, grasslands, and open woodland',
        rangeText: 'East, West, Central, and Southern Africa',
        diet: 'Carnivore',
        conservationStatus: 'Vulnerable',
        riskLevel: 'High in livestock interfaces',
        coexistenceTips:
            'Avoid night movement in active predator areas, secure livestock, and report repeated sightings through local wildlife channels.',
        image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        sortOrder: 3,
    },
    {
        id: 'pangolin',
        slug: 'pangolin',
        name: 'Ground Pangolin',
        scientificName: 'Smutsia temminckii',
        summary:
            'A shy, heavily trafficked insect-eater whose protection depends on awareness, reporting, and habitat security.',
        body:
            'Pangolins are among the most distinctive and threatened mammals in the world. Their protective scales and elusive behavior make them remarkable, but illegal trafficking has pushed many populations into decline.\n\nFor Wildlife-Pedia, pangolins represent a core educational priority: helping people recognize a species that is often unseen but deeply at risk. The platform encourages safe reporting, anti-trafficking awareness, and community-level responsibility in habitats where pangolins still survive.',
        habitat: 'Woodland, scrubland, and mixed savanna',
        rangeText: 'Southern and East Africa',
        diet: 'Insectivore',
        conservationStatus: 'Vulnerable',
        riskLevel: 'Moderate',
        coexistenceTips:
            'Do not handle or relocate pangolins yourself. Report sightings or suspected trafficking to trained wildlife authorities immediately.',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        sortOrder: 4,
    },
    {
        id: 'african-wild-dog',
        slug: 'african-wild-dog',
        name: 'African Wild Dog',
        scientificName: 'Lycaon pictus',
        summary:
            'One of Africa’s most effective hunters, dependent on wide connected ranges and tolerance in shared landscapes.',
        body:
            'African wild dogs are highly social, intelligent hunters that need large territories and healthy prey systems to survive. Their packs can cover huge distances, which makes habitat fragmentation and road pressure especially damaging.\n\nBecause they often move through mixed-use land, their future also depends on public understanding. Wildlife-Pedia highlights wild dogs as an example of how conservation is tied to land planning, coexistence, and community awareness.',
        habitat: 'Savannas, open woodland, and mixed rangelands',
        rangeText: 'Eastern and Southern Africa',
        diet: 'Carnivore',
        conservationStatus: 'Endangered',
        riskLevel: 'Moderate near livestock zones',
        coexistenceTips:
            'Never bait or follow packs closely, report den areas responsibly, and support predator-aware livestock practices.',
        image: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        sortOrder: 5,
    },
    {
        id: 'cheetah',
        slug: 'cheetah',
        name: 'Cheetah',
        scientificName: 'Acinonyx jubatus',
        summary:
            'A fast-moving predator whose future relies on open habitat, prey access, and lower conflict pressure.',
        body:
            'Cheetahs need room to move, hunt, and avoid stronger competitors. They are especially vulnerable to habitat fragmentation, fencing, and conflict in farming landscapes where prey patterns have changed.\n\nWildlife-Pedia uses the cheetah to illustrate why speed and beauty alone do not secure a species. Long-term survival depends on connected landscapes, tolerant communities, and informed coexistence strategies.',
        habitat: 'Open savannas, grasslands, and semi-arid plains',
        rangeText: 'Southern and Eastern Africa',
        diet: 'Carnivore',
        conservationStatus: 'Vulnerable',
        riskLevel: 'Moderate',
        coexistenceTips:
            'Observe from a distance, avoid crowding with vehicles, and support efforts that reduce conflict in shared rangelands.',
        image: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        sortOrder: 6,
    },
    {
        id: 'hippopotamus',
        slug: 'hippopotamus',
        name: 'Hippopotamus',
        scientificName: 'Hippopotamus amphibius',
        summary:
            'A semi-aquatic giant that is often underestimated despite being one of the most dangerous animals in close encounters.',
        body:
            'Hippos are central to river and wetland systems, yet they are involved in many dangerous encounters because people often misread their behavior. They are highly territorial in water and can move surprisingly quickly on land.\n\nWildlife-Pedia uses species profiles like this to bridge the gap between admiration and safety. Understanding approach distance, active times, and river-edge caution can help prevent avoidable incidents for fishers, farmers, and visitors.',
        habitat: 'Rivers, lakes, wetlands, and floodplains',
        rangeText: 'Sub-Saharan Africa',
        diet: 'Herbivore',
        conservationStatus: 'Vulnerable',
        riskLevel: 'High near waterways',
        coexistenceTips:
            'Keep distance from riverbanks at dawn and dusk, avoid getting between hippos and water, and never approach pods by boat.',
        image: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        sortOrder: 7,
    },
    {
        id: 'nile-crocodile',
        slug: 'nile-crocodile',
        name: 'Nile Crocodile',
        scientificName: 'Crocodylus niloticus',
        summary:
            'A formidable river predator that demands careful public awareness anywhere people regularly use shared water access points.',
        body:
            'Nile crocodiles are one of Africa’s most recognizable aquatic predators, but they are also involved in some of the continent’s most serious wildlife-safety incidents. Risk often increases where water access, fishing, livestock, and poor visibility come together.\n\nWildlife-Pedia includes crocodile profiles to make one point clear: coexistence begins with behavior change. Safer water routines, local reporting, and respect for known hotspots can prevent avoidable harm.',
        habitat: 'Rivers, lakes, marshes, and estuaries',
        rangeText: 'Across much of sub-Saharan Africa',
        diet: 'Carnivore',
        conservationStatus: 'Least Concern',
        riskLevel: 'High at shared water access points',
        coexistenceTips:
            'Avoid water edges at dawn or dusk, use known safe access points, and never clean fish or livestock remains at busy riverbanks.',
        image: 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        sortOrder: 8,
    },
    {
        id: 'mountain-gorilla',
        slug: 'mountain-gorilla',
        name: 'Mountain Gorilla',
        scientificName: 'Gorilla beringei beringei',
        summary:
            'A conservation success story that still depends on strict protection, careful tourism, and disease prevention.',
        body:
            'Mountain gorillas show that recovery is possible when protection, habitat stewardship, veterinary support, and community partnership come together. But they remain highly vulnerable to habitat pressure and disease transmission from people.\n\nFor Wildlife-Pedia, gorillas represent the hopeful side of conservation: evidence that long-term commitment can work. They also remind us that responsible tourism and respectful distance are part of conservation too.',
        habitat: 'Montane forests and volcanic highlands',
        rangeText: 'Rwanda, Uganda, and the DRC',
        diet: 'Herbivore',
        conservationStatus: 'Endangered',
        riskLevel: 'Low with guided access, sensitive to disease',
        coexistenceTips:
            'Follow guide instructions closely, keep health precautions in place, and never approach gorillas without authorized supervision.',
        image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        sortOrder: 9,
    },
    {
        id: 'grey-crowned-crane',
        slug: 'grey-crowned-crane',
        name: 'Grey Crowned Crane',
        scientificName: 'Balearica regulorum',
        summary:
            'A striking wetland bird whose presence reflects the health of marshes, floodplains, and shared agricultural landscapes.',
        body:
            'The grey crowned crane is one of Africa’s most iconic birds, but it depends on wetlands that are increasingly under pressure from drainage, pollution, and disturbance. These cranes also show how wildlife conservation is not only about large mammals — it is equally about protecting the quieter systems that support biodiversity.\n\nWildlife-Pedia highlights species like the grey crowned crane to broaden public understanding of conservation and encourage habitat protection in everyday landscapes.',
        habitat: 'Wetlands, marshes, and farmland edges',
        rangeText: 'East and Southern Africa',
        diet: 'Omnivore',
        conservationStatus: 'Endangered',
        riskLevel: 'Low',
        coexistenceTips:
            'Protect nesting areas, reduce disturbance in wetlands, and report illegal capture or egg collection.',
        image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        sortOrder: 10,
    },
];

const DEFAULT_HABITATS = [
    {
        id: 'savannas-grasslands',
        slug: 'savannas-grasslands',
        title: 'Savannas & Grasslands',
        summary:
            'Open systems where migratory herbivores, predators, and pastoral communities often interact most directly.',
        body:
            'Savannas are among Africa’s most recognizable ecosystems. They support elephants, lions, antelope, vultures, and countless smaller species, while also sustaining grazing livelihoods and transport routes. Because these landscapes are so shared, they are also places where conflict prevention matters most.\n\nWildlife-Pedia helps users understand how wildlife movement, farming pressure, and settlement growth intersect in savannas — and what practical coexistence solutions can look like on the ground.',
        humanInteraction: 'Farming, grazing, road crossings, settlement expansion',
        region: 'East and Southern Africa',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        sortOrder: 1,
    },
    {
        id: 'wetlands-rivers',
        slug: 'wetlands-rivers',
        title: 'Wetlands & Rivers',
        summary:
            'High-biodiversity water systems where safety, access, and conservation often depend on careful human behavior.',
        body:
            'Wetlands, river systems, and floodplains support hippos, crocodiles, fish, waterbirds, and the people who rely on these waters every day. But these same spaces can become danger zones when wildlife pressure, poor visibility, and human activity overlap.\n\nThis habitat page explains both the richness of aquatic systems and the practical guidance needed for safer coexistence around waterways.',
        humanInteraction: 'Fishing, water access, transport, farming on floodplains',
        region: 'Across sub-Saharan Africa',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        sortOrder: 2,
    },
    {
        id: 'forest-edges',
        slug: 'forest-edges',
        title: 'Forests & Edge Zones',
        summary:
            'Transition areas where biodiversity remains high and human pressure can quickly reshape wildlife behavior.',
        body:
            'Forest-edge systems are often hotspots for biodiversity, but also for encroachment, fuelwood use, and crop raiding. These are the places where awareness, reporting, and local stewardship can make a measurable difference.\n\nWildlife-Pedia treats forest edges not just as scenic spaces, but as working landscapes that require both ecological knowledge and practical human planning.',
        humanInteraction: 'Settlement growth, fuelwood collection, agriculture, ecotourism',
        region: 'Central, East, and West Africa',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        sortOrder: 3,
    },
];

const DEFAULT_PROJECTS = [
    {
        id: 'coexistence-education',
        slug: 'coexistence-education',
        title: 'Coexistence education',
        summary:
            'Practical guides, school tools, and public awareness that turn wildlife curiosity into safer decisions.',
        body:
            'Through the A & F Wildlife Foundation, Wildlife-Pedia supports public-facing conservation education that helps people understand risk, behavior, and everyday coexistence. This includes school materials, awareness campaigns, and community storytelling that make wildlife knowledge easier to use.',
        status: 'Active',
        ctaLabel: 'Join the education effort',
        ctaLink: '/get-involved',
        image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        sortOrder: 1,
    },
    {
        id: 'sightings-community-reporting',
        slug: 'sightings-community-reporting',
        title: 'Community sightings reporting',
        summary:
            'Building a shared culture of safe reporting, local observation, and better wildlife awareness.',
        body:
            'Wildlife-Pedia is designed to support sighting reports that can help identify patterns, hotspots, and recurring safety concerns. Even in the MVP stage, this creates a practical bridge between knowledge and action.',
        status: 'Growing',
        ctaLabel: 'Report a sighting',
        ctaLink: '/report',
        image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        sortOrder: 2,
    },
    {
        id: 'predator-safe-livestock',
        slug: 'predator-safe-livestock',
        title: 'Predator-safe livestock enclosures',
        summary:
            'Reducing retaliatory killing by helping communities protect livestock more effectively at night.',
        body:
            'One of the most practical ways to reduce conflict with lions, hyenas, and other predators is to make livestock protection stronger, cheaper, and easier to maintain. This project focuses on awareness, local design solutions, and public support for prevention-first coexistence tools.',
        status: 'Active',
        ctaLabel: 'Back coexistence tools',
        ctaLink: '/get-involved',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        sortOrder: 3,
    },
    {
        id: 'species-adoption-drive',
        slug: 'species-adoption-drive',
        title: 'Species adoption support',
        summary:
            'A fundraising pathway that connects public support to visible, species-centered conservation action.',
        body:
            'Species adoption gives supporters a direct way to back conservation awareness and field-linked impact through the A & F Wildlife Foundation. It is designed to turn passive support into ongoing commitment.',
        status: 'Open for support',
        ctaLabel: 'Support a species',
        ctaLink: '/get-involved',
        image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        sortOrder: 4,
    },
    {
        id: 'youth-ranger-clubs',
        slug: 'youth-ranger-clubs',
        title: 'Youth ranger clubs',
        summary:
            'Helping schools and young leaders turn wildlife interest into stewardship, reporting, and local conservation pride.',
        body:
            'Wildlife literacy grows faster when students can connect classroom learning to real animals, real habitats, and real community responsibility. Youth ranger clubs are designed to support that bridge through projects, storytelling, and public-awareness activities.',
        status: 'Launching',
        ctaLabel: 'Partner with a school',
        ctaLink: '/get-involved',
        image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        sortOrder: 5,
    },
    {
        id: 'wetland-guardians',
        slug: 'wetland-guardians',
        title: 'Wetland guardians initiative',
        summary:
            'Protecting high-value wetland spaces through awareness, safer access habits, and habitat advocacy.',
        body:
            'Wetlands are biodiversity engines and community lifelines at the same time. This project focuses on helping people understand why wetland protection supports birds, fisheries, water safety, and broader ecosystem health all at once.',
        status: 'Growing',
        ctaLabel: 'Support wetland protection',
        ctaLink: '/projects',
        image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        sortOrder: 6,
    },
];

const DEFAULT_POSTS = [
    {
        id: 'why-conflict-prevention-starts-with-knowledge',
        slug: 'why-conflict-prevention-starts-with-knowledge',
        title: 'Why conflict prevention starts with knowledge',
        excerpt:
            'Better wildlife outcomes often begin with better public understanding of behavior, habitat use, and warning signs.',
        body:
            'Human–wildlife conflict is rarely caused by a single moment. It usually emerges from patterns: shrinking space, poor information, repeated risky encounters, and systems that are under pressure. Wildlife-Pedia exists to close part of that gap by making wildlife knowledge more accessible, practical, and usable in everyday contexts.',
        category: 'Coexistence',
        image: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        publishedAt: '2026-04-10',
        sortOrder: 1,
    },
    {
        id: 'read-warning-signs-before-conflict-escalates',
        slug: 'read-warning-signs-before-conflict-escalates',
        title: 'How to read warning signs before conflict escalates',
        excerpt:
            'Many dangerous encounters begin with missed cues — movement changes, defensive posture, noise, or blocked routes.',
        body:
            'Wildlife does not usually become dangerous without context. Stress, surprise, crowding, and blocked movement all matter. Learning to notice warning behavior early gives people more time to step back, stay calm, and avoid escalating an encounter unnecessarily.',
        category: 'Safety',
        image: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        publishedAt: '2026-04-09',
        sortOrder: 2,
    },
    {
        id: 'why-vultures-still-matter',
        slug: 'why-vultures-still-matter',
        title: 'Why vultures still matter more than most people realize',
        excerpt:
            'These overlooked birds are public-health allies, ecosystem cleaners, and a critical part of wildlife resilience.',
        body:
            'Vultures are often misunderstood, but they perform one of the most important cleanup roles in nature. When vulture populations drop, the effects reach far beyond the birds themselves. Wildlife-Pedia uses stories like this to show that conservation is about systems, not only the most famous animals.',
        category: 'Biodiversity',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        publishedAt: '2026-04-08',
        sortOrder: 3,
    },
    {
        id: 'what-makes-a-good-sighting-report',
        slug: 'what-makes-a-good-sighting-report',
        title: 'What makes a good wildlife sighting report?',
        excerpt:
            'Clear, calm, and location-aware reports are more useful for both safety awareness and conservation response.',
        body:
            'A strong sighting report includes time, approximate location, observed behavior, and any immediate concerns. The goal is not drama — it is useful, actionable information that can support safety and learning.',
        category: 'Reporting',
        image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        publishedAt: '2026-04-07',
        sortOrder: 4,
    },
    {
        id: 'how-schools-can-teach-coexistence',
        slug: 'how-schools-can-teach-coexistence',
        title: 'How schools can teach wildlife coexistence early',
        excerpt:
            'Conservation literacy works best when young people can connect local wildlife to everyday responsibility.',
        body:
            'Schools are one of the most effective places to build long-term wildlife awareness. When students learn how animals behave, why habitats matter, and how reporting works, that knowledge often travels home into families and communities too.',
        category: 'Education',
        image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        publishedAt: '2026-04-06',
        sortOrder: 5,
    },
    {
        id: 'wetlands-are-safety-zones-too',
        slug: 'wetlands-are-safety-zones-too',
        title: 'Wetlands are safety zones too',
        excerpt:
            'Protecting wetlands supports biodiversity, but it also reduces avoidable risk where people and wildlife meet daily.',
        body:
            'Wetland conservation is not just about birds and water quality. It is also about making shared landscapes safer, more predictable, and more resilient for the communities who depend on them.',
        category: 'Habitats',
        image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        publishedAt: '2026-04-05',
        sortOrder: 6,
    },
    {
        id: 'crocodile-sightings-are-public-safety-signals',
        slug: 'crocodile-sightings-are-public-safety-signals',
        title: 'When a crocodile sighting is a public safety signal',
        excerpt:
            'Some sightings are not just interesting — they are early warnings that a shared water edge may be becoming more risky.',
        body:
            'Wildlife sightings help communities notice patterns. Repeated crocodile reports near the same access point, school route, or fishing area can indicate a growing safety issue. That is why calm, accurate reporting is one of the most practical conservation and safety tools available.',
        category: 'Safety',
        image: 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?auto=format&fit=crop&w=1200&q=80',
        featured: false,
        publishedAt: '2026-04-04',
        sortOrder: 7,
    },
];

const toNullableText = (value) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const normalized = String(value).trim();
    return normalized || null;
};

const toText = (value, fallback = '') => toNullableText(value) || fallback;

const toBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const toSortOrder = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toSlug = (value, fallback = 'item') => {
    const normalized = String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalized || fallback;
};

const normalizeSpecies = (item = {}, index = 0) => ({
    id: toText(item.id, `species-${index + 1}`),
    slug: toSlug(item.slug || item.name || item.title, `species-${index + 1}`),
    name: toText(item.name || item.title, `Species ${index + 1}`),
    scientificName: toText(item.scientific_name || item.scientificName, ''),
    summary: toText(item.summary || item.excerpt, ''),
    body: toText(item.body || item.description || item.summary, ''),
    habitat: toText(item.habitat, ''),
    rangeText: toText(item.range_text || item.rangeText, ''),
    diet: toText(item.diet, ''),
    conservationStatus: toText(item.conservation_status || item.conservationStatus, ''),
    riskLevel: toText(item.risk_level || item.riskLevel, ''),
    coexistenceTips: toText(item.coexistence_tips || item.coexistenceTips, ''),
    image: toText(item.image, ''),
    featured: toBoolean(item.featured, false),
    sortOrder: toSortOrder(item.sort_order || item.sortOrder, index),
});

const normalizeHabitat = (item = {}, index = 0) => ({
    id: toText(item.id, `habitat-${index + 1}`),
    slug: toSlug(item.slug || item.title, `habitat-${index + 1}`),
    title: toText(item.title, `Habitat ${index + 1}`),
    summary: toText(item.summary, ''),
    body: toText(item.body || item.description || item.summary, ''),
    humanInteraction: toText(item.human_interaction || item.humanInteraction, ''),
    region: toText(item.region, ''),
    image: toText(item.image, ''),
    featured: toBoolean(item.featured, false),
    sortOrder: toSortOrder(item.sort_order || item.sortOrder, index),
});

const normalizeProject = (item = {}, index = 0) => ({
    id: toText(item.id, `project-${index + 1}`),
    slug: toSlug(item.slug || item.title, `project-${index + 1}`),
    title: toText(item.title, `Project ${index + 1}`),
    summary: toText(item.summary, ''),
    body: toText(item.body || item.description || item.summary, ''),
    status: toText(item.status, 'Active'),
    ctaLabel: toText(item.cta_label || item.ctaLabel, 'Learn more'),
    ctaLink: toText(item.cta_link || item.ctaLink, '/get-involved'),
    image: toText(item.image, ''),
    featured: toBoolean(item.featured, false),
    sortOrder: toSortOrder(item.sort_order || item.sortOrder, index),
});

const normalizePost = (item = {}, index = 0) => ({
    id: toText(item.id, `post-${index + 1}`),
    slug: toSlug(item.slug || item.title, `post-${index + 1}`),
    title: toText(item.title, `Post ${index + 1}`),
    excerpt: toText(item.excerpt || item.summary, ''),
    body: toText(item.body || item.description || item.excerpt, ''),
    category: toText(item.category, 'Insights'),
    image: toText(item.image, ''),
    featured: toBoolean(item.featured, false),
    publishedAt: toText(item.published_at || item.publishedAt, ''),
    sortOrder: toSortOrder(item.sort_order || item.sortOrder, index),
});

const seedRecordsBySlug = async (tableName, columns, rows) => {
    for (const row of rows) {
        const placeholders = row.map((_value, index) => `$${index + 1}`).join(', ');
        await pool.query(
            `INSERT INTO ${tableName} (${columns.join(', ')})
             VALUES (${placeholders})
             ON CONFLICT (slug) DO NOTHING`,
            row,
        );
    }
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

const ensureWildlifePediaTables = async () => {
    if (!ensureWildlifePediaTablesPromise) {
        ensureWildlifePediaTablesPromise = (async () => {
            await ensurePlatformContentTable();
            await ensureSupportRequestsTable();

            await pool.query(`
                CREATE TABLE IF NOT EXISTS wildlife_pedia_species (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    slug TEXT UNIQUE,
                    name TEXT NOT NULL,
                    scientific_name TEXT,
                    summary TEXT,
                    body TEXT,
                    habitat TEXT,
                    range_text TEXT,
                    diet TEXT,
                    conservation_status TEXT,
                    risk_level TEXT,
                    coexistence_tips TEXT,
                    image TEXT,
                    featured BOOLEAN NOT NULL DEFAULT FALSE,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS wildlife_pedia_habitats (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    slug TEXT UNIQUE,
                    title TEXT NOT NULL,
                    summary TEXT,
                    body TEXT,
                    human_interaction TEXT,
                    region TEXT,
                    image TEXT,
                    featured BOOLEAN NOT NULL DEFAULT FALSE,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS wildlife_pedia_projects (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    slug TEXT UNIQUE,
                    title TEXT NOT NULL,
                    summary TEXT,
                    body TEXT,
                    status TEXT,
                    cta_label TEXT,
                    cta_link TEXT,
                    image TEXT,
                    featured BOOLEAN NOT NULL DEFAULT FALSE,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS wildlife_pedia_posts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    slug TEXT UNIQUE,
                    title TEXT NOT NULL,
                    excerpt TEXT,
                    body TEXT,
                    category TEXT,
                    image TEXT,
                    featured BOOLEAN NOT NULL DEFAULT FALSE,
                    published_at TEXT,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS wildlife_pedia_sightings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    reporter_name TEXT,
                    reporter_email TEXT,
                    species_guess TEXT,
                    location_text TEXT NOT NULL,
                    notes TEXT,
                    image_url TEXT,
                    status TEXT NOT NULL DEFAULT 'new',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS wildlife_pedia_newsletter_subscribers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    full_name TEXT,
                    email TEXT NOT NULL,
                    source TEXT,
                    interests JSONB NOT NULL DEFAULT '[]'::jsonb,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS wildlife_pedia_newsletter_email_idx
                ON wildlife_pedia_newsletter_subscribers (LOWER(email))
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS wildlife_pedia_volunteers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT,
                    interests TEXT,
                    source TEXT,
                    notes TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS wildlife_pedia_donors (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    amount_text TEXT,
                    support_type TEXT,
                    source TEXT,
                    notes TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await seedRecordsBySlug(
                'wildlife_pedia_species',
                ['slug', 'name', 'scientific_name', 'summary', 'body', 'habitat', 'range_text', 'diet', 'conservation_status', 'risk_level', 'coexistence_tips', 'image', 'featured', 'sort_order'],
                DEFAULT_SPECIES.map((item) => [
                    item.slug,
                    item.name,
                    item.scientificName,
                    item.summary,
                    item.body,
                    item.habitat,
                    item.rangeText,
                    item.diet,
                    item.conservationStatus,
                    item.riskLevel,
                    item.coexistenceTips,
                    item.image,
                    item.featured,
                    item.sortOrder,
                ]),
            );

            await seedRecordsBySlug(
                'wildlife_pedia_habitats',
                ['slug', 'title', 'summary', 'body', 'human_interaction', 'region', 'image', 'featured', 'sort_order'],
                DEFAULT_HABITATS.map((item) => [
                    item.slug,
                    item.title,
                    item.summary,
                    item.body,
                    item.humanInteraction,
                    item.region,
                    item.image,
                    item.featured,
                    item.sortOrder,
                ]),
            );

            await seedRecordsBySlug(
                'wildlife_pedia_projects',
                ['slug', 'title', 'summary', 'body', 'status', 'cta_label', 'cta_link', 'image', 'featured', 'sort_order'],
                DEFAULT_PROJECTS.map((item) => [
                    item.slug,
                    item.title,
                    item.summary,
                    item.body,
                    item.status,
                    item.ctaLabel,
                    item.ctaLink,
                    item.image,
                    item.featured,
                    item.sortOrder,
                ]),
            );

            await seedRecordsBySlug(
                'wildlife_pedia_posts',
                ['slug', 'title', 'excerpt', 'body', 'category', 'image', 'featured', 'published_at', 'sort_order'],
                DEFAULT_POSTS.map((item) => [
                    item.slug,
                    item.title,
                    item.excerpt,
                    item.body,
                    item.category,
                    item.image,
                    item.featured,
                    item.publishedAt,
                    item.sortOrder,
                ]),
            );
        })().catch((error) => {
            ensureWildlifePediaTablesPromise = null;
            throw error;
        });
    }

    await ensureWildlifePediaTablesPromise;
};

const createSupportRequest = async ({ contactName, contactEmail, contactPhone, subject, message }) => {
    await ensureSupportRequestsTable();

    const result = await pool.query(
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
        [APP_NAME, STOREFRONT_KEY, contactName, contactEmail, contactPhone, subject, message],
    );

    return result.rows[0];
};

const readSiteContent = async () => {
    await ensurePlatformContentTable();

    try {
        const result = await pool.query(
            'SELECT content FROM platform_content WHERE content_key = $1 LIMIT 1',
            [SITE_CONTENT_KEY],
        );

        return {
            ...DEFAULT_SITE_CONTENT,
            ...(result.rows[0]?.content || {}),
        };
    } catch (error) {
        console.warn('Unable to load Wildlife-Pedia site content, falling back to defaults.', error.message || error);
        return { ...DEFAULT_SITE_CONTENT };
    }
};

const readSpecies = async () => {
    await ensureWildlifePediaTables();

    try {
        const result = await pool.query(`
            SELECT *
            FROM wildlife_pedia_species
            ORDER BY featured DESC, sort_order ASC, created_at DESC
        `);

        return result.rows.length
            ? result.rows.map((item, index) => normalizeSpecies(item, index))
            : DEFAULT_SPECIES.map((item, index) => normalizeSpecies(item, index));
    } catch (error) {
        console.warn('Unable to load Wildlife-Pedia species, falling back to defaults.', error.message || error);
        return DEFAULT_SPECIES.map((item, index) => normalizeSpecies(item, index));
    }
};

const readHabitats = async () => {
    await ensureWildlifePediaTables();

    try {
        const result = await pool.query(`
            SELECT *
            FROM wildlife_pedia_habitats
            ORDER BY featured DESC, sort_order ASC, created_at DESC
        `);

        return result.rows.length
            ? result.rows.map((item, index) => normalizeHabitat(item, index))
            : DEFAULT_HABITATS.map((item, index) => normalizeHabitat(item, index));
    } catch (error) {
        console.warn('Unable to load Wildlife-Pedia habitats, falling back to defaults.', error.message || error);
        return DEFAULT_HABITATS.map((item, index) => normalizeHabitat(item, index));
    }
};

const readProjects = async () => {
    await ensureWildlifePediaTables();

    try {
        const result = await pool.query(`
            SELECT *
            FROM wildlife_pedia_projects
            ORDER BY featured DESC, sort_order ASC, created_at DESC
        `);

        return result.rows.length
            ? result.rows.map((item, index) => normalizeProject(item, index))
            : DEFAULT_PROJECTS.map((item, index) => normalizeProject(item, index));
    } catch (error) {
        console.warn('Unable to load Wildlife-Pedia projects, falling back to defaults.', error.message || error);
        return DEFAULT_PROJECTS.map((item, index) => normalizeProject(item, index));
    }
};

const readPosts = async () => {
    await ensureWildlifePediaTables();

    try {
        const result = await pool.query(`
            SELECT *
            FROM wildlife_pedia_posts
            ORDER BY featured DESC, sort_order ASC, created_at DESC
        `);

        return result.rows.length
            ? result.rows.map((item, index) => normalizePost(item, index))
            : DEFAULT_POSTS.map((item, index) => normalizePost(item, index));
    } catch (error) {
        console.warn('Unable to load Wildlife-Pedia posts, falling back to defaults.', error.message || error);
        return DEFAULT_POSTS.map((item, index) => normalizePost(item, index));
    }
};

const readSimpleRows = async (tableName) => {
    await ensureWildlifePediaTables();
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
    return result.rows;
};

exports.getSiteContent = async (_req, res) => {
    res.json({ content: await readSiteContent() });
};

exports.getSpecies = async (req, res) => {
    const q = toText(req.query.q).toLowerCase();
    const habitat = toText(req.query.habitat).toLowerCase();
    const featuredOnly = toBoolean(req.query.featured, false);

    let items = await readSpecies();

    if (featuredOnly) {
        items = items.filter((item) => item.featured);
    }

    if (q) {
        items = items.filter((item) => (
            `${item.name} ${item.scientificName} ${item.summary} ${item.habitat} ${item.conservationStatus}`
                .toLowerCase()
                .includes(q)
        ));
    }

    if (habitat) {
        items = items.filter((item) => item.habitat.toLowerCase().includes(habitat));
    }

    return res.json({ items });
};

exports.getSpeciesBySlug = async (req, res) => {
    const requestedId = toText(req.params.slug).toLowerCase();
    const items = await readSpecies();
    const item = items.find((entry) => entry.slug.toLowerCase() === requestedId || entry.id.toLowerCase() === requestedId);

    if (!item) {
        return res.status(404).json({ message: 'Species profile not found.' });
    }

    return res.json({ item });
};

exports.getHabitats = async (_req, res) => {
    res.json({ items: await readHabitats() });
};

exports.getProjects = async (_req, res) => {
    res.json({ items: await readProjects() });
};

exports.getPosts = async (_req, res) => {
    res.json({ items: await readPosts() });
};

exports.subscribeNewsletter = async (req, res) => {
    const email = toNullableText(req.body.email);
    const fullName = toNullableText(req.body.full_name || req.body.name);
    const source = toNullableText(req.body.source) || 'website';
    const interests = Array.isArray(req.body.interests) ? req.body.interests : [];

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        await ensureWildlifePediaTables();

        const existingResult = await pool.query(
            'SELECT * FROM wildlife_pedia_newsletter_subscribers WHERE LOWER(email) = LOWER($1) LIMIT 1',
            [email],
        );

        let subscriber;
        let alreadySubscribed = false;

        if (existingResult.rows.length) {
            alreadySubscribed = true;
            const updateResult = await pool.query(
                `UPDATE wildlife_pedia_newsletter_subscribers
                 SET full_name = COALESCE($1, full_name),
                     source = COALESCE($2, source),
                     interests = CASE WHEN $3::jsonb = '[]'::jsonb THEN interests ELSE $3::jsonb END,
                     updated_at = NOW()
                 WHERE id = $4
                 RETURNING *`,
                [fullName, source, JSON.stringify(interests), existingResult.rows[0].id],
            );
            subscriber = updateResult.rows[0];
        } else {
            const insertResult = await pool.query(
                `INSERT INTO wildlife_pedia_newsletter_subscribers (
                    full_name,
                    email,
                    source,
                    interests
                ) VALUES ($1,$2,$3,$4::jsonb)
                RETURNING *`,
                [fullName, email, source, JSON.stringify(interests)],
            );
            subscriber = insertResult.rows[0];
        }

        return res.status(alreadySubscribed ? 200 : 201).json({
            subscribed: true,
            alreadySubscribed,
            subscriber,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to subscribe to Wildlife-Pedia updates.' });
    }
};

exports.submitVolunteer = async (req, res) => {
    const fullName = toNullableText(req.body.name || req.body.full_name);
    const email = toNullableText(req.body.email);
    const phone = toNullableText(req.body.phone);
    const interests = toNullableText(req.body.interests || req.body.area_of_interest || req.body.interest);
    const notes = toNullableText(req.body.notes || req.body.message);
    const source = toNullableText(req.body.source) || 'website';

    if (!fullName || !email) {
        return res.status(400).json({ message: 'Name and email are required.' });
    }

    try {
        await ensureWildlifePediaTables();

        const recordResult = await pool.query(
            `INSERT INTO wildlife_pedia_volunteers (
                full_name,
                email,
                phone,
                interests,
                source,
                notes
            ) VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *`,
            [fullName, email, phone, interests, source, notes],
        );

        const message = [
            'Wildlife-Pedia volunteer enquiry',
            `Interests: ${interests || 'Not provided'}`,
            `Source: ${source}`,
            `Notes: ${notes || 'Not provided'}`,
        ].join('\n');

        const supportRequest = await createSupportRequest({
            contactName: fullName,
            contactEmail: email,
            contactPhone: phone,
            subject: 'Wildlife-Pedia volunteer enquiry',
            message,
        });

        await sendSupportRequestNotification({
            ...supportRequest,
            app_name: APP_NAME,
            storefront_key: STOREFRONT_KEY,
            contact_name: fullName,
            contact_email: email,
            contact_phone: phone,
            subject: 'Wildlife-Pedia volunteer enquiry',
            message,
        });

        return res.status(201).json({ submitted: true, record: recordResult.rows[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to submit volunteer interest.' });
    }
};

exports.submitDonor = async (req, res) => {
    const fullName = toNullableText(req.body.name || req.body.full_name);
    const email = toNullableText(req.body.email);
    const amount = toNullableText(req.body.amount || req.body.amount_text);
    const supportType = toNullableText(req.body.support_type || req.body.supportType) || 'Wildlife support';
    const source = toNullableText(req.body.source) || 'website';
    const notes = toNullableText(req.body.notes || req.body.message);

    if (!fullName || !email) {
        return res.status(400).json({ message: 'Name and email are required.' });
    }

    try {
        await ensureWildlifePediaTables();

        const recordResult = await pool.query(
            `INSERT INTO wildlife_pedia_donors (
                full_name,
                email,
                amount_text,
                support_type,
                source,
                notes
            ) VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *`,
            [fullName, email, amount, supportType, source, notes],
        );

        const message = [
            'Wildlife-Pedia donor enquiry',
            `Support type: ${supportType}`,
            amount ? `Amount: ${amount}` : null,
            `Source: ${source}`,
            `Notes: ${notes || 'Not provided'}`,
        ].filter(Boolean).join('\n');

        const supportRequest = await createSupportRequest({
            contactName: fullName,
            contactEmail: email,
            contactPhone: null,
            subject: 'Wildlife-Pedia donor enquiry',
            message,
        });

        await sendSupportRequestNotification({
            ...supportRequest,
            app_name: APP_NAME,
            storefront_key: STOREFRONT_KEY,
            contact_name: fullName,
            contact_email: email,
            subject: 'Wildlife-Pedia donor enquiry',
            message,
        });

        return res.status(201).json({ submitted: true, record: recordResult.rows[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to submit donor interest.' });
    }
};

exports.submitSightingReport = async (req, res) => {
    const reporterName = toNullableText(req.body.reporter_name || req.body.name);
    const reporterEmail = toNullableText(req.body.reporter_email || req.body.email);
    const speciesGuess = toNullableText(req.body.species_guess || req.body.species);
    const locationText = toNullableText(req.body.location_text || req.body.location);
    const notes = toNullableText(req.body.notes || req.body.message);
    const imageUrl = toNullableText(req.body.image_url || req.body.image);

    if (!locationText) {
        return res.status(400).json({ message: 'Location is required for a sighting report.' });
    }

    try {
        await ensureWildlifePediaTables();

        const result = await pool.query(
            `INSERT INTO wildlife_pedia_sightings (
                reporter_name,
                reporter_email,
                species_guess,
                location_text,
                notes,
                image_url
            ) VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *`,
            [reporterName, reporterEmail, speciesGuess, locationText, notes, imageUrl],
        );

        const message = [
            'New Wildlife-Pedia sighting report',
            speciesGuess ? `Species guess: ${speciesGuess}` : null,
            `Location: ${locationText}`,
            `Notes: ${notes || 'Not provided'}`,
            imageUrl ? `Image URL: ${imageUrl}` : null,
        ].filter(Boolean).join('\n');

        if (reporterEmail) {
            const supportRequest = await createSupportRequest({
                contactName: reporterName || 'Wildlife-Pedia reporter',
                contactEmail: reporterEmail,
                contactPhone: null,
                subject: 'Wildlife-Pedia sighting report',
                message,
            });

            await sendSupportRequestNotification({
                ...supportRequest,
                app_name: APP_NAME,
                storefront_key: STOREFRONT_KEY,
                contact_name: reporterName || 'Wildlife-Pedia reporter',
                contact_email: reporterEmail,
                subject: 'Wildlife-Pedia sighting report',
                message,
            });
        }

        return res.status(201).json({ submitted: true, record: result.rows[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to submit the sighting report.' });
    }
};

exports.getAdminOverview = async (_req, res) => {
    try {
        await ensureWildlifePediaTables();

        const [speciesResult, habitatsResult, projectsResult, postsResult, sightingsResult, volunteerResult, donorResult] = await Promise.all([
            pool.query('SELECT COUNT(*)::int AS count FROM wildlife_pedia_species'),
            pool.query('SELECT COUNT(*)::int AS count FROM wildlife_pedia_habitats'),
            pool.query('SELECT COUNT(*)::int AS count FROM wildlife_pedia_projects'),
            pool.query('SELECT COUNT(*)::int AS count FROM wildlife_pedia_posts'),
            pool.query('SELECT COUNT(*)::int AS count FROM wildlife_pedia_sightings'),
            pool.query('SELECT COUNT(*)::int AS count FROM wildlife_pedia_volunteers'),
            pool.query('SELECT COUNT(*)::int AS count FROM wildlife_pedia_donors'),
        ]);

        return res.json({
            overview: {
                species: speciesResult.rows[0]?.count || 0,
                habitats: habitatsResult.rows[0]?.count || 0,
                projects: projectsResult.rows[0]?.count || 0,
                posts: postsResult.rows[0]?.count || 0,
                sightings: sightingsResult.rows[0]?.count || 0,
                volunteers: volunteerResult.rows[0]?.count || 0,
                donors: donorResult.rows[0]?.count || 0,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load Wildlife-Pedia admin overview.' });
    }
};

exports.getSightings = async (_req, res) => {
    try {
        return res.json({ items: await readSimpleRows('wildlife_pedia_sightings') });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load sighting reports.' });
    }
};

exports.getNewsletterSubscribers = async (_req, res) => {
    try {
        return res.json({ items: await readSimpleRows('wildlife_pedia_newsletter_subscribers') });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load newsletter subscribers.' });
    }
};

exports.getVolunteers = async (_req, res) => {
    try {
        return res.json({ items: await readSimpleRows('wildlife_pedia_volunteers') });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load volunteer records.' });
    }
};

exports.getDonors = async (_req, res) => {
    try {
        return res.json({ items: await readSimpleRows('wildlife_pedia_donors') });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load donor records.' });
    }
};

const saveSpeciesRecord = async (req, res, isUpdate = false) => {
    const id = toNullableText(req.params.id || req.body.id);
    const name = toNullableText(req.body.name || req.body.title);

    if (!name) {
        return res.status(400).json({ message: 'Species name is required.' });
    }

    try {
        await ensureWildlifePediaTables();

        const payload = [
            toSlug(req.body.slug || name, 'species'),
            name,
            toNullableText(req.body.scientificName || req.body.scientific_name),
            toNullableText(req.body.summary),
            toNullableText(req.body.body),
            toNullableText(req.body.habitat),
            toNullableText(req.body.rangeText || req.body.range_text),
            toNullableText(req.body.diet),
            toNullableText(req.body.conservationStatus || req.body.conservation_status),
            toNullableText(req.body.riskLevel || req.body.risk_level),
            toNullableText(req.body.coexistenceTips || req.body.coexistence_tips),
            toNullableText(req.body.image),
            toBoolean(req.body.featured, false),
            toSortOrder(req.body.sortOrder || req.body.sort_order, 0),
        ];

        const query = isUpdate
            ? `UPDATE wildlife_pedia_species
               SET slug = $1,
                   name = $2,
                   scientific_name = $3,
                   summary = $4,
                   body = $5,
                   habitat = $6,
                   range_text = $7,
                   diet = $8,
                   conservation_status = $9,
                   risk_level = $10,
                   coexistence_tips = $11,
                   image = $12,
                   featured = $13,
                   sort_order = $14,
                   updated_at = NOW()
               WHERE id = $15
               RETURNING *`
            : `INSERT INTO wildlife_pedia_species (
                   slug,
                   name,
                   scientific_name,
                   summary,
                   body,
                   habitat,
                   range_text,
                   diet,
                   conservation_status,
                   risk_level,
                   coexistence_tips,
                   image,
                   featured,
                   sort_order
               ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
               RETURNING *`;

        const values = isUpdate ? [...payload, id] : payload;
        const result = await pool.query(query, values);
        return res.status(isUpdate ? 200 : 201).json({ item: normalizeSpecies(result.rows[0]) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: `Unable to ${isUpdate ? 'update' : 'create'} species.` });
    }
};

const saveHabitatRecord = async (req, res, isUpdate = false) => {
    const id = toNullableText(req.params.id || req.body.id);
    const title = toNullableText(req.body.title);

    if (!title) {
        return res.status(400).json({ message: 'Habitat title is required.' });
    }

    try {
        await ensureWildlifePediaTables();

        const payload = [
            toSlug(req.body.slug || title, 'habitat'),
            title,
            toNullableText(req.body.summary),
            toNullableText(req.body.body),
            toNullableText(req.body.humanInteraction || req.body.human_interaction),
            toNullableText(req.body.region),
            toNullableText(req.body.image),
            toBoolean(req.body.featured, false),
            toSortOrder(req.body.sortOrder || req.body.sort_order, 0),
        ];

        const query = isUpdate
            ? `UPDATE wildlife_pedia_habitats
               SET slug = $1,
                   title = $2,
                   summary = $3,
                   body = $4,
                   human_interaction = $5,
                   region = $6,
                   image = $7,
                   featured = $8,
                   sort_order = $9,
                   updated_at = NOW()
               WHERE id = $10
               RETURNING *`
            : `INSERT INTO wildlife_pedia_habitats (
                   slug,
                   title,
                   summary,
                   body,
                   human_interaction,
                   region,
                   image,
                   featured,
                   sort_order
               ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
               RETURNING *`;

        const values = isUpdate ? [...payload, id] : payload;
        const result = await pool.query(query, values);
        return res.status(isUpdate ? 200 : 201).json({ item: normalizeHabitat(result.rows[0]) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: `Unable to ${isUpdate ? 'update' : 'create'} habitat.` });
    }
};

const saveProjectRecord = async (req, res, isUpdate = false) => {
    const id = toNullableText(req.params.id || req.body.id);
    const title = toNullableText(req.body.title);

    if (!title) {
        return res.status(400).json({ message: 'Project title is required.' });
    }

    try {
        await ensureWildlifePediaTables();

        const payload = [
            toSlug(req.body.slug || title, 'project'),
            title,
            toNullableText(req.body.summary),
            toNullableText(req.body.body),
            toNullableText(req.body.status),
            toNullableText(req.body.ctaLabel || req.body.cta_label),
            toNullableText(req.body.ctaLink || req.body.cta_link),
            toNullableText(req.body.image),
            toBoolean(req.body.featured, false),
            toSortOrder(req.body.sortOrder || req.body.sort_order, 0),
        ];

        const query = isUpdate
            ? `UPDATE wildlife_pedia_projects
               SET slug = $1,
                   title = $2,
                   summary = $3,
                   body = $4,
                   status = $5,
                   cta_label = $6,
                   cta_link = $7,
                   image = $8,
                   featured = $9,
                   sort_order = $10,
                   updated_at = NOW()
               WHERE id = $11
               RETURNING *`
            : `INSERT INTO wildlife_pedia_projects (
                   slug,
                   title,
                   summary,
                   body,
                   status,
                   cta_label,
                   cta_link,
                   image,
                   featured,
                   sort_order
               ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
               RETURNING *`;

        const values = isUpdate ? [...payload, id] : payload;
        const result = await pool.query(query, values);
        return res.status(isUpdate ? 200 : 201).json({ item: normalizeProject(result.rows[0]) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: `Unable to ${isUpdate ? 'update' : 'create'} project.` });
    }
};

exports.createSpecies = async (req, res) => saveSpeciesRecord(req, res, false);
exports.updateSpecies = async (req, res) => saveSpeciesRecord(req, res, true);
exports.createHabitat = async (req, res) => saveHabitatRecord(req, res, false);
exports.updateHabitat = async (req, res) => saveHabitatRecord(req, res, true);
exports.createProject = async (req, res) => saveProjectRecord(req, res, false);
exports.updateProject = async (req, res) => saveProjectRecord(req, res, true);

exports.deleteSpecies = async (req, res) => {
    try {
        await ensureWildlifePediaTables();
        await pool.query('DELETE FROM wildlife_pedia_species WHERE id = $1', [req.params.id]);
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to delete species.' });
    }
};

exports.deleteHabitat = async (req, res) => {
    try {
        await ensureWildlifePediaTables();
        await pool.query('DELETE FROM wildlife_pedia_habitats WHERE id = $1', [req.params.id]);
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to delete habitat.' });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        await ensureWildlifePediaTables();
        await pool.query('DELETE FROM wildlife_pedia_projects WHERE id = $1', [req.params.id]);
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to delete project.' });
    }
};

exports.updateSightingStatus = async (req, res) => {
    const status = toNullableText(req.body.status) || 'reviewed';

    try {
        await ensureWildlifePediaTables();
        const result = await pool.query(
            `UPDATE wildlife_pedia_sightings
             SET status = $1,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [status, req.params.id],
        );

        return res.json({ item: result.rows[0] || null });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to update sighting status.' });
    }
};

exports.updateSiteContent = async (req, res) => {
    try {
        await ensurePlatformContentTable();
        const mergedContent = {
            ...DEFAULT_SITE_CONTENT,
            ...(req.body || {}),
        };

        const result = await pool.query(
            `INSERT INTO platform_content (content_key, content, updated_by_email, updated_at)
             VALUES ($1, $2::jsonb, $3, NOW())
             ON CONFLICT (content_key)
             DO UPDATE SET
                content = EXCLUDED.content,
                updated_by_email = EXCLUDED.updated_by_email,
                updated_at = NOW()
             RETURNING content, updated_by_email, updated_at`,
            [SITE_CONTENT_KEY, JSON.stringify(mergedContent), req.user?.email || null],
        );

        return res.json({
            message: 'Wildlife-Pedia content saved successfully.',
            content: result.rows[0]?.content || mergedContent,
            updatedByEmail: result.rows[0]?.updated_by_email || null,
            updatedAt: result.rows[0]?.updated_at || null,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to save Wildlife-Pedia content.' });
    }
};
