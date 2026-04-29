import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const STATUTS = ['En attente', 'Entretien', 'Refusé', 'Accepté'];
const STATUT_COLORS = {
  'En attente': 'bg-yellow-100 text-yellow-700',
  'Entretien': 'bg-blue-100 text-blue-700',
  'Refusé': 'bg-red-100 text-red-700',
  'Accepté': 'bg-green-100 text-green-700',
};

const WF_C_WEBHOOK = 'https://p2urkinden.app.n8n.cloud/webhook/generate-lm';

export default function Candidatures() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  useEffect(() => {
async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: profil } = await supabase
        .from('profils')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profil) { setLoading(false); return; }

      const { data } = await supabase
        .from('candidatures')
        .select('*')
        .eq('user_id', profil.id)
        .order('date_candidature', { ascending: false });
      setCandidatures(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const handleStatutChange = async (id, newStatut) => {
    await supabase.from('candidatures').update({ statut: newStatut }).eq('id', id);
    setCandidatures(prev => prev.map(c => c.id === id ? { ...c, statut: newStatut } : c));
  };

  const handleGenerateLM = async (candidature) => {
    setGenerating(candidature.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch(WF_C_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          titre_poste: candidature.titre_poste,
          entreprise: candidature.entreprise,
          url_offre: candidature.url_offre ?? '',
          description_offre: candidature.description_offre ?? '',
        }),
      });
      const result = await res.json();
      if (result.lm_url) {
        setCandidatures(prev => prev.map(c => c.id === candidature.id ? { ...c, lettre_generee: result.lm_url } : c));
        window.open(result.lm_url, '_blank');
      } else {
        alert(result.message ?? 'Erreur lors de la génération. Réessayez.');
      }
    } catch (err) {
      console.error('[LM Gen]', err);
      alert('Erreur de connexion. Vérifiez votre plan ou contactez support@applyflow.ch');
    } finally {
      setGenerating(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Mes candidatures</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {candidatures.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">Aucune candidature enregistrée. Postulez depuis l&apos;onglet Offres !</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Poste', 'Entreprise', 'Statut', 'Date', 'Lettre', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidatures.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-40 truncate">{c.titre_poste}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-32 truncate">{c.entreprise ?? '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={c.statut ?? 'En attente'}
                        onChange={e => handleStatutChange(c.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${STATUT_COLORS[c.statut] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {c.date_candidature ? new Date(c.date_candidature).toLocaleDateString('fr-CH') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.lettre_generee ? (
                        <a href={c.lettre_generee} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs font-medium">
                          Voir la LM ↗
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!c.lettre_generee && (
                        <button
                          onClick={() => handleGenerateLM(c)}
                          disabled={generating === c.id}
                          className="px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          {generating === c.id ? '⏳ Génération…' : '✍️ Générer LM'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
