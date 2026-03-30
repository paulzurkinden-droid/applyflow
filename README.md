# ApplyFlow

**ApplyFlow** is an AI-powered job application automation platform for the Swiss market.
It automates job discovery, cover letter generation, and application tracking — all wired together with n8n workflows.

---

## What it does

| Feature | Description |
|---|---|
| **Job Alerts** | Scrapes Adzuna, Confederation, and Jobup twice daily. Claude AI scores each offer for relevance. |
| **Email Digests** | Users receive a curated email with their best matching jobs (score ≥ 7/10). |
| **AI Cover Letters** | Claude generates personalized letters based on CV + job description. Delivered as Google Docs + email. |
| **CRM Pipeline** | Track every application from "A envoyer" to "Offre recue" or "Refus". |
| **Subscription Plans** | Stripe-powered subscriptions: Starter (9 CHF), Pro (19 CHF), Booster (39 CHF). |

---

## Architecture

```
[Stripe Checkout] → [WF-STRIPE] → [Supabase: profils + auth]
                                              ↑
                    [WF-A Onboarding] ────────┘

[Cron 2x/day] → [WF-B Alertes] → [Adzuna/RSS] → [Claude Score] → [Resend Email]
                                              ↓
                                    [Supabase: offres_alertes]

[POST /generate-lm] → [WF-C LM Gen] → [Claude] → [Google Docs] → [Resend Email]
                                              ↓
                                    [Supabase: candidatures]

[WF-D CRM] → [Supabase: candidatures CRUD]
```

### Stack

| Layer | Technology |
|---|---|
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Automation | n8n Cloud (5 workflows) |
| AI | Anthropic Claude |
| Email | Resend (from applyflow.ch domain) |
| Payments | Stripe (subscriptions + webhooks) |
| Job APIs | Adzuna REST API, Swiss Confederation RSS, Jobup RSS |
| Documents | Google Drive + Google Docs (cover letter templates) |
| Frontend | Vite + React + Tailwind CSS v4 |

---

## Subscription Plans

| Plan | Price | Features |
|---|---|---|
| **Starter** | 9 CHF/mo | Job alerts, CRM tracking |
| **Pro** | 19 CHF/mo | Starter + AI cover letter generation |
| **Booster** | 39 CHF/mo | Pro + priority support |

---

## Repository Structure

```
applyflow/
├── README.md
├── docs/
│   └── SETUP.md                        # Complete setup guide
├── n8n/
│   ├── WORKFLOWS.md                    # Workflow docs + webhook URL format
│   └── workflows/                      # Exported workflow JSONs (importable)
│       ├── wf-a-onboarding.json
│       ├── wf-b-alertes-offres.json
│       ├── wf-c-generation-lm.json
│       ├── wf-d-crm-candidatures.json
│       └── wf-stripe-abonnements.json
├── stripe/
│   └── setup.md                        # Stripe products, webhooks, payment links
├── landing/
│   ├── PRICING_NOTES.md                # Frontend env vars + price constants
│   └── legal/                          # Privacy policy + CGV (LPD/RGPD)
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql      # Full DB schema with RLS + triggers
        ├── 002_add_missing_columns.sql # Safe upgrade migration
        ├── 003_fix_security_definer.sql # BUG-018: SECURITY DEFINER search_path
        └── 004_add_annees_exp.sql      # BUG-016: annees_exp column
```

---

## Quick Setup

1. **Read the full setup guide:** [`docs/SETUP.md`](docs/SETUP.md)
2. **Apply Supabase migrations:** [`supabase/migrations/`](supabase/migrations/)
3. **Configure Stripe:** [`stripe/setup.md`](stripe/setup.md)
4. **Set n8n credentials and env vars:** see [`docs/SETUP.md`](docs/SETUP.md)
5. **Verify workflows:** [`n8n/WORKFLOWS.md`](n8n/WORKFLOWS.md)

---

## Branches

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready docs |
| `backend` | Backend implementation: n8n workflows, schema, integration docs |

> **BUG-021:** Workflow JSONs are committed on the `backend` branch under `n8n/workflows/`.
> To sync to `main`: open a PR from `backend` to `main` once all fixes are validated.

---

## Security

All secrets (API keys, webhook secrets, service role keys) are stored exclusively in:
- **n8n credentials vault** — Resend, Anthropic, Google Drive, Supabase
- **n8n environment variables** — `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`

No secrets are committed to this repository. See [`docs/SETUP.md`](docs/SETUP.md) for configuration instructions.
