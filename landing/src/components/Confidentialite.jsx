import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Confidentialite() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-indigo-600 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-indigo-200 hover:text-white text-sm mb-4 inline-block">
            &larr; Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-extrabold text-white">Politique de confidentialité</h1>
          <p className="text-indigo-200 mt-2">Dernière mise à jour : mars 2026 — Conforme à la LPD suisse (en vigueur depuis septembre 2023)</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-slate-700">

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Responsable du traitement</h2>
          <p>
            <strong>ApplyFlow</strong>, service exploité en Suisse romande.<br />
            Contact général : <a href="mailto:contact@applyflow.ch" className="text-indigo-600 hover:underline">contact@applyflow.ch</a><br />
            Délégué à la protection des données (DPO) : <a href="mailto:contact@applyflow.ch" className="text-indigo-600 hover:underline">contact@applyflow.ch</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. Données collectées et finalités</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Donnée</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Finalité</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Base légale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Nom, prénom, email', 'Création de compte, communication, envoi du digest emploi', 'Exécution du contrat'],
                  ['CV (stocké sur Google Drive)', 'Génération de lettres de motivation personnalisées', 'Exécution du contrat'],
                  ['Préférences de recherche (secteur, région, type de poste)', 'Personnalisation des alertes emploi', 'Exécution du contrat'],
                  ['Offres d\'emploi consultées et scorées', 'Amélioration du scoring IA et pertinence des alertes', 'Intérêt légitime'],
                  ['Historique des candidatures', 'Suivi personnel des candidatures dans le tableau de bord', 'Exécution du contrat'],
                  ['Données de paiement (gérées par Stripe)', 'Facturation de l\'abonnement', 'Exécution du contrat'],
                  ['Adresse IP, données de navigation', 'Sécurité, détection de fraude, amélioration du service', 'Intérêt légitime'],
                ].map(([d, f, b], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-3 font-medium">{d}</td>
                    <td className="px-4 py-3">{f}</td>
                    <td className="px-4 py-3 text-slate-500">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Durée de conservation</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Données de compte et de profil : conservées jusqu'à la suppression du compte, puis supprimées sous 30 jours.</li>
            <li>CV et lettres de motivation : supprimés de Google Drive sur demande ou à la clôture du compte.</li>
            <li>Données de facturation : conservées 10 ans (obligation légale comptable suisse).</li>
            <li>Logs de navigation : 13 mois maximum.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Transferts vers des tiers</h2>
          <p className="mb-3">Vos données peuvent être traitées par les sous-traitants suivants, tous liés par des garanties contractuelles adéquates :</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Sous-traitant</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Rôle</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Localisation</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Garanties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Supabase', 'Base de données', 'EU (AWS Frankfurt)', 'DPA + clauses contractuelles types'],
                  ['Anthropic (Claude)', 'Génération IA des lettres de motivation', 'USA', 'DPA, clauses contractuelles types UE'],
                  ['Stripe', 'Paiement en ligne', 'USA/EU', 'Certifié PCI DSS, Privacy Shield successor'],
                  ['Resend', 'Emails transactionnels', 'USA', 'DPA + clauses contractuelles types'],
                  ['Adzuna', 'Données d\'offres d\'emploi', 'UK/EU', 'Accord partenaire, données publiques uniquement'],
                  ['Google Drive', 'Stockage des documents (CV, LM)', 'EU (option)', 'DPA Google Workspace, clauses contractuelles types'],
                ].map(([s, r, l, g], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-3 font-medium">{s}</td>
                    <td className="px-4 py-3">{r}</td>
                    <td className="px-4 py-3">{l}</td>
                    <td className="px-4 py-3 text-slate-500">{g}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-slate-500">Aucune vente de vos données à des tiers à des fins publicitaires ou commerciales.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Vos droits (LPD suisse / RGPD)</h2>
          <p className="mb-3">Conformément à la Loi fédérale sur la protection des données (LPD, révisée, en vigueur depuis le 1er septembre 2023), vous disposez des droits suivants :</p>
          <ul className="space-y-2">
            {[
              ['Droit d\'accès', 'Obtenir une copie de vos données personnelles traitées par ApplyFlow.'],
              ['Droit de rectification', 'Corriger des données inexactes ou incomplètes.'],
              ['Droit à l\'effacement', 'Demander la suppression de votre compte et de vos données.'],
              ['Droit à la portabilité', 'Recevoir vos données dans un format structuré et lisible par machine.'],
              ['Droit d\'opposition', 'Vous opposer au traitement basé sur l\'intérêt légitime.'],
              ['Droit à la limitation', 'Demander la suspension temporaire d\'un traitement contesté.'],
            ].map(([right, desc], i) => (
              <li key={i} className="flex gap-3">
                <span className="text-indigo-600 mt-0.5">&#10003;</span>
                <span><strong>{right}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            Pour exercer vos droits : <a href="mailto:contact@applyflow.ch" className="text-indigo-600 hover:underline">contact@applyflow.ch</a>. Réponse sous 30 jours.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            En cas de litige, vous pouvez saisir le Préposé fédéral à la protection des données et à la transparence (PFPDT) : <a href="https://www.edoeb.admin.ch" className="text-indigo-500 hover:underline" target="_blank" rel="noopener noreferrer">www.edoeb.admin.ch</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">6. Sécurité</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Chiffrement en transit : TLS 1.3</li>
            <li>Chiffrement au repos : AES-256 (Supabase)</li>
            <li>Contrôle d'accès : Row Level Security (RLS) — chaque utilisateur ne voit que ses propres données</li>
            <li>Authentification : Supabase Auth avec tokens JWT</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">7. Cookies</h2>
          <p>ApplyFlow n'utilise pas de cookies publicitaires ou de tracking tiers. Des cookies techniques strictement nécessaires au fonctionnement du service (session, authentification) peuvent être déposés.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">8. Modifications</h2>
          <p>Cette politique peut être mise à jour. Toute modification substantielle sera notifiée par email. La version en vigueur est celle publiée sur cette page.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">9. Contact</h2>
          <p>
            Pour toute question relative à cette politique :<br />
            <a href="mailto:contact@applyflow.ch" className="text-indigo-600 hover:underline">contact@applyflow.ch</a>
          </p>
        </section>
      </div>
    </div>
  );
}
