CREATE TABLE IF NOT EXISTS appointments (
    id text PRIMARY KEY,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_email text NOT NULL,
    dropoff_date text NOT NULL,
    dropoff_time text NOT NULL,
    pickup_date text,
    pickup_time text,
    soap_type text NOT NULL,
    has_heavy_items boolean DEFAULT false,
    heavy_items_count integer DEFAULT 0,
    special_instructions text,
    status text NOT NULL DEFAULT 'scheduled',
    reschedule_token text,
    reminders_sent text[] NOT NULL DEFAULT ARRAY[]::text[],
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_reschedule_token_idx ON appointments (reschedule_token);
CREATE INDEX IF NOT EXISTS appointments_dropoff_date_idx ON appointments (dropoff_date);
