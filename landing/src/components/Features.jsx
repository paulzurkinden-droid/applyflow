const features = [
  {
    emoji: '🔔',
    title: 'Alertes emploi IA',
    description:
      'Recevez des alertes personnalisées dès qu\'une offre correspondant à votre profil est publiée sur les principaux jobboards suisses.',
  },
  {
    emoji: '📊',
    title: 'Scoring intelligent',
    description:
      'Chaque offre est analysée et scorée par notre IA pour vous indiquer votre taux de compatibilité et vous faire gagner du temps.',
  },
  {
    emoji: '✍️',
    title: 'LM personnalisées',
    description:
      'Générez des lettres de motivation adaptées à chaque poste en quelques secondes, avec le style et le ton qui vous ressemblent.',
  },
  {
    emoji: '📋',
    title: 'Suivi des candidatures',
    description:
      'Gardez une vue d\'ensemble sur toutes vos candidatures : en attente, entretien planifié, acceptée ou refusée.',
  },
  {
    emoji: '☁️',
    title: 'Stockage Google Drive',
    description:
      'Vos lettres de motivation et documents sont automatiquement sauvegardés dans votre Google Drive pour un accès facile.',
  },
  {
    emoji: '📧',
    title: 'Digest email quotidien',
    description:
      'Recevez chaque matin un récapitulatif des meilleures offres du jour directement dans votre boîte mail.',
  },
];

export default function Features() {
  return (
    <section id="fonctionnalites" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Des outils puissants pour trouver votre emploi idéal plus rapidement.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100"
            >
              <div className="text-4xl mb-4">{feature.emoji}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
