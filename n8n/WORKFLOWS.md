# ApplyFlow — n8n Workflows Documentation

## Overview

ApplyFlow uses 5 n8n Cloud workflows to automate the job search process.
All workflows run on: https://p2urkinden.app.n8n.cloud

---

## WF-A — Onboarding Utilisateur
- **ID:** `EddlSDFtz15DWldl`
- **Status:** ✅ ACTIVE
- **Trigger:** Webhook (called by Stripe or direct API)
- **Purpose:** Creates the user profile in Supabase after signup
- **Do not modify** — already stable and active

---

## WF-B — Alertes Offres Emploi
- **ID:** `IfrDW7U3g7yzxr1d`
- **Status:** ✅ ACTIVE
- **Trigger:** Cron — every day at 08:00 and 18:00
- **Purpose:** 
  1. Fetches all active user profiles and their job preferences
  2. Scrapes job offers from Adzuna, Confederation (RSS), and Jobup (RSS)
  3. Scores each offer using Claude AI (1–10)
  4. Saves all offers ≥1 to `offres_alertes` table
  5. Sends email digest via Resend for offers scoring ≥7
- **Key nodes:**
  - `HTTP - Fetch Adzuna` — Adzuna REST API
  - `HTTP - Fetch RSS Confédération` — Swiss confederation job RSS
  - `HTTP - Fetch RSS Jobup` — Jobup RSS feed
  - `HTTP - Claude Scoring` — Anthropic Claude for relevance scoring
  - `HTTP - Envoyer alerte Resend` — sends digest email

### How to test WF-B
```
# Trigger manually from n8n UI: click "Test workflow"
# Or wait for 08:00/18:00 cron
# Check: offres_alertes table in Supabase
# Check: email inbox of active users with matching preferences
```

---

## WF-C — Génération Lettre de Motivation
- **ID:** `m6voz15eYd38v4Ax`
- **Status:** ✅ ACTIVE
- **Trigger:** Webhook — `POST /webhook/generate-lm`
- **Webhook URL:** `https://p2urkinden.app.n8n.cloud/webhook/generate-lm`
- **Purpose:**
  1. Receives request with `user_id`, `offre_id`, optionally `cv_texte`
  2. Validates request and checks plan (Pro or Booster required)
  3. Fetches user profile and job preferences from Supabase
  4. Generates cover letter using Claude AI
  5. Copies Google Docs template and fills in the letter
  6. Shares document and logs candidature in Supabase
  7. Sends cover letter by email via Resend
  8. Returns JSON with `candidature_id`, `lm_url`, `email_sent`
- **Access control:** Only `pro` and `booster` plans can use this endpoint

### Request format
```json
POST https://p2urkinden.app.n8n.cloud/webhook/generate-lm
Content-Type: application/json

{
  "user_id": "uuid-of-profile",
  "offre_id": "uuid-of-offre-alerte",
  "cv_texte": "optional override CV text"
}
```

### Response format
```json
{
  "success": true,
  "candidature_id": "uuid",
  "lm_url": "https://docs.google.com/...",
  "email_sent": true
}
```

### Error responses
- `422` — Missing required fields
- `403` — Plan insuffisant (starter plan)

### How to test WF-C
```bash
curl -X POST https://p2urkinden.app.n8n.cloud/webhook/generate-lm \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<profile-uuid>", "offre_id": "<offre-uuid>"}'
```

---

## WF-D — CRM Candidatures
- **ID:** `PGCPbeGDdBlmPF4X`
- **Status:** ✅ ACTIVE
- **Trigger:** Webhook or Supabase trigger (based on workflow configuration)
- **Purpose:** Manages the candidature pipeline — status updates, reminders, tracking
- **Key nodes:** Supabase CRUD on `candidatures` table

### How to test WF-D
```
# Trigger manually from n8n UI
# Or via configured webhook/trigger
# Check candidatures table in Supabase
```

---

## WF-STRIPE — Gestion Abonnements
- **ID:** `Sp9T1mGtUkjQy9Sn`
- **Status:** ✅ ACTIVE
- **Trigger:** Stripe Webhook — `POST /webhook/stripe-applyflow`
- **Webhook URL:** `https://p2urkinden.app.n8n.cloud/webhook/stripe-applyflow`
- **Authentication:** HMAC-SHA256 signature verification via `Code - Verifier signature Stripe` node (BUG-006 fix). Secret stored in n8n env var `STRIPE_WEBHOOK_SECRET`.
- **Purpose:**
  1. Receives Stripe events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  2. On new subscription: creates/updates profil, invites user to Supabase Auth, sends welcome email
  3. On subscription update: updates user plan in Supabase
  4. On cancellation: deactivates user, sends cancellation email
- **Events handled:**
  - `checkout.session.completed` → new subscriber flow
  - `customer.subscription.updated` → plan change
  - `customer.subscription.deleted` → cancellation

### How to test WF-STRIPE
```bash
# Use Stripe CLI to forward events locally (for testing):
stripe listen --forward-to https://p2urkinden.app.n8n.cloud/webhook/stripe-applyflow

# Or use Stripe dashboard > Webhooks > Send test event
# Select event type: checkout.session.completed
```

---

## Webhook URLs Summary

> ⚠️ **Security note (BUG-009):** Webhook paths are secrets — regenerate any exposed webhook URL via n8n UI if this repo becomes public. Never commit raw webhook UUIDs to version control.

| Workflow | Webhook URL |
|----------|-------------|
| WF-A Onboarding | `https://p2urkinden.app.n8n.cloud/webhook/[WF-A-WEBHOOK-PATH]` — regenerate if exposed |
| WF-C Génération LM | `https://p2urkinden.app.n8n.cloud/webhook/generate-lm` |
| WF-STRIPE Abonnements | `https://p2urkinden.app.n8n.cloud/webhook/stripe-applyflow` |

---

## Credentials Required in n8n

| Credential Name | Type | Used By |
|----------------|------|---------|
| Supabase account | Supabase API | WF-A, WF-B, WF-C, WF-D, WF-STRIPE |
| Anthropic API | HTTP Header Auth | WF-B, WF-C |
| Google Drive OAuth2 | Google OAuth2 | WF-C (template copy) |
| Header Auth account | HTTP Header Auth | WF-STRIPE (Stripe webhook auth) |

---

## Exported Workflow Files

The workflow JSONs are exported and stored in `n8n/workflows/`:
- `wf-b-alertes-offres.json`
- `wf-c-generation-lm.json`
- `wf-d-crm-candidatures.json`
- `wf-stripe-abonnements.json`

These can be imported into any n8n instance via Settings > Import workflow.
