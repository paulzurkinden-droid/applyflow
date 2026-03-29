-- Migration 004: BUG-016 — Add annees_exp column to profils
-- Apply via Supabase Dashboard > SQL Editor

ALTER TABLE profils ADD COLUMN IF NOT EXISTS annees_exp INTEGER DEFAULT 0;
COMMENT ON COLUMN profils.annees_exp IS 'Années d''expérience professionnelle, collectées via Tally';
