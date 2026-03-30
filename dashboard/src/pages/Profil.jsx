import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const PLAN_COLORS = {
  starter: 'bg-slate-100 text-slate-700',
  pro: 'bg-indigo-100 text-indigo-700',
  booster: 'bg-violet-100 text-violet-700',
};

export default function Profil() {
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('profils')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfil(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profil) return (
    <div className="text-center py-16">
      <p className="text-slate-500 mb-4">Profil introuvable. Votre compte est peut-être en cours d&apos;initialisation.</p>
      <a href="https://tally.so/r/b5kE41" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
        Compléter mon profil →
      </a>
    </div>
  );

  const fields = [
    { label: 'Nom', value: profil.nom },
    { label: 'Email', value: profil.email },
    { label: 'Membre depuis', value: profil.created_at ? new Date(profil.created_at).toLocaleDateString('fr-CH') : '—' },
    { label: 'Compte actif', value: profil.actif ? '✅ Actif' : '❌ Inactif' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-900">Mon profil</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        {/* Plan badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Plan actuel</span>
          <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${PLAN_COLORS[profil.plan] ?? 'bg-slate-100 text-slate-700'}`}>
            {profil.plan ?? 'N/A'}
          </span>
        </div>
        <hr className="border-slate-100" />

        {fields.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center py-1">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-medium text-slate-900">{value ?? '—'}</span>
          </div>
        ))}

        {profil.cv_url && (
          <>
            <hr className="border-slate-100" />
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-slate-500">CV</span>
              <a
                href={profil.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                Télécharger le CV ↗
              </a>
            </div>
          </>
        )}
      </div>

      <div className="bg-indigo-50 rounded-2xl p-6">
        <h2 className="font-bold text-indigo-900 mb-2">Mettre à jour mes informations</h2>
        <p className="text-sm text-indigo-700 mb-4">
          Pour modifier votre profil (compétences, préférences de recherche, CV), remplissez à nouveau le formulaire d&apos;onboarding.
        </p>
        <a
          href="https://tally.so/r/b5kE41"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Mettre à jour mon profil →
        </a>
      </div>
    </div>
  );
}
