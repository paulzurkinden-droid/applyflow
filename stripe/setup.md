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
- **Description:** Alertes emploi + generation de lettres de motivation (Claude AI)
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

> **Important:** The `plan` metadata must be set on the **Price** object (not the Product). This is what WF-STRIPE reads to set the user's plan in Supabase.

---

## Step 2 — Create Payment Links

Go to **Stripe Dashboard > Payment Links > Create payment link** for each product:

1. Select the product + price
2. Set **Success URL:** `https://applyflow.ch/merci?session_id={CHECKOUT_SESSION_ID}`
3. Set **Cancel URL:** `https://applyflow.ch/#pricing`
4. Enable **Collect customer email**
5. Save the link URL for each plan

> **BUG-004 note:** The `/merci` page must exist on the frontend. Create a thank-you page at this route before going live.

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

**BUG-006 fix applied:** WF-STRIPE uses proper HMAC-SHA256 signature verification via Web Crypto API.

The `Code - Verifier signature Stripe` node reads the secret from the n8n env var `STRIPE_WEBHOOK_SECRET`.

1. Go to **n8n Cloud > Settings > Environment Variables**
2. Add:
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_[your-signing-secret]`
3. Also add:
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** `[your Supabase service role key]` (from Supabase Dashboard > Settings > API)

> If `STRIPE_WEBHOOK_SECRET` is not set, signature verification is skipped with a warning. **Must be set before go-live.**

---

## Step 5 — Test the Integration

### Test with Stripe CLI (recommended)
```bash
stripe login
stripe listen --forward-to https://p2urkinden.app.n8n.cloud/webhook/stripe-applyflow
# In another terminal:
stripe trigger checkout.session.completed
```

### Verify end-to-end
After a successful test:
- New row in `profils` table in Supabase (plan = starter/pro/booster)
- User invited to Supabase Auth (check Authentication > Users)
- Welcome email received (from bienvenue@applyflow.ch)

---

## Plan Mapping

| Stripe Price metadata `plan` | Supabase `profils.plan` | Price CHF/month |
|---|---|---|
| `starter` | `starter` | 9 CHF |
| `pro` | `pro` | 19 CHF |
| `booster` | `booster` | 39 CHF |
