# QA_REPORT.md — ApplyFlow

**Date** : 2026-03-30 (Pass 2 — Re-audit post-fixes)
**Pass 1** : 2026-03-29 — 6 CRITICAL, 7 HIGH, 7 MEDIUM, 3 LOW
**Reviewer** : QA Engineer (automated review)
**Branches reviewed** : `main`, `frontend` (commit `97294d2`), `backend` (commit `cb1a210`)
**Scope** : Full re-audit of BUG-001 through BUG-013 + new backend branch (4 n8n JSONs, 2 SQL migrations, Stripe setup doc)

---

## VERDICT GLOBAL : ❌ NON APPROUVÉ POUR LA PRODUCTION

Significant progress since Pass 1: BUG-001 through BUG-005, BUG-007, BUG-010 are fully fixed. The backend branch introduces 4 exported n8n workflow JSONs and proper SQL migrations — major structural improvements.

**However, 3 CRITICAL blockers remain unresolved, and 2 new CRITICAL bugs were introduced in the backend branch.**

| Couche | Pass 1 | Pass 2 | Delta |
|---|---|---|---|
| Frontend / Landing | 4/10 | 8/10 | ✅ +4 |
| Stripe Integration (frontend) | 2/10 | 9/10 | ✅ +7 |
| WF-STRIPE (n8n) | 0/10 | 5/10 | ⚠️ +5 |
| WF-B (Alertes) | 3/10 | 6/10 | ⚠️ +3 |
| WF-C (Génération LM) | 0/10 | 5/10 | ⚠️ new |
| WF-D (CRM Candidatures) | 0/10 | 7/10 | ✅ new |
| Data Model / Supabase | 5/10 | 8/10 | ✅ +3 |
| Sécurité | 3/10 | 4/10 | ⚠️ +1 |
| Resend / Emails | 0/10 | 2/10 | 🔴 broken |

---

## TABLEAU DE BORD — BUGS PASS 1 (BUG-001 à BUG-013)

| Bug | Titre | Statut Pass 2 |
|---|---|---|
| BUG-001 | API Stripe `redirectToCheckout` dépréciée | ✅ FIXED |
| BUG-002 | Aucune gestion d'erreur sur le checkout | ✅ FIXED |
| BUG-003 | Prix incohérents (Gratuit/29/79 vs 9/19/39 CHF) | ✅ FIXED |
| BUG-004 | Page `/merci` inexistante | ✅ FIXED |
| BUG-005 | WF-B : champ `lien` vs `url` — schema mismatch | ✅ FIXED |
| BUG-006 | Signature Stripe — fausse vérification HMAC | ❌ NOT FIXED |
| BUG-007 | WF-B : `source: 'jobup.ch'` viole contrainte CHECK | ✅ FIXED |
| BUG-008 | WF-B : placeholders Adzuna `{{}}` invalides | ⚠️ PARTIAL |
| BUG-009 | URL webhook Tally exposée dans repo public | ⚠️ UNCHANGED |
| BUG-010 | `priceId` undefined si env vars Stripe absentes | ✅ FIXED |
| BUG-011 | Email digest par offre, non par utilisateur | ❌ NOT FIXED |
| BUG-012 | Profils sans `user_id` — RLS bloque l'accès | ⚠️ PARTIAL |
| BUG-013 | Pas de mentions légales / politique de confidentialité | ❌ NOT FIXED |

---

## DÉTAIL DES CORRECTIFS PASS 2

### ✅ BUG-001 & BUG-002 — Stripe frontend entièrement refactorisé
`landing/src/lib/stripe.js` remplace complètement le SDK `redirectToCheckout` par des **Stripe Payment Links** (URLs statiques). La fonction `redirectToPaymentLink(url)` inclut validation de l'URL, try/catch, et message d'erreur utilisateur. Implémentation correcte.

### ✅ BUG-003 — Prix alignés avec la documentation
`landing/src/components/Pricing.jsx` : CHF 9 / CHF 19 / CHF 39 — cohérent avec toute la documentation. Plan Starter n'est plus gratuit. React Router ajouté, tous les plans ont un CTA Stripe Payment Link.

### ✅ BUG-004 — Page `/merci` créée et routée
`landing/src/components/Merci.jsx` existe, `BrowserRouter` + `Routes` configuré dans `App.jsx`. La page de confirmation est complète avec checklist "Et maintenant ?", lien support, et retour accueil.

### ✅ BUG-005 — Champ `url` unifié dans WF-B
Le Code node "Parser offres" dans `wf-b-alertes-offres.json` utilise `url: r.redirect_url` (Adzuna) et `url: getTag('link')` (RSS) — champ `url` cohérent avec le schéma Supabase.

### ✅ BUG-007 — Valeur source `'Jobup'` corrigée
Le Code node de normalisation utilise `source: 'Jobup'` pour le feed RSS Jobup.ch, conforme à la contrainte CHECK `IN ('Adzuna', 'Confederation', 'Jobup')`.

### ✅ BUG-010 — Env vars Payment Link validées
`Pricing.jsx` lit `VITE_STRIPE_PAYMENT_LINK_STARTER/PRO/BOOSTER` et `redirectToPaymentLink` lève une erreur explicite si l'URL est absente/falsy.

---

## BUGS RESTANTS ET NOUVEAUX PROBLÈMES

### ❌ BUG-006 — Vérification signature Stripe HMAC toujours absente (CRITICAL)

**Fichier** : `n8n/workflows/wf-stripe-abonnements.json` — node "Webhook - Stripe"
**Description** : Le webhook Stripe utilise `authentication: headerAuth` avec credential `l9fVHncLdNjJk6Gg` ("Header Auth account"). La documentation `stripe/setup.md` confirme la configuration :
```
Header Name: Stripe-Signature
Header Value: whsec_[your-signing-secret]
```
Cette configuration compare statiquement le header `Stripe-Signature` à la valeur `whsec_xxx` — ce qui est **structurellement impossible** car Stripe génère une signature HMAC unique pour chaque requête (format `t=timestamp,v1=hash`). La comparaison statique échouera systématiquement, soit acceptant TOUTES les requêtes (si Header Auth est désactivé), soit en refusant les vraies requêtes Stripe.

`stripe/setup.md` mentionne en note : *"Alternative: If you want to use Stripe's signature verification logic, update the Code node..."* — mais cela n'a pas été implémenté.

**Impact** : Soit le webhook n'est pas protégé (quiconque peut envoyer de faux événements), soit toutes les vraies notifications Stripe sont rejetées (aucun abonnement créé). Dans les deux cas, le flux de paiement est cassé ou non sécurisé.

---

### 🔴 NOUVEAU BUG N-001 — `{{RESEND_API_KEY}}` hardcodé — TOUTES les lignes d'email cassées (CRITICAL)

**Fichiers** :
- `n8n/workflows/wf-stripe-abonnements.json` : nodes "HTTP - Email bienvenue Resend" et "HTTP - Email résiliation Resend"
- `n8n/workflows/wf-b-alertes-offres.json` : node "HTTP - Envoyer alerte Resend"
- `n8n/workflows/wf-c-generation-lm.json` : node "HTTP - Envoyer LM Resend"

**Description** : Dans les 4 nodes HTTP Resend à travers 3 workflows, le header Authorization est :
```json
{ "name": "Authorization", "value": "Bearer {{RESEND_API_KEY}}" }
```
La syntaxe `{{RESEND_API_KEY}}` **n'est pas une expression n8n valide** pour accéder à des credentials ou variables d'environnement. En n8n, la syntaxe correcte est soit une référence à un credential, soit `$env['RESEND_API_KEY']`. En l'état, cette chaîne est envoyée litéralement à l'API Resend → HTTP 401 Unauthorized sur toutes les tentatives d'envoi d'email.

**Conséquences** :
- Aucun email de bienvenue après inscription (WF-STRIPE)
- Aucun email de résiliation (WF-STRIPE)
- Aucune alerte offres emploi (WF-B)
- Aucune livraison de lettre de motivation (WF-C)
- Le produit entier est silencieusement dysfonctionnel côté communication utilisateur

**Fix** : Dans chaque node HTTP Resend, remplacer par une référence à un credential n8n créé pour Resend :
```
Créer un credential n8n de type "Header Auth" :
  - Header: Authorization
  - Value: Bearer re_xxxxx (vraie clé Resend)
Référencer ce credential dans chaque HTTP Request node.
```
Ou alternativement utiliser `$env['RESEND_API_KEY']` si la variable est définie dans les settings n8n.

---

### 🔴 NOUVEAU BUG N-002 — `{{SUPABASE_SERVICE_ROLE_KEY}}` hardcodé — invitation utilisateur cassée (CRITICAL)

**Fichier** : `n8n/workflows/wf-stripe-abonnements.json` — node "HTTP - Inviter utilisateur Supabase Auth"
**Description** : Le node HTTP qui appelle `https://yltajummrsorqvynvod.supabase.co/auth/v1/admin/users` pour inviter un nouvel utilisateur utilise :
```json
{ "name": "apikey", "value": "{{SUPABASE_SERVICE_ROLE_KEY}}" },
{ "name": "Authorization", "value": "Bearer {{SUPABASE_SERVICE_ROLE_KEY}}" }
```
Même problème que N-001 : `{{SUPABASE_SERVICE_ROLE_KEY}}` est une chaîne littérale, non une expression n8n. Supabase rejettera la requête avec 401 → aucun compte utilisateur n'est créé après paiement → les profils Supabase restent sans `user_id` → l'utilisateur ne peut pas se connecter.

**Fix** : Utiliser le credential n8n Supabase existant ("Supabase account" ID: `8KEISLMo2kUMmv86`) ou créer un credential HTTP Header Auth séparé avec la vraie service_role key.

---

### ⚠️ BUG-008 — Credentials Adzuna : fix partiel avec fallback dangereux (HIGH)

**Fichier** : `n8n/workflows/wf-b-alertes-offres.json` — Code node "Construire URLs"
**Description** : Le code a été amélioré :
```javascript
const APP_ID = $env['ADZUNA_APP_ID'] || '{{ADZUNA_APP_ID}}';
const APP_KEY = $env['ADZUNA_APP_KEY'] || '{{ADZUNA_APP_KEY}}';
```
`$env['ADZUNA_APP_ID']` est la syntaxe n8n correcte pour les variables d'environnement. **Si** ces variables sont définies dans les Settings n8n → le workflow fonctionnera. **Mais** si elles ne sont pas définies, le fallback `'{{ADZUNA_APP_ID}}'` (chaîne littérale) sera utilisé → 401 Adzuna silencieux.

Il n'existe aucune validation explicite ni alerte si les env vars sont absentes. En production, un oubli de configuration passera inaperçu.

**Statut** : PARTIELLEMENT fixé — fonctionnel si les env vars sont correctement configurées dans n8n, mais sans garde-fou.

---

### ❌ BUG-011 — Email par offre, non par utilisateur (HIGH)

**Fichier** : `n8n/workflows/wf-b-alertes-offres.json`
**Description** : Le node "Code - Préparer email" utilise les données d'une offre individuelle (pas d'un groupe) :
```javascript
const offre = $('Code - Éclater offres').item.json; // une seule offre
const html = `...Nouvelle offre pertinente pour vous...${offre.titre}...`;
```
Le sujet est `?? Nouvelle offre pertinente : ${offre.titre}` — confirmant l'envoi d'un email par offre. Un utilisateur avec 5 offres scorées ≥ 7 recevra 5 emails en quelques secondes.

**Non corrigé depuis Pass 1.**

---

### ❌ BUG-013 — Pas de mentions légales / politique de confidentialité (HIGH)

**Fichier** : `landing/src/components/Footer.jsx`
**Description** : Le footer ne contient aucun lien vers CGU, politique de confidentialité, ou mentions légales. La section "Mes données sont-elles sécurisées ?" dans FAQ.jsx promet une politique de données sans la rendre accessible. Non conforme à la LPD suisse.

**Non corrigé depuis Pass 1.**

---

### 🔴 NOUVEAU BUG N-003 — WF-C : aucune vérification du plan utilisateur (HIGH)

**Fichier** : `n8n/workflows/wf-c-generation-lm.json` — Code node "Valider requête"
**Description** : Le Code node de validation vérifie `user_id`, `titre_poste`, `entreprise`, `description_offre` — mais **ne vérifie pas** si l'utilisateur a le plan `pro` ou `booster`. Un utilisateur `starter` peut appeler `/webhook/generate-lm` avec un `user_id` valide et générer des lettres de motivation illimitées. Le garde-fou plan est documenté dans la spec mais absent de l'implémentation.

**Fix** : Après la récupération du profil Supabase, ajouter un IF node :
```javascript
if (!['pro', 'booster'].includes(profil.plan) || !profil.actif) {
  // Respond 403 PLAN_INSUFFICIENT
}
```

---

### ⚠️ BUG-012 — Flux user_id : partiellement adressé (MEDIUM)

**Statut** : AMÉLIORÉ mais pas complètement résolu.
- ✅ WF-STRIPE crée maintenant les profils via Supabase Upsert
- ✅ WF-STRIPE invite l'utilisateur via Supabase Auth Admin API
- ✅ Migration 001 inclut le trigger `on_auth_user_created` qui lie `user_id`
- ❌ Mais N-002 : l'appel Admin API échoue (credential en dur) → trigger jamais déclenché → user_id reste NULL

La chaîne est correctement architecturée mais cassée par N-002.

---

### ⚠️ BUG-009 — URL webhook Tally encore dans les docs publics (MEDIUM)

**Fichiers** : `ApplyFlow_Passation_Projet.md`, `ARCHITECTURE.md` (branch main)
**Description** : L'URL `https://p2urkinden.app.n8n.cloud/webhook/f1fea724-e392-473d-963a-49cf3207f5cf` est toujours visible dans les docs publics du repo. Aucune vérification de signature Tally n'a été ajoutée à WF-A.

---

### 🟡 NOUVEAU BUG N-004 — Dépendance `@stripe/stripe-js` morte dans package.json (LOW)

**Fichier** : `landing/package.json`
**Description** : `@stripe/stripe-js: ^9.0.0` est toujours listé dans `dependencies` alors que le code migré vers Payment Links n'importe plus rien de cette bibliothèque. La lib est chargée inutilement (~40 KB gzippé), ralentissant légèrement le LCP.

---

### 🟡 NOUVEAU BUG N-005 — Stripe success_url dans setup.md ≠ route frontend (LOW)

**Fichiers** : `stripe/setup.md` vs `landing/src/App.jsx`
**Description** : `stripe/setup.md` Step 2 indique de configurer `https://applyflow.ch/welcome?session_id=...` comme success URL des Payment Links, mais le frontend a la route `/merci`. Si les Payment Links sont configurés avec `/welcome`, l'utilisateur atterrit sur une 404 après paiement.

---

### Bugs MEDIUM non corrigés de Pass 1 (inchangés)

- **BUG-014** : Favicon pointe vers `/vite.svg` — toujours présent dans `index.html`
- **BUG-015** : `og:image` et `twitter:image` absents de `index.html`
- **BUG-016** : `annees_exp` non stocké en DB (migration 001 ne l'ajoute pas — WF-B utilise le contournement `profil.cv_texte ? 5 : 0`)
- **BUG-018** : Fonction `link_auth_user_to_profile` SECURITY DEFINER sans `SET search_path` — toujours présent dans `migration 001`
- **BUG-020** : Claim "200+ chercheurs" dans Hero.jsx — toujours présent

---

## NOUVELLES OBSERVATIONS POSITIVES (Pass 2)

1. **Migrations SQL propres** : `001_initial_schema.sql` est complet et bien structuré — tables, index, RLS, triggers `updated_at` (y compris `preferences_recherche` qui manquait), trigger `link_auth_user_to_profile`. `002_add_missing_columns.sql` couvre tous les deltas de façon idempotente.

2. **WF-D (CRM Candidatures)** : Implémentation solide — validation statuts, vérification d'ownership via Supabase + IF, retour 403 correct. Architecture sécurisée.

3. **WF-B structure** : Architecture multi-utilisateurs correcte (jointure profils ↔ préférences par `user_id`), dédoublonnage URL fonctionnel, fallback Claude parsing robuste, champ `url` unifié.

4. **WF-C structure** : Claude prompt de qualité, try/catch sur le parsing JSON, fallback avec placeholders visibles, mapping batchUpdate Google Docs complet.

5. **Stripe setup.md** : Documentation claire et exhaustive des étapes de configuration.

---

## RÉSUMÉ DES ACTIONS REQUISES (MISE À JOUR)

### 🔴 Bloquants absolus (5 bugs critiques restants) :

1. **N-001** : Remplacer `{{RESEND_API_KEY}}` par credential n8n dans WF-B, WF-C, WF-STRIPE (6 nodes concernés)
2. **N-002** : Remplacer `{{SUPABASE_SERVICE_ROLE_KEY}}` par credential n8n dans WF-STRIPE node "Inviter utilisateur"
3. **BUG-006** : Implémenter la vérification HMAC-SHA256 de la signature Stripe dans WF-STRIPE (Code node avant le Switch)

### 🟠 Importants avant lancement :

4. **N-003** : Ajouter vérification du plan (pro/booster) dans WF-C après récupération du profil
5. **BUG-011** : Regrouper les offres par utilisateur avant envoi email dans WF-B
6. **BUG-013** : Créer pages légales et les lier depuis le Footer
7. **N-005** : Aligner success_url dans stripe/setup.md avec la route `/merci` du frontend
8. **BUG-008** : Ajouter validation explicite des env vars Adzuna avec arrêt du workflow si absentes

### 🟡 À traiter rapidement :

9. **BUG-014** : Corriger favicon dans `index.html` → `/favicon.svg`
10. **BUG-015** : Ajouter `og:image` et `twitter:image`
11. **BUG-018** : Ajouter `SET search_path = public, pg_catalog` à la fonction SECURITY DEFINER
12. **N-004** : Retirer `@stripe/stripe-js` des dépendances npm

---

*QA COMPLETE — Pass 2*
