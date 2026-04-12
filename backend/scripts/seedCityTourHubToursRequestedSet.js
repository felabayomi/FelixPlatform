const fs = require('fs');
const path = require('path');
const vm = require('vm');
const pool = require('../db');

function addOneYear(dateString) {
    const d = new Date(dateString);
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function parseTourDataFromTs(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf('];');
    if (start === -1 || end === -1) {
        throw new Error('Could not parse tour array from tourData.ts');
    }
    const arrayCode = raw.slice(start, end + 1);
    const sandbox = {};
    vm.runInNewContext(`tourData = ${arrayCode};`, sandbox);
    return sandbox.tourData;
}

const imageByKey = {
    'Baltimore|Maryland': '/images/Baltimore_Inner_Harbor_sunset_9e4ce905.png',
    'Wilmington & Rehoboth Beach|Delaware': '/images/Rehoboth_Beach_Delaware_coast_ac3a446d.png',
    'Philadelphia & Pittsburgh|Pennsylvania': '/images/Philadelphia_Pennsylvania_Independence_Hall_21cd5305.png',
    'West Orange & Camden|New Jersey': '/images/West_Orange_New_Jersey_0cfb8157.png',
    'Bronx & Brooklyn|New York': '/images/Brooklyn_New_York_skyline_view_c67254f4.png',
    'Bridgeport & Mystic|Connecticut': '/images/Mystic_Connecticut_seaport_charm_0337b7e2.png',
    'Providence & North Kingstown|Rhode Island': '/images/Providence_Rhode_Island_historic_49afbec9.png',
    'Boston|Massachusetts': '/images/Boston_Massachusetts_historic_harbor_02bc8640.png',
    'Holderness & Hampton Beach|New Hampshire': '/images/New_Hampshire_lake_scenery_15a49902.png',
    'Burlington|Vermont': '/images/Burlington_Vermont_lakefront_d53b9a48.png',
    'Gray & Boothbay Harbor|Maine': '/images/Portland_Maine_Old_Port_600d29a9.png',
    'Cincinnati & Newport|Ohio': '/images/Cincinnati_Ohio_riverfront_bridge_de856b91.png',
    'Detroit|Michigan': '/images/Detroit_Michigan_Renaissance_Center_37540d93.png',
    'Indianapolis|Indiana': '/images/Indianapolis_Indiana_downtown_2884bae2.png',
    'Chicago|Illinois': '/images/Chicago_Illinois_lakefront_skyline_41301165.png',
    'Milwaukee|Wisconsin': '/images/Milwaukee_Wisconsin_lakefront_d5f5ee64.png',
    'Apple Valley & Bloomington|Minnesota': '/images/Minneapolis_Minnesota_skyline_35dd8d67.png',
    'Fargo & Bismarck|North Dakota': '/images/Fargo_North_Dakota_downtown_1875d69d.png',
    'Sioux Falls|South Dakota': '/images/Sioux_Falls_South_Dakota_87bd3c26.png',
    'Omaha|Nebraska': '/images/Omaha_Nebraska_riverfront_07e25ea8.png',
    'Wichita & Kansas City|Kansas': '/images/Kansas_City_riverfront_skyline_808f8159.png',
    'St. Louis & Springfield|Missouri': '/images/St_Louis_Missouri_Gateway_Arch_34217ea3.png',
    'Des Moines & Dubuque|Iowa': '/images/Des_Moines_Iowa_capital_4deb3a10.png',
    'Little Rock & Hot Springs|Arkansas': '/images/Little_Rock_Arkansas_riverfront_c926e1ff.png',
    'New Orleans|Louisiana': '/images/New_Orleans_French_Quarter_f0d4b86d.png',
    'Jackson|Mississippi': '/images/Jackson_Mississippi_capital_city_857f3f77.png',
    'Birmingham|Alabama': '/images/Birmingham_Alabama_cityscape_689f776e.png',
    'Memphis|Tennessee': '/images/Nashville_skyline_at_dusk_81989aa1.png',
    'Lexington & Louisville|Kentucky': '/images/Louisville_Kentucky_riverfront_77b9822a.png',
    'Columbia & Charleston|South Carolina': '/images/Charleston_Rainbow_Row_houses_580fc3c6.png',
    'Atlanta & Savannah|Georgia': '/images/Savannah_historic_square_oaks_88b92e3f.png',
    'Jacksonville|Florida': '/images/Jacksonville_Florida_riverfront_skyline_241db261.png',
    'Oklahoma City|Oklahoma': '/images/Oklahoma_City_skyline_97969b85.png',
    'Houston|Texas': '/images/Houston_Texas_skyline_7c0112a2.png',
    'Phoenix|Arizona': '/images/Phoenix_Arizona_desert_skyline_b317b961.png',
    'Santa Fe & Albuquerque|New Mexico': '/images/Santa_Fe_New_Mexico_adobe_3b5c5a76.png',
    'Salt Lake City|Utah': '/images/Salt_Lake_City_Utah_mountains_6637f113.png',
    'Las Vegas|Nevada': '/images/Las_Vegas_Nevada_Strip_44a0c6f4.png',
    'Seattle|Washington': '/images/Seattle_Washington_Space_Needle_f348659d.png',
    'Anchorage|Alaska': '/images/Anchorage_Alaska_mountain_backdrop_441ca7f7.png',
    'Honolulu|Hawaii': '/images/Honolulu_Hawaii_Waikiki_Beach_616f79ac.png',
    'Boise|Idaho': '/images/Boise_Idaho_foothills_view_aa42005c.png',
    'Denver|Colorado': '/images/Denver_Colorado_mountain_skyline_5704a94b.png',
    'Portland & Newport|Oregon': '/images/Portland_Oregon_mountain_backdrop_7f916ea8.png',
    'San Diego & Monterey|California': '/images/San_Diego_California_harbor_view_4380b182.png',
    'Billings & Bozeman|Montana': '/images/Bozeman_Montana_mountain_town_d16d5f94.png',
    'Wilson & Jackson|Wyoming': '/images/Jackson_Hole_Wyoming_Tetons_e0329978.png',
    'Wheeling & French Creek|West Virginia': '/images/Wheeling_Suspension_Bridge_view_c2beaa3e.png',
    'Seattle, Bainbridge Island & Mt. Rainier|Washington': '/images/Seattle_Washington_Space_Needle_f348659d.png',
    'New York City|New York': '/images/Brooklyn_New_York_skyline_view_c67254f4.png',
    'Cumberland|Maryland': '/images/Baltimore_Inner_Harbor_sunset_9e4ce905.png',
    'Los Angeles|California': '/images/San_Diego_California_harbor_view_4380b182.png',
    'Nashville|Tennessee': '/images/Nashville_skyline_at_dusk_81989aa1.png',
    'Austin|Texas': '/images/Houston_Texas_skyline_7c0112a2.png',
    'Miami|Florida': '/images/Jacksonville_Florida_riverfront_skyline_241db261.png',
    'Asheboro|North Carolina': '/images/Raleigh_North_Carolina_downtown_81039abc.png',
    'Memphis & Chattanooga|Tennessee': '/images/Nashville_skyline_at_dusk_81989aa1.png',
    'Henderson & Las Vegas|Nevada': '/images/Las_Vegas_Nevada_Strip_44a0c6f4.png',
    'Bridgetown & Holetown|Barbados': '/images/American_cityscape_hero_panorama_5758d44c.png',
    'Madrid|Spain': '/images/American_cityscape_hero_panorama_5758d44c.png',
    'London|England': '/images/American_cityscape_hero_panorama_5758d44c.png',
    'Lagos & Abuja|Nigeria': '/images/American_cityscape_hero_panorama_5758d44c.png',
    'Accra & Cape Coast|Ghana': '/images/American_cityscape_hero_panorama_5758d44c.png',
};

function imageFor(city, state) {
    const key = `${city}|${state}`;
    return imageByKey[key] || '/images/American_cityscape_hero_panorama_5758d44c.png';
}

function cleanHighlights(highlights) {
    if (Array.isArray(highlights) && highlights.length > 0) return highlights;
    return ['Curated itinerary', 'Local experiences', 'Group travel support'];
}

function asDateValue(dateString) {
    return new Date(dateString).getTime();
}

function makePremiumTours() {
    return [
        {
            city: 'Seattle, Bainbridge Island & Mt. Rainier',
            state: 'Washington',
            description: "Experience the best of the Pacific Northwest with this curated escape combining Seattle's vibrant city culture, a scenic ferry ride to Bainbridge Island, and a breathtaking day trip to Mount Rainier National Park. From world-famous Pike Place Market to the iconic Space Needle and stunning mountain vistas, this tour captures the soul of the Pacific Northwest.",
            highlights: ['Pike Place Market', 'Space Needle', 'Bainbridge ferry', 'Mount Rainier day trip'],
            startDate: 'July 16, 2026',
            endDate: 'July 19, 2026',
            maxParticipants: 36,
            currentParticipants: 0,
        },
        {
            city: 'Chicago',
            state: 'Illinois',
            description: "Here's your Chicago travel deal, matching the same structure and dates as your itinerary + flight sheet. Experience the best of the Windy City with architecture cruises, world-class art, deep-dish pizza, and iconic landmarks.",
            highlights: ['Architecture cruise', 'Art Institute', 'Deep-dish pizza'],
            startDate: 'September 10, 2026',
            endDate: 'September 13, 2026',
            maxParticipants: 36,
            currentParticipants: 0,
        },
        {
            city: 'New York City',
            state: 'New York',
            description: "Here's a clean, publish-ready travel deal for New York City using your itinerary + flight structure. Explore the most iconic landmarks and neighborhoods the city has to offer.",
            highlights: ['Iconic landmarks', 'Neighborhood tours', 'Curated city experience'],
            startDate: 'September 18, 2026',
            endDate: 'September 21, 2026',
            maxParticipants: 36,
            currentParticipants: 0,
        },
        {
            city: 'Cumberland',
            state: 'Maryland',
            description: "Here's your Cumberland travel deal, keeping everything clean, consistent, and flight-based. Discover the Appalachian region's mountain charm, scenic rail rides, and outdoor adventure along the Great Allegheny Passage.",
            highlights: ['Appalachian charm', 'Scenic rail rides', 'Great Allegheny Passage'],
            startDate: 'September 24, 2026',
            endDate: 'September 27, 2026',
            maxParticipants: 36,
            currentParticipants: 0,
        },
        {
            city: 'Boston',
            state: 'Massachusetts',
            description: "Here's your Boston travel deal, continuing your premium fall series. Explore America's most historic city with its iconic Freedom Trail, world-class universities, and stunning harbor.",
            highlights: ['Freedom Trail', 'Historic neighborhoods', 'Harbor views'],
            startDate: 'October 8, 2026',
            endDate: 'October 11, 2026',
            maxParticipants: 36,
            currentParticipants: 0,
        },
        {
            city: 'Los Angeles',
            state: 'California',
            description: "Here's your Los Angeles travel deal, continuing the same polished series. Coast, culture, and Hollywood - experience the best of LA from Santa Monica to Malibu.",
            highlights: ['Santa Monica', 'Malibu coast', 'Hollywood highlights'],
            startDate: 'October 15, 2026',
            endDate: 'October 18, 2026',
            maxParticipants: 36,
            currentParticipants: 0,
        },
        {
            city: 'Nashville',
            state: 'Tennessee',
            description: "Here's your Nashville travel deal, continuing your polished series. Music, culture, and Southern flavor - experience the heart of country music and vibrant downtown Nashville.",
            highlights: ['Music district', 'Downtown Nashville', 'Southern cuisine'],
            startDate: 'October 22, 2026',
            endDate: 'October 25, 2026',
            maxParticipants: 36,
            currentParticipants: 0,
        },
        {
            city: 'Atlanta',
            state: 'Georgia',
            description: "Here's your Atlanta travel deal, continuing your full series. Culture, history, and Southern flavor - from the BeltLine to Midtown, Atlanta has it all.",
            highlights: ['BeltLine', 'Midtown', 'History and culture'],
            startDate: 'October 29, 2026',
            endDate: 'November 1, 2026',
            maxParticipants: 36,
            currentParticipants: 0,
        },
        {
            city: 'Austin',
            state: 'Texas',
            description: "Here's your Austin travel deal, continuing your consistent series. Music, food, and Hill Country - from Lady Bird Lake to Dripping Springs wineries, Austin delivers every time.",
            highlights: ['Live music', 'Lady Bird Lake', 'Hill Country'],
            startDate: 'November 5, 2026',
            endDate: 'November 8, 2026',
            maxParticipants: 36,
            currentParticipants: 0,
        },
        {
            city: 'Las Vegas',
            state: 'Nevada',
            description: "Here's your Las Vegas travel deal, completing your full series. Lights, luxury, and desert adventures - from the iconic Strip to Red Rock Canyon and Hoover Dam.",
            highlights: ['The Strip', 'Red Rock Canyon', 'Hoover Dam'],
            startDate: 'November 12, 2026',
            endDate: 'November 15, 2026',
            maxParticipants: 36,
            currentParticipants: 0,
        },
        {
            city: 'Miami',
            state: 'Florida',
            description: "Here's your Miami travel deal, matching the same structure and dates as your itinerary + flight sheet. Sun, culture, and nightlife - from South Beach to the Everglades.",
            highlights: ['South Beach', 'Everglades', 'Nightlife'],
            startDate: 'December 10, 2026',
            endDate: 'December 13, 2026',
            maxParticipants: 36,
            currentParticipants: 0,
        },
    ];
}

function makeSpecialTours() {
    return [
        {
            city: 'Asheboro',
            state: 'North Carolina',
            description: "Experience Asheboro's down-to-earth charm and wild spirit in the heart of North Carolina. From the world-famous North Carolina Zoo to scenic drives through the Uwharrie Mountains, this small city delivers big adventure. Discover local art and craft breweries downtown, explore hiking trails, or unwind with Southern comfort food that captures the warmth of Randolph County.",
            highlights: ['North Carolina Zoo', 'Uwharrie Mountains', 'Downtown art and breweries'],
            startDate: 'November 23, 2027',
            endDate: 'November 29, 2027',
            maxParticipants: 36,
            currentParticipants: 3,
        },
        {
            city: 'Memphis & Chattanooga',
            state: 'Tennessee',
            description: "Experience two sides of Tennessee's soul - the music-fueled magic of Memphis and the mountain-meets-river charm of Chattanooga. In Memphis, the beat of Beale Street, the legacy of Graceland, and the flavors of world-famous barbecue capture the rhythm of the South. Head east to Chattanooga, where outdoor adventure and creative energy flow along the Tennessee River, from Lookout Mountain's sweeping views to the vibrant Southside arts scene. Together, these cities blend history, nature, and culture into one unforgettable journey through the heart of Tennessee.",
            highlights: ['Beale Street', 'Graceland', 'Lookout Mountain', 'Tennessee River'],
            startDate: 'November 30, 2027',
            endDate: 'December 6, 2027',
            maxParticipants: 36,
            currentParticipants: 3,
        },
        {
            city: 'Wheeling & French Creek',
            state: 'West Virginia',
            description: "Discover two sides of West Virginia's story - the riverfront legacy of Wheeling and the wild heart of French Creek. In Wheeling, 19th-century architecture and Appalachian charm meet modern revival. Explore the historic Centre Market, walk the Wheeling Suspension Bridge, and experience the elegance of Oglebay Resort. A few scenic hours south, French Creek immerses you in West Virginia's natural beauty - from the West Virginia State Wildlife Center to serene hiking trails and quiet streams surrounded by forested hills. Together, these destinations offer a perfect blend of small-city culture and mountain escape.",
            highlights: ['Wheeling Suspension Bridge', 'Oglebay Resort', 'French Creek nature trails'],
            startDate: 'April 19, 2028',
            endDate: 'April 25, 2028',
            maxParticipants: 36,
            currentParticipants: 3,
        },
    ];
}

function makeInternationalTours() {
    return [
        {
            city: 'Bridgetown & Holetown',
            state: 'Barbados',
            description: 'Escape to the jewel of the Caribbean. Barbados blends powdery white beaches, vibrant coral reefs, rum distilleries, and a rich Bajan culture that will leave you wanting more.',
            highlights: ['Beaches', 'Coral reefs', 'Rum distilleries'],
            startDate: 'July 10, 2028',
            endDate: 'July 17, 2028',
            maxParticipants: 24,
            currentParticipants: 0,
        },
        {
            city: 'Madrid',
            state: 'Spain',
            description: 'Step into the heart of Europe. Madrid dazzles with world-class art, grand boulevards, a legendary food scene, and the unmistakable energy of a city that never sleeps.',
            highlights: ['World-class art', 'Boulevards', 'Food scene'],
            startDate: 'August 7, 2028',
            endDate: 'August 14, 2028',
            maxParticipants: 24,
            currentParticipants: 0,
        },
        {
            city: 'London',
            state: 'England',
            description: 'Discover the timeless magic of London. From Buckingham Palace to the Tower of London, world-famous museums to West End theatre - the British capital never stops inspiring.',
            highlights: ['Buckingham Palace', 'Tower of London', 'West End theatre'],
            startDate: 'September 4, 2028',
            endDate: 'September 11, 2028',
            maxParticipants: 24,
            currentParticipants: 0,
        },
        {
            city: 'Lagos & Abuja',
            state: 'Nigeria',
            description: "Celebrate Christmas and ring in the New Year in the vibrant heart of West Africa. Nigeria's energy, culture, music, and cuisine make for an unforgettable holiday season experience.",
            highlights: ['Holiday season', 'Culture and music', 'Cuisine'],
            startDate: 'December 26, 2028',
            endDate: 'January 2, 2029',
            maxParticipants: 24,
            currentParticipants: 0,
        },
        {
            city: 'Accra & Cape Coast',
            state: 'Ghana',
            description: "Experience the warmth, history, and beauty of West Africa's most welcoming country. From Accra's vibrant food scene and nightlife to the historic slave forts of Cape Coast and the pristine beaches of Elmina - Ghana is a journey of culture, heritage, and soul.",
            highlights: ['Accra city life', 'Cape Coast heritage', 'Elmina beaches'],
            startDate: 'February 5, 2029',
            endDate: 'February 12, 2029',
            maxParticipants: 24,
            currentParticipants: 0,
        },
    ];
}

async function seed() {
    const sourcePath = path.resolve(__dirname, '../../incoming/CityTourHub/server/tourData.ts');
    const sourceTours = parseTourDataFromTs(sourcePath);

    const blockedCities = new Set(['Charleston', 'Richmond', 'Raleigh & Durham', 'Wheeling']);

    const shiftedDomestic = sourceTours
        .filter((t) => !blockedCities.has(t.city))
        .map((t) => ({
            city: t.city,
            state: t.state,
            description: t.description,
            highlights: cleanHighlights(t.highlights),
            startDate: addOneYear(t.startDate),
            endDate: addOneYear(t.endDate),
            maxParticipants: 36,
            currentParticipants: 3,
        }));

    const tours = [
        ...makePremiumTours(),
        ...shiftedDomestic,
        ...makeSpecialTours(),
        ...makeInternationalTours(),
    ].map((t) => ({
        ...t,
        imageUrl: imageFor(t.city, t.state),
    }));

    tours.sort((a, b) => asDateValue(a.startDate) - asDateValue(b.startDate));

    await pool.query('BEGIN');
    try {
        await pool.query('DELETE FROM cth_tours');

        for (const t of tours) {
            await pool.query(
                `INSERT INTO cth_tours (city, state, description, highlights, start_date, end_date, max_participants, current_participants, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [
                    t.city,
                    t.state,
                    t.description,
                    t.highlights,
                    t.startDate,
                    t.endDate,
                    t.maxParticipants,
                    t.currentParticipants,
                    t.imageUrl,
                ]
            );
        }

        await pool.query('COMMIT');
        console.log(`SEEDED_COUNT=${tours.length}`);
        console.log(`FIRST=${tours[0].city} (${tours[0].startDate})`);
        console.log(`LAST=${tours[tours.length - 1].city} (${tours[tours.length - 1].startDate})`);
    } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
    } finally {
        await pool.end();
    }
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
