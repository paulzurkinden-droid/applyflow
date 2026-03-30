# ApplyFlow — n8n Workflows Documentation

## Overview

ApplyFlow uses 5 n8n Cloud workflows to automate the job search process.

> **Security note (BUG-009):** Webhook paths are secrets — regenerate any exposed webhook URL
> via n8n UI (Webhook node > regenerate path) if this repo becomes public.
> Never commit raw webhook UUIDs to version control.

---

## WF-A — Onboarding Utilisateur
- **Status:** Active
- **Trigger:** Webhook (called by Tally form on profile submission)
- **Purpose:** Creates/updates the user profile in Supabase after Tally form submission
- **Do not modify** — already stable and active

---

## WF-B — Alertes Offres Emploi
- **Status:** Active
- **Trigger:** Cron — every day at 08:00 and 18:00
- **Purpose:**
  1. Fetches all active user profiles and their job preferences
  2. Scrapes job offers from Adzuna, Confederation (RSS), and Jobup (RSS)
  3. Scores each offer using Claude AI (1–10)
  4. Saves all offers ≥1 to `offres_alertes` table
  5. Sends ONE digest email per user (for offers scoring ≥7)
- **Env vars required:** `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` (set in n8n Cloud > Settings > Environment Variables)

### How to test WF-B
```
# Trigger manually from n8n UI: click "Test workflow"
# Or wait for 08:00/18:00 cron
# Check: offres_alertes table in Supabase
# Check: email inbox of active users with matching preferences
```

---

## WF-C — Generation Lettre de Motivation
- **Status:** Active
- **Trigger:** Webhook POST `/webhook/generate-lm`
- **Webhook URL:** `https://[YOUR_N8N_INSTANCE]/webhook/generate-lm`
- **Purpose:**
  1. Validates request (user_id, titre_poste, entreprise, description_offre)
  2. Checks plan: **Pro or Booster required** — returns 403 for Starter/inactive accounts
  3. Fetches user profile and preferences from Supabase
  4. Generates cover letter using Claude AI
  5. Copies Google Docs template and fills placeholders
  6. Shares document with user and logs candidature in Supabase
  7. Sends cover letter link by email via Resend
  8. Returns JSON with `candidature_id`, `lm_url`, `email_sent`

### Request format
```json
POST /webhook/generate-lm
Content-Type: application/json

{
  "user_id": "uuid-of-profile",
  "titre_poste": "Chef de projet digital",
  "entreprise": "Etat de Vaud",
  "url_offre": "https://jobs.example.ch/xxx",
  "description_offre": "Description du poste..."
}
```

### Response format
```json
{
  "success": true,
  "candidature_id": "uuid",
  "lm_url": "https://docs.google.com/document/d/xxx/edit",
  "email_sent": true
}
```

### Error responses
- `422` — Missing required fields
- `403` — Plan insuffisant (Starter plan or inactive account)

---

## WF-D — CRM Candidatures
- **Status:** Active
- **Trigger:** Webhook POST `/webhook/update-candidature`
- **Webhook URL:** `https://[YOUR_N8N_INSTANCE]/webhook/update-candidature`
- **Purpose:** Updates candidature status in the `candidatures` Supabase table

### Request format
```json
POST /webhook/update-candidature
Content-Type: application/json

{
  "candidature_id": "uuid",
  "user_id": "uuid",
  "statut": "Entretien",
  "notes": "RDV le 3 avril"
}
```

---

## WF-STRIPE — Gestion Abonnements
- **Status:** Active
- **Trigger:** Stripe Webhook POST `/webhook/stripe-applyflow`
- **Webhook URL:** `https://[YOUR_N8N_INSTANCE]/webhook/stripe-applyflow`
- **Authentication:** HMAC-SHA256 signature verification via `Code - Verifier signature Stripe`
  node (BUG-006 fix). Secret stored in n8n env var `STRIPE_WEBHOOK_SECRET`.
- **Purpose:**
  1. `checkout.session.completed` → creates/updates profil, invites user to Supabase Auth, sends welcome email
  2. `customer.subscription.updated` → updates user plan
  3. `customer.subscription.deleted` → deactivates user, sends cancellation email

### How to test WF-STRIPE
```bash
# Use Stripe CLI:
stripe listen --forward-to https://[YOUR_N8N_INSTANCE]/webhook/stripe-applyflow
stripe trigger checkout.session.completed

# Or via Stripe Dashboard > Developers > Webhooks > Send test event
```

---

## Credentials Required in n8n

| Credential Name | Type | Used By |
|---|---|---|
| Supabase account | Supabase API | WF-A, WF-B, WF-C, WF-D, WF-STRIPE |
| Header Auth account (Anthropic) | HTTP Header Auth | WF-B, WF-C |
| Google Drive account 2 | Google Drive OAuth2 | WF-C (template copy + batchUpdate) |
| Resend API | HTTP Header Auth | WF-B, WF-C, WF-STRIPE |

## Environment Variables Required in n8n

| Variable | Purpose |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | HMAC signature verification in WF-STRIPE |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Auth admin invite in WF-STRIPE |
| `ADZUNA_APP_ID` | Adzuna job search API in WF-B |
| `ADZUNA_APP_KEY` | Adzuna job search API in WF-B |

---

## Exported Workflow Files

Workflow JSONs are stored in `n8n/workflows/` and kept in sync with the live n8n instance:

| File | Workflow |
|---|---|
| `wf-a-onboarding.json` | WF-A Onboarding |
| `wf-b-alertes-offres.json` | WF-B Alertes Offres Emploi |
| `wf-c-generation-lm.json` | WF-C Generation Lettre de Motivation |
| `wf-d-crm-candidatures.json` | WF-D CRM Candidatures |
| `wf-stripe-abonnements.json` | WF-STRIPE Gestion Abonnements |

To import into a new n8n instance: **Settings > Import workflow** > select the JSON file.
