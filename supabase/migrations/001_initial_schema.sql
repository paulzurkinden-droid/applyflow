-- Migration 001: Initial schema for ApplyFlow
-- Apply via Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/[YOUR_SUPABASE_PROJECT_REF]/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profils
CREATE TABLE IF NOT EXISTS profils (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nom               TEXT NOT NULL,
  email             TEXT UNIQUE NOT NULL,
  plan              TEXT NOT NULL DEFAULT 'starter'
                    CHECK (plan IN ('starter', 'pro', 'booster')),
  cv_texte          TEXT,
  cv_url            TEXT,
  description_libre TEXT,
  actif             BOOLEAN NOT NULL DEFAULT true,
  stripe_customer_id TEXT UNIQUE,
  annees_exp        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profils_email    ON profils(email);
CREATE INDEX IF NOT EXISTS idx_profils_actif    ON profils(actif) WHERE actif = true;
CREATE INDEX IF NOT EXISTS idx_profils_user_id  ON profils(user_id);

ALTER TABLE profils ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profils FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile"
  ON profils FOR UPDATE USING (auth.uid() = user_id);

-- Table: preferences_recherche
CREATE TABLE IF NOT EXISTS preferences_recherche (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  poste_cible     TEXT NOT NULL,
  localisation    TEXT NOT NULL,
  type_contrat    TEXT,
  taux_travail    TEXT,
  salaire_min     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prefs_user_id ON preferences_recherche(user_id);
ALTER TABLE preferences_recherche ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences"
  ON preferences_recherche FOR ALL USING (
    auth.uid() = (SELECT user_id FROM profils WHERE id = preferences_recherche.user_id)
  );

-- Table: offres_alertes
CREATE TABLE IF NOT EXISTS offres_alertes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  source           TEXT NOT NULL CHECK (source IN ('Adzuna', 'Confederation', 'Jobup')),
  titre            TEXT NOT NULL,
  entreprise       TEXT,
  url              TEXT NOT NULL,
  localisation     TEXT,
  date_trouvee     DATE NOT NULL DEFAULT CURRENT_DATE,
  date_publication DATE,
  description      TEXT,
  envoyee          BOOLEAN NOT NULL DEFAULT false,
  score            INTEGER CHECK (score BETWEEN 1 AND 10),
  raison           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_offres_user_id ON offres_alertes(user_id);
CREATE INDEX IF NOT EXISTS idx_offres_score   ON offres_alertes(score) WHERE score >= 7;
CREATE INDEX IF NOT EXISTS idx_offres_envoyee ON offres_alertes(envoyee) WHERE envoyee = false;

ALTER TABLE offres_alertes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own alerts"
  ON offres_alertes FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profils WHERE id = offres_alertes.user_id)
  );

-- Table: candidatures
CREATE TABLE IF NOT EXISTS candidatures (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  titre_poste      TEXT NOT NULL,
  entreprise       TEXT NOT NULL,
  url_offre        TEXT,
  statut           TEXT NOT NULL DEFAULT 'A envoyer'
                   CHECK (statut IN (
                     'A envoyer', 'Envoyee', 'Reponse recue',
                     'Entretien', 'Offre recue', 'Refus', 'Abandonnee'
                   )),
  date_candidature DATE NOT NULL DEFAULT CURRENT_DATE,
  lettre_generee   TEXT,
  notes            TEXT,
  offre_alerte_id  UUID REFERENCES offres_alertes(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cand_user_id ON candidatures(user_id);
CREATE INDEX IF NOT EXISTS idx_cand_statut  ON candidatures(statut);

ALTER TABLE candidatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own candidatures"
  ON candidatures FOR ALL USING (
    auth.uid() = (SELECT user_id FROM profils WHERE id = candidatures.user_id)
  );

-- ============================================================
-- Trigger function: auto-update updated_at on any UPDATE
-- BUG-018: SET search_path prevents search_path injection attacks
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

CREATE TRIGGER set_updated_at_profils
  BEFORE UPDATE ON profils
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_candidatures
  BEFORE UPDATE ON candidatures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_preferences
  BEFORE UPDATE ON preferences_recherche
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Trigger function: link Supabase Auth user_id to profil on signup
-- Fires after Stripe webhook creates the Auth user via admin API.
-- BUG-018: SECURITY DEFINER + SET search_path (prevents privilege escalation)
-- ============================================================
CREATE OR REPLACE FUNCTION link_auth_user_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profils
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_auth_user_to_profile();
