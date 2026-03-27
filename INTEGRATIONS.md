# INTEGRATIONS.md — ApplyFlow

*Version 1.0 — 27 mars 2026*

---

## 1. Stripe

### Configuration initiale

1. Créer un compte Stripe sur stripe.com
2. Créer 3 produits avec abonnement mensuel :
   - **Starter** : 9.00 CHF/mois → noter le `price_id`
   - **Pro** : 19.00 CHF/mois → noter le `price_id`
   - **Booster** : 39.00 CHF/mois → noter le `price_id`
3. Dans les métadonnées de chaque produit, ajouter : `plan = starter|pro|booster`
4. Configurer le webhook Stripe :
   - URL : `https://p2urkinden.app.n8n.cloud/webhook/stripe-applyflow` (à créer dans n8n)
   - Événements à écouter : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copier le `Signing Secret` → credentials n8n

### Checkout Session (landing page → Stripe)

```javascript
// Exemple d'URL Stripe Checkout (Payment Links — méthode la plus simple pour Framer/Webflow)
// Créer dans Dashboard Stripe → Payment Links
// Ajouter success_url et cancel_url
// https://buy.stripe.com/xxx?prefilled_email={email}
```

### Vérification signature webhook dans n8n

Dans le node Webhook de n8n :
- **Authentication** : Header Auth
- **Header Name** : `stripe-signature`
- Note : n8n vérifie le HMAC automatiquement avec le Signing Secret

---

## 2. Resend (emails transactionnels)

### Pourquoi Resend plutôt que Brevo

- API REST simple (1 endpoint)
- Pricing : 3 000 emails/mois gratuits, puis $20/10K emails
- SDK non nécessaire — HTTP Request node n8n suffit
- Logs et analytics intégrés
- Domaine custom facile à configurer

### Configuration

1. Créer compte sur resend.com
2. Vérifier le domaine `applyflow.ch` (DNS TXT + MX)
3. Créer une clé API → stocker dans credentials n8n
4. Adresses d'expédition :
   - `bienvenue@applyflow.ch` → emails de bienvenue
   - `alertes@applyflow.ch` → alertes offres emploi
   - `noreply@applyflow.ch` → livraison LM/CV

### Appel API (n8n HTTP Request node)

```
POST https://api.resend.com/emails
Headers:
  Authorization: Bearer {RESEND_API_KEY}
  Content-Type: application/json

Body:
{
  "from": "ApplyFlow <alertes@applyflow.ch>",
  "to": ["{{email_utilisateur}}"],
  "subject": "🔔 {{nb_offres}} nouvelles offres pour vous",
  "html": "{{html_contenu}}"
}
```

### Templates email HTML

#### Email de bienvenue (post-Stripe)
```html
<h2>Bienvenue sur ApplyFlow, {{prenom}} ! 👋</h2>
<p>Votre abonnement <strong>{{plan}}</strong> est actif.</p>
<p>Pour configurer vos alertes emploi, complétez votre profil :</p>
<a href="https://tally.so/r/b5kE41?email={{email}}" style="...">
  Compléter mon profil →
</a>
<p>Vous recevrez vos premières alertes emploi dans les 24h.</p>
```

#### Email alerte offres emploi
```html
<h2>🔔 {{nb_offres}} nouvelles offres pour vous</h2>
<p>Sélectionnées pour : <strong>{{poste_cible}}</strong> en <strong>{{localisation}}</strong></p>
{{#each offres}}
<div style="border:1px solid #eee; padding:16px; margin:8px 0; border-radius:8px;">
  <h3><a href="{{url}}">{{titre}}</a></h3>
  <p>{{entreprise}} — {{localisation}}</p>
  <p>Score : <strong>{{score}}/10</strong> — {{raison}}</p>
</div>
{{/each}}
<p><small>ApplyFlow — Pour modifier vos préférences, répondez à cet email.</small></p>
```

#### Email livraison LM
```html
<h2>✉️ Votre lettre de motivation est prête</h2>
<p>Poste : <strong>{{titre_poste}}</strong> chez <strong>{{entreprise}}</strong></p>
<a href="{{url_google_doc}}">Voir ma lettre de motivation →</a>
<p>💡 Conseil : personnalisez les sections en <span style="color:orange">orange</span>
avant d'envoyer.</p>
```

---

## 3. Google Drive / Docs

### Credentials n8n (configuration unique)

- Type : **Google Drive OAuth2**
- Scope requis : `drive`, `documents`
- ⚠️ Utiliser ce credential pour les nodes Google Drive ET les HTTP Requests vers Docs API

### IDs à conserver

| Ressource | ID |
|---|---|
| Template CV | `1g8c0TvOnG322m_C5es2kdaib1H-esHbkXnNczOw0r2k` |
| Template LM | `1E-edWxTWOVQ3LtR9qSJcViC_zzBKCzZX` |
| Dossier Utilisateurs/ | `1ewqPkXjGm4aZ8eU6kvCAdNDsU0mRr45V` |

### Créer un sous-dossier par utilisateur

```javascript
// HTTP Request — POST https://www.googleapis.com/drive/v3/files
{
  "name": "{{email_utilisateur}}",
  "mimeType": "application/vnd.google-apps.folder",
  "parents": ["1ewqPkXjGm4aZ8eU6kvCAdNDsU0mRr45V"]
}
// → Sauvegarder l'id retourné pour les futures copies de docs
```

### Copier un template

```javascript
// POST https://www.googleapis.com/drive/v3/files/{TEMPLATE_ID}/copy
{
  "name": "LM - {{entreprise}} - {{titre_poste}}",
  "parents": ["{{id_dossier_utilisateur}}"]
}
// → response.id = ID du nouveau document
```

### batchUpdate Google Docs (remplacement placeholders)

```javascript
// POST https://docs.googleapis.com/v1/documents/{docId}:batchUpdate
{
  "requests": [
    {
      "replaceAllText": {
        "containsText": { "text": "{{NOM}}", "matchCase": true },
        "replaceText": "Marie Dupont"
      }
    },
    // ... un objet par placeholder
  ]
}
```

### Placeholders LM (Template `1E-edWxTWOVQ3LtR9qSJcViC_zzBKCzZX`)

| Placeholder | Champ Claude | Exemple |
|---|---|---|
| `{{DESTINATAIRE_NOM}}` | destinataire_nom | "Madame, Monsieur" |
| `{{DESTINATAIRE_ADRESSE}}` | destinataire_adresse | "" |
| `{{DESTINATAIRE_VILLE}}` | destinataire_ville | "Lausanne" |
| `{{OBJET_LABEL}}` | objet_label | "Objet :" |
| `{{OBJET}}` | objet | "Candidature au poste de..." |
| `{{LIEU_DATE}}` | lieu_date | "Lausanne, le 27 mars 2026" |
| `{{SALUTATION}}` | salutation | "Madame, Monsieur," |
| `{{PARA_ACCROCHE}}` | para_accroche | paragraphe 1 |
| `{{PARA_ARG1}}` | para_arg1 | paragraphe 2 |
| `{{PARA_ARG2}}` | para_arg2 | paragraphe 3 |
| `{{PARA_COMPETENCES}}` | para_competences | paragraphe 4 |
| `{{PARA_CONCLUSION}}` | para_conclusion | paragraphe 5 |
| `{{FORMULE_POLITESSE}}` | formule_politesse | "Veuillez agréer..." |

---

## 4. Adzuna API

### Endpoint principal

```
GET https://api.adzuna.com/v1/api/jobs/ch/search/{page}
  ?app_id={APP_ID}
  &app_key={APP_KEY}
  &what={poste_encodé}
  &where={lieu_encodé}
  &results_per_page=20
  &sort_by=date
  &content-type=application/json
  &language=fr
```

### Réponse (champs utilisés)

```json
{
  "results": [
    {
      "id": "string",
      "title": "string",
      "company": { "display_name": "string" },
      "location": { "display_name": "string" },
      "redirect_url": "string",
      "description": "string",
      "created": "2026-03-27T08:00:00Z"
    }
  ]
}
```

### Limites et gestion d'erreurs

- **250 requêtes/jour** sur le plan gratuit
- Strategy : 1 requête par utilisateur actif par cron → max ~120 users/jour avec 2 crons
- En cas d'erreur 429 : `onError=continueRegularOutput` sur le HTTP node, log dans n8n

---

## 5. Claude API (Anthropic)

### Endpoint

```
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {ANTHROPIC_API_KEY}
  anthropic-version: 2023-06-01
  content-type: application/json
```

### Body type pour scoring (WF-B)

```json
{
  "model": "claude-opus-4-5",
  "max_tokens": 2048,
  "messages": [
    {
      "role": "user",
      "content": "{{prompt_scoring}}"
    }
  ]
}
```

### Body type pour PDF (WF-A — upload CV)

```json
{
  "model": "claude-opus-4-5",
  "max_tokens": 2048,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "document",
          "source": {
            "type": "base64",
            "media_type": "application/pdf",
            "data": "{{base64_pdf}}"
          }
        },
        {
          "type": "text",
          "text": "Extrais les informations du CV..."
        }
      ]
    }
  ]
}
```

### Parsing de la réponse (Code node — toujours utiliser ce pattern)

```javascript
let raw = $input.first().json.content[0].text;
// Nettoyer les balises markdown
raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
let parsed;
try {
  parsed = JSON.parse(raw);
} catch(e) {
  // Fallback: retourner objet vide pour ne pas bloquer le workflow
  parsed = {};
}
return [{ json: parsed }];
```

---

## 6. Supabase Auth + Stripe — Flux d'inscription

```
1. Utilisateur paie sur Stripe (checkout.session.completed)
2. WF-STRIPE crée le profil dans supabase.profils (sans user_id encore)
3. WF-STRIPE appelle Supabase Admin API pour inviter l'utilisateur:
   POST https://yltajummrsorqvynvod.supabase.co/auth/v1/admin/users
   Headers: apikey: {SERVICE_ROLE_KEY}, Authorization: Bearer {SERVICE_ROLE_KEY}
   Body: { email, email_confirm: false }
   → Supabase envoie un email d'invitation avec lien de définition de mot de passe
4. L'utilisateur clique le lien → définit son mot de passe → user_id créé
5. Trigger Supabase (ou WF n8n) lie user_id au profil existant via email
```

### Trigger Supabase pour lier user_id

```sql
CREATE OR REPLACE FUNCTION link_auth_user_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profils SET user_id = NEW.id WHERE email = NEW.email AND user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_auth_user_to_profile();
```

---

## 7. Landing Page (Framer)

### Stack recommandé

- **Framer** (framer.com) — no-code, SEO-friendly, intégration Stripe Payment Links native
- Alternative : **Webflow** (plus flexible mais plus complexe)

### Sections à prévoir

1. **Hero** : tagline + CTA "Commencer maintenant"
2. **Problème** : la recherche d'emploi est chronophage
3. **Solution** : démonstration du flux ApplyFlow
4. **Pricing** : 3 plans (Starter 9 CHF / Pro 19 CHF / Booster 39 CHF)
5. **FAQ** : questions fréquentes
6. **Footer** : mentions légales, contact, RGPD/LPD

### Intégration Stripe

- Créer des **Payment Links** dans Stripe pour chaque plan
- Les intégrer comme CTAs dans Framer
- Configurer `success_url` → page de confirmation ApplyFlow
- Configurer `cancel_url` → retour sur la page pricing

### SEO technique

- Domaine : `applyflow.ch` (ou `.com` si disponible)
- Balises meta : "Recherche d'emploi automatisée en Suisse romande"
- Schema.org SoftwareApplication
- Sitemap XML auto-généré par Framer
