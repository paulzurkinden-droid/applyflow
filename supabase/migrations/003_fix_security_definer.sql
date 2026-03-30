-- Migration 003: BUG-018 fix — SECURITY DEFINER functions must set search_path
-- BUG-012: Ensure link_auth_user_to_profile is secure and properly chains user_id to profil
-- Apply via Supabase Dashboard > SQL Editor

-- Fix search_path for SECURITY DEFINER functions (security hardening)
CREATE OR REPLACE FUNCTION link_auth_user_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profils SET user_id = NEW.id WHERE email = NEW.email AND user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
