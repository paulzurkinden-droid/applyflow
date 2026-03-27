# DATA_MODEL.md — ApplyFlow

*Version 1.0 — 27 mars 2026*

---

## 1. Schéma Supabase (état complet)

### Table `profils`

```sql
CREATE TABLE profils (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nom             TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  plan            TEXT NOT NULL DEFAULT 'starter'
                  CHECK (plan IN ('starter', 'pro', 'booster')),
  cv_texte        TEXT,          -- Contenu extrait/généré du CV par Claude
  cv_url          TEXT,          -- URL Google Docs du CV généré
  description_libre TEXT,
  actif           BOOLEAN NOT NULL DEFAULT true,
  stripe_customer_id TEXT UNIQUE, -- ID client Stripe (ex: cus_xxx)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_profils_email ON profils(email);
CREATE INDEX idx_profils_actif ON profils(actif) WHERE actif = true;
CREATE INDEX idx_profils_user_id ON profils(user_id);

-- RLS
ALTER TABLE profils ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profils FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile"
  ON profils FOR UPDATE USING (auth.uid() = user_id);
-- Service role (n8n) bypass RLS via service_role key
```

### Table `preferences_recherche`

```sql
CREATE TABLE preferences_recherche (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  poste_cible     TEXT NOT NULL,
  localisation    TEXT NOT NULL,   -- Cantons séparés par virgule: "Vaud, Genève"
  type_contrat    TEXT,            -- "CDI, CDD" ou "Stage/Apprentissage"
  taux_travail    TEXT,            -- "80-100%, Flexible"
  salaire_min     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prefs_user_id ON preferences_recherche(user_id);

ALTER TABLE preferences_recherche ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences"
  ON preferences_recherche FOR ALL USING (
    auth.uid() = (SELECT user_id FROM profils WHERE id = preferences_recherche.user_id)
  );
```

### Table `offres_alertes`

```sql
CREATE TABLE offres_alertes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  source          TEXT NOT NULL CHECK (source IN ('Adzuna', 'Confederation', 'Jobup')),
  titre           TEXT NOT NULL,
  entreprise      TEXT,
  url             TEXT NOT NULL,
  localisation    TEXT,
  date_trouvee    DATE NOT NULL DEFAULT CURRENT_DATE,
  date_publication DATE,
  description     TEXT,           -- Tronqué à 2000 chars
  envoyee         BOOLEAN NOT NULL DEFAULT false,
  score           INTEGER CHECK (score BETWEEN 1 AND 10),
  raison          TEXT,           -- Explication du score par Claude
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, url)             -- Dédoublonnage par user + URL
);

CREATE INDEX idx_offres_user_id ON offres_alertes(user_id);
CREATE INDEX idx_offres_score ON offres_alertes(score) WHERE score >= 7;
CREATE INDEX idx_offres_envoyee ON offres_alertes(envoyee) WHERE envoyee = false;

ALTER TABLE offres_alertes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own alerts"
  ON offres_alertes FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profils WHERE id = offres_alertes.user_id)
  );
```

### Table `candidatures`

```sql
CREATE TABLE candidatures (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  titre_poste     TEXT NOT NULL,
  entreprise      TEXT NOT NULL,
  url_offre       TEXT,
  statut          TEXT NOT NULL DEFAULT 'A envoyer'
                  CHECK (statut IN ('A envoyer', 'Envoyée', 'Réponse reçue',
                                    'Entretien', 'Offre reçue', 'Refus', 'Abandonnée')),
  date_candidature DATE NOT NULL DEFAULT CURRENT_DATE,
  lettre_generee  TEXT,           -- URL Google Docs LM
  notes           TEXT,           -- Notes libres du candidat
  offre_alerte_id UUID REFERENCES offres_alertes(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cand_user_id ON candidatures(user_id);
CREATE INDEX idx_cand_statut ON candidatures(statut);

ALTER TABLE candidatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own candidatures"
  ON candidatures FOR ALL USING (
    auth.uid() = (SELECT user_id FROM profils WHERE id = candidatures.user_id)
  );
```

---

## 2. Format normalisé d'une offre (n8n interne)

Format intermédiaire utilisé entre le parser et Supabase dans WF-B :

```typescript
interface OffreNormalisee {
  source: 'Adzuna' | 'Confederation' | 'Jobup';
  titre: string;
  entreprise: string;
  url: string;                   // URL canonique (dedupe key)
  localisation: string;
  date_publication: string;      // Format YYYY-MM-DD
  description: string;           // Max 2000 chars, tronqué si nécessaire
  user_id: string;               // UUID Supabase du profil
  email: string;                 // Pour email alerte
}
```

---

## 3. Format de réponse scoring Claude (WF-B)

```typescript
interface ScoreItem {
  index: number;                  // Position dans le batch (1-based)
  score: number;                  // 1-10
  mots_cles: string[];            // Mots-clés matchés
  raison: string;                 // Explication ≤ 100 chars
}
```

---

## 4. Format de réponse génération LM Claude (WF-C)

```typescript
interface LettreMotivation {
  destinataire_nom: string;
  destinataire_adresse: string;
  destinataire_ville: string;
  objet_label: string;            // "Objet :"
  objet: string;                  // "Candidature au poste de..."
  lieu_date: string;              // "Lausanne, le 27 mars 2026"
  salutation: string;             // "Madame, Monsieur,"
  para_accroche: string;
  para_arg1: string;
  para_arg2: string;
  para_competences: string;
  para_conclusion: string;
  formule_politesse: string;
}
```

---

## 5. Payload Webhook Stripe (checkout.session.completed)

Champs utilisés par WF-STRIPE :

```typescript
interface StripeCheckoutSession {
  type: 'checkout.session.completed';
  data: {
    object: {
      customer: string;           // "cus_xxx"
      customer_email: string;
      subscription: string;       // "sub_xxx"
      metadata: {
        plan: 'starter' | 'pro' | 'booster';
      };
    };
  };
}
```

---

## 6. Migrations SQL à appliquer

### Migration 001 — Ajout colonnes manquantes (à appliquer si tables déjà créées)

```sql
-- Ajouter stripe_customer_id à profils
ALTER TABLE profils ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ajouter champs manquants à candidatures
ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS offre_alerte_id UUID REFERENCES offres_alertes(id);
ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ajouter taux_travail à preferences_recherche
ALTER TABLE preferences_recherche ADD COLUMN IF NOT EXISTS taux_travail TEXT;
ALTER TABLE preferences_recherche ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Contrainte UNIQUE sur offres_alertes (si pas déjà présente)
ALTER TABLE offres_alertes ADD CONSTRAINT offres_alertes_user_url_unique UNIQUE (user_id, url);
```

### Trigger updated_at automatique

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profils
  BEFORE UPDATE ON profils
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_candidatures
  BEFORE UPDATE ON candidatures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```
