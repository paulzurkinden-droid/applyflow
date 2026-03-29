# BUGS.md — ApplyFlow

**Date** : 2026-03-30 (Pass 2 — Re-audit post-fixes)
**Pass 1 total** : 23 bugs (6 CRITICAL · 7 HIGH · 7 MEDIUM · 3 LOW)
**Pass 2 total** : 16 bugs remaining + 5 new bugs introduced (7 CRITICAL · 5 HIGH · 6 MEDIUM · 3 LOW)

---

## BUGS CORRIGÉS DEPUIS PASS 1 ✅

| Bug | Titre | Résolution |
|---|---|---|
| BUG-001 | API Stripe dépréciée | Migré vers Payment Links — stripe.js supprimé |
| BUG-002 | Pas de try/catch checkout | `redirectToPaymentLink()` avec try/catch + alert |
| BUG-003 | Prix incohérents (Gratuit/29/79) | Corrigé : CHF 9 / 19 / 39, aligné avec la doc |
| BUG-004 | Page `/merci` inexistante | `Merci.jsx` créé + React Router configuré |
| BUG-005 | WF-B : champ `lien` au lieu de `url` | Champ `url` unifié dans WF-B JSON |
| BUG-007 | WF-B : `source: 'jobup.ch'` invalide | Corrigé en `source: 'Jobup'` |
| BUG-010 | `priceId` undefined sans env vars | `redirectToPaymentLink` valide l'URL avant redirect |

---

## 🔴 CRITICAL — Bloquants production (5 bugs actifs)

---

### BUG-006 · CRITICAL · NOT FIXED
**Titre** : Vérification signature Stripe HMAC — toujours absente
**Fichier** : `n8n/workflows/wf-stripe-abonnements.json` — node "Webhook - Stripe"
**Description** : La configuration `authentication: headerAuth` avec la valeur statique `whsec_xxx` ne peut pas valider les signatures Stripe. Stripe génère un header `Stripe-Signature: t=timestamp,v1=HMAC_hash` unique par requête — une comparaison statique sera soit toujours vraie (sécurité nulle) soit toujours fausse (flux de paiement bloqué). `stripe/setup.md` reconnaît le problème dans une note mais l'implémentation HMAC n'a pas été faite.
**Fix** :
```javascript
// Premier Code node dans WF-STRIPE, avant tout autre traitement :
const crypto = require('crypto');
const sigHeader = $input.first().headers['stripe-signature'] || '';
const rawBody = $input.first().rawBody || JSON.stringify($input.first().json);
const secret = $env['STRIPE_WEBHOOK_SECRET']; // whsec_xxx dans n8n env vars
const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
const expected = crypto.createHmac('sha256', secret)
  .update(`${parts.t}.${rawBody}`).digest('hex');
if (expected !== parts.v1) throw new Error('Invalid Stripe signature — request rejected');
```
Note : activer "Raw Body" dans les options du Webhook node n8n.

---

### BUG-N001 · CRITICAL · NEW
**Titre** : `{{RESEND_API_KEY}}` hardcodé — toutes les lignes d'email sont cassées
**Fichiers** :
- `n8n/workflows/wf-stripe-abonnements.json` : "HTTP - Email bienvenue Resend" + "HTTP - Email résiliation Resend"
- `n8n/workflows/wf-b-alertes-offres.json` : "HTTP - Envoyer alerte Resend"
- `n8n/workflows/wf-c-generation-lm.json` : "HTTP - Envoyer LM Resend"

**Description** : Tous les nodes HTTP Resend dans les 3 workflows utilisent :
```json
{ "name": "Authorization", "value": "Bearer {{RESEND_API_KEY}}" }
```
`{{RESEND_API_KEY}}` est une chaîne litérale — pas une expression n8n valide. L'API Resend reçoit `Authorization: Bearer {{RESEND_API_KEY}}` → 401 Unauthorized. **Aucun email ne sera jamais envoyé** : ni bienvenue, ni alerte emploi, ni livraison LM, ni résiliation. L'ensemble des communications utilisateurs est silencieusement cassé.
**Fix** :
```
Option 1 (recommandée) : Créer un credential n8n "Header Auth" avec clé Resend
→ l'associer à chaque HTTP Request node via "Authentication: predefined credential"

Option 2 : Ajouter RESEND_API_KEY aux Environment Variables n8n
→ remplacer la value par : Bearer {{ $env['RESEND_API_KEY'] }}
```

---

### BUG-N002 · CRITICAL · NEW
**Titre** : `{{SUPABASE_SERVICE_ROLE_KEY}}` hardcodé — invitation utilisateur Supabase Auth cassée
**Fichier** : `n8n/workflows/wf-stripe-abonnements.json` — node "HTTP - Inviter utilisateur Supabase Auth"
**Description** : L'appel à `https://yltajummrsorqvynvod.supabase.co/auth/v1/admin/users` pour créer/inviter l'utilisateur après paiement utilise la chaîne litérale `{{SUPABASE_SERVICE_ROLE_KEY}}` dans les headers `apikey` et `Authorization`. Supabase retournera 401 → aucun compte Auth n'est créé → aucun email d'invitation → l'utilisateur ne peut pas se connecter → le trigger `link_auth_user_to_profile` ne s'exécute jamais → le profil reste sans `user_id` → la RLS bloque tout accès au profil.
**Fix** : Utiliser le credential Supabase existant ("Supabase account" ID: `8KEISLMo2kUMmv86`) ou configurer les clés dans les env vars n8n et utiliser `$env['SUPABASE_SERVICE_ROLE_KEY']`.

---

### BUG-N003 · CRITICAL · NEW
**Titre** : WF-C — Aucune vérification du plan utilisateur (bypass accès Pro/Booster)
**Fichier** : `n8n/workflows/wf-c-generation-lm.json` — Code node "Valider requête" + structure des nodes
**Description** : Le Code node de validation vérifie la présence de `user_id`, `titre_poste`, `entreprise`, `description_offre` mais **ne vérifie pas** le plan de l'utilisateur. N'importe quel utilisateur `starter` connaissant l'URL du webhook peut générer des LM illimitées, contournant complètement la restriction Pro/Booster. Les appels Claude et Google Drive seront quand même exécutés et facturés.
**Fix** : Ajouter après le node "Supabase - Récupérer profil" :
```javascript
// IF node ou Code node
const profil = $('Supabase - Récupérer profil').item.json;
if (!profil || !profil.actif) {
  // Respond 401 : profil inactif ou introuvable
}
if (!['pro', 'booster'].includes(profil.plan)) {
  // Respond 403 PLAN_INSUFFICIENT
}
```

---

## 🟠 HIGH — Importants avant lancement (5 bugs actifs)

---

### BUG-008 · HIGH · PARTIAL FIX
**Titre** : Credentials Adzuna — fallback sur placeholder invalide si env vars absentes
**Fichier** : `n8n/workflows/wf-b-alertes-offres.json` — Code node "Construire URLs"
**Description** : Le code utilise maintenant `$env['ADZUNA_APP_ID'] || '{{ADZUNA_APP_ID}}'`. La première branche est correcte, mais le fallback `'{{ADZUNA_APP_ID}}'` est une chaîne litérale invalide. Si les variables d'environnement ne sont pas configurées dans n8n → toutes les requêtes Adzuna échouent silencieusement (401) sans aucune alerte. Aucune validation ni log d'erreur explicite n'est implémenté.
**Fix** :
```javascript
const APP_ID = $env['ADZUNA_APP_ID'];
const APP_KEY = $env['ADZUNA_APP_KEY'];
if (!APP_ID || !APP_KEY) {
  throw new Error('ADZUNA_APP_ID ou ADZUNA_APP_KEY non configurés dans les env vars n8n');
}
```

---

### BUG-009 · HIGH · UNCHANGED
**Titre** : URL webhook Tally n8n WF-A exposée dans repo GitHub public
**Fichiers** : `ApplyFlow_Passation_Projet.md`, `ARCHITECTURE.md`
**Description** : L'URL `https://p2urkinden.app.n8n.cloud/webhook/f1fea724-e392-473d-963a-49cf3207f5cf` est visible publiquement. Sans vérification de signature Tally côté WF-A, quiconque peut POSTer des données fictives et créer/écraser des profils utilisateurs en Supabase.
**Fix** : Activer la signature webhook Tally (Settings Tally → Webhook → Signing Secret) et ajouter une vérification HMAC dans WF-A. Régénérer l'URL webhook n8n si possible. Supprimer l'URL des fichiers Markdown publics.

---

### BUG-011 · HIGH · NOT FIXED
**Titre** : WF-B — Email digest envoyé par offre (pas par utilisateur)
**Fichier** : `n8n/workflows/wf-b-alertes-offres.json` — Code node "Préparer email alerte"
**Description** : Le Code node prépare un email pour une offre individuelle (`$('Code - Éclater offres').item.json`) avec pour sujet `?? Nouvelle offre pertinente : ${offre.titre}`. Si 5 offres sont scorées ≥ 7, l'utilisateur reçoit 5 emails séparés dans la même minute. Risque de marquage spam + très mauvaise UX.
**Fix** : Ajouter un node "Merge / Group by user" entre "Code - Éclater offres" et "Préparer email alerte" pour agréger toutes les offres ≥ 7 d'un même utilisateur en un seul email digest.

---

### BUG-013 · HIGH · NOT FIXED
**Titre** : Pas de mentions légales ni politique de confidentialité (non-conformité LPD suisse)
**Fichiers** : `landing/src/components/Footer.jsx`, `landing/src/App.jsx`
**Description** : Aucun lien vers CGU, politique de confidentialité ou mentions légales dans le footer ou l'application. La LPD suisse (en vigueur depuis sept. 2023) exige une politique de confidentialité accessible. Le RGPD s'applique pour les utilisateurs résidant en Europe.
**Fix** :
1. Créer `landing/src/components/Confidentialite.jsx` et `Cgu.jsx`
2. Ajouter les routes `/confidentialite` et `/cgv` dans `App.jsx`
3. Ajouter les liens dans `Footer.jsx`
4. Contenu minimum : données collectées, finalité, durée conservation, droits (accès, suppression, rectification), contact DPO

---

### BUG-N005 · HIGH · NEW
**Titre** : Stripe success_url dans setup.md pointe vers `/welcome` — route inexistante
**Fichiers** : `stripe/setup.md` (Step 2) vs `landing/src/App.jsx`
**Description** : `stripe/setup.md` indique de configurer `https://applyflow.ch/welcome?session_id={CHECKOUT_SESSION_ID}` comme success URL des Payment Links. La route `/welcome` n'existe pas dans le frontend React (seule `/merci` est définie). Si les Payment Links sont configurés selon la documentation, l'utilisateur atterrit sur une page 404 après paiement.
**Fix** : Mettre à jour `stripe/setup.md` Step 2 pour utiliser `https://applyflow.ch/merci` comme success URL. (Ou créer la route `/welcome` si le nom `/merci` doit changer.)

---

## 🟡 MEDIUM — À corriger avant croissance (6 bugs actifs)

---

### BUG-014 · MEDIUM · NOT FIXED
**Titre** : Favicon pointe vers `/vite.svg` (icône Vite par défaut)
**Fichier** : `landing/index.html`, ligne 4
**Fix** : `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`

---

### BUG-015 · MEDIUM · NOT FIXED
**Titre** : `og:image` et `twitter:image` absents — mauvais rendu partage social
**Fichier** : `landing/index.html`
**Fix** : Créer `public/og-image.png` (1200×630) et ajouter :
```html
<meta property="og:image" content="https://applyflow.ch/og-image.png" />
<meta name="twitter:image" content="https://applyflow.ch/og-image.png" />
```

---

### BUG-016 · MEDIUM · WORKAROUND ONLY
**Titre** : `annees_exp` non stocké dans Supabase — WF-B utilise valeur hardcodée
**Fichier** : `n8n/workflows/wf-b-alertes-offres.json` — Code node "Construire URLs"
**Description** : `annees_exp: profil.cv_texte ? 5 : 0` est un contournement non représentatif. La colonne `annees_exp` n'existe pas dans la table `profils` (absent de la migration 001). La valeur réelle collectée via Tally n'est pas persistée.
**Fix** : Ajouter `annees_exp INTEGER DEFAULT 0` à la migration 001 (ou une migration 003). Mettre à jour WF-A pour écrire cette valeur. Mettre à jour WF-B pour la lire depuis `profil.annees_exp`.

---

### BUG-018 · MEDIUM · NOT FIXED
**Titre** : Fonction SECURITY DEFINER sans `SET search_path` — vulnérabilité PostgreSQL
**Fichier** : `supabase/migrations/001_initial_schema.sql` — fonction `link_auth_user_to_profile()`
**Fix** :
```sql
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;
```

---

### BUG-020 · MEDIUM · NOT FIXED
**Titre** : Claim "200+ chercheurs d'emploi" possiblement faux — risque LCD suisse
**Fichier** : `landing/src/components/Hero.jsx`, ligne 13
**Fix** : Remplacer par un claim vérifiable ou neutre. Ex : "Les premiers chercheurs d'emploi en Suisse romande ont testé ApplyFlow" ou simplement retirer le badge de social proof.

---

### BUG-N004 · MEDIUM · NEW
**Titre** : Dépendance `@stripe/stripe-js` inutile dans `package.json`
**Fichier** : `landing/package.json`
**Description** : La migration vers Payment Links a supprimé toute utilisation du SDK `@stripe/stripe-js`, mais la dépendance est toujours dans `dependencies`. Charge ~40 KB gzippé inutilement.
**Fix** : `npm uninstall @stripe/stripe-js` — retirer de `package.json` et `package-lock.json`.

---

## 🔵 LOW — Qualité et maintenabilité (3 bugs inchangés)

---

### BUG-021 · LOW · PARTIALLY FIXED
**Titre** : Workflows n8n exportés dans `backend` branch mais pas dans `main`
**Description** : Les 4 JSON de workflows sont dans la branche `backend`. Bien, mais aucun n'a été fusionné vers `main`. Si `backend` est supprimé ou oublié, les JSONs sont perdus.
**Fix** : Fusionner la branche `backend` dans `main` ou créer un processus de sync.

---

### BUG-022 · LOW · UNCHANGED
**Titre** : Contradiction architecture : DECISIONS.md dit Framer, le code est Vite+React
**Fichier** : `DECISIONS.md` D-004
**Fix** : Mettre à jour D-004 pour documenter la décision de construire une landing React personnalisée et la justification.

---

### BUG-023 · LOW · UNCHANGED
**Titre** : `landing/src/App.css` — styles globaux potentiellement conflictuels avec Tailwind v4
**Fix** : Vérifier que App.css ne définit que des custom properties CSS (`:root { }`) et n'override pas les utilitaires Tailwind.

---

## RÉCAPITULATIF PASS 2

| Sévérité | Pass 1 | Corrigés | Nouveaux | Total actif |
|---|---|---|---|---|
| 🔴 CRITICAL | 6 | 4 (BUG-001/002/003/004) | 3 (N001/N002/N003) | **5** |
| 🟠 HIGH | 7 | 3 (BUG-005/007/010) | 1 (N005) | **5** |
| 🟡 MEDIUM | 7 | 2 (BUG-017/019) | 1 (N004) | **6** |
| 🔵 LOW | 3 | 0 | 0 | **3** |
| **TOTAL** | **23** | **9** | **5** | **19** |

---

```json
{"approved": false, "critical_bugs": 5, "summary": "Pass 2 : 9 bugs corrigés sur 23 (BUG-001 à BUG-005, BUG-007, BUG-010 — frontend entièrement fixé). Mais 3 nouveaux critiques introduits dans la branche backend : {{RESEND_API_KEY}} littéral dans 6 nodes HTTP (toutes les lignes d'email cassées), {{SUPABASE_SERVICE_ROLE_KEY}} littéral (invitation Auth cassée après paiement), et absence totale de vérification de plan dans WF-C (bypass Pro/Booster). BUG-006 (signature Stripe HMAC) non résolu. Non approuvé."}
```
