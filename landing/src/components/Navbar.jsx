import { useState } from 'react';

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
              Fonctionnalités
            </a>
            <a href="#tarifs" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
              Tarifs
            </a>
            <a href="#faq" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
              FAQ
            </a>
            <a
              href="https://tally.so/r/b5kE41"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 transition-colors"
            >
              Commencer gratuitement
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
              Fonctionnalités
            </a>
            <a href="#tarifs" className="text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setMenuOpen(false)}>
              Tarifs
            </a>
            <a href="#faq" className="text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setMenuOpen(false)}>
              FAQ
            </a>
            <a
              href="https://tally.so/r/b5kE41"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 transition-colors text-center"
            >
              Commencer gratuitement
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
