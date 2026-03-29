# BUGS.md — ApplyFlow

**Date** : 2026-03-29
**Reviewer** : QA Engineer
**Total bugs** : 23 (6 CRITICAL · 7 HIGH · 7 MEDIUM · 3 LOW)

---

## 🔴 CRITICAL — Bloquants production

---

### BUG-001 · CRITICAL
**Titre** : API Stripe `redirectToCheckout` dépréciée — peut échouer silencieusement
**Fichier** : `landing/src/lib/stripe.js`, ligne 5–11
**Description** : `stripe.redirectToCheckout({ lineItems, mode, successUrl, cancelUrl })` est l'ancienne méthode client-only de Stripe Checkout, dépréciée depuis 2022. Avec @stripe/stripe-js v9 (version utilisée ici), cette méthode est absente ou non documentée, et son comportement n'est pas garanti. Les clients peuvent être bloqués au moment du paiement.
**Fix** : Migrer vers des **Stripe Payment Links** (URLs statiques créées dans le dashboard Stripe, intégrées comme simple `<a href>`) ou créer une Checkout Session côté backend et utiliser `stripe.redirectToCheckout({ sessionId })`.

---

### BUG-002 · CRITICAL
**Titre** : Aucune gestion d'erreur sur le checkout Stripe — TypeError non catchée
**Fichier** : `landing/src/lib/stripe.js`, ligne 5–11 · `landing/src/components/Pricing.jsx`, ligne 52
**Description** : Si `stripePromise` résout à `null` (ad blocker, réseau, clé invalide), `stripe.redirectToCheckout(...)` lève une `TypeError: Cannot read properties of null`. Aucun `try/catch` ni `.catch()` n'est présent. L'utilisateur voit une page blanche ou une erreur console sans feedback.
**Fix** :
```javascript
export async function redirectToCheckout(priceId) {
  try {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe non chargé');
    const { error } = await stripe.redirectToCheckout({ ... });
    if (error) throw error;
  } catch (err) {
    console.error('[Stripe]', err);
    alert('Une erreur est survenue. Veuillez réessayer ou contacter support@applyflow.ch');
  }
}
```

---

### BUG-003 · CRITICAL
**Titre** : Prix incohérents entre le frontend et toute la documentation
**Fichier** : `landing/src/components/Pricing.jsx`, lignes 3–44
**Description** :
- Starter : **Gratuit** dans le frontend vs **9 CHF/mois** dans toute la doc
- Pro : **CHF 29/mois** dans le frontend vs **19 CHF/mois** dans toute la doc
- Booster : **CHF 79/mois** dans le frontend vs **39 CHF/mois** dans toute la doc

Trois incohérences en même temps. Soit le business model a changé (et la doc n'est pas à jour), soit le frontend est faux. En l'état, les Stripe Price IDs ne correspondent à aucun prix documenté.
**Fix** : Aligner explicitement avec le product owner, puis corriger soit la doc soit le frontend.

---

### BUG-004 · CRITICAL
**Titre** : Page `/merci` (success_url Stripe) inexistante — 404 après paiement
**Fichier** : `landing/src/lib/stripe.js`, ligne 9
**Description** : `successUrl: window.location.origin + '/merci'` pointe vers une route non définie dans l'application React (application monopages sans routeur). L'utilisateur ayant payé atterrit sur une page vide ou 404 — pire expérience possible post-conversion.
**Fix** : Soit créer un composant `Merci.jsx` avec React Router, soit utiliser une URL absolue externe (`https://applyflow.ch/merci`) sur un page dédiée, soit rediriger vers `/#merci` avec une section conditionnelle dans `App.jsx`.

---

### BUG-005 · CRITICAL
**Titre** : WF-B — Champ `lien` vs `url` : schema mismatch provoque des INSERT échoués
**Fichier** : `ApplyFlow_Passation_Projet.md` section 7 (code node) vs `DATA_MODEL.md` table `offres_alertes`
**Description** : Le format normalisé d'une offre dans la passation utilise `lien` comme clé du champ URL. La table Supabase et la contrainte UNIQUE utilisent `url`. Le Code node "Parser + normaliser offres" produira des objets avec `lien` mais le node Supabase attendra `url` → les inserts échouent en silencieux (onError=continueRegularOutput), aucune offre n'est jamais écrite.
**Fix** : Uniformiser sur `url` dans tous les documents et dans le code des Code nodes.

---

### BUG-006 · CRITICAL
**Titre** : WF-B — Vérification signature Stripe documentée comme automatique — FAUSSE
**Fichier** : `INTEGRATIONS.md`, section 1 "Vérification signature webhook dans n8n"
**Description** : La documentation indique que n8n vérifie automatiquement la signature HMAC-SHA256 Stripe via "Header Auth". **C'est incorrect.** Le node Webhook n8n avec Header Auth compare simplement un header à une valeur statique, sans calcul HMAC. Sans vraie vérification de signature, n'importe qui peut envoyer de faux events Stripe (ex: `checkout.session.completed` fabriqué) → création de comptes frauduleux, modification de plans.
**Fix** : Ajouter un Code node en tête de WF-STRIPE :
```javascript
const crypto = require('crypto');
const sig = $input.first().headers['stripe-signature'];
const payload = $input.first().rawBody; // nécessite Raw Body activé dans le webhook
const secret = $credentials.stripeWebhookSecret;
const [t, v1] = sig.split(',').map(p => p.split('=')[1]);
const expected = crypto.createHmac('sha256', secret)
  .update(`${t}.${payload}`).digest('hex');
if (expected !== v1) throw new Error('Invalid Stripe signature');
```

---

## 🟠 HIGH — Importants, à corriger avant lancement

---

### BUG-007 · HIGH
**Titre** : WF-B — Valeur `source: 'jobup.ch'` viole la contrainte CHECK Supabase
**Fichier** : `ApplyFlow_Passation_Projet.md` section 7, code node (format normalisé)
**Description** : `source: 'jobup.ch'` ne fait pas partie de `CHECK (source IN ('Adzuna', 'Confederation', 'Jobup'))`. Chaque tentative d'INSERT d'une offre Jobup sera rejetée par la contrainte DB avec une erreur PostgreSQL. Avec `onError=continueRegularOutput`, ces erreurs sont silencieuses — toutes les offres Jobup.ch sont perdues.
**Fix** : Corriger en `source: 'Jobup'` dans le Code node "Parser + normaliser offres".

---

### BUG-008 · HIGH
**Titre** : WF-B — Credentials Adzuna en dur comme placeholders invalides
**Fichier** : `WORKFLOWS.md` section "Code node Construire URLs" + `ApplyFlow_Passation_Projet.md` section 11
**Description** : `const APP_ID = '{{ADZUNA_APP_ID}}'` — les doubles accolades ne sont pas la syntaxe n8n pour les credentials. Le code n8n utilise `$credentials.xxx` ou des variables d'environnement n8n. En l'état, toutes les requêtes Adzuna seront authentifiées avec la chaîne littérale `{{ADZUNA_APP_ID}}` → 401 Unauthorized.
**Fix** : Dans n8n, stocker les clés Adzuna dans des Custom Credentials et les référencer via `{{ $credentials.adzunaAppId }}`, ou passer les clés via n8n Variables.

---

### BUG-009 · HIGH
**Titre** : WF-A — URL webhook n8n exposée dans un repo GitHub public
**Fichier** : `ApplyFlow_Passation_Projet.md`, section 5
**Description** : `https://p2urkinden.app.n8n.cloud/webhook/f1fea724-e392-473d-963a-49cf3207f5cf` est publiquement visible. Toute personne peut envoyer un POST à cette URL et créer/modifier des profils utilisateurs dans Supabase.
**Fix** : Ajouter la vérification de signature Tally dans WF-A. Envisager de régénérer l'URL webhook (invalidant l'ancienne). Supprimer l'URL des documents publics ou les mettre dans un vault.

---

### BUG-010 · HIGH
**Titre** : `priceId` peut être `undefined` si les variables d'environnement sont absentes
**Fichier** : `landing/src/components/Pricing.jsx`, ligne 52–56
**Description** : Si `VITE_STRIPE_PRICE_PRO` ou `VITE_STRIPE_PRICE_BOOSTER` ne sont pas définies dans `.env` (déploiement Vercel/Netlify sans configuration des variables), les `import.meta.env` retournent `undefined`. `redirectToCheckout(undefined)` ne lève pas d'erreur immédiate mais peut provoquer un comportement Stripe inattendu.
**Fix** :
```javascript
const priceId = plan.priceEnvKey === 'VITE_STRIPE_PRICE_PRO'
  ? import.meta.env.VITE_STRIPE_PRICE_PRO
  : import.meta.env.VITE_STRIPE_PRICE_BOOSTER;
if (!priceId) {
  console.error('Price ID manquant pour', plan.priceEnvKey);
  alert('Configuration manquante. Contactez support@applyflow.ch');
  return;
}
```

---

### BUG-011 · HIGH
**Titre** : WF-B — Email digest envoyé par offre et non par utilisateur (spam potentiel)
**Fichier** : `WORKFLOWS.md` section WF-B, steps [15]→[17]→[19]
**Description** : Le workflow éclate les offres en items individuels au step [15], puis filtre celles avec score ≥ 7 au step [17], puis envoie un email par item au step [19]. Un utilisateur avec 5 offres bien scorées reçoit 5 emails distincts dans la même minute, au lieu d'un seul digest. Mauvaise expérience utilisateur et risque de marquage spam.
**Fix** : Ajouter un Code node de regroupement entre [17] et [19] qui agrège les offres par `user_id` avant d'appeler Resend une seule fois par utilisateur.

---

### BUG-012 · HIGH
**Titre** : Profils WF-A sans `user_id` → RLS empêche l'accès utilisateur
**Fichier** : `DATA_MODEL.md` (RLS policies) + `ApplyFlow_Passation_Projet.md` section 6
**Description** : WF-A crée des profils avec `user_id = NULL`. La politique RLS `auth.uid() = user_id` ne matchera jamais `NULL` → les utilisateurs ne peuvent pas lire leur propre profil via l'API REST Supabase. Sans WF-STRIPE pour faire l'invite Supabase Auth et sans le trigger `link_auth_user_to_profile`, les profils sont orphelins.
**Fix** : Déployer WF-STRIPE en priorité. S'assurer que le trigger `on_auth_user_created` est bien actif en production. Ajouter une vérification dans WF-A : si le user existe déjà dans `auth.users`, lier directement.

---

### BUG-013 · HIGH
**Titre** : Pas de mentions légales ni politique de confidentialité — non-conformité LPD/RGPD
**Fichier** : `landing/src/App.jsx`, tous composants
**Description** : Le site collecte des emails (formulaire Tally), traite des données personnelles (profils, CV, candidatures) et vend des abonnements. La LPD suisse (en vigueur depuis 09/2023) et le RGPD européen (applicable aux résidents EU utilisant le service) exigent une politique de confidentialité accessible depuis toutes les pages.
**Fix** : Créer `/politique-confidentialite` et `/cgv`. Ajouter un lien dans le Footer. Mentionner : données collectées, durée de rétention, droits des utilisateurs, DPO contact.

---

## 🟡 MEDIUM — À corriger avant croissance

---

### BUG-014 · MEDIUM
**Titre** : Favicon pointe vers `/vite.svg` au lieu de `/favicon.svg`
**Fichier** : `landing/index.html`, ligne 4
**Description** : `<link rel="icon" type="image/svg+xml" href="/vite.svg" />` utilise l'icône Vite par défaut. `/public/favicon.svg` existe et contient l'icône ApplyFlow.
**Fix** : `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`

---

### BUG-015 · MEDIUM
**Titre** : Open Graph sans og:image — mauvais rendu partage social
**Fichier** : `landing/index.html`, lignes 9–18
**Description** : Absence de `og:image` et `twitter:image`. Tous les partages sur WhatsApp, LinkedIn, Twitter/X, Slack afficheront une boîte vide à la place d'une preview visuelle. Impact direct sur le taux de conversion des partages.
**Fix** : Ajouter `/public/og-image.png` (1200×630px) et les meta tags correspondants.

---

### BUG-016 · MEDIUM
**Titre** : WF-B — `annees_exp` non stocké dans Supabase `profils`
**Fichier** : `DATA_MODEL.md` (schéma profils) + `WORKFLOWS.md` WF-B prompt scoring
**Description** : Le champ `annees_exp` est collecté dans Tally et utilisé dans le prompt de scoring Claude, mais n'est pas défini comme colonne dans la table `profils`. WF-A extrait la valeur mais n'a nulle part où l'écrire. WF-B tente de le lire depuis Supabase → `undefined` dans le prompt.
**Fix** : Ajouter `annees_exp INTEGER DEFAULT 0` à la table `profils`. Mettre à jour WF-A pour l'écrire. Ajouter à la Migration 001.

---

### BUG-017 · MEDIUM
**Titre** : Race condition sur INSERT profil — double soumission Tally
**Fichier** : `ApplyFlow_Passation_Projet.md` section 6 (structure WF-A)
**Description** : Le workflow fait SELECT → IF (existe ?) → INSERT ou UPDATE, sans transaction. Si un utilisateur soumet deux fois le formulaire rapidement, les deux exécutions peuvent passer le SELECT (email non encore committé), puis tenter deux INSERTs → violation de contrainte UNIQUE sur `email` → une des deux exécutions échoue.
**Fix** : Utiliser `UPSERT` (Insert + onConflict=email → update) au lieu de SELECT+IF. Le node Supabase n8n supporte le mode "Upsert".

---

### BUG-018 · MEDIUM
**Titre** : Fonction SECURITY DEFINER sans `SET search_path` — vulnérabilité PostgreSQL
**Fichier** : `INTEGRATIONS.md` section 6, `DATA_MODEL.md` section trigger
**Description** : Sans `SET search_path = public, pg_catalog`, un attaquant avec accès à la DB pourrait créer un objet malveillant dans un schéma qui precède `public` dans le search_path et faire exécuter du code arbitraire par la fonction SECURITY DEFINER.
**Fix** : `$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;`

---

### BUG-019 · MEDIUM
**Titre** : Trigger `updated_at` manquant sur `preferences_recherche`
**Fichier** : `DATA_MODEL.md` section "Trigger updated_at automatique"
**Description** : Les triggers `set_updated_at` sont définis pour `profils` et `candidatures` mais pas pour `preferences_recherche`. Le champ `updated_at` existe sur la table mais ne sera jamais mis à jour automatiquement.
**Fix** : Ajouter `CREATE TRIGGER set_updated_at_preferences BEFORE UPDATE ON preferences_recherche FOR EACH ROW EXECUTE FUNCTION update_updated_at();`

---

### BUG-020 · MEDIUM
**Titre** : Claim "200+ chercheurs d'emploi" possiblement faux — risque LCD suisse
**Fichier** : `landing/src/components/Hero.jsx`, ligne 13
**Description** : Si le service vient d'être lancé et n'a pas encore 200 utilisateurs, ce badge social proof constitue une indication fausse sur la popularité du service, potentiellement déloyale sous l'art. 3 LCD.
**Fix** : Retirer ou remplacer par un chiffre vérifiable. Utiliser "Rejoignez les premiers chercheurs d'emploi en Suisse romande" si en phase beta.

---

## 🔵 LOW — Qualité et maintenabilité

---

### BUG-021 · LOW
**Titre** : Pas d'export JSON des workflows n8n dans le repo
**Description** : WF-A est le seul workflow fonctionnel et n'est pas versionné. Si le compte n8n Cloud est perdu, WF-A est irrécupérable.
**Fix** : Exporter tous les workflows depuis n8n (Settings → Download) et les committer dans `n8n-workflows/wf-a-onboarding.json`, etc.

---

### BUG-022 · LOW
**Titre** : Contradiction architecture : DECISIONS.md dit Framer, le code implémente Vite+React
**Fichier** : `DECISIONS.md` D-004 vs branche `frontend`
**Description** : La documentation de décision recommande Framer mais le code réel est Vite+React. Pas un bug fonctionnel mais une confusion pour les futurs développeurs.
**Fix** : Mettre à jour DECISIONS.md D-004 pour documenter le changement de stack et la justification.

---

### BUG-023 · LOW
**Titre** : `landing/src/App.css` — styles globaux potentiellement conflictuels avec Tailwind v4
**Fichier** : `landing/src/App.css`
**Description** : L'application utilise TailwindCSS v4 (via `@tailwindcss/vite`) mais `App.css` contient des styles CSS globaux. Avec Tailwind v4, le fichier CSS de base est généré automatiquement — les styles dans `App.css` peuvent créer des conflits ou des surcharges inattendues.
**Fix** : Vérifier qu'`App.css` ne définit que des custom properties CSS (`:root { --xxx }`) et n'override pas les utilitaires Tailwind.

---

## RÉCAPITULATIF

| Sévérité | Nombre | Bugs |
|---|---|---|
| 🔴 CRITICAL | 6 | BUG-001 à BUG-006 |
| 🟠 HIGH | 7 | BUG-007 à BUG-013 |
| 🟡 MEDIUM | 7 | BUG-014 à BUG-020 |
| 🔵 LOW | 3 | BUG-021 à BUG-023 |
| **TOTAL** | **23** | |

---

```json
{"approved": false, "critical_bugs": 6, "summary": "ApplyFlow ne peut pas aller en production dans son état actuel. 6 bugs critiques bloquent le lancement : API Stripe dépréciée sans gestion d'erreur, prix incohérents entre frontend et documentation (Starter gratuit vs 9 CHF, Pro 29 vs 19 CHF, Booster 79 vs 39 CHF), page /merci post-paiement inexistante (404 après checkout), schema mismatch champ lien/url dans WF-B qui fait échouer tous les inserts d'offres emploi, et vérification signature Stripe documentée comme automatique alors qu'elle ne l'est pas (faille de sécurité majeure). De plus, les workflows WF-STRIPE, WF-C, WF-D et Resend ne sont pas encore construits/configurés, rendant le produit non vendable. 7 bugs HIGH doivent être résolus avant la première cohorte d'utilisateurs."}
```
