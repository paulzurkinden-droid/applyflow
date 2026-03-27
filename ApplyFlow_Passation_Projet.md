# ApplyFlow — Document de passation projet
*Rédigé le 27 mars 2026 — À destination des agents de développement*

---

## 1. CONTEXTE ET VISION

**ApplyFlow** est un SaaS B2C de recherche d'emploi automatisée, ciblant les demandeurs d'emploi francophones en Suisse (Vaud, Genève, Fribourg, Valais, Neuchâtel, Jura).

Le projet est né de la transformation de workflows n8n personnels (utilisés par Paul Zurkinden, Senior Consultant à Lausanne) en une solution multi-utilisateurs commercialisable.

### Modèle commercial (prévu)
- **Starter** : 9 CHF/mois — alertes emploi
- **Pro** : 19 CHF/mois — alertes + CV + lettres de motivation
- **Booster** : 39 CHF/mois — tout + accompagnement

### Marché cible
Demandeurs d'emploi suisses romands, tous profils : cadres secteur public/privé, indépendants, stagiaires, apprentis.

---

## 2. STACK TECHNIQUE

| Outil | Usage | Détails |
|---|---|---|
| **n8n Cloud** | Orchestration workflows | v1.123.22, instance : p2urkinden.app.n8n.cloud |
| **Supabase** | Base de données + auth | EU Frankfurt, projet : yltajummrsorqvynvod |
| **Tally.so** | Formulaire onboarding | Form ID : b5kE41 |
| **Claude API** | IA (CV, scoring, lettres) | Modèle : claude-opus-4-5 |
| **Google Drive** | Stockage CV et LM | Compte dédié ApplyFlow |
| **Adzuna API** | Offres d'emploi secteur privé | Clé obtenue, 250 req/jour gratuit |
| **Resend/Brevo** | Emails transactionnels | Non encore configuré |
| **Stripe** | Paiement | Non encore configuré |
| **Webflow/Framer** | Landing page | Non encore commencé |

### Contraintes importantes n8n Cloud
- Les modules npm externes (ex: `docx`) sont **bloqués** dans les Code nodes
- Les appels HTTP vers `*.supabase.co` (Edge Functions) sont **bloqués** — utiliser les nodes Supabase natifs
- Les imports dynamiques sont bloqués
- Utiliser `alwaysOutputData=true` + `onError=continueRegularOutput` sur les nodes Supabase qui peuvent retourner 0 lignes

---

## 3. SUPABASE — SCHÉMA BASE DE DONNÉES

**URL projet** : `https://yltajummrsorqvynvod.supabase.co`
**RLS activé** sur toutes les tables.

### Table `profils`
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID (référence auth.users, nullable pour MVP)
nom TEXT
email TEXT UNIQUE
plan TEXT DEFAULT 'starter'
cv_texte TEXT (contenu extrait du CV uploadé par Claude)
cv_url TEXT (lien Google Docs du CV généré)
description_libre TEXT
actif BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
```

### Table `preferences_recherche`
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID
poste_cible TEXT
localisation TEXT (cantons séparés par virgule)
type_contrat TEXT (CDI, CDD, Stage/Apprentissage, Indépendant/Mandat)
salaire_min INTEGER DEFAULT 0
created_at TIMESTAMPTZ DEFAULT now()
```

### Table `candidatures`
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID
titre_poste TEXT
entreprise TEXT
url_offre TEXT
statut TEXT
date_candidature DATE
lettre_generee TEXT
created_at TIMESTAMPTZ DEFAULT now()
```

### Table `offres_alertes`
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID
source TEXT
titre TEXT
url TEXT
date_trouvee DATE
envoyee BOOLEAN DEFAULT false
score INTEGER
raison TEXT
created_at TIMESTAMPTZ DEFAULT now()
```

---

## 4. GOOGLE DRIVE APPLYFLOW

**Compte Google dédié** : applyflowch@gmail.com (ou similaire)
**Structure Drive** :
```
📁 Templates/
   📄 Template_CV (Google Doc natif)
      ID : 1g8c0TvOnG322m_C5es2kdaib1H-esHbkXnNczOw0r2k
   📄 Template_LM (Google Doc natif)
      ID : 1E-edWxTWOVQ3LtR9qSJcViC_zzBKCzZX
📁 Utilisateurs/
   ID dossier : 1ewqPkXjGm4aZ8eU6kvCAdNDsU0mRr45V
   📁 [email utilisateur]/
      📄 CV - Nom Prénom
      📄 LM - Entreprise - Poste
```

### Template CV — Placeholders
```
{{NOM}}           → Nom complet du candidat (grand, gras)
{{INFOS_PERSO}}   → Ligne infos (vide pour MVP, rempli après Stripe)
{{PROFIL}}        → Texte profil généré par Claude
{{COMPETENCES}}   → Liste compétences (une par ligne : "Titre : détail")
{{EXPERIENCES}}   → Bloc expériences formaté
{{FORMATION}}     → Liste formations
{{LANGUES_CERTIFICATIONS}} → Langues et certifications fusionnées
```

### Template LM — Placeholders
```
{{DESTINATAIRE_NOM}}, {{DESTINATAIRE_ADRESSE}}, {{DESTINATAIRE_VILLE}}
{{OBJET_LABEL}}, {{OBJET}}, {{LIEU_DATE}}, {{SALUTATION}}
{{PARA_ACCROCHE}}, {{PARA_ARG1}}, {{PARA_ARG2}}
{{PARA_COMPETENCES}}, {{PARA_CONCLUSION}}, {{FORMULE_POLITESSE}}
```

---

## 5. FORMULAIRE TALLY

**Form ID** : `b5kE41`
**URL webhook production** : `https://p2urkinden.app.n8n.cloud/webhook/f1fea724-e392-473d-963a-49cf3207f5cf`

### Structure du formulaire
**Section 1 — Identité** : Prénom/Nom, Email

**Section 2 — Recherche** :
- Poste recherché (textarea)
- Cantons souhaités (multiple choice : Fribourg, Genève, Vaud, Valais, Jura, Neuchâtel, Toute la Suisse)
- Type de contrat (CDI, CDD, Stage/Apprentissage, Indépendant/Mandat)
- Taux de travail (80-100%, 60-80%, 50%, Flexible)

**Section 3 — Profil avec CV** :
- Poste actuel ou dernier poste
- Années d'expérience
- Secteurs d'activité
- Formations/diplômes
- Langues et niveaux
- Upload CV PDF (optionnel)

**Section 4 — Sans CV (conditionnel si CV vide)** :
- Quel poste ou type de rôle visez-vous ?
- Secteurs cibles (checkboxes 18 options)
- Motivation
- Expérience 1 (obligatoire) : Employeur, Lieu, Intitulé, Période, Contexte, Missions, Résultat
- Expérience 2 (conditionnel)
- Expérience 3 (conditionnel)
- Diplômes obtenus
- Formations continues ou certifications
- Matrice langues (FR/EN/DE/IT/ES/PT/AR/TR/AL/SR/ZH × Notions/Intermédiaire/Courant/Bilingue)

### Keys Tally des expériences (pour parsing)
```
Expérience 1 : question_PAN7p1(employeur), question_EPG2Kl(lieu), question_rlQe5o(poste),
               question_42YMQr(période), question_jBrjZQ(contexte), question_24YpXe(missions), question_xd7Ard(résultat)
Expérience 2 : question_NAxar0, question_qbq9LO, question_QAqb1Y, question_9dY8BE,
               question_eBGVMx, question_WA6L2e, question_aB1R9Z
Expérience 3 : question_7dYyqa, question_blMoq6, question_AlYEzy, question_BGYrae,
               question_kY42lr, question_vNalMg, question_KM49zg
Matrice langues : fields.find(f => f.label?.includes('Quelles langues'))
```

---

## 6. WF-A — ONBOARDING (COMPLÉTÉ ✅)

**ID n8n** : `EddlSDFtz15DWldl`
**Nom** : "WF-A Onboarding"
**Trigger** : Webhook POST production

### Structure complète
```
Webhook (Tally POST)
  → Code in JavaScript (parse + nettoie toutes les données du formulaire)
  → Get many rows (Supabase profils, cherche par email, alwaysOutputData=true)
  → IF (email trouvé dans Supabase ?)
    TRUE  → Mettre à jour profil (Supabase update)
           → Créer préférences (Supabase insert preferences_recherche)
    FALSE → Créer profil (Supabase insert profils)
           → Créer préférences (Supabase insert preferences_recherche)
  → If1 (cv_url non vide = CV uploadé ?)
    TRUE  → Télécharger CV (HTTP GET, responseFormat=file)
           → Convertir en base64 (Code node, construit body Claude avec PDF en base64)
           → Extraire CV (HTTP POST Claude API)
           → Update a row (Supabase, met à jour cv_texte)
    FALSE → Code in JavaScript1 (prépare prompt Claude pour génération CV)
           → Générer CV (HTTP POST Claude API)
           → Parser CV (Code node, nettoie JSON, extrait cv + email + nom)
           → Préparer replacements CV (Code node, formate tous les champs)
           → Copier template CV (Google Drive, copie Template_CV dans Utilisateurs/)
           → Remplir CV (HTTP POST batchUpdate Google Docs API)
           → Partager CV (HTTP POST Drive permissions, role=writer, type=user)
           → Sauvegarder lien CV (Supabase update profils, champ cv_url)
```

### Points techniques critiques WF-A
- **Node "Get many rows"** : `alwaysOutputData=true`, `onError=continueRegularOutput`
- **Après IF** : toujours référencer `$('Code in JavaScript').item.json.xxx` et non `$json.xxx`
- **Claude API** : `max_tokens=4096` pour la génération CV, `max_tokens=2048` pour l'extraction
- **batchUpdate Google Docs** : credential type = `Google Drive OAuth2` (pas Docs)
- **Copier template** : option `Parents` = `1ewqPkXjGm4aZ8eU6kvCAdNDsU0mRr45V` (dossier Utilisateurs/)
- **Template CV ID** : `1g8c0TvOnG322m_C5es2kdaib1H-esHbkXnNczOw0r2k` (Google Doc natif, pas .docx)

### Code node "Code in JavaScript" (parser Tally) — version complète
```javascript
const body = $input.first().json.body;
const fields = body.data.fields;

function resolveOptions(field) {
  if (!field || !field.value) return '';
  const values = Array.isArray(field.value) ? field.value : [field.value];
  return values.map(id => {
    const opt = field.options?.find(o => o.id === id);
    return opt ? opt.text : id;
  }).join(', ');
}

function getField(label) {
  return fields.find(f => f.label === label);
}

function getFieldByKey(key) {
  return fields.find(f => f.key === key);
}

const nom = getField('Prénom et Nom')?.value || '';
const email = getField('Email')?.value || '';
const poste_actuel = getField('Poste actuel ou dernier poste')?.value || '';
const annees_exp = getField("Années d'expérience")?.value || 0;
const secteurs_base = getField("Secteurs d'activité")?.value || '';
const formations_base = getField('Formations / diplômes')?.value || '';
const langues_base = getField('Langues et niveaux')?.value || '';
const poste_cible = getField('Poste recherché')?.value || '';
const cantons = resolveOptions(getField('Cantons souhaités'));
const contrats = resolveOptions(getField('Type de contrat'));
const taux = resolveOptions(getField('Taux de travail souhaité'));

const cvField = getField('Votre CV (optionnel)');
const cv_url = cvField?.value?.[0]?.url || '';
const cv_nom = cvField?.value?.[0]?.name || '';
const has_cv = cv_url !== '';

const role_vise = getField('Quel poste ou type de rôle visez-vous ?')?.value || '';
const motivation = getField("Qu'est-ce qui vous motive dans ce type de poste ?")?.value || '';

const secteursField = getField("Dans quel(s) secteur(s) souhaitez-vous travailler ? ");
const secteurs_cibles = secteursField?.options
  ?.filter(o => secteursField.value?.includes(o.id) && o.text)
  .map(o => o.text).join(', ') || '';

const expKeys = [
  { employeur: 'question_PAN7p1', lieu: 'question_EPG2Kl', poste: 'question_rlQe5o', periode: 'question_42YMQr', contexte: 'question_jBrjZQ', missions: 'question_24YpXe', resultat: 'question_xd7Ard' },
  { employeur: 'question_NAxar0', lieu: 'question_qbq9LO', poste: 'question_QAqb1Y', periode: 'question_9dY8BE', contexte: 'question_eBGVMx', missions: 'question_WA6L2e', resultat: 'question_aB1R9Z' },
  { employeur: 'question_7dYyqa', lieu: 'question_blMoq6', poste: 'question_AlYEzy', periode: 'question_BGYrae', contexte: 'question_kY42lr', missions: 'question_vNalMg', resultat: 'question_KM49zg' },
];

const experiences = expKeys
  .map(keys => ({
    employeur: getFieldByKey(keys.employeur)?.value || '',
    lieu: getFieldByKey(keys.lieu)?.value || '',
    poste: getFieldByKey(keys.poste)?.value || '',
    periode: getFieldByKey(keys.periode)?.value || '',
    contexte: getFieldByKey(keys.contexte)?.value || '',
    missions: getFieldByKey(keys.missions)?.value || '',
    resultat: getFieldByKey(keys.resultat)?.value || '',
  }))
  .filter(e => e.employeur);

const diplomes = getField('Diplôme(s) obtenu(s)')?.value || '';
const certifications = getField('Formations continues ou certifications')?.value || '';

const languesMatrix = fields.find(f => f.label?.includes('Quelles langues'));
let langues_structurees = '';
if (languesMatrix?.value && languesMatrix.rows && languesMatrix.columns) {
  langues_structurees = languesMatrix.rows
    .map(row => {
      const colIds = languesMatrix.value[row.id];
      if (!colIds || !colIds.length) return null;
      const niveau = languesMatrix.columns.find(c => c.id === colIds[0])?.text || '';
      return niveau === 'Notions (A1-A2)' ? null : `${row.text} : ${niveau}`;
    })
    .filter(Boolean)
    .join(', ');
}

return [{
  json: {
    nom, email, poste_actuel, annees_exp, secteurs_base,
    formations_base, langues_base, poste_cible, cantons,
    contrats, taux, cv_url, cv_nom, has_cv,
    role_vise, motivation, secteurs_cibles,
    experiences, diplomes, certifications, langues_structurees,
  },
}];
```

---

## 7. WF-B — ALERTES OFFRES EMPLOI (EN COURS 🔧)

**ID n8n** : `rpzXTHR8m6BDfyC8`
**Nom** : "WF-B Veille offres emploi copy"
**Status** : Dupliqué depuis WF1, modifications en cours

### Ce qui a été fait
- Workflow dupliqué depuis WF1
- Supabase : colonnes `actif` (profils), `score` et `raison` (offres_alertes) ajoutées

### Ce qu'il reste à construire
Le workflow WF-B doit remplacer intégralement la logique Gmail/GSheets de WF1 par une logique multi-utilisateurs Supabase + API.

**Nodes à supprimer du WF1 copié :**
- `Gmail — Fetch alertes emploi`
- `Parser emails`
- `Mark a message as read` (x2)
- `GSheets — Lire Veille`
- `GSheets — Écrire Veille`
- `Préparer Telegram`
- `Telegram — Alerte`

**Nouvelle structure cible :**
```
Cron 8h et 18h
  → Supabase "Récupérer utilisateurs" (profils WHERE actif=true, limit=100)
  → Code "Construire URLs" (Adzuna + RSS par utilisateur)
  → HTTP "Fetch Adzuna" (GET API Adzuna)
  → HTTP "Fetch RSS jobs.admin.ch" (GET RSS Confédération)
  → HTTP "Fetch RSS jobup.ch" (GET RSS Jobup)
  → Code "Parser + normaliser offres" (unifie les formats)
  → Code "Éclater offres" (une offre = un item)
  → Supabase "Lire offres_alertes" (dédoublonnage par URL)
  → Code "Dédoublonner" (exclure offres déjà en base)
  → IF "Nouvelles offres ?"
    NON → No Op
    OUI → Code "Préparer scoring Claude" (prompt avec profil utilisateur dynamique)
         → HTTP "Claude Scoring" (POST Claude API)
         → Code "Extraire scores" (parse JSON scores)
         → Code "Éclater rows scorés"
         → Supabase "Écrire offres_alertes" (insert avec score + raison)
         → IF "Score >= 7 ?"
           NON → No Op
           OUI → Email "Alerte utilisateur" (via Resend/Brevo)
```

### Sources d'offres à fetcher

**Adzuna API (secteur privé)**
```
GET https://api.adzuna.com/v1/api/jobs/ch/search/1
  ?app_id=TON_APP_ID
  &app_key=TON_APP_KEY
  &what={poste_cible encodé}
  &where={canton encodé}
  &results_per_page=20
  &sort_by=date
  &content-type=application/json
```

**RSS Confédération (secteur public fédéral)**
```
GET https://www.jobs.admin.ch/api/v1/jobs/rss?language=fr&query={poste}
```

**RSS Jobup.ch (marché suisse général)**
```
GET https://www.jobup.ch/fr/jobs/rss/?term={poste}&region={lieu}
```

### Adaptation du scoring Claude pour multi-utilisateurs
Le prompt de scoring doit être **dynamique** — il utilise le profil de chaque utilisateur au lieu du profil fixe de Paul. Les champs à injecter depuis Supabase :
- `cv_texte` (si disponible) ou données formulaire
- `poste_cible`
- `localisation`
- `type_contrat`
- `annees_exp`

### Format de sortie attendu du scoring Claude
```json
[
  {
    "index": 1,
    "score": 8,
    "mots_cles": ["HERMES", "secteur public"],
    "raison": "explication courte en français"
  }
]
```

### Format normalisé d'une offre (sortie du parser)
```javascript
{
  source: 'Adzuna' | 'Confederation' | 'jobup.ch',
  titre: String,
  lien: String,
  entreprise: String,
  localisation: String,
  date_publication: String (YYYY-MM-DD),
  description: String (max 2000 chars),
  id_offre: String (unique, préfixé par source),
  user_id: String (UUID Supabase),
  email: String
}
```

---

## 8. WF-C — GÉNÉRATION LETTRES DE MOTIVATION (À CONSTRUIRE 🔲)

Adapter WF3 (workflow personnel de Paul) en version multi-utilisateurs.

**WF3 personnel ID** : `2lT4TKckpgMqzgNR`

### Différences WF3 → WF-C
| WF3 (personnel) | WF-C (SaaS) |
|---|---|
| Profil fixe Paul codé en dur dans le prompt | Profil dynamique depuis Supabase |
| Google Sheets comme CRM | Supabase table `candidatures` |
| Telegram notification | Email utilisateur |
| Template LM dans Drive personnel | Template LM dans Drive ApplyFlow |
| Déclenchement : polling GSheets | Déclenchement : à définir (webhook depuis interface ?) |

### Template LM
**ID** : `1E-edWxTWOVQ3LtR9qSJcViC_zzBKCzZX`
(Google Doc natif dans Templates/ du Drive ApplyFlow)

---

## 9. CE QUI N'EST PAS ENCORE FAIT

### Stripe (paiement)
- Non configuré
- À prévoir : webhook Stripe → n8n → création compte Supabase + envoi formulaire onboarding
- Les infos personnelles (date/lieu naissance, nationalité, adresse, téléphone) seront collectées à l'inscription Stripe, pas dans Tally

### Resend/Brevo (emails transactionnels)
- Non configuré
- Nécessaire pour :
  - Email de bienvenue post-inscription
  - Alerte offres emploi (remplace Telegram dans WF-B)
  - Envoi lien CV généré (actuellement géré par Google via partage Drive)
  - Futur : envoi lettres de motivation

### Landing page
- Non commencée
- Stack envisagé : Webflow ou Framer
- Doit présenter ApplyFlow, les 3 plans tarifaires, et rediriger vers Stripe

### Authentification utilisateur
- Non définie — sera gérée par Stripe + Supabase Auth
- Pas encore de frontend/dashboard utilisateur

### WF-D — CRM Candidatures
- Non commencé
- Remplacera Google Sheets par Supabase table `candidatures`
- Permettra à l'utilisateur de suivre ses candidatures

---

## 10. LEÇONS APPRISES ET PIÈGES À ÉVITER

### n8n
- `$('Node Name').item.json.field` et non `.first()` quand les branches convergent après un IF
- Modules npm bloqués en n8n Cloud → pas de `docx`, `jszip`, etc.
- HTTP vers `*.supabase.co` bloqué → utiliser nodes Supabase natifs
- Nodes Supabase : toujours `alwaysOutputData=true` + `onError=continueRegularOutput`
- Google Sheets : "Column to Match On" doit être défini dans l'UI même si passé programmatiquement
- Code node : toutes les propriétés d'objets multi-lignes nécessitent des virgules finales

### Claude API
- `max_tokens` ≥ 2048 pour les lettres de motivation, ≥ 4096 pour les CV
- Toujours wrapper `JSON.parse` dans try/catch (réponses parfois tronquées)
- Nettoyer les balises ```json avant de parser
- Ne jamais demander à Claude de générer des dates (hallucination) — générer en code

### Google Docs
- `batchUpdate` ne fonctionne que sur des Google Docs natifs (pas les .docx uploadés)
- Credential type : `Google Drive OAuth2` (pas Google Docs)
- Le gras/formatage des placeholders est préservé lors du remplacement

### Telegram
- Limite caption : 1024 caractères — au-delà, erreur 400 silencieuse

### Gmail node n8n
- HTML dans `item.html` (pas `item.body.html`)
- Champ from : `item.from.value[0].address`

---

## 11. PROCHAINE ACTION IMMÉDIATE

**Compléter WF-B** en suivant la structure définie en section 7.

Le premier node à construire est "Récupérer utilisateurs" (Supabase Get Many sur `profils` WHERE `actif=true`), suivi du Code node "Construire URLs" qui génère pour chaque utilisateur les URLs Adzuna et RSS selon ses préférences.

Le node "Construire URLs" était en cours de construction avec ce code de départ :

```javascript
const utilisateurs = $input.all();
const results = [];

for (const user of utilisateurs) {
  const u = user.json;
  
  const poste = encodeURIComponent(u.poste_cible || '');
  const localisationRaw = u.localisation || '';
  const canton = localisationRaw.split(',')[0].trim();
  const lieu = encodeURIComponent(canton === 'Toute la Suisse' ? '' : canton);
  
  const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/ch/search/1` +
    `?app_id=TON_APP_ID` +
    `&app_key=TON_APP_KEY` +
    `&what=${poste}` +
    `&where=${lieu}` +
    `&results_per_page=20` +
    `&sort_by=date` +
    `&content-type=application/json`;

  const rssUrls = [
    `https://www.jobs.admin.ch/api/v1/jobs/rss?language=fr&query=${poste}`,
    `https://www.jobup.ch/fr/jobs/rss/?term=${poste}&region=${lieu}`,
  ];

  results.push({
    json: {
      user_id: u.id,
      email: u.email,
      nom: u.nom,
      poste_cible: u.poste_cible || '',
      localisation: localisationRaw,
      type_contrat: u.type_contrat || '',
      cv_texte: u.cv_texte || '',
      adzunaUrl,
      rssUrls,
    }
  });
}

return results;
```

**Note** : remplacer `TON_APP_ID` et `TON_APP_KEY` par les vraies clés Adzuna de Paul.

---

## 12. ACCÈS ET CREDENTIALS

| Ressource | Détail |
|---|---|
| n8n Cloud | p2urkinden.app.n8n.cloud |
| Supabase URL | https://yltajummrsorqvynvod.supabase.co |
| Tally form | Form ID b5kE41 |
| Google Drive ApplyFlow | Dossier Utilisateurs/ : 1ewqPkXjGm4aZ8eU6kvCAdNDsU0mRr45V |
| Template CV | Google Doc ID : 1g8c0TvOnG322m_C5es2kdaib1H-esHbkXnNczOw0r2k |
| Template LM | Google Doc ID : 1E-edWxTWOVQ3LtR9qSJcViC_zzBKCzZX |
| WF-A ID | EddlSDFtz15DWldl |
| WF-B ID | rpzXTHR8m6BDfyC8 |
| WF3 (LM personnel, référence) | 2lT4TKckpgMqzgNR |
| WF1 (Veille personnelle, référence) | PsiDPBIAtQqoAiRT |
