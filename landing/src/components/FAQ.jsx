import { useState } from 'react';

const faqs = [
  {
    question: 'Comment ApplyFlow trouve-t-il les offres d\'emploi pour moi ?',
    answer:
      'ApplyFlow surveille en continu les principaux jobboards suisses (jobs.ch, Indeed, LinkedIn, etc.) et filtre les offres selon votre profil, vos compétences et vos préférences de localisation. Notre IA attribue ensuite un score de compatibilité à chaque offre.',
  },
  {
    question: 'Est-ce que les lettres de motivation générées sont vraiment personnalisées ?',
    answer:
      'Oui ! Notre IA analyse simultanément votre profil, vos expériences et la description du poste pour créer une lettre unique. Vous pouvez ensuite la modifier avant de l\'envoyer. Elle n\'est pas générique — elle parle de vous.',
  },
  {
    question: 'Puis-je annuler mon abonnement à tout moment ?',
    answer:
      'Absolument. Pas d\'engagement, pas de frais cachés. Vous pouvez annuler votre abonnement Pro ou Booster depuis votre tableau de bord à n\'importe quel moment, et vous conservez l\'accès jusqu\'à la fin de la période en cours.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'La sécurité de vos données est notre priorité. Vos informations sont chiffrées et stockées sur des serveurs sécurisés en Europe. Nous ne vendons jamais vos données à des tiers. Vous pouvez demander la suppression de votre compte à tout moment.',
  },
  {
    question: 'ApplyFlow fonctionne-t-il pour tous les secteurs d\'activité en Suisse romande ?',
    answer:
      'Oui, ApplyFlow couvre tous les secteurs d\'activité : tech, finance, santé, éducation, industrie, commerce, etc. Il fonctionne pour toute offre d\'emploi publiée en ligne en Suisse romande, que ce soit pour des CDI, CDD ou missions freelance.',
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-xl text-slate-600">
            Vous avez des questions ? Nous avons les réponses.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                onClick={() => toggle(idx)}
                aria-expanded={openIdx === idx}
              >
                <span className="font-semibold text-slate-900 text-base">{faq.question}</span>
                <span
                  className={`flex-shrink-0 text-indigo-600 transition-transform ${
                    openIdx === idx ? 'rotate-180' : ''
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {openIdx === idx && (
                <div className="px-6 pb-5">
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
