# ApplyFlow — Complete Setup Guide

This guide walks you through setting up the full ApplyFlow backend stack.

## Architecture Overview

```
[User] → [Stripe Payment] → [WF-STRIPE: n8n] → [Supabase DB + Auth]
                                                      ↓
[WF-B: Cron 2x/day] → [Adzuna/RSS APIs] → [Claude Scoring] → [Email via Resend]
                                                      ↓
[User App] → [WF-C: Webhook] → [Claude LM Gen] → [Google Docs] → [Email via Resend]
```

**Stack:**
- **Database & Auth:** Supabase (PostgreSQL + Auth)
- **Automation:** n8n Cloud (5 workflows)
- **AI:** Anthropic Claude (scoring + letter generation)
- **Email:** Resend (transactional emails from applyflow.ch)
- **Payments:** Stripe (subscriptions)
- **Job APIs:** Adzuna, Confederation RSS, Jobup RSS
- **Documents:** Google Drive / Google Docs (LM templates)

---

## 1 — n8n Cloud Credentials

Log in to your n8n Cloud instance and configure these credentials:

### 1.1 Supabase Credential
- **Type:** Supabase API
- **Host:** `https://[YOUR_SUPABASE_PROJECT_REF].supabase.co`
  _(from Supabase Dashboard > Settings > API > Project URL)_
- **Service Role Secret:** Get from Supabase Dashboard > Settings > API > `service_role` key

### 1.2 Anthropic API
- **Type:** HTTP Header Auth
- **Header Name:** `x-api-key`
- **Header Value:** Your Anthropic API key (from https://console.anthropic.com)

### 1.3 Resend API
- **Type:** HTTP Header Auth (name: "Resend API")
- **Header Name:** `Authorization`
- **Header Value:** `Bearer [your Resend API key]`
  _(from https://resend.com/api-keys)_

### 1.4 Google Drive OAuth2
- **Type:** Google Drive OAuth2
- **Purpose:** WF-C uses this to copy the LM template and create user documents
- **Setup:** Follow n8n's Google OAuth2 setup → authorize with the Google account that owns the LM template

---

## 2 — n8n Environment Variables

Go to **n8n Cloud > Settings > Environment Variables** and add:

| Variable | Value | Used by |
|---|---|---|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe Dashboard > Webhooks | WF-STRIPE HMAC verification |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Dashboard > Settings > API > service_role | WF-STRIPE Auth invite |
| `ADZUNA_APP_ID` | From https://developer.adzuna.com | WF-B job search |
| `ADZUNA_APP_KEY` | From https://developer.adzuna.com | WF-B job search |

> **STRIPE_WEBHOOK_SECRET** must be set before go-live — WF-STRIPE skips HMAC verification with a warning if it's missing.

---

## 3 — Supabase SQL Migrations

Apply migrations in order via **Supabase Dashboard > SQL Editor**:

### Migration 001 — Initial Schema
File: [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql)

Creates all 4 tables (`profils`, `preferences_recherche`, `offres_alertes`, `candidatures`),
indexes, RLS policies, and triggers. **Run this first on a fresh project.**

### Migration 002 — Add Missing Columns
File: [`supabase/migrations/002_add_missing_columns.sql`](../supabase/migrations/002_add_missing_columns.sql)

Safe to run on existing schemas. Run if upgrading from an early version.

### Migration 003 — Security Definer Fix (BUG-018)
File: [`supabase/migrations/003_fix_security_definer.sql`](../supabase/migrations/003_fix_security_definer.sql)

Re-creates SECURITY DEFINER functions with `SET search_path = public, pg_catalog`.

### Migration 004 — Add annees_exp (BUG-016)
File: [`supabase/migrations/004_add_annees_exp.sql`](../supabase/migrations/004_add_annees_exp.sql)

Adds `annees_exp INTEGER DEFAULT 0` to `profils`. Required for WF-B scoring prompt.

---

## 4 — Stripe Setup

See [`stripe/setup.md`](../stripe/setup.md) for full Stripe configuration instructions.

**Summary (correct prices):**
1. Create 3 products: Starter (9 CHF/mois), Pro (19 CHF/mois), Booster (39 CHF/mois)
2. Add `plan` metadata to each price object
3. Create Payment Links with success URL `/merci`
4. Configure webhook pointing to your n8n WF-STRIPE webhook URL
5. Add signing secret as `STRIPE_WEBHOOK_SECRET` n8n env var

---

## 5 — Resend Domain Verification

ApplyFlow sends emails from the `@applyflow.ch` domain.

### Setup Steps
1. Log in to https://resend.com
2. Go to **Domains > Add domain** → enter `applyflow.ch`
3. Add the required DNS records (SPF, DKIM, DMARC)
4. Click **Verify** after DNS propagation (up to 48h)

### Email addresses used
| From address | Workflow |
|---|---|
| `alertes@applyflow.ch` | WF-B job alerts |
| `noreply@applyflow.ch` | WF-C cover letter delivery |
| `bienvenue@applyflow.ch` | WF-STRIPE welcome email |
| `noreply@applyflow.ch` | WF-STRIPE cancellation email |

---

## 6 — n8n Workflow Status

| Workflow | Status | Trigger |
|---|---|---|
| WF-A Onboarding | Active | Tally webhook |
| WF-B Alertes Offres | Active | Cron 08:00 + 18:00 |
| WF-C Generation LM | Active | Webhook POST /generate-lm |
| WF-D CRM Candidatures | Active | Webhook POST /update-candidature |
| WF-STRIPE Abonnements | Active | Stripe webhook |

See [`n8n/WORKFLOWS.md`](../n8n/WORKFLOWS.md) for webhook URLs and test instructions.

---

## 7 — Testing Checklist

- [ ] Supabase migrations applied (check table list in dashboard)
- [ ] Resend domain verified
- [ ] Stripe products created with correct `plan` metadata
- [ ] Stripe webhook configured and receiving events
- [ ] `STRIPE_WEBHOOK_SECRET` set in n8n env vars
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in n8n env vars
- [ ] `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` set in n8n env vars
- [ ] WF-STRIPE test: send `checkout.session.completed` → check `profils` table
- [ ] WF-B test: trigger manually → check `offres_alertes` table and email
- [ ] WF-C test: POST to webhook with valid `user_id` (pro/booster) → check Google Docs + email
- [ ] End-to-end: complete Stripe checkout → Supabase Auth user + profile + welcome email

---

## Security Notes

> **BUG-009:** Webhook paths are secrets. Raw webhook UUIDs have been redacted from this repo.
> If this repo becomes public, regenerate all webhook URLs via n8n UI (Webhook node > regenerate path).
> The WF-A onboarding webhook path appears in `ApplyFlow_Passation_Projet.md` (main branch) — regenerate before publishing.

> **Credentials:** Never commit API keys to this repository. All secrets belong in:
> - n8n credentials vault (Resend, Anthropic, Google Drive, Supabase)
> - n8n environment variables (STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY, ADZUNA_*)
> - Your local `.env` file (never committed)
