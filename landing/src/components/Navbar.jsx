import { useState } from 'react';

const DASHBOARD_URL = 'https://dashboard.applyflow.ch';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-indigo-600">ApplyFlow</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#fonctionnalites" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
              Fonctionnalit&eacute;s
            </a>
            <a href="#tarifs" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
              Tarifs
            </a>
            <a href="#faq" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
              FAQ
            </a>
            <a
              href={DASHBOARD_URL}
              className="text-slate-600 hover:text-indigo-600 transition-colors font-medium"
            >
              Se connecter
            </a>
            <a
              href="#tarifs"
              className="bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 transition-colors"
            >
              S&apos;inscrire
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-slate-600 hover:text-indigo-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-4">
            <a href="#fonctionnalites" className="text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setMenuOpen(false)}>
              Fonctionnalit&eacute;s
            </a>
            <a href="#tarifs" className="text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setMenuOpen(false)}>
              Tarifs
            </a>
            <a href="#faq" className="text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setMenuOpen(false)}>
              FAQ
            </a>
            <a
              href={DASHBOARD_URL}
              className="text-slate-600 hover:text-indigo-600 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Se connecter
            </a>
            <a
              href="#tarifs"
              className="bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 transition-colors text-center"
              onClick={() => setMenuOpen(false)}
            >
              S&apos;inscrire
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
