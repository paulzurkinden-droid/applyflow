# QA_REPORT.md — ApplyFlow

**Date** : 2026-03-29
**Reviewer** : QA Engineer (automated review)
**Branches reviewed** : `main`, `frontend` (no `backend` branch exists)
**n8n workflows reviewed** : WF-A (code documented), WF-B (partial), WF-C/D/STRIPE (not yet built)
**Scope** : Code, docs, data model, integrations, security, env vars

---

## VERDICT GLOBAL : ❌ NON APPROUVÉ POUR LA PRODUCTION

| Couche | Statut | Score |
|---|---|---|
| Frontend / Landing | ⚠️ Problèmes bloquants | 4/10 |
| Stripe Integration | ❌ Critique | 2/10 |
| n8n WF-A (Onboarding) | ⚠️ Problèmes moyens | 6/10 |
| n8n WF-B (Alertes) | ❌ Non finalisé + bugs | 3/10 |
| n8n WF-C/D/STRIPE | ❌ Non construit | 0/10 |
| Data Model / Supabase | ⚠️ Incohérences schéma | 5/10 |
| Sécurité | ❌ Lacunes critiques | 3/10 |
| Configuration Resend | ❌ Non configuré | 0/10 |

---

## 1. BRANCHES & STRUCTURE DU REPO

### 1.1 Branches existantes
- `main` — **Documentation uniquement** (8 fichiers Markdown, aucun code)
- `frontend` — Landing page Vite + React + TailwindCSS v4 + Stripe.js

### 1.2 Branches manquantes
- Branche `backend` : **n'existe pas** (mentionnée dans la demande de review)
- Dossier `n8n-workflows/` : **absent du repo** — aucun fichier JSON n8n exporté
- WF-B, WF-C, WF-D, WF-STRIPE : uniquement documentés, pas encore construits

---

## 2. FRONTEND — LANDING PAGE (branche `frontend`)

### 2.1 Stripe Integration — `landing/src/lib/stripe.js`

**🔴 CRITIQUE — API Stripe dépréciée**
`stripe.redirectToCheckout({ lineItems, mode, successUrl, cancelUrl })` est l'ancienne API client-only Stripe Checkout, **officiellement dépréciée**. En production avec @stripe/stripe-js v9, cette méthode peut échouer ou afficher des avertissements. La méthode correcte est :
- Soit créer une Checkout Session côté backend, puis `stripe.redirectToCheckout({ sessionId })`
- Soit utiliser des **Stripe Payment Links** (URLs statiques) sans SDK JS — approche recommandée pour un projet sans backend

**🔴 CRITIQUE — Aucune gestion d'erreur sur le checkout**
```javascript
export async function redirectToCheckout(priceId) {
  const stripe = await stripePromise;
  await stripe.redirectToCheckout({ ... }); // Pas de try/catch
}
```
Si `stripe` est `null` (bloqueur de pub, échec réseau), `stripe.redirectToCheckout()` lève une `TypeError` non catchée → page blanche pour l'utilisateur. Aucun feedback utilisateur en cas d'échec.

**🔴 CRITIQUE — `priceId` peut être `undefined`**
```javascript
const priceId = priceEnvKey === 'VITE_STRIPE_PRICE_PRO'
  ? import.meta.env.VITE_STRIPE_PRICE_PRO
  : import.meta.env.VITE_STRIPE_PRICE_BOOSTER;
redirectToCheckout(priceId); // priceId = undefined si env var manquante
```
Si les variables d'environnement ne sont pas définies (déploiement sans `.env`), `priceId` est `undefined` et Stripe lève une erreur non gérée. Aucune validation de la présence des env vars.

**🟠 IMPORTANT — Logic de mapping priceEnvKey fragile**
Le switch `priceEnvKey === 'VITE_STRIPE_PRICE_PRO'` compare le nom de la variable à sa valeur — tout changement de nommage casse silencieusement le checkout pour un plan.

### 2.2 Pricing — `landing/src/components/Pricing.jsx`

**🔴 CRITIQUE — Prix incohérents avec toute la documentation**

| Plan | Frontend | DECISIONS.md | INTEGRATIONS.md | WORKFLOWS.md |
|---|---|---|---|---|
| Starter | **GRATUIT** | 9 CHF/mois | 9 CHF/mois | 9 CHF/mois |
| Pro | **CHF 29/mois** | 19 CHF/mois | 19 CHF/mois | 19 CHF/mois |
| Booster | **CHF 79/mois** | 39 CHF/mois | 39 CHF/mois | 39 CHF/mois |

Le plan Starter est affiché gratuit dans le frontend (pas de priceId, redirection Tally) mais est à 9 CHF dans tous les documents. Les plans Pro et Booster sont **plus du double** des prix documentés. Incohérence majeure entre le frontend et le business model.

**🟠 IMPORTANT — Route `/merci` inexistante**
```javascript
successUrl: window.location.origin + '/merci',
```
Cette route n'existe pas dans l'application React. Après paiement réussi, l'utilisateur atterrit sur une page 404 ou vide — pas de page de confirmation, pas de message de succès.

### 2.3 App & SEO — `landing/index.html`

**🟡 MEDIUM — Favicon incorrect**
```html
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
```
Le favicon pointe vers `/vite.svg` (icône par défaut Vite) au lieu de `/favicon.svg` qui existe bien dans `public/`.

**🟡 MEDIUM — Open Graph et Twitter Card sans image**
`og:image` et `twitter:image` sont absents des meta tags, ce qui réduit significativement la qualité du partage social (aperçu sans image sur WhatsApp, Twitter, LinkedIn).

**🟡 MEDIUM — Aucune mention légale ni politique de confidentialité**
La FAQ indique que les données sont sécurisées et chiffrées, mais il n'y a aucun lien vers des CGU, politique de confidentialité ou mentions légales. Ceci est **requis par la LPD suisse** (Loi sur la protection des données) et le RGPD pour tout service collectant des données personnelles (email, profil).

**🟡 MEDIUM — Claim social proof non vérifiable**
```jsx
"Rejoignez 200+ chercheurs d'emploi en Suisse romande"
```
Si ce chiffre est fictif ou non atteint au lancement, cela constitue une pratique commerciale déloyale sous la **LCD suisse** (Loi contre la concurrence déloyale, art. 3).

### 2.4 Architecture Frontend vs. Documentation

**🟠 IMPORTANT — Contradiction avec DECISIONS.md**
DECISIONS.md D-004 décide d'utiliser **Framer** pour la landing page, mais le frontend branch implémente une app **Vite + React** custom. Ce n'est pas intrinsèquement un bug, mais crée une incohérence de documentation qui peut confondre les prochains développeurs.

---

## 3. STRIPE — INTÉGRATION PAIEMENT

### 3.1 WF-STRIPE (n8n) — Non construit

**🔴 CRITIQUE — Flux de paiement non implémenté**
WF-STRIPE est marqué "🔲 À construire". Sans ce workflow :
- Aucune création de compte utilisateur après paiement
- Aucune mise à jour du plan (`starter/pro/booster`) dans Supabase
- Aucune gestion des désabonnements
- Le produit ne peut **pas être vendu** dans son état actuel

### 3.2 Vérification de signature Stripe — Documentation incorrecte

**🔴 CRITIQUE — INTEGRATIONS.md induit en erreur**
```
Note : n8n vérifie le HMAC automatiquement avec le Signing Secret
```
**Ceci est faux.** Le node Webhook n8n avec `Header Auth` vérifie uniquement qu'un header contient une valeur statique — il ne fait **pas** de vérification HMAC-SHA256 de la signature Stripe. La vraie vérification exige un Code node qui :
1. Récupère le header `stripe-signature`
2. Parse `t=timestamp,v1=signature`
3. Calcule `HMAC-SHA256(timestamp + "." + raw_body, signing_secret)`
4. Compare au `v1` reçu en constant-time

Sans cela, n'importe qui peut forger un webhook Stripe et déclencher des créations de compte ou changements de plan.

### 3.3 Métadonnées Stripe non documentées correctement

**🟠 IMPORTANT — Métadonnées plan dans DATA_MODEL.md**
```typescript
metadata: { plan: 'starter' | 'pro' | 'booster' }
```
Ces métadonnées doivent être configurées dans le **Price object** Stripe (pas le Product), et leur présence dans `checkout.session.completed` dépend de comment les Payment Links sont configurés. Si les métadonnées sont absentes, le workflow ne peut pas déterminer le plan souscrit.

---

## 4. n8n WF-A — ONBOARDING (documenté, déployé)

### 4.1 Sécurité webhook Tally

**🟠 IMPORTANT — Aucune vérification de signature Tally**
L'URL webhook `f1fea724-e392-473d-963a-49cf3207f5cf` est sécurisée uniquement par obscurité. Tally supporte les webhook signatures (HMAC), mais le workflow ne les vérifie pas. Toute personne connaissant l'URL (repo GitHub public!) peut injecter des données arbitraires et créer/modifier des profils.

**🟠 IMPORTANT — URL webhook exposée dans un repo public**
```
https://p2urkinden.app.n8n.cloud/webhook/f1fea724-e392-473d-963a-49cf3207f5cf
```
Cette URL est visible dans `ApplyFlow_Passation_Projet.md` sur GitHub. Elle devrait être dans un fichier `.env` ou au moins dans un document privé.

### 4.2 Validation des données

**🟡 MEDIUM — Aucune validation côté n8n**
Le Code node parse les champs Tally mais ne valide pas :
- Format email (`email` pourrait être vide ou malformé → échec de la contrainte UNIQUE)
- Longueur du `nom` (TEXT NOT NULL dans la DB)
- Valeurs valides pour `type_contrat` et `taux`
- Injection de caractères spéciaux dans les champs text

**🟡 MEDIUM — Race condition sur la vérification email**
Le workflow vérifie l'email avec un SELECT puis insère ou met à jour en deux opérations non atomiques. Si deux soumissions arrivent simultanément pour le même email, les deux peuvent passer le SELECT (email non trouvé) et tenter deux INSERTs, causant une erreur de contrainte UNIQUE.

### 4.3 Problème RLS / user_id NULL

**🟠 IMPORTANT — Profils créés sans `user_id`**
WF-A crée des profils dans `profils` sans `user_id` (nullable pour le MVP). Or les politiques RLS sont :
```sql
CREATE POLICY "Users can read own profile"
  ON profils FOR SELECT USING (auth.uid() = user_id);
```
Avec `user_id = NULL`, `auth.uid() = NULL` est toujours `false` → l'utilisateur ne peut **jamais lire son propre profil** jusqu'à ce que le lien `auth.users` soit fait via le trigger. Le trigger `link_auth_user_to_profile()` n'est déclenché que si Supabase Auth crée l'utilisateur (flux Stripe → WF-STRIPE → Admin API invite). Sans WF-STRIPE, les profils restent inaccessibles.

---

## 5. n8n WF-B — ALERTES EMPLOI (partiellement documenté, non finalisé)

### 5.1 Incohérence du champ `lien` vs `url`

**🔴 CRITIQUE — Schema mismatch entre workflow et base de données**
Dans `ApplyFlow_Passation_Projet.md` section 7, le format normalisé d'une offre utilise `lien` :
```javascript
{ source, titre, lien: String, entreprise, ... }
```
Mais dans `WORKFLOWS.md` section 2 et la table `offres_alertes` : le champ est `url`.
La contrainte UNIQUE est sur `(user_id, url)` — si le workflow insère dans un champ `lien` qui n'existe pas, le INSERT échoue. Le dédoublonnage ne fonctionne pas.

### 5.2 Contrainte CHECK source violée

**🔴 CRITIQUE — Valeur 'jobup.ch' invalide**
Table `offres_alertes` :
```sql
CHECK (source IN ('Adzuna', 'Confederation', 'Jobup'))
```
Le Code node du WF-B produit `source: 'jobup.ch'` (avec `.ch`). Cette valeur **n'est pas dans la contrainte CHECK** → tout insert d'offre Jobup lève une erreur et est rejeté silencieusement (selon `onError=continueRegularOutput`).

### 5.3 Clés API Adzuna en clair dans le code

**🟠 IMPORTANT — Placeholders non remplacés**
```javascript
const APP_ID = '{{ADZUNA_APP_ID}}';
const APP_KEY = '{{ADZUNA_APP_KEY}}';
```
Ces placeholders template n8n ne sont **pas des expressions n8n valides** (`{{ }}` n'est pas la syntaxe n8n). Les vraies expressions seraient `$credentials.adzunaAppId`. Si ce code est déployé tel quel, toutes les requêtes Adzuna retourneront 401.

### 5.4 Champ `annees_exp` absent du schéma

**🟡 MEDIUM — Champ utilisé mais non stocké**
Le prompt de scoring Claude utilise `annees_exp` du profil utilisateur, mais ce champ n'existe pas dans la table `profils`. Il est collecté dans Tally mais n'est pas écrit en base. Le scoring sera fait sans ce critère important.

### 5.5 Jointure profils ↔ preferences_recherche non spécifiée

**🟡 MEDIUM — Step [3] WF-B sous-spécifié**
Le node Supabase "Récupérer préférences" filtre par `user_id IN (liste from step 2)` mais le node Supabase natif n8n ne supporte pas nativement les clauses IN avec une liste dynamique. Sans un Code node de jointure explicite, les données profil et préférences ne seront pas correctement associées par utilisateur.

### 5.6 Email digest envoyé par offre (pas par utilisateur)

**🟡 MEDIUM — Spam potentiel**
L'architecture de WF-B éclate les offres en items individuels (step [15]) avant le filtre score ≥ 7 (step [17]) et l'envoi email (step [19]). Sans regroupement explicite par utilisateur avant l'envoi, chaque offre scorée ≥ 7 déclencherait un email séparé — un utilisateur avec 5 offres pertinentes recevrait 5 emails au lieu d'un digest.

---

## 6. DATA MODEL — SUPABASE

### 6.1 Incohérences de schéma entre documents

**🟠 IMPORTANT — Deux versions du schéma `offres_alertes`**
- `ApplyFlow_Passation_Projet.md` section 3 : table minimale sans `entreprise`, `localisation`, `date_publication`, `description`
- `DATA_MODEL.md` : table complète avec ces colonnes

WF-B insère `entreprise`, `localisation`, `date_publication`, `description`. Si la table en production correspond à la version minimale (ancienne), ces inserts échouent.

**🟠 IMPORTANT — Deux versions du schéma `candidatures`**
- `Passation` : sans `notes`, `offre_alerte_id`, `updated_at`
- `DATA_MODEL.md` : avec ces colonnes (Migration 001)

**🟡 MEDIUM — `preferences_recherche` : `taux_travail` manquant dans la passation**
- `DATA_MODEL.md` inclut `taux_travail TEXT`
- `Passation` ne l'a pas → champ peut ne pas exister en production

### 6.2 Trigger `updated_at` incomplet

**🟡 MEDIUM — `preferences_recherche` sans trigger**
Les triggers `set_updated_at` sont définis pour `profils` et `candidatures` mais pas pour `preferences_recherche` qui a pourtant un champ `updated_at`.

### 6.3 Sécurité SQL

**🟡 MEDIUM — Fonction SECURITY DEFINER sans search_path**
```sql
CREATE OR REPLACE FUNCTION link_auth_user_to_profile()
RETURNS TRIGGER AS $$
...
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
Sans `SET search_path = public, pg_catalog`, une fonction `SECURITY DEFINER` est vulnérable aux attaques par injection de `search_path`. Doit être :
```sql
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;
```

### 6.4 Pas de politique INSERT pour `profils`

**🟡 MEDIUM — RLS bloque les auto-inscriptions futures**
Il n'existe pas de politique `INSERT` sur `profils` pour les utilisateurs authentifiés. Si un futur dashboard permet aux users de compléter leur profil directement (sans passer par n8n), les inserts seront refusés par RLS.

---

## 7. SÉCURITÉ GLOBALE

### 7.1 Authentification WF-C non implémentée

**🔴 CRITIQUE (à venir) — JWT non vérifié**
L'API spec définit WF-C avec `Auth: Bearer token (user Supabase JWT)`, mais n8n ne peut pas vérifier un JWT nativement. Sans un Code node appelant Supabase pour valider le token, tout utilisateur peut appeler le webhook avec un user_id arbitraire et générer des LM pour d'autres utilisateurs.

### 7.2 Pas de vérification de plan dans WF-C

**🟠 IMPORTANT (à venir) — Bypass plan**
Le WORKFLOWS.md mentionne la vérification :
```javascript
if (!['pro', 'booster'].includes(profil.plan)) { /* 403 */ }
```
Mais sans authentification JWT valide (voir 7.1), un utilisateur Starter peut contourner la restriction en fournissant un `user_id` Pro.

### 7.3 Service Role Key

**🟡 MEDIUM — Single point of failure**
La service_role key dans les credentials n8n contourne tout RLS. Si elle est compromise (accès non autorisé à n8n Cloud), toutes les données utilisateurs sont exposées. Recommandé : Supabase Vault pour stocker les secrets + monitoring des accès service_role.

### 7.4 Informations sensibles dans le repo public

| Information | Fichier | Risque |
|---|---|---|
| URL webhook n8n production | `ApplyFlow_Passation_Projet.md` | Spam/injection |
| URL Supabase projet | Plusieurs fichiers | Reconnaissance |
| ID dossier Google Drive | `ApplyFlow_Passation_Projet.md` | Si credentials volés |
| IDs templates Google Docs | `INTEGRATIONS.md` | Copie templates |

---

## 8. RESEND — CONFIGURATION EMAILS

**🔴 CRITIQUE — Non configuré**
Resend n'est pas configuré. Sans cela :
- Aucun email de bienvenue post-inscription
- Aucune alerte offres emploi envoyée
- Aucune livraison des lettres de motivation

Actions requises avant production :
1. Vérifier le domaine `applyflow.ch` dans Resend (DNS TXT + MX)
2. Configurer SPF (`v=spf1 include:amazonses.com ~all`)
3. Configurer DKIM (clé fournie par Resend)
4. Créer les adresses d'expédition (`bienvenue@`, `alertes@`, `noreply@`)
5. Créer la clé API et l'ajouter aux credentials n8n
6. Tester la délivrabilité (score spam < 3)

---

## 9. ARCHITECTURE & DOCUMENTATION

### 9.1 Pas de fichiers n8n exportés

**🟡 MEDIUM — Risque de perte**
Aucun workflow n8n n'est exporté en JSON dans le repo. Si le compte n8n Cloud est perdu ou supprimé, WF-A (le seul workflow complet) est irrécouvrable. Recommandé : exporter et versionner les JSON dans `n8n-workflows/`.

### 9.2 Cron WF-B — Vérification expression

**🟡 MEDIUM — Double cron non configurable**
`0 8 * * *` et `0 18 * * *` — ces deux déclencheurs nécessitent deux Cron Trigger nodes dans n8n (ou un Schedule Trigger avec deux plages horaires). La documentation ne précise pas si c'est un seul node avec deux expressions ou deux nodes séparés. Si mal configuré, WF-B peut ne déclencher qu'une fois par jour.

### 9.3 Timeout WF-C

**🟡 MEDIUM — Risque de timeout n8n**
DECISIONS.md D-001 précise un timeout de 60s pour les webhooks n8n. WF-C enchaîne : Supabase (×2) + Claude (~10-15s) + Google Drive copy + batchUpdate + Permissions + Supabase insert + Resend = risque réel de dépasser 45s recommandés. Aucune stratégie async/queue documentée pour ce cas.

---

## 10. RÉSUMÉ DES ACTIONS REQUISES AVANT PRODUCTION

### Bloquant (doit être résolu) :
1. Remplacer `stripe.redirectToCheckout` deprecated par Payment Links ou session backend
2. Ajouter try/catch et feedback utilisateur sur le checkout Stripe
3. Valider les env vars Stripe au runtime
4. Corriger les prix dans Pricing.jsx (alignement avec le business model)
5. Créer la page `/merci` post-paiement
6. Construire et déployer WF-STRIPE avec vraie vérification signature HMAC
7. Corriger le champ `lien` → `url` dans le format normalisé WF-B
8. Corriger `source: 'jobup.ch'` → `source: 'Jobup'` dans WF-B
9. Remplacer les placeholders `{{ADZUNA_APP_ID}}` par des credentials n8n valides
10. Configurer Resend (domaine, DNS, clé API)

### Importants (avant la première cohorte d'utilisateurs) :
11. Implémenter la vérification de signature webhook Tally
12. Ajouter la vérification JWT dans WF-C
13. Appliquer Migration 001 en production (colonnes manquantes)
14. Exporter WF-A en JSON et le versionner dans `n8n-workflows/`
15. Ajouter mentions légales / politique de confidentialité (LPD/RGPD)
16. Corriger le favicon (`/favicon.svg`)
17. Ajouter og:image et twitter:image
18. Corriger la fonction SECURITY DEFINER (search_path)
19. Regrouper les emails par utilisateur dans WF-B avant envoi

---

*QA COMPLETE*
