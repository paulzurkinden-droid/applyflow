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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editFields, setEditFields] = useState({
    adresse: '',
    telephone: '',
    ville: '',
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('profils')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfil(data);
      if (data) {
        setEditFields({
          adresse: data.adresse ?? '',
          telephone: data.telephone ?? '',
          ville: data.ville ?? '',
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleFieldChange = (field, value) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profils')
      .update({
        adresse: editFields.adresse,
        telephone: editFields.telephone,
        ville: editFields.ville,
      })
      .eq('id', profil.id);

    if (error) {
      alert('Erreur lors de la sauvegarde : ' + error.message);
    } else {
      setProfil(prev => ({ ...prev, ...editFields }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const hasChanges =
    editFields.adresse !== (profil?.adresse ?? '') ||
    editFields.telephone !== (profil?.telephone ?? '') ||
    editFields.ville !== (profil?.ville ?? '');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profil) return (
    <div className="text-center py-16">
      <p className="text-slate-500 mb-4">Profil introuvable. Votre compte est peut-&ecirc;tre en cours d&apos;initialisation.</p>
      <a href="https://tally.so/r/b5kE41" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
        Compl&eacute;ter mon profil &rarr;
      </a>
    </div>
  );

  const readOnlyFields = [
    { label: 'Nom', value: profil.nom },
    { label: 'Email', value: profil.email },
    { label: 'Membre depuis', value: profil.created_at ? new Date(profil.created_at).toLocaleDateString('fr-CH') : '\u2014' },
    { label: 'Compte actif', value: profil.actif ? '\u2705 Actif' : '\u274C Inactif' },
  ];

  const editableFields = [
    { key: 'adresse', label: 'Adresse', placeholder: 'rue du Bugnon 6 \u2013 1005 Lausanne' },
    { key: 'telephone', label: 'T\u00E9l\u00E9phone', placeholder: '+41 (0)78 000 00 00' },
    { key: 'ville', label: 'Ville', placeholder: 'Lausanne' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-900">Mon profil</h1>

      {/* Infos fixes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Plan actuel</span>
          <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${PLAN_COLORS[profil.plan] ?? 'bg-slate-100 text-slate-700'}`}>
            {profil.plan ?? 'N/A'}
          </span>
        </div>
        <hr className="border-slate-100" />
        {readOnlyFields.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center py-1">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-medium text-slate-900">{value ?? '\u2014'}</span>
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
                T&eacute;l&eacute;charger le CV &nearr;
              </a>
            </div>
          </>
        )}
      </div>

      {/* Coordonn\u00E9es \u00E9ditables */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Mes coordonn&eacute;es</h2>
          {(!profil.adresse && !profil.telephone && !profil.ville) && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              &#9888;&#65039; Requis pour g&eacute;n&eacute;rer des lettres de motivation
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Ces informations apparaissent sur vos lettres de motivation g&eacute;n&eacute;r&eacute;es.
        </p>
        <hr className="border-slate-100" />
        {editableFields.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1">
            <label htmlFor={key} className="text-sm font-medium text-slate-600">{label}</label>
            <input
              id={key}
              type="text"
              value={editFields[key]}
              onChange={e => handleFieldChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
            />
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Sauvegarde\u2026' : 'Enregistrer'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">{'\u2705'} Coordonn&eacute;es mises &agrave; jour</span>
          )}
        </div>
      </div>

      {/* Lien Tally */}
      <div className="bg-indigo-50 rounded-2xl p-6">
        <h2 className="font-bold text-indigo-900 mb-2">Mettre &agrave; jour mes pr&eacute;f&eacute;rences</h2>
        <p className="text-sm text-indigo-700 mb-4">
          Pour modifier vos comp&eacute;tences, pr&eacute;f&eacute;rences de recherche ou CV, remplissez &agrave; nouveau le formulaire d&apos;onboarding.
        </p>
        <a
          href="https://tally.so/r/b5kE41"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Mettre &agrave; jour mon profil &rarr;
        </a>
      </div>
    </div>
  );
}
