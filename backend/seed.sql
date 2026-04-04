-- PLATFORM CATEGORY STRUCTURE (Felix Store + A & F Laundry)
INSERT INTO categories (name, parent_id)
SELECT v.name, NULL
FROM (
  VALUES
    ('Apps & Software'),
    ('Financial Tools'),
    ('Travel & Experiences'),
    ('Services'),
    ('Consulting & Strategy'),
    ('Digital Products'),
    ('Media & Content'),
    ('Logistics & Delivery'),
    ('Lifestyle & Marketplace'),
    ('Conservation & Non-Profit'),
    ('Education & Learning'),
    ('Subscriptions & Memberships')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id IS NULL
);

UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE name = 'Services' AND parent_id IS NULL LIMIT 1)
WHERE name = 'Laundry Services' AND parent_id IS NULL;

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Apps & Software' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Finance Apps'),
    ('Travel Apps'),
    ('Productivity Apps'),
    ('Media Apps'),
    ('Utility Apps'),
    ('AI Tools'),
    ('Business Tools')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Financial Tools' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Financial Readiness Tool'),
    ('Budgeting Tools'),
    ('Expense Tracking'),
    ('Bill Tracking'),
    ('Savings Tools'),
    ('Investment Tools'),
    ('Income Tools'),
    ('Wealth Tools'),
    ('Financial Education')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Travel & Experiences' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Travel Planning'),
    ('Travel Booking'),
    ('Group Tours'),
    ('City Guides'),
    ('Travel Deals'),
    ('Luxury Travel'),
    ('Road Trips'),
    ('Travel Consulting'),
    ('Travel Subscriptions')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Services' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Laundry Services'),
    ('Errand Services'),
    ('Delivery Services'),
    ('Pickup Services'),
    ('Virtual Assistant'),
    ('Business Services'),
    ('Personal Services'),
    ('Booking Services')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id
  FROM categories
  WHERE name = 'Laundry Services'
  ORDER BY CASE WHEN parent_id IS NOT NULL THEN 0 ELSE 1 END, id
  LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Pickup & Delivery'),
    ('Wash & Fold'),
    ('Dry Cleaning'),
    ('Ironing'),
    ('Express Laundry'),
    ('Commercial Laundry'),
    ('Specialty Cleaning'),
    ('Laundry Subscriptions')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Consulting & Strategy' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Business Consulting'),
    ('Financial Consulting'),
    ('Travel Consulting'),
    ('Strategy Consulting'),
    ('Technology Consulting'),
    ('Asset Management'),
    ('Textile Advisory')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Digital Products' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Templates'),
    ('Guides'),
    ('Courses'),
    ('E-books'),
    ('Business Documents'),
    ('Financial Templates'),
    ('Travel Guides'),
    ('Digital Planners'),
    ('Forms'),
    ('Checklists')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Media & Content' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Films'),
    ('Documentaries'),
    ('Streaming Tools'),
    ('Podcasts'),
    ('Articles'),
    ('News'),
    ('Storytelling'),
    ('Education Content')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Logistics & Delivery' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Local Delivery'),
    ('Moving Services'),
    ('Freight'),
    ('Pickup Services'),
    ('Errand Delivery'),
    ('Logistics Booking')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Lifestyle & Marketplace' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Clothing'),
    ('Home Goods'),
    ('Office Supplies'),
    ('Accessories'),
    ('Print on Demand'),
    ('Food & Meal Services'),
    ('Wellness')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Conservation & Non-Profit' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Wildlife Conservation'),
    ('Environmental Projects'),
    ('Research'),
    ('Non-Profit Programs'),
    ('Donations'),
    ('Events'),
    ('Memberships')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Education & Learning' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('Courses'),
    ('Training Programs'),
    ('Workshops'),
    ('Certifications'),
    ('Learning Platforms'),
    ('Educational Content')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

WITH parent AS (
  SELECT id FROM categories WHERE name = 'Subscriptions & Memberships' AND parent_id IS NULL LIMIT 1
)
INSERT INTO categories (name, parent_id)
SELECT v.name, parent.id
FROM parent
CROSS JOIN (
  VALUES
    ('App Subscriptions'),
    ('Financial Programs'),
    ('Travel Memberships'),
    ('Content Memberships'),
    ('Community Memberships'),
    ('Premium Access')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = v.name AND c.parent_id = parent.id
);

-- SAMPLE PRODUCTS
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  type,
  image_url,
  download_url,
  booking_required,
  subscription_required,
  stock,
  active
)
SELECT
  'Felix Budget Pro',
  'A digital budgeting toolkit for personal and business finance.',
  29.99,
  (SELECT id FROM categories WHERE name = 'Financial Tools' LIMIT 1),
  'digital',
  'https://example.com/images/felix-budget-pro.jpg',
  'https://example.com/downloads/felix-budget-pro',
  false,
  false,
  999,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Felix Budget Pro');

INSERT INTO products (
  name, description, price, category_id, type, image_url, booking_required, subscription_required, stock, active
)
SELECT
  'Felix Premium T-Shirt',
  'Official branded physical merchandise for the Felix platform.',
  24.99,
  (SELECT id FROM categories WHERE name = 'Lifestyle & Marketplace' LIMIT 1),
  'physical',
  'https://example.com/images/felix-shirt.jpg',
  false,
  false,
  120,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Felix Premium T-Shirt');

INSERT INTO products (
  name, description, price, category_id, type, image_url, booking_required, subscription_required, stock, active
)
SELECT
  'Business Strategy Session',
  'One-on-one consulting service for founders and growing businesses.',
  150.00,
  (SELECT id FROM categories WHERE name = 'Consulting & Strategy' LIMIT 1),
  'service',
  'https://example.com/images/strategy-session.jpg',
  false,
  false,
  50,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Business Strategy Session');

INSERT INTO products (
  name, description, price, category_id, type, image_url, download_url, booking_required, subscription_required, stock, active
)
SELECT
  'Felix Mobile App Suite',
  'A packaged application product for business operations and e-commerce.',
  99.00,
  (SELECT id FROM categories WHERE name = 'Apps & Software' LIMIT 1),
  'app',
  'https://example.com/images/app-suite.jpg',
  'https://example.com/downloads/felix-app-suite',
  false,
  false,
  999,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Felix Mobile App Suite');

INSERT INTO products (
  name, description, price, category_id, type, image_url, booking_required, subscription_required, stock, active
)
SELECT
  'City Tour Booking',
  'Reserve a guided travel and experience booking through the platform.',
  75.00,
  (SELECT id FROM categories WHERE name = 'Travel & Experiences' LIMIT 1),
  'booking',
  'https://example.com/images/city-tour.jpg',
  true,
  false,
  40,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'City Tour Booking');

INSERT INTO products (
  name, description, price, category_id, type, image_url, booking_required, subscription_required, stock, active
)
SELECT
  'Felix Plus Membership',
  'Monthly subscription for exclusive tools, discounts, and premium access.',
  19.99,
  (SELECT id FROM categories WHERE name = 'Subscriptions & Memberships' LIMIT 1),
  'subscription',
  'https://example.com/images/felix-plus.jpg',
  false,
  true,
  999,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Felix Plus Membership');

INSERT INTO products (
  name, description, price, category_id, type, image_url, booking_required, subscription_required, stock, active
)
SELECT
  'Wildlife Support Donation',
  'Make a contribution to conservation and community non-profit projects.',
  10.00,
  (SELECT id FROM categories WHERE name = 'Conservation & Non-Profit' LIMIT 1),
  'donation',
  'https://example.com/images/donation.jpg',
  false,
  false,
  999,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Wildlife Support Donation');

INSERT INTO products (
  name, description, price, category_id, type, image_url, download_url, booking_required, subscription_required, stock, active
)
SELECT
  'E-Commerce Launch Masterclass',
  'A practical course on launching and scaling an online business.',
  49.99,
  (SELECT id FROM categories WHERE name = 'Education & Learning' LIMIT 1),
  'course',
  'https://example.com/images/masterclass.jpg',
  'https://example.com/downloads/ecommerce-masterclass',
  false,
  false,
  999,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'E-Commerce Launch Masterclass');

INSERT INTO products (
  name, description, price, category_id, type, image_url, booking_required, subscription_required, stock, active
)
SELECT
  'Express Laundry Pickup',
  'Same-day wash, dry, and delivery laundry service booking.',
  15.99,
  (SELECT id FROM categories WHERE name = 'Laundry Services' LIMIT 1),
  'laundry',
  'https://example.com/images/laundry-pickup.jpg',
  true,
  false,
  200,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Express Laundry Pickup');

-- FELIX STORE: APPS & SOFTWARE STARTER PRODUCTS
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  type,
  booking_required,
  subscription_required,
  stock,
  active
)
SELECT
  v.name,
  v.description,
  v.price,
  (SELECT id FROM categories WHERE name = 'Apps & Software' AND parent_id IS NULL LIMIT 1),
  'app',
  false,
  false,
  999,
  true
FROM (
  VALUES
    ('StreamPilot', 'A smart operations and workflow app for managing platform streams and digital experiences.', 0.00),
    ('WildFilms', 'A media discovery and storytelling app focused on films, documentaries, and visual content.', 0.00),
    ('LetterVault', 'A secure app for storing, organizing, and managing important letters and documents.', 0.00),
    ('Debt to Legacy', 'A financial transformation app designed to help users move from debt toward long-term wealth.', 0.00),
    ('BillWatch', 'An app for tracking recurring bills, payment dates, and household financial obligations.', 0.00),
    ('ExpenseWatch', 'A spending tracker that helps users monitor day-to-day expenses and financial habits.', 0.00),
    ('FinanceWatch', 'A complete money overview app for budgets, expenses, and financial performance insights.', 0.00),
    ('SavingsPro', 'A goal-based savings app for building stronger saving habits and tracking progress.', 0.00),
    ('IncomeLift', 'An app built to help users grow, organize, and monitor multiple income streams.', 0.00),
    ('Felix Pay', 'A payment and wallet management app for smoother transactions across the Felix platform.', 0.00),
    ('City Discoverer', 'A travel-friendly city exploration app for discovering places, guides, and activities.', 0.00),
    ('Travel Planner', 'An itinerary and trip organization app for planning travel from start to finish.', 0.00),
    ('Trip Budget Calculator', 'A practical budgeting app for estimating trip costs and controlling travel spending.', 0.00),
    ('Travel Deal Finder', 'A travel savings app that helps users spot and compare the best travel deals.', 0.00),
    ('Document Manager', 'A business productivity app for organizing, storing, and accessing important files.', 0.00),
    ('Business Toolkit', 'An all-in-one app that brings together key tools for entrepreneurs and growing businesses.', 0.00),
    ('Asset Tracker', 'An app for recording and monitoring personal or business assets in one place.', 0.00),
    ('Invoice Manager', 'A billing app for creating, managing, and tracking invoices and payments.', 0.00),
    ('Client Portal App', 'A customer-facing portal app for managing client communication, files, and updates.', 0.00),
    ('Booking Manager', 'A scheduling and reservations app for managing appointments, services, and availability.', 0.00)
) AS v(name, description, price)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name
);

-- FELIX STORE: FINANCIAL TOOLS STARTER PRODUCTS
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  type,
  booking_required,
  subscription_required,
  stock,
  active
)
SELECT
  v.name,
  v.description,
  v.price,
  (SELECT id FROM categories WHERE name = 'Financial Tools' AND parent_id IS NULL LIMIT 1),
  v.type,
  false,
  false,
  999,
  true
FROM (
  VALUES
    ('Debt to Legacy Financial Readiness Tool', 'An assessment tool that helps users understand their current financial position and recommended next steps.', 0.00, 'digital'),
    ('Budget Planner', 'A structured budgeting tool for planning spending, savings, and monthly financial goals.', 0.00, 'digital'),
    ('Expense Tracker', 'A practical tool for monitoring daily expenses and improving money awareness.', 0.00, 'digital'),
    ('Bill Tracker', 'A simple tracking solution for managing due dates, recurring bills, and payment reminders.', 0.00, 'digital'),
    ('Savings Calculator', 'A financial calculator that helps users estimate growth toward savings goals.', 0.00, 'digital'),
    ('Investment Planner', 'A planning tool for organizing investment priorities, targets, and long-term strategies.', 0.00, 'digital'),
    ('Income Growth Planner', 'A goal-setting tool designed to help users increase and diversify income streams.', 0.00, 'digital'),
    ('Wealth Builder Toolkit', 'A collection of practical financial resources focused on building stronger long-term wealth habits.', 0.00, 'digital'),
    ('Financial Literacy Course', 'A beginner-friendly educational course covering money management, budgeting, and wealth basics.', 0.00, 'course'),
    ('Credit Repair Guide', 'A step-by-step guide to understanding credit health and improving credit-related habits.', 0.00, 'digital')
) AS v(name, description, price, type)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name
);

-- FELIX STORE: TRAVEL & EXPERIENCES STARTER PRODUCTS
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  type,
  booking_required,
  subscription_required,
  stock,
  active
)
SELECT
  v.name,
  v.description,
  v.price,
  (SELECT id FROM categories WHERE name = 'Travel & Experiences' AND parent_id IS NULL LIMIT 1),
  v.type,
  v.booking_required,
  v.subscription_required,
  999,
  true
FROM (
  VALUES
    ('Travel Planning Service', 'A personalized travel planning service that helps users organize destinations, timelines, and logistics.', 0.00, 'service', false, false),
    ('Custom Travel Itinerary', 'A curated itinerary product tailored to travel goals, interests, and preferred pace.', 0.00, 'service', false, false),
    ('Group Travel Planning', 'A coordination service for planning travel experiences for families, teams, and larger groups.', 0.00, 'service', false, false),
    ('City Travel Guide', 'A destination guide featuring key attractions, local recommendations, and travel tips.', 0.00, 'digital', false, false),
    ('Luxury Travel Planning', 'A premium travel service for building high-end trips with comfort, style, and convenience in mind.', 0.00, 'service', false, false),
    ('Road Trip Planner', 'A route and experience planning tool for organizing scenic road trips and stopovers.', 0.00, 'service', false, false),
    ('Travel Deals Finder', 'A travel savings product that helps surface competitive deals on trips, stays, and experiences.', 0.00, 'digital', false, false),
    ('Travel Subscription Club', 'A membership-based travel product offering exclusive updates, perks, and insider opportunities.', 0.00, 'subscription', false, true),
    ('Travel Consultation', 'A one-on-one consultation service for travel strategy, destination planning, and budgeting support.', 0.00, 'service', false, false),
    ('Destination Research Service', 'A research-focused service that helps users compare destinations based on budget and goals.', 0.00, 'service', false, false)
) AS v(name, description, price, type, booking_required, subscription_required)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name
);

-- FELIX STORE: CONSULTING & STRATEGY STARTER PRODUCTS
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  type,
  booking_required,
  subscription_required,
  stock,
  active
)
SELECT
  v.name,
  v.description,
  v.price,
  (SELECT id FROM categories WHERE name = 'Consulting & Strategy' AND parent_id IS NULL LIMIT 1),
  'service',
  false,
  false,
  999,
  true
FROM (
  VALUES
    ('Business Consulting Session', 'A consulting session focused on improving business structure, growth, and operational strategy.', 0.00),
    ('Financial Strategy Session', 'A guided session for reviewing money goals, financial positioning, and strategic next steps.', 0.00),
    ('Travel Strategy Session', 'A planning session designed to help shape smarter travel offers, positioning, and destination strategies.', 0.00),
    ('Technology Consulting', 'A strategic consulting service for systems, tools, workflows, and digital transformation decisions.', 0.00),
    ('Startup Consulting', 'An advisory service for founders building, launching, and scaling early-stage ventures.', 0.00),
    ('Asset Management Consulting', 'A consulting offering focused on asset organization, monitoring, and long-term value strategy.', 0.00),
    ('Textile Consulting', 'A specialist consulting service around textiles, sourcing, production, and materials insight.', 0.00),
    ('Operations Consulting', 'A service designed to improve operational efficiency, systems flow, and execution performance.', 0.00),
    ('Brand Strategy Consulting', 'A consulting session focused on brand positioning, audience clarity, and growth messaging.', 0.00)
) AS v(name, description, price)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name
);

-- FELIX STORE: DIGITAL PRODUCTS STARTER PRODUCTS
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  type,
  booking_required,
  subscription_required,
  stock,
  active
)
SELECT
  v.name,
  v.description,
  v.price,
  (SELECT id FROM categories WHERE name = 'Digital Products' AND parent_id IS NULL LIMIT 1),
  'digital',
  false,
  false,
  999,
  true
FROM (
  VALUES
    ('Business Plan Template', 'A ready-to-use digital template for structuring business ideas, goals, and execution plans.', 0.00),
    ('Budget Template', 'A practical template for organizing income, expenses, and monthly budgeting decisions.', 0.00),
    ('Travel Planner Template', 'A digital planning template for mapping out trips, schedules, and travel details.', 0.00),
    ('Digital Planner', 'An all-purpose digital planner for organizing tasks, goals, and daily priorities.', 0.00),
    ('Expense Spreadsheet', 'A spreadsheet tool for tracking recurring and one-time expenses in a clear format.', 0.00),
    ('Invoice Template', 'A professional invoice template for creating clean billing documents for clients and customers.', 0.00),
    ('Resume Template', 'A polished resume template designed to help users present their experience clearly and professionally.', 0.00),
    ('Investment Tracker Sheet', 'A tracker sheet for monitoring investment activity, balances, and performance over time.', 0.00),
    ('Business Document Bundle', 'A bundle of business-ready digital documents and templates for operations and planning.', 0.00),
    ('Financial Planning Guide', 'A digital guide with structured steps for budgeting, saving, and long-term financial planning.', 0.00),
    ('Travel Planning Guide', 'A digital guide that helps users organize trips, destinations, and travel preparation.', 0.00),
    ('Startup Guide', 'A starter guide covering foundational steps for launching and growing a new business.', 0.00)
) AS v(name, description, price)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name
);

-- FELIX STORE: MEDIA & CONTENT STARTER PRODUCTS
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  type,
  booking_required,
  subscription_required,
  stock,
  active
)
SELECT
  v.name,
  v.description,
  v.price,
  (SELECT id FROM categories WHERE name = 'Media & Content' AND parent_id IS NULL LIMIT 1),
  v.type,
  false,
  v.subscription_required,
  999,
  true
FROM (
  VALUES
    ('Wildlife Documentary Access', 'Access to curated wildlife documentary content focused on nature, conservation, and education.', 0.00, 'digital', false),
    ('Streaming Platform Access', 'Digital access to a streaming content platform for media, educational viewing, and on-demand experiences.', 0.00, 'subscription', true),
    ('Podcast Subscription', 'A subscription-based audio content offering featuring insights, storytelling, and educational discussions.', 0.00, 'subscription', true),
    ('Educational Video Library', 'A library of educational video content covering practical topics for business, finance, and growth.', 0.00, 'digital', false),
    ('Film Downloads', 'Downloadable film and visual media content for offline access and viewing.', 0.00, 'digital', false),
    ('Travel Video Library', 'A collection of destination and travel-focused video resources for inspiration and planning.', 0.00, 'digital', false),
    ('Business Education Videos', 'Video-based business education content designed to support learning, strategy, and execution.', 0.00, 'digital', false),
    ('Storytelling Content Access', 'Access to digital storytelling content including narratives, features, and creative media experiences.', 0.00, 'digital', false)
) AS v(name, description, price, type, subscription_required)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name
);

-- FELIX STORE: LOGISTICS & DELIVERY STARTER PRODUCTS
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  type,
  booking_required,
  subscription_required,
  stock,
  active
)
SELECT
  v.name,
  v.description,
  v.price,
  (SELECT id FROM categories WHERE name = 'Logistics & Delivery' AND parent_id IS NULL LIMIT 1),
  v.type,
  v.booking_required,
  false,
  999,
  true
FROM (
  VALUES
    ('Local Delivery Service', 'A local delivery offering for transporting packages, documents, and small goods efficiently.', 0.00, 'service', false),
    ('Errand Delivery Service', 'A practical service for handling errands, small-item drop-offs, and everyday delivery tasks.', 0.00, 'service', false),
    ('Pickup Service', 'A pickup-focused service for collecting goods, laundry, or packages from customer locations.', 0.00, 'service', false),
    ('Moving Assistance Booking', 'A bookable moving support service for relocation help, loading, and transport coordination.', 0.00, 'booking', true),
    ('Freight Booking Service', 'A freight coordination and booking service for larger transport and delivery needs.', 0.00, 'booking', true),
    ('Logistics Coordination Service', 'A service that helps organize routes, schedules, and delivery logistics for smoother operations.', 0.00, 'service', false)
) AS v(name, description, price, type, booking_required)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name
);

-- FELIX STORE: LIFESTYLE & MARKETPLACE STARTER PRODUCTS
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  type,
  booking_required,
  subscription_required,
  stock,
  active
)
SELECT
  v.name,
  v.description,
  v.price,
  (SELECT id FROM categories WHERE name = 'Lifestyle & Marketplace' AND parent_id IS NULL LIMIT 1),
  v.type,
  false,
  false,
  999,
  true
FROM (
  VALUES
    ('Print on Demand T-Shirts', 'Customizable print-on-demand t-shirts for brand merchandising and lifestyle sales.', 0.00, 'physical'),
    ('Print on Demand Hoodies', 'Branded print-on-demand hoodies designed for comfort, style, and online storefront sales.', 0.00, 'physical'),
    ('Office Supply Packs', 'Curated office supply bundles for productivity, organization, and small business use.', 0.00, 'physical'),
    ('Home Organization Kits', 'Practical kits with tools and products to support cleaner and better-organized home spaces.', 0.00, 'physical'),
    ('Accessories', 'A lifestyle accessories product line for everyday use, gifting, and brand extension.', 0.00, 'physical'),
    ('Wellness Products', 'Products focused on healthy habits, self-care, and wellness-oriented lifestyle support.', 0.00, 'physical'),
    ('Meal Prep Service', 'A prepared meal support offering for convenient planning, healthier routines, and time savings.', 0.00, 'service')
) AS v(name, description, price, type)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name
);

-- FELIX STORE: SUBSCRIPTIONS & MEMBERSHIPS STARTER PRODUCTS
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  type,
  booking_required,
  subscription_required,
  stock,
  active
)
SELECT
  v.name,
  v.description,
  v.price,
  (SELECT id FROM categories WHERE name = 'Subscriptions & Memberships' AND parent_id IS NULL LIMIT 1),
  'subscription',
  false,
  true,
  999,
  true
FROM (
  VALUES
    ('Felix Platform Membership', 'A platform-wide membership offering access to premium tools, perks, and exclusive member benefits.', 0.00),
    ('Travel Club Membership', 'A travel-focused membership with access to exclusive offers, planning perks, and curated opportunities.', 0.00),
    ('Financial Coaching Subscription', 'An ongoing subscription for financial coaching support, resources, and progress guidance.', 0.00),
    ('Business Tools Subscription', 'A recurring subscription that unlocks business-focused tools, templates, and growth resources.', 0.00),
    ('Digital Content Subscription', 'A subscription for ongoing access to digital guides, content libraries, and downloadable resources.', 0.00),
    ('Laundry Subscription (Weekly)', 'A weekly recurring laundry subscription for routine pickup, cleaning, and return service.', 0.00),
    ('Laundry Subscription (Monthly)', 'A monthly laundry membership plan designed for consistent recurring service and convenience.', 0.00)
) AS v(name, description, price)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name
);

-- A & F LAUNDRY: SERVICE LIST + PRICING SETUP
INSERT INTO products (
  name,
  description,
  price,
  category_id,
  type,
  price_type,
  unit,
  min_order_weight,
  subscription_interval,
  image_url,
  booking_required,
  subscription_required,
  stock,
  active
)
SELECT
  v.name,
  v.description,
  v.price,
  (
    SELECT id
    FROM categories
    WHERE name = 'Laundry Services'
    ORDER BY CASE WHEN parent_id IS NOT NULL THEN 0 ELSE 1 END, id
    LIMIT 1
  ),
  v.type,
  v.price_type,
  v.unit,
  v.min_order_weight,
  v.subscription_interval,
  v.image_url,
  v.booking_required,
  v.subscription_required,
  999,
  true
FROM (
  VALUES
    ('Laundry Pickup Service', 'A scheduled laundry pickup option for collecting items directly from the customer location.', 7.00, 'laundry', 'fixed', NULL, NULL, NULL, 'https://example.com/images/laundry-pickup-service.jpg', true, false),
    ('Wash & Fold Service', 'A standard laundry service for washing, drying, and neatly folding everyday clothing items.', 1.85, 'laundry', 'per_lb', 'lb', 5.00, NULL, 'https://example.com/images/wash-fold-service.jpg', true, false),
    ('Dry Cleaning Service', 'A garment care service for delicate fabrics and professional dry-clean-only items.', 8.00, 'laundry', 'per_item', 'item', NULL, NULL, 'https://example.com/images/dry-cleaning-service.jpg', true, false),
    ('Ironing Service', 'A finishing service for pressed, wrinkle-free clothing and presentation-ready garments.', 3.00, 'laundry', 'per_item', 'item', NULL, NULL, 'https://example.com/images/ironing-service.jpg', true, false),
    ('Same Day Laundry Service', 'An express laundry option for urgent same-day cleaning and return.', 3.00, 'laundry', 'per_lb', 'lb', 5.00, NULL, 'https://example.com/images/same-day-laundry-service.jpg', true, false),
    ('Next Day Laundry Service', 'A next-day turnaround laundry option for reliable fast service and convenience.', 2.00, 'laundry', 'per_lb', 'lb', 5.00, NULL, 'https://example.com/images/next-day-laundry-service.jpg', true, false),
    ('Commercial Laundry Service', 'A business-focused laundry solution for recurring cleaning needs across commercial operations.', 1.40, 'laundry', 'per_lb', 'lb', 15.00, NULL, 'https://example.com/images/commercial-laundry-service.jpg', true, false),
    ('Hotel Laundry Service', 'A hospitality laundry service designed for hotels, guest operations, and linen turnover.', 1.35, 'laundry', 'per_lb', 'lb', 15.00, NULL, 'https://example.com/images/hotel-laundry-service.jpg', true, false),
    ('Airbnb Laundry Service', 'A turnover laundry service built for short-stay hosts managing guest linens and fabric care.', 25.00, 'laundry', 'per_load', 'load', NULL, NULL, 'https://example.com/images/airbnb-laundry-service.jpg', true, false),
    ('Bulk Laundry Service', 'A large-volume laundry service for households, businesses, and institutional loads.', 1.20, 'laundry', 'per_lb', 'lb', 20.00, NULL, 'https://example.com/images/bulk-laundry-service.jpg', true, false),
    ('Laundry Delivery Service', 'A return-delivery service that brings cleaned laundry back to the customer after processing.', 6.00, 'laundry', 'fixed', NULL, NULL, NULL, 'https://example.com/images/laundry-delivery-service.jpg', true, false),
    ('Laundry Subscription Weekly', 'A recurring weekly laundry plan for routine pickup, washing, and delivery service.', 50.00, 'subscription', 'subscription', NULL, NULL, 'weekly', 'https://example.com/images/laundry-subscription-weekly.jpg', false, true),
    ('Laundry Subscription Monthly', 'A monthly subscription plan for consistent laundry support and predictable service scheduling.', 150.00, 'subscription', 'subscription', NULL, NULL, 'monthly', 'https://example.com/images/laundry-subscription-monthly.jpg', false, true),
    ('Comforter Cleaning', 'A specialized cleaning service for comforters, duvets, and bulky bedding items.', 20.00, 'laundry', 'per_item', 'item', NULL, NULL, 'https://example.com/images/comforter-cleaning.jpg', true, false),
    ('Curtain Cleaning', 'A fabric care service for cleaning curtains, drapes, and household window treatments.', 15.00, 'laundry', 'per_item', 'panel', NULL, NULL, 'https://example.com/images/curtain-cleaning.jpg', true, false),
    ('Uniform Cleaning', 'A recurring or one-time uniform cleaning service for staff apparel and workwear.', 8.00, 'laundry', 'per_item', 'uniform', NULL, NULL, 'https://example.com/images/uniform-cleaning.jpg', true, false),
    ('Shoe Cleaning', 'A care service for cleaning and refreshing everyday footwear and specialty shoes.', 20.00, 'laundry', 'per_item', 'pair', NULL, NULL, 'https://example.com/images/shoe-cleaning.jpg', true, false)
) AS v(name, description, price, type, price_type, unit, min_order_weight, subscription_interval, image_url, booking_required, subscription_required)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name
);

UPDATE products AS p
SET
  description = v.description,
  price = v.price,
  type = v.type,
  price_type = v.price_type,
  unit = v.unit,
  min_order_weight = v.min_order_weight,
  subscription_interval = v.subscription_interval,
  image_url = v.image_url,
  booking_required = v.booking_required,
  subscription_required = v.subscription_required,
  active = true
FROM (
  VALUES
    ('Express Laundry Pickup', 'A fast laundry pickup option for same-area collection and convenient order scheduling.', 7.00, 'laundry', 'fixed', NULL, NULL, NULL, 'https://example.com/images/express-laundry-pickup.jpg', true, false),
    ('Laundry Pickup Service', 'A scheduled laundry pickup option for collecting items directly from the customer location.', 7.00, 'laundry', 'fixed', NULL, NULL, NULL, 'https://example.com/images/laundry-pickup-service.jpg', true, false),
    ('Wash & Fold Service', 'A standard laundry service for washing, drying, and neatly folding everyday clothing items.', 1.85, 'laundry', 'per_lb', 'lb', 5.00, NULL, 'https://example.com/images/wash-fold-service.jpg', true, false),
    ('Dry Cleaning Service', 'A garment care service for delicate fabrics and professional dry-clean-only items.', 8.00, 'laundry', 'per_item', 'item', NULL, NULL, 'https://example.com/images/dry-cleaning-service.jpg', true, false),
    ('Ironing Service', 'A finishing service for pressed, wrinkle-free clothing and presentation-ready garments.', 3.00, 'laundry', 'per_item', 'item', NULL, NULL, 'https://example.com/images/ironing-service.jpg', true, false),
    ('Same Day Laundry Service', 'An express laundry option for urgent same-day cleaning and return.', 3.00, 'laundry', 'per_lb', 'lb', 5.00, NULL, 'https://example.com/images/same-day-laundry-service.jpg', true, false),
    ('Next Day Laundry Service', 'A next-day turnaround laundry option for reliable fast service and convenience.', 2.00, 'laundry', 'per_lb', 'lb', 5.00, NULL, 'https://example.com/images/next-day-laundry-service.jpg', true, false),
    ('Commercial Laundry Service', 'A business-focused laundry solution for recurring cleaning needs across commercial operations.', 1.40, 'laundry', 'per_lb', 'lb', 15.00, NULL, 'https://example.com/images/commercial-laundry-service.jpg', true, false),
    ('Hotel Laundry Service', 'A hospitality laundry service designed for hotels, guest operations, and linen turnover.', 1.35, 'laundry', 'per_lb', 'lb', 15.00, NULL, 'https://example.com/images/hotel-laundry-service.jpg', true, false),
    ('Airbnb Laundry Service', 'A turnover laundry service built for short-stay hosts managing guest linens and fabric care.', 25.00, 'laundry', 'per_load', 'load', NULL, NULL, 'https://example.com/images/airbnb-laundry-service.jpg', true, false),
    ('Bulk Laundry Service', 'A large-volume laundry service for households, businesses, and institutional loads.', 1.20, 'laundry', 'per_lb', 'lb', 20.00, NULL, 'https://example.com/images/bulk-laundry-service.jpg', true, false),
    ('Laundry Delivery Service', 'A return-delivery service that brings cleaned laundry back to the customer after processing.', 6.00, 'laundry', 'fixed', NULL, NULL, NULL, 'https://example.com/images/laundry-delivery-service.jpg', true, false),
    ('Laundry Subscription Weekly', 'A recurring weekly laundry plan for routine pickup, washing, and delivery service.', 50.00, 'subscription', 'subscription', NULL, NULL, 'weekly', 'https://example.com/images/laundry-subscription-weekly.jpg', false, true),
    ('Laundry Subscription Monthly', 'A monthly subscription plan for consistent laundry support and predictable service scheduling.', 150.00, 'subscription', 'subscription', NULL, NULL, 'monthly', 'https://example.com/images/laundry-subscription-monthly.jpg', false, true),
    ('Laundry Subscription (Weekly)', 'A weekly recurring laundry subscription for routine pickup, cleaning, and return service.', 50.00, 'subscription', 'subscription', NULL, NULL, 'weekly', 'https://example.com/images/laundry-subscription-weekly.jpg', false, true),
    ('Laundry Subscription (Monthly)', 'A monthly laundry membership plan designed for consistent recurring service and convenience.', 150.00, 'subscription', 'subscription', NULL, NULL, 'monthly', 'https://example.com/images/laundry-subscription-monthly.jpg', false, true),
    ('Comforter Cleaning', 'A specialized cleaning service for comforters, duvets, and bulky bedding items.', 20.00, 'laundry', 'per_item', 'item', NULL, NULL, 'https://example.com/images/comforter-cleaning.jpg', true, false),
    ('Curtain Cleaning', 'A fabric care service for cleaning curtains, drapes, and household window treatments.', 15.00, 'laundry', 'per_item', 'panel', NULL, NULL, 'https://example.com/images/curtain-cleaning.jpg', true, false),
    ('Uniform Cleaning', 'A recurring or one-time uniform cleaning service for staff apparel and workwear.', 8.00, 'laundry', 'per_item', 'uniform', NULL, NULL, 'https://example.com/images/uniform-cleaning.jpg', true, false),
    ('Shoe Cleaning', 'A care service for cleaning and refreshing everyday footwear and specialty shoes.', 20.00, 'laundry', 'per_item', 'pair', NULL, NULL, 'https://example.com/images/shoe-cleaning.jpg', true, false)
) AS v(name, description, price, type, price_type, unit, min_order_weight, subscription_interval, image_url, booking_required, subscription_required)
WHERE p.name = v.name;
