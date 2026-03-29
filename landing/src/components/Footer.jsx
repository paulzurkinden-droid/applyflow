export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div>
            <span className="text-2xl font-bold text-white">ApplyFlow</span>
            <p className="text-sm text-slate-400 mt-1">Votre recherche d'emploi, automatisée.</p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="#fonctionnalites" className="hover:text-white transition-colors">
              Fonctionnalités
            </a>
            <a href="#tarifs" className="hover:text-white transition-colors">
              Tarifs
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <a
              href="https://tally.so/r/b5kE41"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Commencer gratuitement
            </a>
          </nav>
        </div>

        <hr className="border-slate-700 my-8" />

        <div className="text-center text-sm text-slate-500">
          © 2026 ApplyFlow — Suisse romande
        </div>
      </div>
    </footer>
  );
}
