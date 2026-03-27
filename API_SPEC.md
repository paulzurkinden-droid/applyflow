# API_SPEC.md — ApplyFlow

*Version 1.0 — 27 mars 2026*

> ApplyFlow n8n Cloud est l'orchestrateur central. Les "endpoints" sont des webhooks n8n.
> Pas de backend custom — toutes les routes passent par n8n ou directement par Supabase REST.

---

## 1. Webhooks n8n (API interne)

Base URL : `https://p2urkinden.app.n8n.cloud/webhook/`

### POST `/webhook/f1fea724-e392-473d-963a-49cf3207f5cf`
**WF-A — Onboarding Tally**

Appelé automatiquement par Tally à la soumission du formulaire.

```
Source: Tally.so (POST automatique)
Auth: Aucune (URL opaque suffisante)
Content-Type: application/json
```

Body (généré par Tally) : voir structure complète dans `ApplyFlow_Passation_Projet.md` section 5.

**Response** : 200 OK (n8n acquitte immédiatement)

---

### POST `/webhook/stripe-applyflow` *(à créer)*
**WF-STRIPE — Gestion abonnements**

Appelé par Stripe sur les événements d'abonnement.

```
Source: Stripe
Auth: Header stripe-signature (HMAC SHA-256)
Content-Type: application/json
```

**Events gérés** :

| Event | Action |
|---|---|
| `checkout.session.completed` | Créer profil + inviter user Supabase Auth + email bienvenue |
| `customer.subscription.updated` | Mettre à jour `plan` dans profils |
| `customer.subscription.deleted` | Passer `actif = false` dans profils |

**Response** : 200 OK (toujours — Stripe re-essaie si timeout)

---

### POST `/webhook/generate-lm` *(à créer)*
**WF-C — Génération lettre de motivation**

Appelé depuis le futur dashboard ou une interface simple.

```
Auth: Bearer token (user Supabase JWT)
Content-Type: application/json
```

**Request body** :
```json
{
  "user_id": "uuid",
  "titre_poste": "Chef de projet digital",
  "entreprise": "Etat de Vaud",
  "url_offre": "https://jobs.admin.ch/xxx",
  "description_offre": "Description du poste..."
}
```

**Validation** :
- `user_id` : UUID valide, profil actif en base
- `titre_poste` : non vide, max 100 chars
- `entreprise` : non vide, max 100 chars
- Plan utilisateur : `pro` ou `booster` (sinon 403)

**Response 200** :
```json
{
  "success": true,
  "candidature_id": "uuid",
  "lm_url": "https://docs.google.com/document/d/xxx/edit",
  "email_sent": true
}
```

**Response 403** (plan insuffisant) :
```json
{
  "error": "PLAN_INSUFFICIENT",
  "message": "La génération de lettres de motivation nécessite un plan Pro ou Booster.",
  "upgrade_url": "https://applyflow.ch/pricing"
}
```

**Response 422** (données manquantes) :
```json
{
  "error": "VALIDATION_ERROR",
  "fields": ["description_offre"]
}
```

---

### POST `/webhook/update-candidature` *(à créer)*
**WF-D — Mise à jour statut candidature**

```
Auth: Bearer token (user Supabase JWT)
Content-Type: application/json
```

**Request body** :
```json
{
  "candidature_id": "uuid",
  "statut": "Entretien",
  "notes": "RDV le 3 avril 2026 à 14h"
}
```

**Statuts valides** : `A envoyer`, `Envoyée`, `Réponse reçue`, `Entretien`, `Offre reçue`, `Refus`, `Abandonnée`

**Response 200** :
```json
{
  "success": true,
  "candidature_id": "uuid",
  "statut": "Entretien",
  "updated_at": "2026-03-27T22:00:00Z"
}
```

---

## 2. Supabase REST API (accès direct depuis futur frontend)

Base URL : `https://yltajummrsorqvynvod.supabase.co/rest/v1/`

Auth : `apikey: {ANON_KEY}` + `Authorization: Bearer {USER_JWT}`

> Toutes ces routes sont protégées par RLS — l'utilisateur ne voit que ses données.

### GET `/profils?id=eq.{user_id}&select=*`
Récupérer son propre profil.

**Response 200** :
```json
[{
  "id": "uuid",
  "nom": "Marie Dupont",
  "email": "marie@exemple.ch",
  "plan": "pro",
  "cv_url": "https://docs.google.com/...",
  "actif": true,
  "created_at": "2026-01-15T10:00:00Z"
}]
```

---

### GET `/offres_alertes?user_id=eq.{user_id}&order=created_at.desc&limit=50`
Récupérer ses alertes emploi récentes.

**Query params optionnels** :
- `score=gte.7` — filtrer par score minimum
- `envoyee=eq.false` — offres non encore vues
- `select=titre,entreprise,url,score,raison,date_trouvee`

---

### GET `/candidatures?user_id=eq.{user_id}&order=date_candidature.desc`
Récupérer ses candidatures.

**Query params optionnels** :
- `statut=eq.Entretien` — filtrer par statut

---

### PATCH `/candidatures?id=eq.{candidature_id}`
Mettre à jour une candidature (statut, notes).

```json
{
  "statut": "Envoyée",
  "notes": "Envoyé le 27 mars"
}
```

---

## 3. Gestion des erreurs — Conventions

| Code | Signification | Action client |
|---|---|---|
| 200 | Succès | Afficher résultat |
| 400 | Données invalides | Afficher erreur de validation |
| 401 | Non authentifié | Rediriger vers login |
| 403 | Plan insuffisant | Afficher upgrade |
| 422 | Champs manquants | Afficher champs requis |
| 429 | Rate limit (Adzuna) | Retry après 1h |
| 500 | Erreur interne n8n | Log + retry manuel |

---

## 4. Rate Limiting

| Endpoint | Limite | Comportement dépassement |
|---|---|---|
| `/webhook/generate-lm` | 5 LM/heure/user (Starter: 0, Pro: 2/mois, Booster: illimité) | 429 avec `retry_after` |
| Adzuna API | 250 req/jour total | Skip utilisateur, log erreur |
| Claude API | Selon plan Anthropic | Retry avec backoff exponentiel |

---

## 5. Authentification côté frontend (futur dashboard)

```javascript
// Supabase Auth — login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'marie@exemple.ch',
  password: 'motdepasse'
});

// Récupérer le JWT pour les appels n8n webhook
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Appel webhook n8n avec auth
fetch('https://p2urkinden.app.n8n.cloud/webhook/generate-lm', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ user_id: session.user.id, ... })
});
```
