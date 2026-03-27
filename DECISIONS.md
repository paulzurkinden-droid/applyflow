# DECISIONS.md — ApplyFlow

*Version 1.0 — 27 mars 2026*

---

## D-001 — n8n Cloud comme orchestrateur central

**Décision** : Utiliser n8n Cloud (plan existant) pour tous les workflows d'automatisation.

**Alternatives considérées** :
- Make (Integromat) : plus simple mais moins flexible pour la logique complexe
- Zapier : trop limité pour les loops multi-utilisateurs
- Backend custom (Node.js/Python) : trop de DevOps pour un MVP

**Justification** :
- WF-A déjà construit et opérationnel en n8n — coût de migration prohibitif
- n8n supporte les Code nodes JS pour la logique complexe (parsing, scoring)
- Pas de serveur à maintenir
- Idéal pour itérations rapides sur un MVP B2C

**Contraintes acceptées** :
- Modules npm bloqués → pas de `docx`, `jszip` etc.
- HTTP vers `*.supabase.co` bloqué → nodes Supabase natifs obligatoires
- Timeout 60s sur les webhooks → WF-C doit être rapide (< 45s)

---

## D-002 — Supabase comme source de vérité (vs Google Sheets)

**Décision** : Migrer toute la persistance vers Supabase, abandon total de Google Sheets.

**Alternatives considérées** :
- Conserver Google Sheets : solution MVP minimale
- Airtable : plus cher, API moins directe depuis n8n
- PocketBase : auto-hébergé, DevOps supplémentaire

**Justification** :
- Google Sheets ne supporte pas le multi-utilisateurs avec isolation des données
- Supabase offre RLS natif → sécurité par conception
- Supabase Auth intégré → pas de service auth séparé
- API REST standard → compatible futur dashboard
- Tier gratuit généreux pour le MVP (500 MB, 50K req/mois)

**Migration requise** : Données de test Paul à migrer manuellement de GSheets vers Supabase.

---

## D-003 — Resend pour les emails (vs Brevo)

**Décision** : Utiliser Resend pour les emails transactionnels.

**Alternatives considérées** :
- Brevo (ex-Sendinblue) : plus complet (marketing + transactionnel) mais plus complexe
- Sendgrid : cher pour un petit volume
- Amazon SES : setup complexe, pas de dashboard simple
- Mailgun : bonne alternative, mais Resend plus moderne

**Justification** :
- API ultra-simple (1 endpoint REST, pas de SDK requis)
- 3 000 emails/mois gratuits → suffisant jusqu'à ~300 utilisateurs actifs
- Dashboard de logs en temps réel
- Réputation d'expéditeur élevée (faible taux spam)
- Intégration n8n via HTTP Request node sans friction

**Limite** : Resend est transactionnel uniquement. Pour les campagnes marketing futures, utiliser Brevo en parallèle.

---

## D-004 — Framer pour la landing page (vs Webflow)

**Décision** : Utiliser Framer pour la landing page ApplyFlow.

**Alternatives considérées** :
- Webflow : plus puissant mais courbe d'apprentissage plus steep
- WordPress : overkill, lent
- Next.js custom : trop de développement pour un MVP
- Carrd : trop simple, pas assez flexible

**Justification** :
- Framer : déploiement en < 2h pour une page simple
- Intégration Stripe Payment Links native (boutons CTA)
- SEO correct out-of-the-box
- Design professionnel sans compétences dev
- Pas de serveur à gérer

**Migration future** : Si dashboard utilisateur requis, envisager Next.js + Supabase JS SDK.

---

## D-005 — Supabase Auth (vs Auth0, Clerk)

**Décision** : Utiliser Supabase Auth pour l'authentification utilisateur.

**Alternatives considérées** :
- Auth0 : excellent mais service tiers supplémentaire, coût élevé au scale
- Clerk : belle UX mais overhead pour un MVP
- JWT custom : trop de code à maintenir

**Justification** :
- Déjà dans le stack (Supabase) → zéro service supplémentaire
- Invitation par email natif → flux parfait post-Stripe
- RLS Supabase utilise directement le JWT Auth
- Gratuit jusqu'à 50 000 utilisateurs actifs/mois

**Implémentation** : Flux invitation (pas self-signup) — Stripe paie → n8n invite → user définit son MDP.

---

## D-006 — Claude Opus 4.5 pour toute l'IA

**Décision** : Utiliser `claude-opus-4-5` pour le scoring (WF-B), la génération LM (WF-C), et l'extraction CV (WF-A).

**Alternatives considérées** :
- GPT-4o : similaire en qualité, prix comparable
- Claude Haiku : beaucoup moins cher mais qualité insuffisante pour les LM
- Mixtral (open source) : auto-hébergement non viable sur n8n Cloud

**Justification** :
- Qualité des LM en français romand : Claude Opus surpasse les autres modèles
- Déjà utilisé et testé dans WF1/WF3 personnels
- `max_tokens=4096` pour CV, `2048` pour LM et scoring : coût maîtrisé
- Pour le scoring seul (WF-B), envisager Claude Haiku à l'avenir pour réduire les coûts

**Optimisation future** : Passer WF-B scoring à `claude-haiku-4-5` (5x moins cher) une fois la qualité validée.

---

## D-007 — Stockage documents dans Google Drive (vs S3/Supabase Storage)

**Décision** : Conserver Google Drive pour le stockage et la livraison des CV et LM.

**Alternatives considérées** :
- Supabase Storage : fichiers binaires, pas éditable en ligne
- AWS S3 : pas de viewer/editor natif
- OneDrive : moins compatible avec l'API Google Docs

**Justification** :
- Templates CV/LM sont des Google Docs natifs → batchUpdate API obligatoire
- Les utilisateurs peuvent éditer leurs docs directement dans Google Docs
- Partage par lien ou par email déjà fonctionnel dans WF-A
- Zéro coût supplémentaire (compte Google dédié)

**Contrainte** : Les documents ne sont PAS dans le compte Google de l'utilisateur — ils sont dans le Drive ApplyFlow et partagés par email. Acceptable pour le MVP.

---

## D-008 — Modèle de prix (9 / 19 / 39 CHF/mois)

**Décision** : 3 plans CHF avec facturation mensuelle uniquement pour le MVP.

**Justification** :
- Marché suisse : pricing en CHF élimine les frictions de conversion
- Starter 9 CHF : point d'entrée accessible, valide la proposition de valeur alertes
- Pro 19 CHF : coeur de cible, génération LM incluse
- Booster 39 CHF : package premium avec accompagnement humain (à définir)
- Annuel non prioritaire pour le MVP — simplification de la gestion des abonnements

**À revoir** : Introduire des plans annuels (2 mois offerts) dès 50 abonnés actifs.

---

## D-009 — Pas de dashboard utilisateur dans le MVP

**Décision** : Le MVP ne comporte pas de dashboard frontend. L'utilisateur interagit via email et formulaires.

**Justification** :
- Réduire le time-to-market : landing + Stripe + n8n suffisent pour valider le modèle
- Les alertes emploi sont livrées par email (pas besoin de dashboard pour ça)
- Les LM sont accessibles via Google Drive (lien dans l'email)
- Le CRM candidatures est géré côté Supabase sans UI dans un premier temps

**Trigger pour construire le dashboard** : 50 utilisateurs actifs payants ou demande explicite des early users.
