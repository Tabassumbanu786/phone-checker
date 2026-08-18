-- Manually inserts test phone numbers. There is no API or app code path that
-- inserts rows — this is intentionally a standalone script you run directly
-- against Neon.
--
--   psql "$DATABASE_URL" -f db/seed_test_row.sql

INSERT INTO users (phone_number) VALUES
    ('+14155552671'), -- US test number
    ('+917021710954')  -- India test number (used for Zoho SalesIQ testing)
ON CONFLICT (phone_number) DO NOTHING;
