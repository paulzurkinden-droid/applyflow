const steps = [
  {
    number: '01',
    emoji: '👤',
    title: 'Créez votre profil',
    description:
      'Renseignez vos compétences, votre secteur et vos préférences de localisation. ApplyFlow apprend ce qui vous correspond.',
  },
  {
    number: '02',
    emoji: '🤖',
    title: 'Recevez des offres scorées par l\'IA',
    description:
      'Notre IA analyse des milliers d\'offres et vous envoie chaque jour les plus pertinentes avec un score de compatibilité.',
  },
  {
    number: '03',
    emoji: '✉️',
    title: 'Générez votre lettre de motivation en 1 clic',
    description:
      'Pour chaque offre qui vous intéresse, générez une lettre de motivation personnalisée et percutante en quelques secondes.',
  },
];

export default function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Comment ça marche
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Trois étapes simples pour automatiser votre recherche d'emploi.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center p-8">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-14 left-2/3 w-1/3 h-0.5 bg-indigo-200" />
              )}

              {/* Step number circle */}
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-indigo-600 text-white text-2xl font-extrabold mb-4 shadow-lg">
                <span>{step.emoji}</span>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
