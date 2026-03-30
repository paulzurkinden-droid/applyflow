import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: '🏠', exact: true },
  { to: '/offres', label: 'Offres', icon: '💼' },
  { to: '/candidatures', label: 'Candidatures', icon: '📋' },
  { to: '/profil', label: 'Mon profil', icon: '👤' },
];

export default function Layout() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email ?? ''));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0 z-20">
        <NavLink to="/" className="text-xl font-extrabold text-indigo-600">ApplyFlow</NavLink>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-sm text-slate-500 truncate max-w-48">{email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-600 transition-colors font-medium"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 p-4 gap-1 flex-shrink-0">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact} className={linkClass}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex z-20">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-500'
              }`
            }
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            <span>{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
