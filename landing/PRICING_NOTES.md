# Landing Page — Pricing Notes

> This file documents required frontend implementation details for the Pricing component (Pricing.jsx).
> The `landing/` directory is a placeholder — frontend code to be added in a future sprint.

---

## Correct Prices (BUG-003)

| Plan | Price | Included |
|------|-------|----------|
| Starter | **9 CHF/mois** | Alertes emploi 2x/jour |
| Pro | **19 CHF/mois** | Alertes + génération LM (2/mois) + CRM candidatures |
| Booster | **39 CHF/mois** | Alertes + génération LM illimitée + CRM candidatures |

---

## Required Environment Variables

The frontend Pricing component must use these env vars for Stripe Payment Links:

```
VITE_STRIPE_PRICE_STARTER=price_xxx   # Stripe Price ID for Starter plan
VITE_STRIPE_PRICE_PRO=price_xxx       # Stripe Price ID for Pro plan
VITE_STRIPE_PRICE_BOOSTER=price_xxx   # Stripe Price ID for Booster plan
```

These are set at build time (Vite) and reference the Price IDs from Stripe Dashboard > Products.

---

## BUG-010: Guard Against Undefined priceId

When implementing `Pricing.jsx`, apply this guard before calling Stripe Checkout:

```javascript
// BUG-010 FIX: Guard against undefined priceId before calling Stripe
const handleSubscribe = (plan) => {
  const priceIds = {
    starter: import.meta.env.VITE_STRIPE_PRICE_STARTER,
    pro: import.meta.env.VITE_STRIPE_PRICE_PRO,
    booster: import.meta.env.VITE_STRIPE_PRICE_BOOSTER,
  };

  const priceId = priceIds[plan];
  if (!priceId) {
    console.error(`[Pricing] No priceId configured for plan: ${plan}`);
    // Show user-friendly error — do NOT call Stripe with undefined
    alert('Configuration error: pricing not available. Please contact support.');
    return;
  }

  // Safe to proceed
  stripe.redirectToCheckout({ lineItems: [{ price: priceId, quantity: 1 }], mode: 'subscription', ... });
};
```

**Also validate on backend:** WF-STRIPE checks `plan` metadata on the Stripe Price object. If `plan` is missing from price metadata, the subscription event will fail silently. Always set `plan` metadata on Stripe Price objects.

---

## Integration with WF-STRIPE

After successful checkout:
- Stripe fires `checkout.session.completed` → WF-STRIPE
- WF-STRIPE reads `session.metadata.plan` or `price.metadata.plan`
- Creates profil in Supabase with correct plan
- Invites user to Supabase Auth
- Sends welcome email via Resend

Success redirect URL should be: `https://applyflow.ch/welcome?session_id={CHECKOUT_SESSION_ID}`
