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

Log in to https://p2urkinden.app.n8n.cloud and configure these credentials:

### 1.1 Supabase Credential
- **Type:** Supabase API
- **Host:** `https://yltajummrsorqvynvod.supabase.co`
- **Service Role Secret:** Get from Supabase Dashboard > Settings > API > `service_role` key

### 1.2 Anthropic API
- **Type:** HTTP Header Auth (or built-in Anthropic credential if available)
- **Header Name:** `x-api-key`
- **Header Value:** Your Anthropic API key
- **Note:** API key is already configured in workflows via n8n credential `8KEISLMo2kUMmv86`

### 1.3 Google Drive OAuth2
- **Type:** Google Drive OAuth2
- **Purpose:** WF-C uses this to copy the LM template and create user documents
- **Setup:** Follow n8n's Google OAuth2 setup → authorize with the Google account that owns the LM template

### 1.4 Stripe Webhook Auth
- **Type:** HTTP Header Auth
- **Credential name:** "Header Auth account" (ID: l9fVHncLdNjJk6Gg)
- **Used by:** WF-STRIPE to validate incoming Stripe webhooks
- See `stripe/setup.md` for the signing secret

---

## 2 — Supabase SQL Migrations

Apply migrations in order via **Supabase Dashboard > SQL Editor**:
https://supabase.com/dashboard/project/yltajummrsorqvynvod/sql

### Migration 001 — Initial Schema
File: [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql)

Creates:
- `profils` table (users, plans, CV, Stripe customer ID)
- `preferences_recherche` table (job search preferences per user)
- `offres_alertes` table (job offers found and scored)
- `candidatures` table (application tracking CRM)
- All indexes, RLS policies, and triggers

**Run this first on a fresh Supabase project.**

### Migration 002 — Add Missing Columns
File: [`supabase/migrations/002_add_missing_columns.sql`](../supabase/migrations/002_add_missing_columns.sql)

Safe to run on existing schemas. Adds columns that may have been missing in early versions.

**Run this if you already had a schema and need to upgrade.**

### RLS Policies
After running migrations, verify in Supabase:
- Authentication > Policies: all 4 tables should have policies enabled
- Users can only read/write their own data

---

## 3 — Stripe Setup

See [`stripe/setup.md`](../stripe/setup.md) for full Stripe configuration instructions.

**Summary:**
1. Create 3 products: Starter (9 CHF), Pro (19 CHF), Booster (39 CHF)
2. Add `plan` metadata to each price object
3. Create Payment Links for each plan
4. Configure webhook: `https://p2urkinden.app.n8n.cloud/webhook/stripe-applyflow`
5. Add signing secret to n8n "Header Auth account" credential

---

## 4 — Resend Domain Verification

ApplyFlow sends emails from the `@applyflow.ch` domain.

### Setup Steps
1. Log in to https://resend.com
2. Go to **Domains > Add domain**
3. Enter `applyflow.ch`
4. Add the required DNS records to your domain registrar:
   - SPF record
   - DKIM records (2 CNAME entries)
   - DMARC record (optional but recommended)
5. Click **Verify** after DNS propagation (can take up to 48h)

### Email addresses used
| From address | Workflow |
|-------------|----------|
| `alertes@applyflow.ch` | WF-B job alerts |
| `noreply@applyflow.ch` | WF-C cover letter delivery |
| `bienvenue@applyflow.ch` | WF-STRIPE welcome email |
| `noreply@applyflow.ch` | WF-STRIPE cancellation email |

### Resend API Key
- **Current key:** `re_X64zNEHb_5M75DjfChJW2gLH6PYQ1WaHR`
- This is already hardcoded in the n8n workflow HTTP nodes (WF-B, WF-C, WF-STRIPE)
- If you rotate the key, update it in all 4 HTTP Resend nodes via the n8n API or UI

---

## 5 — Environment Variables Summary

| Variable | Value / Source | Used In |
|----------|---------------|---------|
| `N8N_API_URL` | `https://p2urkinden.app.n8n.cloud/api/v1` | n8n API calls |
| `N8N_API_KEY` | From n8n Cloud > Settings > API Keys | n8n API calls |
| `RESEND_API_KEY` | `re_X64zNEHb_5M75DjfChJW2gLH6PYQ1WaHR` | Hardcoded in n8n nodes |
| `ANTHROPIC_API_KEY` | From Anthropic console | n8n credential |
| `STRIPE_SECRET_KEY` | From Stripe Dashboard | Stripe API calls |
| `ADZUNA_APP_ID` | `e42ff894` | WF-B Adzuna fetch |
| `ADZUNA_APP_KEY` | `f7706538962bbd15e33d2c45375ae0d3` | WF-B Adzuna fetch |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Dashboard | WF-STRIPE Supabase Auth invite (via n8n env) |

> ⚠️ **SUPABASE_SERVICE_ROLE_KEY** must be set as an n8n environment variable in n8n Cloud settings, as it is referenced via `$env['SUPABASE_SERVICE_ROLE_KEY']` in WF-STRIPE.

To set n8n environment variables:
1. Go to n8n Cloud > Settings > Environment Variables
2. Add `SUPABASE_SERVICE_ROLE_KEY` = your service role key from Supabase

---

## 6 — n8n Workflow Status

| Workflow | ID | Status |
|---------|-----|--------|
| WF-A Onboarding | `EddlSDFtz15DWldl` | ✅ Active |
| WF-B Alertes Offres | `IfrDW7U3g7yzxr1d` | ✅ Active |
| WF-C Génération LM | `m6voz15eYd38v4Ax` | ✅ Active |
| WF-D CRM Candidatures | `PGCPbeGDdBlmPF4X` | ✅ Active |
| WF-STRIPE Abonnements | `Sp9T1mGtUkjQy9Sn` | ✅ Active |

See [`n8n/WORKFLOWS.md`](../n8n/WORKFLOWS.md) for detailed documentation.

---

## 7 — Testing Checklist

### After initial setup, test in this order:

- [ ] **Supabase migrations applied** — check table list in Supabase dashboard
- [ ] **Resend domain verified** — check domain status in Resend dashboard
- [ ] **Stripe products created** with correct `plan` metadata
- [ ] **Stripe webhook configured** and receiving events
- [ ] **n8n SUPABASE_SERVICE_ROLE_KEY env var set**
- [ ] **WF-STRIPE test:** send `checkout.session.completed` test event → check Supabase `profils` table
- [ ] **WF-B test:** trigger manually in n8n → check `offres_alertes` table and email delivery
- [ ] **WF-C test:** POST to webhook with a valid `user_id` (pro/booster plan) → check Google Docs + email
- [ ] **WF-D test:** trigger manually → check `candidatures` table
- [ ] **End-to-end:** complete Stripe checkout → verify user created in Supabase Auth + profile created + welcome email received

---

## Support

For issues with the n8n workflows, check:
1. n8n > Executions > [workflow] for error logs
2. Supabase > Logs for database errors
3. Resend > Logs for email delivery status
4. Stripe > Developers > Events for webhook delivery status
