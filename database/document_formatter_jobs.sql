CREATE TABLE IF NOT EXISTS document_formatter_jobs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL,
    export_format TEXT NOT NULL,
    title TEXT,
    source_type TEXT NOT NULL DEFAULT 'text',
    input_filename TEXT,
    content_length INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
