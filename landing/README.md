# ApplyFlow — Landing Page

Landing page marketing pour **ApplyFlow**, un SaaS suisse d'automatisation de recherche d'emploi en Suisse romande.

## Stack technique

- **React 18** — composants fonctionnels avec hooks
- **Vite** — bundler rapide avec HMR
- **Tailwind CSS v4** — styling utility-first
- **Stripe.js** — intégration paiement pour les plans Pro et Booster

## Sections

1. **Navbar** — logo, navigation, CTA
2. **Hero** — accroche, sous-titre, CTAs, social proof
3. **Comment ça marche** — 3 étapes illustrées
4. **Fonctionnalités** — 6 cartes avec icônes emoji
5. **Tarifs** — 3 plans (Starter / Pro / Booster)
6. **FAQ** — 5 questions en accordéon
7. **Footer** — liens, copyright

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/paulzurkinden-droid/applyflow
cd applyflow/landing

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditez .env avec vos vraies clés

# 4. Démarrer en développement
npm run dev

# 5. Build de production
npm run build
```

## Variables d'environnement

Copiez `.env.example` vers `.env` et renseignez :

| Variable | Description |
|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (`pk_live_...` ou `pk_test_...`) |
| `VITE_STRIPE_PRICE_PRO` | ID du prix Stripe pour le plan Pro (`price_...`) |
| `VITE_STRIPE_PRICE_BOOSTER` | ID du prix Stripe pour le plan Booster (`price_...`) |

> ⚠️ **Important** : Ne committez jamais votre fichier `.env` contenant de vraies clés.  
> Seul `.env.example` doit être versionné.

## Intégration Stripe

- Le plan **Starter** est gratuit → redirige vers le formulaire Tally : `https://tally.so/r/b5kE41`
- Les plans **Pro** et **Booster** utilisent `stripe.redirectToCheckout()` avec les price IDs définis en variables d'environnement

Pour créer vos produits et prix dans Stripe :
1. Connectez-vous à [dashboard.stripe.com](https://dashboard.stripe.com)
2. Allez dans **Produits → Créer un produit**
3. Créez "ApplyFlow Pro" (CHF 29/mois) et "ApplyFlow Booster" (CHF 79/mois)
4. Copiez les `price_xxx` dans votre `.env`

## Déploiement

### Vercel (recommandé)
```bash
npm install -g vercel
vercel --prod
# Définissez vos env vars dans le dashboard Vercel
```

### Netlify
```bash
npm run build
# Déployez le dossier dist/
# Définissez vos env vars dans Netlify Settings > Environment variables
```

## Structure des fichiers

```
landing/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── HowItWorks.jsx
│   │   ├── Features.jsx
│   │   ├── Pricing.jsx
│   │   ├── FAQ.jsx
│   │   └── Footer.jsx
│   ├── lib/
│   │   └── stripe.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── .env.example
└── README.md
```
