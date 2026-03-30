import { useEffect } from 'react';

export default function Merci() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
          Merci pour votre abonnement !
        </h1>

        {/* Message */}
        <p className="text-slate-600 text-lg mb-2">
          Votre paiement a bien été confirmé. 🎉
        </p>
        <p className="text-slate-500 mb-8">
          Vous allez recevoir un email de bienvenue dans les prochaines minutes avec les instructions pour configurer votre profil et commencer à recevoir vos alertes emploi personnalisées.
        </p>

        {/* What's next */}
        <div className="bg-indigo-50 rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-bold text-indigo-900 mb-3 text-sm uppercase tracking-wide">
            Et maintenant ?
          </h2>
          <ul className="space-y-2">
            {[
              '📧 Vérifiez votre boîte mail (et les spams)',
              '👤 Complétez votre profil via le formulaire dans l\'email',
              '🤖 Notre IA commence à trouver des offres pour vous',
              '✉️ Générez votre première lettre de motivation',
            ].map((step, i) => (
              <li key={i} className="text-sm text-indigo-800">
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <a
          href="/"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors"
        >
          Retour à l'accueil
        </a>

        <p className="text-xs text-slate-400 mt-6">
          Des questions ? Écrivez-nous à{' '}
          <a href="mailto:support@applyflow.ch" className="text-indigo-500 hover:underline">
            support@applyflow.ch
          </a>
        </p>
      </div>
    </div>
  );
}
