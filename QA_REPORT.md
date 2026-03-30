# QA_REPORT.md — ApplyFlow

**Date** : 2026-03-30 (Pass 3 — Final pre-launch audit)
**Pass 1** : 2026-03-29 — 6 CRITICAL, 7 HIGH, 7 MEDIUM, 3 LOW
**Pass 2** : 2026-03-30 — 5 CRITICAL, 5 HIGH, 6 MEDIUM, 3 LOW
**Pass 3** : 2026-03-30 — **1 CRITICAL, 3 HIGH, 4 MEDIUM, 2 LOW**
**Reviewer** : QA Engineer
**Branches** : `main` (`7ff71c6`), `backend` (`26f4054`), `frontend` (`ce5e53a`)

---

## VERDICT GLOBAL : ❌ NON APPROUVÉ — 1 BLOQUANT CRITIQUE RESTANT

One critical showstopper remains: **live API credentials committed in plaintext to a public GitHub repository** (`docs/SETUP.md`, backend branch). This alone is grounds for rejection regardless of functional state. Once rotated and removed, the project is very close to production-ready.

Functionally, all 5 critical bugs from Pass 2 are resolved and the architecture is sound.

| Couche | Pass 2 | Pass 3 | Delta |
|---|---|---|---|
| Frontend / Landing | 8/10 | 8/10 | — |
| Stripe Integration | 9/10 | 9/10 | — |
| WF-STRIPE (n8n) | 5/10 | 9/10 | ✅ +4 |
| WF-B (Alertes) | 6/10 | 9/10 | ✅ +3 |
| WF-C (Génération LM) | 5/10 | 8/10 | ✅ +3 |
| WF-D (CRM Candidatures) | 7/10 | 9/10 | ✅ +2 |
| Data Model / Supabase | 8/10 | 9/10 | ✅ +1 |
| Sécurité | 4/10 | 3/10 | 🔴 -1 (leaked keys) |
| Resend / Emails | 2/10 | 9/10 | ✅ +7 |

---

## PASS 3 — STATUT DE CHAQUE BUG PASS 2

| Bug | Titre | Pass 3 Status |
|---|---|---|
| BUG-006 | Stripe HMAC signature verification | ✅ FIXED |
| BUG-N001 | `{{RESEND_API_KEY}}` literal in all email nodes | ✅ FIXED |
| BUG-N002 | `{{SUPABASE_SERVICE_ROLE_KEY}}` literal | ✅ FIXED |
| BUG-N003 | WF-C no plan check | ✅ FIXED |
| BUG-N005 | stripe/setup.md success_url `/welcome` wrong | ✅ FIXED |
| BUG-008 | Adzuna hard-fail on missing env vars | ✅ FIXED |
| BUG-009 | Webhook URLs in public repo | ⚠️ ACKNOWLEDGED (not removed) |
| BUG-011 | Email digest per-offer not per-user | ✅ FIXED |
| BUG-013 | No legal pages / privacy policy | ❌ NOT FIXED |
| BUG-014 | Favicon `/vite.svg` | ❌ NOT FIXED |
| BUG-015 | Missing og:image / twitter:image | ❌ NOT FIXED |
| BUG-016 | `annees_exp` not in DB | ✅ FIXED (migration 004) |
| BUG-018 | SECURITY DEFINER without search_path | ✅ FIXED (migration 003) |
| BUG-020 | "200+" claim unverified | ❌ NOT FIXED |
| BUG-N004 | `@stripe/stripe-js` dead dependency | ❌ NOT FIXED |

---

## DÉTAIL DES CORRECTIFS PASS 3

### ✅ BUG-006 — HMAC Stripe : implémentation complète et correcte

**Fichier** : `n8n/workflows/wf-stripe-abonnements.json` — node "Code - Verifier signature Stripe"

Architecture vérifiée :
- Webhook node : `authentication: none`, `options.rawBody: true` ✅
- Chaîne de connexion : Webhook → 200 ACK → **HMAC verify** → Parser → Switch ✅
- Implémentation : Web Crypto API (`crypto.subtle`) car `require('crypto')` est bloqué sur n8n Cloud ✅
- Parsing du header `t=timestamp,v1=hash` ✅
- Guard anti-replay : rejet si `|now - timestamp| > 300s` ✅
- Lecture du secret via `$env['STRIPE_WEBHOOK_SECRET']` (pas hardcodé) ✅

**Un point à surveiller** : La logique contient un soft-fail si `STRIPE_WEBHOOK_SECRET` n'est pas configuré :
```javascript
if (!secret) {
  console.warn('[WF-STRIPE] STRIPE_WEBHOOK_SECRET not configured - skipping HMAC verification');
  return $input.all(); // passe sans vérification
}
```
Acceptable pour le développement, **mais `STRIPE_WEBHOOK_SECRET` DOIT être configuré avant tout trafic réel**. Documenté dans `docs/SETUP.md`. Risque résiduel acceptable.

### ✅ BUG-N001 — Resend : credential n8n dans tous les nodes

Tous les 5 nodes HTTP Resend utilisent `auth: predefinedCredentialType` avec credential `tc2f1NdNXAUtStcp` ("Resend API") :
- WF-STRIPE : "HTTP - Email bienvenue Resend" ✅, "HTTP - Email résiliation Resend" ✅
- WF-B : "HTTP - Envoyer alerte Resend" ✅
- WF-C : "HTTP - Envoyer LM Resend" ✅

Aucune chaîne `{{RESEND_API_KEY}}` littérale dans les JSON. ✅

### ✅ BUG-N002 — Service Role Key : expressions n8n correctes

Node "HTTP - Inviter utilisateur Supabase Auth" :
```
apikey: ={{ $env['SUPABASE_SERVICE_ROLE_KEY'] }}
Authorization: ={{ 'Bearer ' + $env['SUPABASE_SERVICE_ROLE_KEY'] }}
```
Syntaxe n8n valide. La clé doit être configurée en tant que variable d'environnement n8n. ✅

### ✅ BUG-N003 — WF-C : vérification du plan Pro/Booster

IF node "IF - Plan Pro ou Booster ?" avec deux conditions combinées par `AND` :
1. `plan != 'starter'` — bloque les utilisateurs Starter
2. `actif == true` — bloque les comptes désactivés

Retour 403 avec payload `{ "error": "PLAN_INSUFFICIENT", "upgrade_url": "..." }` ✅

**Note** : La condition `plan != 'starter'` exclut aussi les plans `null` ou vides (car `null !== 'starter'` est vrai). Risque d'un profil inexistant passant la vérification si Supabase retourne un objet vide avec `alwaysOutputData=true`. Mineur en pratique car un `user_id` invalide échouerait à la récupération de profil.

### ✅ BUG-N005 — stripe/setup.md : success URL corrigée

Le frontend branch contient désormais `stripe/setup.md` avec :
```
Success URL: https://applyflow.ch/merci?session_id={CHECKOUT_SESSION_ID}
```
Note explicite : *"La route `/welcome` n'existe pas dans l'application — utiliser uniquement `/merci`."* ✅

### ✅ BUG-011 — Email digest groupé par utilisateur

"Code - Préparer email digest" utilise `$input.all()` pour agréger toutes les offres d'un run. Commentaire explicite : `// BUG-011 FIX: One digest email per user per run`. Le HTML liste toutes les offres dans un seul email. ✅

### ✅ BUG-008 — Adzuna : hard-fail sur credentials manquants

```javascript
const APP_ID = $env['ADZUNA_APP_ID'];
const APP_KEY = $env['ADZUNA_APP_KEY'];
if (!APP_ID || !APP_KEY) throw new Error('ADZUNA_APP_ID ou ADZUNA_APP_KEY non configures dans les env vars n8n');
```
Lève une erreur explicite au lieu d'envoyer une chaîne invalide. ✅

### ✅ BUG-016 & BUG-018 — Migrations SQL ajoutées

- **Migration 003** : `SECURITY DEFINER SET search_path = public, pg_catalog` sur les deux fonctions trigger ✅
- **Migration 004** : `ALTER TABLE profils ADD COLUMN IF NOT EXISTS annees_exp INTEGER DEFAULT 0` ✅

WF-B lit maintenant `profil.annees_exp` avec commentaire `// BUG-016: reads profil.annees_exp from Supabase (requires migration 004)`. ✅

---

## BUGS RESTANTS PASS 3

---

### 🔴 BUG-SEC001 · CRITICAL · NEW

**Titre** : Credentials de production en clair dans le repo GitHub public

**Fichier** : `backend/docs/SETUP.md`, section "4 — Resend" et "5 — Environment Variables Summary"

**Description** : Les secrets suivants sont visibles en clair dans un repo GitHub **public** :

| Secret | Valeur exposée |
|---|---|
| Resend API Key | `re_X64zNEHb_5M75DjfChJW2gLH6PYQ1WaHR` |
| Adzuna App ID | `e42ff894` |
| Adzuna App Key | `f7706538962bbd15e33d2c45375ae0d3` |

Ces clés sont maintenant considérées comme compromises. Elles doivent être **immédiatement révoquées et régénérées** indépendamment de tout autre correctif.

**Risques immédiats** :
- Quiconque a scanné le repo peut envoyer des emails depuis `@applyflow.ch` via Resend (spam, phishing)
- Quiconque peut épuiser le quota Adzuna (250 req/jour) rendant WF-B non fonctionnel
- Les GitHub secret scanners de tiers peuvent déjà avoir indexé ces clés

**Procédure de rotation obligatoire AVANT mise en production** :
1. **Resend** : Dashboard → API Keys → Révoquer `re_X64zNEHb...` → Créer nouvelle clé → Mettre à jour le credential n8n "Resend API"
2. **Adzuna** : api.adzuna.com → Régénérer les clés → Mettre à jour les env vars n8n `ADZUNA_APP_ID` / `ADZUNA_APP_KEY`
3. **Supprimer** les valeurs réelles de `docs/SETUP.md` → les remplacer par `YOUR_RESEND_API_KEY`, `YOUR_ADZUNA_APP_ID`, etc.
4. Envisager de rendre le repo privé ou d'utiliser un outil de scan de secrets (truffleHog, git-secrets)

---

### 🟠 BUG-013 · HIGH · NOT FIXED

**Titre** : Aucune page légale / politique de confidentialité
**Fichier** : `landing/src/components/Footer.jsx`, `landing/src/App.jsx`
**Description** : Aucune CGU, politique de confidentialité, ni mentions légales. Non conforme à la LPD suisse (septembre 2023). Requis avant tout trafic utilisateur réel.
**Fix** : Créer `Confidentialite.jsx` + `Cgu.jsx`, ajouter routes `/confidentialite` et `/cgv`, lier depuis le footer.

---

### 🟠 BUG-020 · HIGH · NOT FIXED

**Titre** : Claim "200+ chercheurs d'emploi" non vérifiable — risque LCD suisse
**Fichier** : `landing/src/components/Hero.jsx`
**Description** : Si le produit n'a pas encore 200 utilisateurs, ce badge constitue une indication fausse sous la Loi contre la Concurrence Déloyale (art. 3 LCD).
**Fix** : Retirer ou remplacer par un claim exact et vérifiable (ex : "Les premiers chercheurs d'emploi en Suisse romande ont testé ApplyFlow" pendant la phase beta).

---

### 🟠 BUG-009 · HIGH · ACKNOWLEDGED (not resolved)

**Titre** : URL webhook Tally WF-A encore dans les docs publics
**Fichiers** : `ApplyFlow_Passation_Projet.md`, `ARCHITECTURE.md` (main branch)
**Description** : L'URL `https://p2urkinden.app.n8n.cloud/webhook/f1fea724-e392-473d-963a-49cf3207f5cf` est toujours présente. `docs/SETUP.md` l'adresse dans une note (BUG-009) mais ne la supprime pas. Sans vérification de signature Tally dans WF-A, cette URL permet l'injection de profils arbitraires.
**Status** : Le risque est reconnu dans la documentation mais non résolu. Régénérer l'URL webhook WF-A dans n8n, puis mettre à jour les docs.

---

### 🟡 BUG-014 · MEDIUM · NOT FIXED

**Titre** : Favicon pointe vers `/vite.svg` (icône Vite par défaut)
**Fichier** : `landing/index.html`, ligne 4
**Fix** : `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`

---

### 🟡 BUG-015 · MEDIUM · NOT FIXED

**Titre** : `og:image` et `twitter:image` absents — mauvais rendu partage social
**Fichier** : `landing/index.html`
**Fix** : Créer `public/og-image.png` (1200×630px) et ajouter les meta tags.

---

### 🟡 BUG-N004 · MEDIUM · NOT FIXED

**Titre** : Dépendance `@stripe/stripe-js` inutile dans `package.json`
**Fichier** : `landing/package.json`
**Description** : La migration vers Payment Links a rendu le SDK Stripe inutile, mais il reste dans les dépendances (~40 KB gzip).
**Fix** : `npm uninstall @stripe/stripe-js`

---

### 🟡 BUG-P301 · MEDIUM · NEW

**Titre** : WF-C — Profil inexistant peut passer la vérification de plan
**Fichier** : `n8n/workflows/wf-c-generation-lm.json`
**Description** : Le node Supabase "Récupérer profil" a `alwaysOutputData=true` + `onError=continueRegularOutput`. Si le `user_id` soumis n'existe pas, Supabase retourne un objet vide `{}`. Dans ce cas, `profil.plan = undefined`, et la condition IF `plan != 'starter'` est `true` (undefined !== 'starter') tandis que `profil.actif` sera `undefined` — non strictement `true`, ce qui devrait bloquer. La condition `actif == true` en mode `strict` devrait rejeter `undefined != true`. En pratique ce cas est bloqué, mais une validation explicite `user_id` → profil trouvé serait plus robuste.
**Fix** : Ajouter un IF node après la récupération du profil pour vérifier que `profil.id` est non nul avant de passer à la vérification du plan.

---

### 🔵 BUG-022 · LOW · NOT FIXED

**Titre** : DECISIONS.md dit Framer, le code est Vite+React
**Fix** : Mettre à jour D-004 dans `DECISIONS.md`.

---

### 🔵 BUG-023 · LOW · NOT FIXED

**Titre** : `landing/src/App.css` styles globaux potentiellement conflictuels avec Tailwind v4
**Fix** : Vérifier que App.css ne contient que des custom properties CSS.

---

## RÉSUMÉ FINAL ET CHEMIN VERS LA PRODUCTION

### Pour obtenir l'approbation QA :

**1 action immédiate (avant tout — indépendant du code) :**
- ☐ Révoquer et régénérer Resend API Key + clés Adzuna
- ☐ Supprimer les valeurs réelles de `docs/SETUP.md`

**2 actions bloquantes légales :**
- ☐ Créer les pages CGU + politique de confidentialité
- ☐ Corriger ou retirer le claim "200+"

**Actions recommandées (non bloquantes) :**
- ☐ Régénérer l'URL webhook WF-A et mettre à jour `ApplyFlow_Passation_Projet.md`
- ☐ Corriger le favicon (`/favicon.svg`)
- ☐ Ajouter `og:image`
- ☐ Retirer `@stripe/stripe-js` de `package.json`

### Architecture globale : ✅ SOLIDE

Une fois BUG-SEC001 résolu et les pages légales créées, ApplyFlow peut aller en production. L'architecture n8n + Supabase + Stripe + Resend est correctement câblée sur les 5 workflows. La sécurité HMAC Stripe, le contrôle de plan dans WF-C, le digest email groupé, et les 4 migrations SQL sont tous correctement implémentés.

---

*QA COMPLETE — Pass 3*
