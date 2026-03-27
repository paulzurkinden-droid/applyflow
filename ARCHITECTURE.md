# ARCHITECTURE.md — ApplyFlow

*Version 1.0 — 27 mars 2026*

---

## 1. Vue d'ensemble

ApplyFlow est un SaaS B2C d'automatisation de la recherche d'emploi pour les francophones en Suisse romande. L'architecture repose sur une combinaison de services no-code/low-code (n8n, Supabase, Tally) et d'APIs tierces (Claude, Adzuna, Stripe, Google Drive).

```
┌─────────────────────────────────────────────────────────────┐
│                        UTILISATEUR                          │
└───────────┬─────────────────────────────────┬───────────────┘
            │                                 │
   ┌────────▼────────┐               ┌────────▼────────┐
   │  Landing Page   │               │  Formulaire      │
   │ (Webflow/Framer)│               │  Onboarding      │
   │  + Stripe       │               │  (Tally b5kE41)  │
   └────────┬────────┘               └────────┬────────┘
            │ Webhook paiement               │ Webhook POST
   ┌────────▼────────┐               ┌────────▼────────┐
   │  WF-STRIPE      │               │  WF-A Onboarding│
   │  n8n webhook    │               │  (✅ Complété)   │
   └────────┬────────┘               └────────┬────────┘
            │                                 │
   ┌────────▼─────────────────────────────────▼────────┐
   │                    SUPABASE                        │
   │  profils │ preferences_recherche │ candidatures    │
   │  offres_alertes                                    │
   │  (RLS activé — auth par user_id)                   │
   └────────┬──────────────────────┬────────────────────┘
            │                      │
   ┌────────▼────────┐    ┌────────▼────────┐
   │  WF-B Alertes   │    │  WF-C LM Gen    │
   │  Cron 8h/18h    │    │  Webhook POST   │
   │  Adzuna+RSS     │    │  Claude + Drive │
   │  Claude scoring │    └────────┬────────┘
   └────────┬────────┘             │
            │              ┌───────▼──────┐
   ┌────────▼────────┐     │ Google Drive │
   │  Resend/Brevo   │     │ (CV + LM)    │
   │  Email alertes  │     └──────────────┘
   └─────────────────┘
```

---

## 2. Composants

### 2.1 Infrastructure existante

| Composant | Service | URL / ID | Statut |
|---|---|---|---|
| Orchestration | n8n Cloud | p2urkinden.app.n8n.cloud | ✅ Actif |
| Base de données | Supabase | yltajummrsorqvynvod.supabase.co | ✅ Actif |
| Formulaire | Tally | Form ID: b5kE41 | ✅ Actif |
| IA | Claude API | claude-opus-4-5 | ✅ Actif |
| Stockage docs | Google Drive | Compte applyflowch | ✅ Actif |
| Offres emploi | Adzuna API | 250 req/jour (gratuit) | ✅ Actif |

### 2.2 À configurer

| Composant | Service recommandé | Rôle |
|---|---|---|
| Paiement | Stripe | Plans Starter/Pro/Booster |
| Emails transactionnels | Resend (recommandé) | Alertes, bienvenue, livraison docs |
| Landing page | Framer (recommandé) | Présentation + tunnel de vente |
| Auth utilisateur | Supabase Auth | Gestion sessions |

---

## 3. Workflows n8n

| ID | Nom | Trigger | Statut |
|---|---|---|---|
| EddlSDFtz15DWldl | WF-A Onboarding | Webhook Tally POST | ✅ Complété |
| rpzXTHR8m6BDfyC8 | WF-B Alertes emploi | Cron 8h + 18h | 🔧 En cours |
| À créer | WF-C Génération LM | Webhook POST | 🔲 À construire |
| À créer | WF-D CRM Candidatures | Webhook POST | 🔲 À construire |
| À créer | WF-STRIPE | Webhook Stripe | 🔲 À construire |

---

## 4. Flux de données principaux

### Flux A — Inscription utilisateur
```
Stripe (paiement) → Webhook n8n → Supabase (créer user_id + plan)
→ Resend (email bienvenue + lien Tally) → Tally (onboarding) → WF-A
```

### Flux B — Alertes emploi (quotidien)
```
Cron n8n → Supabase (fetch profils actifs) → Adzuna API + RSS
→ Claude (scoring) → Supabase (write offres_alertes)
→ [si score ≥ 7] Resend (email digest alertes)
```

### Flux C — Génération lettre de motivation
```
Utilisateur soumet offre → Webhook n8n → Supabase (fetch profil)
→ Claude (génère LM) → Google Drive (copie template + remplit placeholders)
→ Supabase (log candidature) → Resend (lien LM par email)
```

### Flux D — Suivi candidatures
```
WF-C → Supabase candidatures (insert)
→ [futur dashboard] Supabase API → Frontend
```

---

## 5. Décisions architecturales clés

Voir `DECISIONS.md` pour le détail de chaque choix.

- **n8n Cloud** comme orchestrateur central (vs alternatives) — simplicité, pas de DevOps
- **Supabase** comme source de vérité utilisateur (vs Google Sheets) — scalabilité multi-users
- **Resend** pour les emails (vs Brevo) — API simple, pricing prévisible, logs intégrés
- **Framer** pour la landing page (vs Webflow) — plus rapide à déployer, intégration Stripe native
- **Supabase Auth** (vs Auth0) — cohérence stack, pas de service tiers supplémentaire

---

## 6. Contraintes techniques n8n Cloud (critiques)

1. **Modules npm bloqués** : `docx`, `jszip`, `axios` non disponibles → utiliser HTTP Request nodes
2. **HTTP vers `*.supabase.co` bloqué** → utiliser uniquement les nodes Supabase natifs
3. **Nodes Supabase** : toujours `alwaysOutputData=true` + `onError=continueRegularOutput`
4. **Après IF** : référencer `$('Node Name').item.json.field` et non `$json.field`
5. **Google Docs `batchUpdate`** : credential type `Google Drive OAuth2` (pas Google Docs)
6. **Claude** : wrapper `JSON.parse` dans `try/catch`, nettoyer les backticks avant parsing

---

## 7. Sécurité

- **RLS Supabase** activé sur toutes les tables — chaque user ne voit que ses données
- **Webhooks n8n** : sécurisés par token dans le path (non devinable)
- **Stripe webhook** : signature `stripe-signature` vérifiée côté n8n
- **Clés API** stockées dans les credentials n8n (jamais dans le code)
- **Google Drive** : partage par email utilisateur avec `role=writer` (pas lien public)

---

## 8. Scalabilité

- n8n Cloud gère jusqu'à ~1000 utilisateurs actifs avec les plans actuels
- Supabase Free tier : 500 MB, 50K requêtes/mois → passer à Pro ($25/mois) dès 100 users
- Adzuna API : 250 req/jour → suffisant jusqu'à ~50 users actifs simultanés; au-delà, passer au plan payant
- Pour > 500 users : envisager une queue (n8n + Redis) pour WF-B afin d'éviter les timeouts
