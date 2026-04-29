import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function ScoreBadge({ score }) {
  const cls = score >= 7 ? 'bg-green-100 text-green-700' : score >= 4 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{score}/10</span>;
}

export default function Offres() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      // Récupérer le profil via le user_id Auth
      const { data: profil } = await supabase
        .from('profils')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profil) { setLoading(false); return; }

      const { data } = await supabase
        .from('offres_alertes')
        .select('id, titre, entreprise, localisation, score, raison, date_trouvee, url, envoyee, ignoree')
        .eq('user_id', profil.id)
        .order('date_trouvee', { ascending: false });
      setOffers(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

const handlePostuler = async (offer) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Créer la candidature
    await supabase.from('candidatures').insert({
      user_id: user.id,
      titre_poste: offer.titre,
      entreprise: offer.entreprise,
      url_offre: offer.url,
      description_offre: offer.raison || '',
      statut: 'En attente',
      date_candidature: new Date().toISOString().substring(0, 10),
      offre_alerte_id: offer.id,
    });

    // Marquer l'offre comme envoyée
    await supabase.from('offres_alertes').update({ envoyee: true }).eq('id', offer.id);

    // Retirer l'offre de la liste
    setOffers(prev => prev.filter(o => o.id !== offer.id));

    // Ouvrir l'URL de l'offre
    if (offer.url) window.open(offer.url, '_blank');
  };

  const handleIgnorer = async (id) => {
    await supabase.from('offres_alertes').update({ ignoree: true }).eq('id', id);
    setOffers(prev => prev.filter(o => o.id !== id));
  };

 const filtered = offers.filter(o => !o.ignoree && !o.envoyee && o.score >= minScore);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Offres d&apos;emploi</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600 font-medium">Score minimum :</label>
          <select
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[0, 4, 6, 7, 8, 9].map(v => (
              <option key={v} value={v}>{v === 0 ? 'Toutes' : `≥ ${v}/10`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">Aucune offre correspondant à ce filtre.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Poste', 'Entreprise', 'Lieu', 'Score', 'Raison IA', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(offer => (
                  <tr key={offer.id} className={`hover:bg-slate-50 transition-colors ${offer.envoyee ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-48">
                      <div className="truncate">{offer.titre}</div>
                      {offer.envoyee && <span className="text-xs text-green-600 font-normal">✓ Postulé</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-32 truncate">{offer.entreprise ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{offer.localisation ?? '—'}</td>
                    <td className="px-4 py-3"><ScoreBadge score={offer.score} /></td>
                    <td className="px-4 py-3 text-slate-500 max-w-56">
                      <div className="text-xs line-clamp-4">{offer.raison ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {offer.date_trouvee ? new Date(offer.date_trouvee).toLocaleDateString('fr-CH') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePostuler(offer)}
                          disabled={offer.envoyee}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          Postuler
                        </button>
                        <button
                          onClick={() => handleIgnorer(offer.id)}
                          className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                        >
                          Ignorer
                        </button>
                      </div>
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
