import { Link } from 'react-router-dom';
export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div>
            <span className="text-2xl font-bold text-white">ApplyFlow</span>
            <p className="text-sm text-slate-400 mt-1">Votre recherche d&apos;emploi, automatis&eacute;e.</p>
          </div>
          {/* Nav links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="/#fonctionnalites" className="hover:text-white transition-colors">
              Fonctionnalit&eacute;s
            </a>
            <a href="/#tarifs" className="hover:text-white transition-colors">
              Tarifs
            </a>
            <a href="/#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <a
              href="https://dashboard.applyflow.ch"
              className="hover:text-white transition-colors"
            >
              Se connecter
            </a>
            <a href="/#tarifs" className="hover:text-white transition-colors">
              S&apos;inscrire
            </a>
          </nav>
        </div>
        <hr className="border-slate-700 my-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>&copy; 2026 ApplyFlow &mdash; Suisse romande</span>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/confidentialite" className="hover:text-slate-300 transition-colors">
              Politique de confidentialit&eacute;
            </Link>
            <Link to="/cgu" className="hover:text-slate-300 transition-colors">
              CGU
            </Link>
            <a href="mailto:contact@applyflow.ch" className="hover:text-slate-300 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
