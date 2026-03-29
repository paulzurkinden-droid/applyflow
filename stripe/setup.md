# Stripe Setup for ApplyFlow

## Prerequisites
- Stripe account at https://dashboard.stripe.com
- Access to n8n Cloud: https://p2urkinden.app.n8n.cloud
- n8n WF-STRIPE workflow is active (ID: Sp9T1mGtUkjQy9Sn)

---

## Step 1 — Create Products and Prices

Go to **Stripe Dashboard > Products > Add product** and create 3 products:

### Product 1: Starter
- **Name:** ApplyFlow Starter
- **Description:** Alertes emploi quotidiennes, suivi CRM
- **Pricing:** CHF 9.00 / month (recurring)
- **Price metadata:**
  - Key: `plan`
  - Value: `starter`

### Product 2: Pro
- **Name:** ApplyFlow Pro
- **Description:** Alertes emploi + génération de lettres de motivation (Claude AI)
- **Pricing:** CHF 19.00 / month (recurring)
- **Price metadata:**
  - Key: `plan`
  - Value: `pro`

### Product 3: Booster
- **Name:** ApplyFlow Booster
- **Description:** Tout inclus + accompagnement prioritaire
- **Pricing:** CHF 39.00 / month (recurring)
- **Price metadata:**
  - Key: `plan`
  - Value: `booster`

> ⚠️ **Important:** The `plan` metadata must be set on the **Price** object (not the Product). This is what WF-STRIPE reads to set the user's plan in Supabase.

---

## Step 2 — Create Payment Links

Go to **Stripe Dashboard > Payment Links > Create payment link** for each product:

1. Select the product + price
2. Set **Success URL:** `https://applyflow.ch/welcome?session_id={CHECKOUT_SESSION_ID}`
3. Enable **Collect customer email**
4. Save the link URL for each plan

Example links to embed on your website:
```
Starter:  https://buy.stripe.com/[your-starter-link]
Pro:      https://buy.stripe.com/[your-pro-link]
Booster:  https://buy.stripe.com/[your-booster-link]
```

---

## Step 3 — Configure Stripe Webhook

Go to **Stripe Dashboard > Developers > Webhooks > Add endpoint**

### Webhook Configuration
- **Endpoint URL:** `https://p2urkinden.app.n8n.cloud/webhook/stripe-applyflow`
- **Events to send:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### Get Signing Secret
After creating the webhook:
1. Click on the webhook endpoint
2. Click **Reveal signing secret**
3. Copy the value (starts with `whsec_...`)

---

## Step 4 — Add Signing Secret to n8n Environment Variables

**BUG-006 fix applied:** WF-STRIPE now uses proper HMAC-SHA256 signature verification (not static header comparison).

The `Code - Verifier signature Stripe` node reads the secret from the n8n environment variable `STRIPE_WEBHOOK_SECRET`.

1. Go to **n8n Cloud > Settings > Environment Variables**
2. Add variable:
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_[your-signing-secret]`

> ⚠️ If `STRIPE_WEBHOOK_SECRET` is not set, verification is skipped with a warning (to allow initial setup). Set it before going live.

> ℹ️ The old "Header Auth account" credential (ID: `l9fVHncLdNjJk6Gg`) is no longer used for webhook auth and can be deleted.

---

## Step 5 — Test the Integration

### Test with Stripe CLI (recommended)
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to https://p2urkinden.app.n8n.cloud/webhook/stripe-applyflow

# In another terminal, trigger a test event:
stripe trigger checkout.session.completed
```

### Test via Stripe Dashboard
1. Go to **Developers > Webhooks > [your endpoint]**
2. Click **Send test event**
3. Select `checkout.session.completed`
4. Check n8n execution history for WF-STRIPE

### Verify end-to-end
After a successful test:
- ✅ New row in `profils` table in Supabase
- ✅ User invited to Supabase Auth (check Authentication > Users)
- ✅ Welcome email received (from bienvenue@applyflow.ch)

---

## Stripe Environment Variables

| Variable | Where to get it |
|----------|----------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API Keys > Secret key |
| Webhook Signing Secret | Stripe Dashboard > Developers > Webhooks > [endpoint] > Signing secret |

---

## Plan Mapping

| Stripe Price metadata `plan` | Supabase `profils.plan` | Monthly CHF |
|------------------------------|------------------------|-------------|
| `starter` | `starter` | 9 CHF |
| `pro` | `pro` | 19 CHF |
| `booster` | `booster` | 39 CHF |
