# Stripe Setup — ApplyFlow

## Step 1 — Créer les produits

Dans le [dashboard Stripe](https://dashboard.stripe.com), créez 3 produits :

| Produit | Prix | Intervalle |
|---|---|---|
| ApplyFlow Starter | CHF 9 | Mensuel |
| ApplyFlow Pro | CHF 19 | Mensuel |
| ApplyFlow Booster | CHF 39 | Mensuel |

Notez les `price_xxx` générés pour chaque produit.

---

## Step 2 — Créer les Payment Links

Pour chaque produit, créez un Payment Link :

1. Stripe Dashboard → **Payment Links** → **New Payment Link**
2. Sélectionnez le produit
3. **Success URL** : `https://applyflow.ch/merci?session_id={CHECKOUT_SESSION_ID}`
4. **Cancel URL** : `https://applyflow.ch/#tarifs`
5. Copiez l'URL générée (`https://buy.stripe.com/xxx`)

> ⚠️ La route `/welcome` n'existe pas dans l'application — utiliser uniquement `/merci`.

---

## Step 3 — Configurer les variables d'environnement

Copiez `landing/.env.example` → `landing/.env` et renseignez :

```env
VITE_STRIPE_PAYMENT_LINK_STARTER=https://buy.stripe.com/xxx_starter
VITE_STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/xxx_pro
VITE_STRIPE_PAYMENT_LINK_BOOSTER=https://buy.stripe.com/xxx_booster
```

---

## Step 4 — Configurer le webhook WF-STRIPE (n8n)

URL du webhook à créer dans n8n : `https://p2urkinden.app.n8n.cloud/webhook/[WEBHOOK_ID]`

Events Stripe à écouter :

| Event | Action |
|---|---|
| `checkout.session.completed` | Créer profil + inviter user Supabase Auth + email bienvenue |
| `customer.subscription.updated` | Mettre à jour `plan` dans profils |
| `customer.subscription.deleted` | Passer `actif = false` dans profils |

> La vérification de signature HMAC-SHA256 doit être implémentée côté n8n (voir BUG-006 dans BUGS.md).
