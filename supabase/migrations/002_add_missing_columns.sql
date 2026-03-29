-- Migration 002: Add missing columns if upgrading from older schema
-- Safe to run on fresh installs too (uses IF NOT EXISTS / IF NOT EXISTS guards)
-- Apply via Supabase SQL Editor: https://supabase.com/dashboard/project/yltajummrsorqvynvod/sql

ALTER TABLE profils ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS offre_alerte_id UUID REFERENCES offres_alertes(id);
ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE preferences_recherche ADD COLUMN IF NOT EXISTS taux_travail TEXT;
ALTER TABLE preferences_recherche ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add unique constraint on offres_alertes if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'offres_alertes_user_url_unique'
  ) THEN
    ALTER TABLE offres_alertes ADD CONSTRAINT offres_alertes_user_url_unique UNIQUE (user_id, url);
  END IF;
END $$;
