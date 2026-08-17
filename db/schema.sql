-- phone-checker database schema
-- Run against your Neon database, e.g.:
--   psql "$DATABASE_URL" -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    phone_number  TEXT NOT NULL UNIQUE, -- normalized E.164 format, e.g. +14155552671
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users (phone_number);
