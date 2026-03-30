import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Cgu() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const sections = [
    {
      title: '1. Objet',
      content: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du service ApplyFlow, plateforme SaaS d'automatisation de recherche d'emploi destinée aux résidents francophones de Suisse. En créant un compte ou en souscrivant à un abonnement, vous acceptez sans réserve les présentes CGU.`,
    },
    {
      title: '2. Description du service',
      content: `ApplyFlow est un service d'automatisation de recherche d'emploi proposant :
      (a) des alertes emploi personnalisées basées sur votre profil et vos préférences,
      (b) un scoring IA des offres d'emploi via Claude (Anthropic),
      (c) la génération automatique de lettres de motivation personnalisées,
      (d) un suivi de vos candidatures.
      Le service est accessible via le site web applyflow.ch et l'API associée.`,
    },
    {
      title: '3. Plans tarifaires et facturation',
      content: `ApplyFlow propose les plans d'abonnement mensuel suivants :

• Starter — CHF 9/mois : alertes emploi personnalisées, scoring IA, jusqu'à 10 offres/jour, digest email quotidien.
• Pro — CHF 19/mois : tout Starter inclus, 2 lettres de motivation IA/mois, suivi des candidatures, offres illimitées, stockage Google Drive.
• Booster — CHF 39/mois : tout Pro inclus, lettres de motivation illimitées, support prioritaire, revue de CV IA, accès anticipé aux nouvelles fonctionnalités.

Les abonnements sont facturés mensuellement via Stripe. Les prix sont indiqués en francs suisses (CHF), TVA incluse. Aucun remboursement partiel n'est accordé en cas de résiliation en cours de période.`,
    },
    {
      title: '4. Inscription et compte utilisateur',
      content: `L'inscription requiert une adresse email valide et la création d'un mot de passe. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte. Vous vous engagez à fournir des informations exactes et à les maintenir à jour.`,
    },
    {
      title: '5. Obligations de l\'utilisateur',
      content: `Vous vous engagez à :
• Utiliser le service uniquement à des fins légales et personnelles.
• Ne pas tenter de contourner les mesures de sécurité ou d'accéder aux données d'autres utilisateurs.
• Ne pas revendre, redistribuer ou céder l'accès au service à des tiers.
• Ne pas utiliser le service pour générer du contenu trompeur, frauduleux ou portant atteinte aux droits de tiers.
• Respecter les conditions d'utilisation des services tiers intégrés (Adzuna, Google, Stripe, Anthropic).`,
    },
    {
      title: '6. Propriété intellectuelle',
      content: `ApplyFlow, son code source, ses algorithmes, son interface et sa marque sont la propriété exclusive d'ApplyFlow. Tous droits réservés.

Les lettres de motivation générées via le service sont la propriété de l'utilisateur qui les a commandées. ApplyFlow ne revendique aucun droit sur ces documents.`,
    },
    {
      title: '7. Disponibilité et niveaux de service',
      content: `ApplyFlow s'efforce d'assurer la disponibilité du service 24h/24, 7j/7. Des interruptions de maintenance planifiées ou non planifiées peuvent survenir. ApplyFlow ne garantit pas un niveau de disponibilité particulier et ne saurait être tenu responsable des interruptions de service liées à des tiers (Supabase, n8n, Anthropic, Adzuna, Stripe).`,
    },
    {
      title: '8. Limitation de responsabilité',
      content: `ApplyFlow est un outil d'aide à la recherche d'emploi. Le service ne garantit pas l'obtention d'un emploi ni la réponse positive d'un employeur.

Dans les limites autorisées par le droit suisse applicable, ApplyFlow ne saurait être tenu responsable :
• des décisions de recrutement des employeurs,
• des pertes indirectes, manque à gagner ou préjudice moral résultant de l'utilisation du service,
• des erreurs dans les offres d'emploi provenant de sources tierces (Adzuna, jobboards).

La responsabilité maximale d'ApplyFlow est limitée aux montants effectivement payés par l'utilisateur au cours des 3 derniers mois.`,
    },
    {
      title: '9. Résiliation',
      content: `Vous pouvez résilier votre abonnement à tout moment depuis votre espace client. La résiliation prend effet à la fin de la période de facturation en cours. Aucun remboursement prorata temporis n'est accordé.

ApplyFlow se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU, sans préavis ni remboursement. En cas de résiliation par ApplyFlow sans faute de l'utilisateur, les sommes prépayées sont remboursées au prorata.`,
    },
    {
      title: '10. Protection des données',
      content: `Le traitement de vos données personnelles est décrit dans notre Politique de confidentialité, consultable à l'adresse /confidentialite. Conformément à la LPD suisse révisée (en vigueur depuis le 1er septembre 2023), vous disposez de droits d'accès, de rectification, de suppression et de portabilité de vos données.`,
    },
    {
      title: '11. Modifications des CGU',
      content: `ApplyFlow se réserve le droit de modifier les présentes CGU à tout moment. Toute modification substantielle sera notifiée par email au moins 30 jours avant son entrée en vigueur. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles conditions.`,
    },
    {
      title: '12. Droit applicable et for exclusif',
      content: `Les présentes CGU sont régies exclusivement par le droit suisse, à l'exclusion des règles de conflit de lois. Tout litige relatif à l'interprétation ou à l'exécution des présentes CGU sera soumis à la compétence exclusive des tribunaux du canton de Genève, Suisse.`,
    },
    {
      title: '13. Contact',
      content: `Pour toute question relative aux présentes CGU : contact@applyflow.ch`,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-indigo-600 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-indigo-200 hover:text-white text-sm mb-4 inline-block">
            &larr; Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-extrabold text-white">Conditions générales d'utilisation</h1>
          <p className="text-indigo-200 mt-2">Dernière mise à jour : mars 2026 — Droit applicable : droit suisse, for exclusif Genève</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-slate-700">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h2>
            <p className="leading-relaxed whitespace-pre-line">{s.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
