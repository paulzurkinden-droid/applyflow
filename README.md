# ApplyFlow 🚀

**ApplyFlow** is an AI-powered job application automation platform for the Swiss market.
It automates job discovery, cover letter generation, and application tracking — all wired together with n8n workflows.

---

## What it does

| Feature | Description |
|---------|-------------|
| 🔍 **Job Alerts** | Scrapes Adzuna, Confederation, and Jobup twice daily. Claude AI scores each offer for relevance. |
| ✉️ **Instant Email Digests** | Users receive a curated email with their best matching jobs (score ≥ 7/10). |
| 📝 **AI Cover Letters** | Claude generates personalized letters based on CV + job description. Delivered as Google Docs + email. |
| 📋 **CRM Pipeline** | Track every application from "À envoyer" to "Offre reçue" or "Refus". |
| 💳 **Subscription Plans** | Stripe-powered subscriptions: Starter (9 CHF), Pro (19 CHF), Booster (39 CHF). |

---

## Architecture

```
[Stripe Checkout] ──► [WF-STRIPE] ──► [Supabase: profils + auth]
                                              │
                    [WF-A Onboarding] ◄───────┘
                    
[Cron 2x/day] ──► [WF-B Alertes] ──► [Adzuna/RSS] ──► [Claude Score] ──► [Resend Email]
                                              │
                                    [Supabase: offres_alertes]

[POST /generate-lm] ──► [WF-C LM Gen] ──► [Claude] ──► [Google Docs] ──► [Resend Email]
                                              │
                                    [Supabase: candidatures]

[WF-D CRM] ──► [Supabase: candidatures CRUD]
```

### Stack

| Layer | Technology |
|-------|-----------|
| Database | [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS) |
| Automation | [n8n Cloud](https://n8n.io) (5 workflows) |
| AI | [Anthropic Claude](https://anthropic.com) (claude-3-5-sonnet) |
| Email | [Resend](https://resend.com) (from applyflow.ch domain) |
| Payments | [Stripe](https://stripe.com) (subscriptions + webhooks) |
| Job APIs | Adzuna REST API, Swiss Confederation RSS, Jobup RSS |
| Documents | Google Drive + Google Docs (cover letter templates) |

---

## Subscription Plans

| Plan | Price | Features |
|------|-------|---------|
| **Starter** | 9 CHF/mo | Job alerts, CRM tracking |
| **Pro** | 19 CHF/mo | Starter + AI cover letter generation |
| **Booster** | 39 CHF/mo | Pro + priority support |

---

## Repository Structure

```
applyflow/
├── README.md                          # This file
├── docs/
│   └── SETUP.md                       # Complete setup guide
├── n8n/
│   ├── WORKFLOWS.md                   # Workflow documentation + webhook URLs
│   └── workflows/                     # Exported workflow JSONs (importable)
│       ├── wf-b-alertes-offres.json
│       ├── wf-c-generation-lm.json
│       ├── wf-d-crm-candidatures.json
│       └── wf-stripe-abonnements.json
├── stripe/
│   └── setup.md                       # Stripe products, webhooks, payment links
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql     # Full DB schema with RLS + triggers
        └── 002_add_missing_columns.sql # Safe upgrade migration
```

---

## Quick Setup

1. **Read the full setup guide:** [`docs/SETUP.md`](docs/SETUP.md)
2. **Apply Supabase migrations:** [`supabase/migrations/`](supabase/migrations/)
3. **Configure Stripe:** [`stripe/setup.md`](stripe/setup.md)
4. **Verify workflows:** [`n8n/WORKFLOWS.md`](n8n/WORKFLOWS.md)

---

## Webhook Endpoints

| Endpoint | URL | Workflow |
|----------|-----|---------|
| LM Generation | `https://p2urkinden.app.n8n.cloud/webhook/generate-lm` | WF-C |
| Stripe Events | `https://p2urkinden.app.n8n.cloud/webhook/stripe-applyflow` | WF-STRIPE |

---

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable, production-ready docs |
| `backend` | Backend implementation: n8n workflows, schema, integration docs |

---

## n8n Workflow Status

| Workflow | ID | Status |
|---------|-----|--------|
| WF-A Onboarding | `EddlSDFtz15DWldl` | ✅ Active |
| WF-B Alertes Offres | `IfrDW7U3g7yzxr1d` | ✅ Active |
| WF-C Génération LM | `m6voz15eYd38v4Ax` | ✅ Active |
| WF-D CRM Candidatures | `PGCPbeGDdBlmPF4X` | ✅ Active |
| WF-STRIPE Abonnements | `Sp9T1mGtUkjQy9Sn` | ✅ Active |

---

*Built with ❤️ for Swiss job seekers*
