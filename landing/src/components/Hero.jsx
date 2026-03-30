export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white overflow-hidden pt-16">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24">
        {/* Neutral badge — BUG-020 fix: removed false "200+" social proof claim */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
          <span className="text-yellow-400 text-lg">&#127464;&#127469;</span>
          <span className="text-sm font-medium">Conçu pour les chercheurs d&apos;emploi en Suisse romande</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
          Trouvez votre prochain emploi{' '}
          <span className="text-yellow-400">plus vite</span>{' '}
          grâce à l&apos;IA
        </h1>

        {/* Subheadline */}
        <p className="text-xl sm:text-2xl text-indigo-100 mb-10 max-w-2xl mx-auto leading-relaxed">
          ApplyFlow automatise votre recherche d&apos;emploi en Suisse romande : alertes personnalisées,
          offres scorées par l&apos;IA et lettres de motivation générées en 1 clic.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://tally.so/r/b5kE41"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-indigo-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-50 transition-colors shadow-xl"
          >
            Commencer gratuitement &rarr;
          </a>
          <a
            href="#comment-ca-marche"
            className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-colors"
          >
            Voir comment ça marche
          </a>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-indigo-200 text-sm">
          <div className="flex items-center gap-2">
            <span>&#10003;</span>
            <span>Sans carte bancaire</span>
          </div>
          <div className="flex items-center gap-2">
            <span>&#127464;&#127469;</span>
            <span>Fait pour la Suisse romande</span>
          </div>
          <div className="flex items-center gap-2">
            <span>&#9889;</span>
            <span>Actif en 2 minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
