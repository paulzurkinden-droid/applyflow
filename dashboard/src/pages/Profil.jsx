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
    npa: '',
    ville: '',
    telephone: '',
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
          npa: data.npa ?? '',
          ville: data.ville ?? '',
          telephone: data.telephone ?? '',
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
        npa: editFields.npa,
        ville: editFields.ville,
        telephone: editFields.telephone,
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
    editFields.npa !== (profil?.npa ?? '') ||
    editFields.ville !== (profil?.ville ?? '') ||
    editFields.telephone !== (profil?.telephone ?? '');

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
    { label: 'Membre depuis', value: profil.created_at ? new Date(profil.created_at).toLocaleDateString('fr-CH') : '—' },
    { label: 'Compte actif', value: profil.actif ? '✅ Actif' : '❌ Inactif' },
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
            <span className="text-sm font-medium text-slate-900">{value ?? '—'}</span>
          </div>
        ))}
        {profil.cv_url && (
          <>
            <hr className="border-slate-100" />
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-slate-500">CV</span>
              <a href={profil.cv_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">
                Voir mon CV ↗
              </a>
            </div>
          </>
        )}
      </div>

      {/* Coordonnées éditables */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Mes coordonnées</h2>
          {(!profil.adresse && !profil.telephone && !profil.ville) && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              ⚠️ Requis pour les lettres de motivation
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Ces informations apparaissent sur vos lettres de motivation.
        </p>
        <hr className="border-slate-100" />

        {/* Adresse (rue) */}
        <div className="space-y-1">
          <label htmlFor="adresse" className="text-sm font-medium text-slate-600">Rue et numéro</label>
          <input
            id="adresse"
            type="text"
            value={editFields.adresse}
            onChange={e => handleFieldChange('adresse', e.target.value)}
            placeholder="Rue du Bugnon 6"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
          />
        </div>

        {/* NPA + Ville sur la même ligne */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label htmlFor="npa" className="text-sm font-medium text-slate-600">NPA</label>
            <input
              id="npa"
              type="text"
              value={editFields.npa}
              onChange={e => handleFieldChange('npa', e.target.value)}
              placeholder="1005"
              maxLength={4}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
            />
          </div>
          <div className="col-span-2 space-y-1">
            <label htmlFor="ville" className="text-sm font-medium text-slate-600">Ville</label>
            <input
              id="ville"
              type="text"
              value={editFields.ville}
              onChange={e => handleFieldChange('ville', e.target.value)}
              placeholder="Lausanne"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        {/* Téléphone */}
        <div className="space-y-1">
          <label htmlFor="telephone" className="text-sm font-medium text-slate-600">Téléphone</label>
          <input
            id="telephone"
            type="text"
            value={editFields.telephone}
            onChange={e => handleFieldChange('telephone', e.target.value)}
            placeholder="+41 79 000 00 00"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">✅ Coordonnées mises à jour</span>
          )}
        </div>
      </div>

      {/* Lien Tally */}
      <div className="bg-indigo-50 rounded-2xl p-6">
        <h2 className="font-bold text-indigo-900 mb-2">Mettre à jour mes préférences</h2>
        <p className="text-sm text-indigo-700 mb-4">
          Pour modifier vos compétences, préférences de recherche ou CV, remplissez à nouveau le formulaire.
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
