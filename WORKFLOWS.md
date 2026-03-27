# WORKFLOWS.md — ApplyFlow

*Version 1.0 — 27 mars 2026*

---

## WF-A — Onboarding ✅ COMPLÉTÉ

**ID n8n** : `EddlSDFtz15DWldl`
**Trigger** : Webhook POST Tally (`/webhook/f1fea724-e392-473d-963a-49cf3207f5cf`)

Structure complète documentée dans `ApplyFlow_Passation_Projet.md` section 6.

---

## WF-B — Alertes Offres Emploi 🔧 EN COURS

**ID n8n** : `rpzXTHR8m6BDfyC8`
**Trigger** : Cron — `0 8 * * *` et `0 18 * * *`

### Structure complète

```
[1] Cron Trigger (8h00 + 18h00)
      ↓
[2] Supabase "Récupérer utilisateurs actifs"
    → Table: profils
    → Filter: actif = true
    → Limit: 100
    → alwaysOutputData=true, onError=continueRegularOutput
      ↓
[3] Supabase "Récupérer préférences"
    → Table: preferences_recherche
    → Filter: user_id IN (liste from step 2)
      ↓
[4] Code "Construire URLs par utilisateur"
    → Pour chaque user: génère URLs Adzuna + RSS Confédération + RSS Jobup
    → Output: tableau [{user_id, email, urls[], profil}]
      ↓
[5] HTTP Request "Fetch Adzuna" (x1 par user)
    → GET https://api.adzuna.com/v1/api/jobs/ch/search/1?...
    → responseFormat: json
      ↓
[6] HTTP Request "Fetch RSS Confédération"
    → GET https://www.jobs.admin.ch/api/v1/jobs/rss?language=fr&query={poste}
    → responseFormat: text (XML)
      ↓
[7] HTTP Request "Fetch RSS Jobup"
    → GET https://www.jobup.ch/fr/jobs/rss/?term={poste}&region={lieu}
    → responseFormat: text (XML)
      ↓
[8] Code "Parser + normaliser offres"
    → Parse XML RSS avec regex/string parsing (pas de module npm)
    → Normalise au format commun (voir DATA_MODEL.md)
    → Déduplique par URL au sein du même batch
      ↓
[9] Supabase "Vérifier offres existantes"
    → Table: offres_alertes
    → Filter: user_id = current AND url IN (nouvelles URLs)
    → alwaysOutputData=true
      ↓
[10] Code "Dédoublonner"
     → Exclut les URLs déjà présentes en base
     → Si aucune nouvelle offre → output vide
      ↓
[11] IF "Nouvelles offres ?"
     → TRUE si array.length > 0
     FALSE → [No Operation]
     TRUE  ↓
[12] Code "Préparer batch scoring Claude"
     → Construit prompt avec profil utilisateur (cv_texte OU données formulaire)
     → Injecte les N offres à scorer (max 20 par appel)
     → Format: voir section Prompt Scoring ci-dessous
      ↓
[13] HTTP Request "Claude Scoring"
     → POST https://api.anthropic.com/v1/messages
     → model: claude-opus-4-5
     → max_tokens: 2048
     → Headers: x-api-key, anthropic-version: 2023-06-01
      ↓
[14] Code "Parser scores Claude"
     → try/catch JSON.parse
     → Nettoie backticks/markdown
     → Associe score à chaque offre
      ↓
[15] Code "Éclater offres scorées" (Split In Batches ou loop)
     → Un item n8n = une offre avec son score
      ↓
[16] Supabase "Écrire offres_alertes"
     → Table: offres_alertes
     → Insert: user_id, source, titre, url, date_trouvee, score, raison, envoyee=false
      ↓
[17] IF "Score ≥ 7 ?"
     → Filter: score >= 7
     FALSE → [No Operation]
     TRUE  ↓
[18] Code "Préparer email digest"
     → Groupe les offres ≥ 7 par utilisateur
     → Formate HTML email avec liste des offres
      ↓
[19] HTTP Request "Envoyer alerte via Resend"
     → POST https://api.resend.com/emails
     → from: alertes@applyflow.ch
     → to: email utilisateur
     → subject: "🔔 [N] nouvelles offres pour vous — ApplyFlow"
      ↓
[20] Supabase "Marquer offres comme envoyées"
     → Table: offres_alertes
     → Update: envoyee = true WHERE id IN (offres envoyées)
```

### Prompt de scoring Claude (template)

```
Tu es un expert en recrutement suisse. Analyse ces offres d'emploi et score leur pertinence
pour ce candidat sur une échelle de 1 à 10.

PROFIL DU CANDIDAT :
- Poste cible : {{poste_cible}}
- Localisation souhaitée : {{localisation}}
- Type de contrat : {{type_contrat}}
- Années d'expérience : {{annees_exp}}
{{#if cv_texte}}
- Extrait CV : {{cv_texte_500chars}}
{{/if}}

OFFRES À SCORER :
{{#each offres}}
[{{index}}] {{titre}} chez {{entreprise}} ({{localisation}})
{{description_200chars}}
{{/each}}

Réponds UNIQUEMENT avec un JSON valide, sans markdown :
[
  {"index": 1, "score": 8, "mots_cles": ["HERMES", "secteur public"], "raison": "explication courte"},
  ...
]

Critères de scoring :
- 9-10 : Correspondance quasi parfaite (titre exact, lieu exact, contrat exact)
- 7-8  : Bonne correspondance avec quelques écarts mineurs
- 5-6  : Correspondance partielle, vaut la peine d'être regardé
- 3-4  : Faible correspondance
- 1-2  : Hors cible
```

### Code node "Construire URLs" (complet)

```javascript
const utilisateurs = $input.all();
const results = [];

// Map canton → code région Adzuna
const cantonToAdzuna = {
  'Vaud': 'vaud', 'Genève': 'geneve', 'Fribourg': 'fribourg',
  'Valais': 'valais', 'Neuchâtel': 'neuchatel', 'Jura': 'jura',
  'Toute la Suisse': ''
};

const APP_ID = '{{ADZUNA_APP_ID}}'; // remplacer par expression n8n
const APP_KEY = '{{ADZUNA_APP_KEY}}';

for (const user of utilisateurs) {
  const u = user.json;
  const poste = encodeURIComponent(u.poste_cible || '');
  const localisationRaw = u.localisation || '';
  const cantons = localisationRaw.split(',').map(c => c.trim());
  const canton = cantons[0] || '';
  const cantonAdzuna = cantonToAdzuna[canton] || '';

  const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/ch/search/1?app_id=${APP_ID}&app_key=${APP_KEY}&what=${poste}&where=${encodeURIComponent(cantonAdzuna)}&results_per_page=20&sort_by=date&content-type=application/json`;
  const confUrl = `https://www.jobs.admin.ch/api/v1/jobs/rss?language=fr&query=${poste}`;
  const jobupUrl = `https://www.jobup.ch/fr/jobs/rss/?term=${poste}&region=${encodeURIComponent(canton)}`;

  results.push({
    json: {
      user_id: u.id,
      email: u.email,
      poste_cible: u.poste_cible,
      localisation: u.localisation,
      type_contrat: u.type_contrat,
      cv_texte: u.cv_texte || '',
      annees_exp: u.annees_exp || 0,
      urls: { adzuna: adzunaUrl, confederation: confUrl, jobup: jobupUrl }
    }
  });
}

return results;
```

---

## WF-C — Génération Lettres de Motivation 🔲 À CONSTRUIRE

**ID n8n** : À créer (adapter depuis WF3 personnel `2lT4TKckpgMqzgNR`)
**Trigger** : Webhook POST (appelé depuis interface future ou email)

### Structure complète

```
[1] Webhook Trigger
    → Body attendu: { user_id, titre_poste, entreprise, url_offre, description_offre }
      ↓
[2] Supabase "Récupérer profil"
    → Table: profils
    → Filter: id = user_id
    → alwaysOutputData=true
      ↓
[3] Supabase "Récupérer préférences"
    → Table: preferences_recherche
    → Filter: user_id = user_id
      ↓
[4] Code "Préparer prompt LM"
    → Injecte profil + offre dans le prompt Claude
    → Prompt: voir section Prompt LM ci-dessous
      ↓
[5] HTTP Request "Claude — Générer LM"
    → POST https://api.anthropic.com/v1/messages
    → model: claude-opus-4-5
    → max_tokens: 2048
      ↓
[6] Code "Parser LM Claude"
    → try/catch JSON.parse
    → Extrait les champs placeholders
      ↓
[7] Code "Préparer replacements LM"
    → Mappe les champs vers les placeholders du template
    → Format: voir Template LM dans INTEGRATIONS.md
      ↓
[8] HTTP Request "Copier template LM"
    → POST https://www.googleapis.com/drive/v3/files/{TEMPLATE_LM_ID}/copy
    → Body: { name: "LM - {entreprise} - {titre_poste}", parents: ["{dossier_user}"] }
      ↓
[9] HTTP Request "Remplir LM (batchUpdate)"
    → POST https://docs.googleapis.com/v1/documents/{new_doc_id}:batchUpdate
    → Body: requests[]  avec replaceAllText pour chaque placeholder
    → Credential: Google Drive OAuth2
      ↓
[10] HTTP Request "Partager LM avec l'utilisateur"
     → POST https://www.googleapis.com/drive/v3/files/{new_doc_id}/permissions
     → Body: { role: "writer", type: "user", emailAddress: email }
      ↓
[11] Supabase "Logger candidature"
     → Table: candidatures
     → Insert: user_id, titre_poste, entreprise, url_offre, statut="A envoyer",
               date_candidature=today, lettre_generee=lien_doc
      ↓
[12] HTTP Request "Envoyer LM par email (Resend)"
     → POST https://api.resend.com/emails
     → from: noreply@applyflow.ch
     → subject: "✉️ Votre lettre de motivation — {titre_poste} chez {entreprise}"
     → HTML: lien vers Google Doc + conseils de personnalisation
```

### Prompt de génération LM

```
Tu es un expert en rédaction de candidatures pour le marché suisse romand.
Génère une lettre de motivation professionnelle et personnalisée.

PROFIL DU CANDIDAT :
- Nom : {{nom}}
- Poste actuel : {{poste_actuel}}
- Années d'expérience : {{annees_exp}}
- Compétences clés : {{competences_extraites_cv}}
- Localisation : {{localisation}}

OFFRE CIBLÉE :
- Entreprise : {{entreprise}}
- Poste : {{titre_poste}}
- Description : {{description_offre}}

Génère un JSON avec ces champs exactement :
{
  "destinataire_nom": "Madame, Monsieur" ou nom si connu,
  "destinataire_adresse": "",
  "destinataire_ville": "{{localisation_entreprise}}",
  "objet": "Candidature au poste de {{titre_poste}}",
  "lieu_date": "{{ville_candidat}}, le {{date_jour}}",
  "salutation": "Madame, Monsieur,",
  "para_accroche": "paragraphe 1 (accroche forte, 3-4 phrases)",
  "para_arg1": "paragraphe 2 (expérience pertinente)",
  "para_arg2": "paragraphe 3 (valeur ajoutée pour l'entreprise)",
  "para_competences": "paragraphe 4 (compétences techniques/soft skills)",
  "para_conclusion": "paragraphe 5 (disponibilité, appel à l'action)",
  "formule_politesse": "formule de politesse complète"
}

Règles :
- Ton professionnel mais chaleureux, adapté à la culture suisse
- Ne jamais inventer de dates, diplômes ou expériences non mentionnés
- Longueur : 350-450 mots total
- Langue : français romand (pas d'anglicismes inutiles)
```

---

## WF-D — CRM Candidatures 🔲 À CONSTRUIRE

**Trigger** : Automatique via WF-C (insert Supabase) + mise à jour manuelle future

### Structure (phase 1 — backend uniquement)

```
[1] Webhook "Mise à jour statut candidature"
    → Body: { candidature_id, user_id, nouveau_statut }
      ↓
[2] Supabase "Vérifier ownership"
    → Table: candidatures
    → Filter: id = candidature_id AND user_id = user_id
      ↓
[3] IF "Candidature appartient à l'utilisateur ?"
    FALSE → HTTP 403 (Return node)
    TRUE  ↓
[4] Supabase "Mettre à jour statut"
    → Table: candidatures
    → Update: statut = nouveau_statut, updated_at = now()
```

**Statuts candidature** : `A envoyer` → `Envoyée` → `Réponse reçue` → `Entretien` → `Offre` → `Refus`

---

## WF-STRIPE — Gestion des abonnements 🔲 À CONSTRUIRE

**Trigger** : Webhook Stripe (`checkout.session.completed`, `customer.subscription.deleted`)

### Structure

```
[1] Webhook Trigger Stripe
    → Vérifier signature stripe-signature (Header Auth dans n8n)
      ↓
[2] Code "Parser événement Stripe"
    → Extraire: event.type, customer.email, subscription.plan, customer.metadata
      ↓
[3] Switch sur event.type
    → checkout.session.completed ↓
    → customer.subscription.updated ↓
    → customer.subscription.deleted ↓

--- checkout.session.completed ---
[4] Supabase "Créer ou mettre à jour profil"
    → Table: profils
    → Upsert sur email: plan = stripe_plan, actif = true
      ↓
[5] Supabase Auth "Créer utilisateur"
    → admin.createUser({ email, email_confirm: true })
      ↓
[6] Resend "Email de bienvenue"
    → Template: bienvenue avec lien Tally onboarding personnalisé

--- customer.subscription.deleted ---
[4] Supabase "Désactiver utilisateur"
    → Table: profils
    → Update: actif = false WHERE email = customer.email
      ↓
[5] Resend "Email fin d'abonnement"
```

---

## Mapping Plans Stripe → Fonctionnalités

| Plan | Prix | WF-A | WF-B | WF-C | WF-D |
|---|---|---|---|---|---|
| Starter | 9 CHF/mois | ✅ | ✅ (alertes seulement) | ❌ | ❌ |
| Pro | 19 CHF/mois | ✅ | ✅ | ✅ (2 LM/mois) | ✅ |
| Booster | 39 CHF/mois | ✅ | ✅ | ✅ (illimité) | ✅ |

Vérification du plan dans WF-C :
```javascript
if (!['pro', 'booster'].includes(profil.plan)) {
  // Retourner erreur 403 — plan insuffisant
}
```
