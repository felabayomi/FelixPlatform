-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text UNIQUE,
  phone text,
  password text,
  role text DEFAULT 'customer',
  created_at timestamp DEFAULT now()
);

-- VENDORS (for marketplace later)
CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  approved boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- CATEGORIES
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  parent_id uuid,
  created_at timestamp DEFAULT now()
);

-- PRODUCTS (apps, services, digital, physical)
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric,
  category_id uuid REFERENCES categories(id),
  vendor_id uuid REFERENCES vendors(id),
  type text,
  price_type text DEFAULT 'fixed',
  unit text,
  min_order_weight numeric,
  subscription_interval text,
  action_label text,
  image_url text,
  download_url text,
  booking_required boolean DEFAULT false,
  subscription_required boolean DEFAULT false,
  stock integer,
  active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- PRODUCT CATEGORY TAGS (allow a product to appear in more than one category)
CREATE TABLE product_categories (
  id bigserial PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (product_id, category_id)
);

-- PRODUCT IMAGES
CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  image_url text
);

-- ADDRESSES
CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  country text
);

-- ORDERS (Felix Store purchases, laundry jobs, service orders)
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  subtotal numeric,
  delivery_fee numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric,
  final_total numeric,
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  payment_method text,
  delivery_type text,
  app_name text DEFAULT 'Felix Store',
  notes text,
  address_id uuid REFERENCES addresses(id),
  created_at timestamp DEFAULT now()
);

-- ORDER ITEMS
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  product_id uuid REFERENCES products(id),
  product_name_snapshot text,
  quantity integer DEFAULT 1,
  measured_quantity numeric DEFAULT 1,
  unit text,
  price_type text DEFAULT 'fixed',
  unit_price numeric,
  price numeric,
  line_total numeric,
  item_notes text
);

-- BOOKINGS (Laundry, services, travel, etc.)
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  product_id uuid REFERENCES products(id),
  booking_date date,
  booking_time text,
  service_date date,
  service_window text,
  status text DEFAULT 'pending',
  notes text,
  special_instructions text,
  pickup_address text,
  delivery_address text,
  contact_name text,
  contact_phone text,
  assigned_driver text,
  weight_estimate numeric,
  app_name text DEFAULT 'A & F Laundry',
  created_at timestamp DEFAULT now()
);

-- QUOTE REQUESTS (unified quote-first workflow for products and services)
CREATE TABLE quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  product_id uuid REFERENCES products(id),
  details text,
  quantity numeric,
  status text DEFAULT 'pending',
  quoted_price numeric,
  admin_notes text,
  created_at timestamp DEFAULT now()
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  product_id uuid REFERENCES products(id),
  status text,
  billing_interval text,
  renewal_price numeric,
  app_name text DEFAULT 'Felix Store',
  start_date date,
  end_date date
);

-- DIGITAL DOWNLOADS
CREATE TABLE downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  product_id uuid REFERENCES products(id),
  download_url text,
  created_at timestamp DEFAULT now()
);

-- PAYMENTS
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  order_id uuid,
  amount numeric,
  provider text,
  status text,
  created_at timestamp DEFAULT now()
);

-- WACI (reuse shared `users` and `support_requests`; add only WACI-specific records below)
CREATE TABLE waci_newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name text NOT NULL DEFAULT 'WACI',
  storefront_key text NOT NULL DEFAULT 'waci',
  full_name text,
  email text NOT NULL,
  interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS waci_newsletter_subscribers_app_email_idx
  ON waci_newsletter_subscribers (app_name, LOWER(email));

CREATE TABLE waci_volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  area_of_interest text,
  availability text,
  preferred_contact text,
  notes text,
  status text NOT NULL DEFAULT 'new',
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE waci_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  organization text,
  email text NOT NULL,
  phone text,
  partnership_type text,
  preferred_contact text,
  notes text,
  status text NOT NULL DEFAULT 'new',
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE waci_donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  organization text,
  email text NOT NULL,
  phone text,
  support_type text,
  amount_text text,
  preferred_contact text,
  notes text,
  status text NOT NULL DEFAULT 'new',
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE waci_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  region text,
  image_url text,
  cta_label text,
  cta_link text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE waci_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  location text,
  published_at date,
  image_url text,
  link text,
  featured boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE waci_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  file_url text,
  alt_text text,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
