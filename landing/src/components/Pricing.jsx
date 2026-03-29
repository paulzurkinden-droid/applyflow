import { redirectToCheckout } from '../lib/stripe';

const plans = [
  {
    name: 'Starter',
    price: 'Gratuit',
    period: '',
    description: 'Pour commencer votre recherche d\'emploi avec l\'IA.',
    features: [
      'Alertes emploi personnalisées',
      'Scoring IA des offres',
      'Jusqu\'à 10 offres par jour',
      'Digest email quotidien',
    ],
    cta: 'Commencer gratuitement',
    ctaType: 'link',
    href: 'https://tally.so/r/b5kE41',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'CHF 29',
    period: '/mois',
    description: 'Pour les candidats sérieux qui veulent se démarquer.',
    badge: 'Populaire',
    features: [
      'Tout Starter inclus',
      '2 lettres de motivation IA/mois',
      'Suivi des candidatures',
      'Offres illimitées par jour',
      'Stockage Google Drive',
    ],
    cta: 'Choisir Pro',
    ctaType: 'stripe',
    priceEnvKey: 'VITE_STRIPE_PRICE_PRO',
    highlighted: true,
  },
  {
    name: 'Booster',
    price: 'CHF 79',
    period: '/mois',
    description: 'Pour maximiser vos chances avec un accompagnement premium.',
    features: [
      'Tout Pro inclus',
      'LM illimitées',
      'Support prioritaire',
      'Revue de CV par l\'IA',
      'Accès anticipé aux nouvelles fonctions',
    ],
    cta: 'Choisir Booster',
    ctaType: 'stripe',
    priceEnvKey: 'VITE_STRIPE_PRICE_BOOSTER',
    highlighted: false,
  },
];

export default function Pricing() {
  const handleStripeClick = (priceEnvKey) => {
    const priceId =
      priceEnvKey === 'VITE_STRIPE_PRICE_PRO'
        ? import.meta.env.VITE_STRIPE_PRICE_PRO
        : import.meta.env.VITE_STRIPE_PRICE_BOOSTER;
    redirectToCheckout(priceId);
  };

  return (
    <section id="tarifs" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Tarifs simples et transparents
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Commencez gratuitement. Passez au niveau supérieur quand vous êtes prêt.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? 'bg-indigo-600 text-white shadow-2xl scale-105'
                  : 'bg-white text-slate-900 shadow-sm border border-slate-200'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-yellow-400 text-yellow-900 text-sm font-bold px-4 py-1 rounded-full shadow">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mb-4">
                <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-lg ${plan.highlighted ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {plan.period}
                  </span>
                )}
              </div>

              <p className={`text-sm mb-6 ${plan.highlighted ? 'text-indigo-100' : 'text-slate-500'}`}>
                {plan.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3">
                    <span className={`mt-0.5 text-sm flex-shrink-0 ${plan.highlighted ? 'text-indigo-200' : 'text-indigo-600'}`}>
                      ✓
                    </span>
                    <span className={`text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-slate-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.ctaType === 'link' ? (
                <a
                  href={plan.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center px-6 py-3 rounded-full font-bold transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  onClick={() => handleStripeClick(plan.priceEnvKey)}
                  className={`w-full px-6 py-3 rounded-full font-bold transition-colors cursor-pointer ${
                    plan.highlighted
                      ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-slate-500 mt-8 text-sm">
          Tous les prix sont en francs suisses (CHF), TVA incluse. Annulation possible à tout moment.
        </p>
      </div>
    </section>
  );
}
