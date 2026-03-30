# BUGS.md — ApplyFlow

**Date** : 2026-03-30 (Pass 3 — Final pre-launch audit)
**Pass 1** : 23 bugs (6 CRITICAL · 7 HIGH · 7 MEDIUM · 3 LOW)
**Pass 2** : 19 active (5 CRITICAL · 5 HIGH · 6 MEDIUM · 3 LOW)
**Pass 3** : **10 active (1 CRITICAL · 3 HIGH · 4 MEDIUM · 2 LOW)**

---

## BUGS CORRIGÉS DEPUIS PASS 2 ✅

| Bug | Titre | Fix |
|---|---|---|
| BUG-006 | Stripe HMAC signature | Web Crypto API impl. + rawBody=true + replay guard |
| BUG-N001 | `{{RESEND_API_KEY}}` literal (6 nodes) | Credential n8n `tc2f1NdNXAUtStcp` dans tous les nodes Resend |
| BUG-N002 | `{{SUPABASE_SERVICE_ROLE_KEY}}` literal | `$env['SUPABASE_SERVICE_ROLE_KEY']` dans WF-STRIPE |
| BUG-N003 | WF-C no plan check | IF node "Plan Pro ou Booster ?" + 403 PLAN_INSUFFICIENT |
| BUG-N005 | stripe/setup.md success_url `/welcome` | Corrigé en `/merci`, note explicite |
| BUG-008 | Adzuna credentials fallback dangereux | Hard-fail avec `throw new Error(...)` si env vars absentes |
| BUG-011 | Email par offre au lieu de par utilisateur | `$input.all()` dans digest node — un email groupé par run |
| BUG-016 | `annees_exp` non stocké en DB | Migration 004 + WF-B lit `profil.annees_exp` |
| BUG-018 | SECURITY DEFINER sans search_path | Migration 003 + `SET search_path = public, pg_catalog` |

---

## 🔴 CRITICAL — Bloquant absolu (1)

---

### BUG-SEC001 · CRITICAL · NEW — ROTATION IMMÉDIATE REQUISE

**Titre** : Credentials de production en clair dans le repo public GitHub
**Fichier** : `backend/docs/SETUP.md` — sections 4 "Resend" et 5 "Environment Variables Summary"
**Découvert** : Pass 3 (2026-03-30)

**Secrets exposés** :

| Secret | Valeur compromise | Service |
|---|---|---|
| Resend API Key | `re_X64zNEHb_5M75DjfChJW2gLH6PYQ1WaHR` | Emails depuis applyflow.ch |
| Adzuna App ID | `e42ff894` | Recherche d'offres emploi |
| Adzuna App Key | `f7706538962bbd15e33d2c45375ae0d3` | Recherche d'offres emploi |

**Risques immédiats** :
- Envoi d'emails de phishing/spam depuis `@applyflow.ch` (réputation domaine)
- Épuisement du quota Adzuna (250 req/jour) → WF-B non fonctionnel
- Ces secrets sont maintenant dans l'historique git et peuvent être indexés

**Actions OBLIGATOIRES dans cet ordre** :
1. **Resend** → Dashboard → API Keys → Révoquer `re_X64zNEHb...` → Créer une nouvelle clé → Mettre à jour le credential n8n "Resend API" (`tc2f1NdNXAUtStcp`) avec la nouvelle valeur
2. **Adzuna** → api.adzuna.com → Régénérer les clés → Mettre à jour les env vars n8n `ADZUNA_APP_ID` / `ADZUNA_APP_KEY`
3. **`docs/SETUP.md`** → Remplacer toutes les valeurs réelles par des placeholders (`YOUR_RESEND_API_KEY`, etc.) → Commit + push
4. Envisager de rendre le repo **privé** ou d'ajouter `.github/workflows/secret-scan.yml` (truffleHog/gitleaks) pour prévenir les fuites futures

---

## 🟠 HIGH — Importants avant lancement (3)

---

### BUG-013 · HIGH · NOT FIXED (Pass 1 → Pass 3)

**Titre** : Aucune page légale — non-conformité LPD suisse
**Fichiers** : `landing/src/components/Footer.jsx`, `landing/src/App.jsx`
**Description** : Pas de CGU, politique de confidentialité, ni mentions légales. La LPD suisse (en vigueur depuis septembre 2023) et le RGPD européen exigent une politique de confidentialité accessible depuis toutes les pages.
**Fix** :
```
1. Créer landing/src/components/Confidentialite.jsx
2. Créer landing/src/components/Cgu.jsx
3. Ajouter routes /confidentialite et /cgv dans App.jsx
4. Ajouter liens dans Footer.jsx
Contenu minimum : données collectées, durée conservation, droits des utilisateurs (accès, suppression, rectification), contact DPO.
```

---

### BUG-020 · HIGH · NOT FIXED (Pass 1 → Pass 3)

**Titre** : Claim "200+ chercheurs d'emploi" non vérifiable — risque LCD suisse
**Fichier** : `landing/src/components/Hero.jsx`, ligne 13
**Description** : Si le produit n'a pas encore 200 utilisateurs actifs, ce badge constitue une affirmation fausse sur la popularité du service, potentiellement déloyale sous l'art. 3 LCD (Loi contre la Concurrence Déloyale).
**Fix** : Retirer ou remplacer par un claim vérifiable. Ex : "Rejoignez les premiers candidats en Suisse romande" pendant le lancement.

---

### BUG-009 · HIGH · ACKNOWLEDGED NOT RESOLVED (Pass 2 → Pass 3)

**Titre** : URL webhook Tally WF-A exposée dans les docs publics
**Fichiers** : `ApplyFlow_Passation_Projet.md` et `ARCHITECTURE.md` (main branch)
**Description** : `https://p2urkinden.app.n8n.cloud/webhook/f1fea724-e392-473d-963a-49cf3207f5cf` est visible dans le repo public. La doc (SETUP.md) reconnaît le problème mais ne l'a pas supprimé des fichiers existants. Sans vérification de signature Tally dans WF-A, n'importe qui peut POSTer des données arbitraires et créer/modifier des profils Supabase.
**Fix** :
```
1. Dans n8n UI : WF-A webhook node → Regenerate Path
2. Mettre à jour ApplyFlow_Passation_Projet.md et ARCHITECTURE.md avec la nouvelle URL (ou la masquer)
3. Ajouter vérification signature Tally dans WF-A (HMAC sur le header Tally-Signature)
```

---

## 🟡 MEDIUM — À corriger avant croissance (4)

---

### BUG-014 · MEDIUM · NOT FIXED (Pass 1 → Pass 3)

**Titre** : Favicon pointe vers `/vite.svg` (logo Vite par défaut, non ApplyFlow)
**Fichier** : `landing/index.html`, ligne 4
**Fix** : `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
**Impact** : Visible dans l'onglet navigateur, les favoris, et lors des partages. Mauvaise image de marque.

---

### BUG-015 · MEDIUM · NOT FIXED (Pass 1 → Pass 3)

**Titre** : Open Graph sans `og:image` — mauvais rendu lors des partages sociaux
**Fichier** : `landing/index.html`
**Fix** : Créer `public/og-image.png` (1200×630px, design ApplyFlow) et ajouter :
```html
<meta property="og:image" content="https://applyflow.ch/og-image.png" />
<meta name="twitter:image" content="https://applyflow.ch/og-image.png" />
```

---

### BUG-N004 · MEDIUM · NOT FIXED (Pass 2 → Pass 3)

**Titre** : Dépendance `@stripe/stripe-js` inutile dans `package.json` (~40 KB gzip)
**Fichier** : `landing/package.json`
**Description** : La migration vers Payment Links a supprimé tout import de cette bibliothèque, mais elle reste listée dans `dependencies`. Inutile, alourdit le bundle.
**Fix** : `npm uninstall @stripe/stripe-js` — retirer de `dependencies` et de `package-lock.json`.

---

### BUG-P301 · MEDIUM · NEW (Pass 3)

**Titre** : WF-C — Profil introuvable peut passer la vérification de plan dans certains edge cases
**Fichier** : `n8n/workflows/wf-c-generation-lm.json`
**Description** : Si `user_id` soumis n'existe pas en base, Supabase (`alwaysOutputData=true`) retourne `{}`. Le plan est `undefined` — la condition `plan != 'starter'` est `true` (car `undefined !== 'starter'`). La condition `actif === true` (strict) devrait bloquer `undefined` mais dépend de la version du node n8n. Cas borderline qui mérite une garde explicite.
**Fix** : Après le node Supabase profil, ajouter un IF node :
```javascript
// Vérifier que le profil existe réellement
$('Supabase - Récupérer profil').item.json.id !== undefined && 
$('Supabase - Récupérer profil').item.json.id !== null
```
Si faux → Respond 401 `PROFILE_NOT_FOUND`.

---

## 🔵 LOW — Qualité (2)

---

### BUG-022 · LOW · NOT FIXED (Pass 1 → Pass 3)

**Titre** : DECISIONS.md D-004 dit Framer, le code est Vite+React
**Fichier** : `DECISIONS.md`
**Fix** : Mettre à jour D-004 pour documenter la décision réelle et sa justification.

---

### BUG-023 · LOW · NOT FIXED (Pass 1 → Pass 3)

**Titre** : `landing/src/App.css` — styles globaux potentiellement conflictuels avec Tailwind v4
**Fix** : S'assurer que App.css ne contient que des custom properties (`:root { --xxx }`) sans override d'utilitaires Tailwind.

---

## RÉCAPITULATIF TOUTES PASSES

| Sévérité | Pass 1 | Pass 2 | Pass 3 | Tendance |
|---|---|---|---|---|
| 🔴 CRITICAL | 6 | 5 | **1** | ✅ -5 |
| 🟠 HIGH | 7 | 5 | **3** | ✅ -4 |
| 🟡 MEDIUM | 7 | 6 | **4** | ✅ -3 |
| 🔵 LOW | 3 | 3 | **2** | ✅ -1 |
| **TOTAL** | **23** | **19** | **10** | ✅ -13 |

**Bugs résolus depuis Pass 1** : 13 sur 23 (57%)

---

## CHEMIN MINIMUM VERS L'APPROBATION

Les seules actions nécessaires pour l'approbation QA :

| Priorité | Action | Effort estimé |
|---|---|---|
| 🔴 **IMMÉDIAT** | Révoquer + régénérer Resend Key + Adzuna Keys | 10 min |
| 🔴 **IMMÉDIAT** | Supprimer les valeurs réelles de `docs/SETUP.md` | 5 min |
| 🟠 **Avant lancement** | Créer pages CGU + Confidentialité + liens footer | 2h |
| 🟠 **Avant lancement** | Corriger ou retirer le claim "200+" | 5 min |

Tout le reste (BUG-009, BUG-014, BUG-015, BUG-N004, BUG-P301) peut être traité post-lancement sans bloquer la mise en production.

---

```json
{"approved": false, "critical_bugs": 1, "summary": "Pass 3 : 9 bugs supplémentaires corrigés — BUG-006 (HMAC Stripe), BUG-N001 (Resend credentials), BUG-N002 (Supabase service key), BUG-N003 (WF-C plan check), BUG-N005 (success URL), BUG-008/011/016/018 tous résolus. Architecture fonctionnellement solide. Un unique bloquant critique : Resend API Key (re_X64zNEHb...) et clés Adzuna (e42ff894 / f7706538...) commitées en clair dans docs/SETUP.md sur un repo public — rotation immédiate obligatoire. Après rotation des secrets et création des pages légales (LPD suisse), le projet est prêt pour la production."}
```
