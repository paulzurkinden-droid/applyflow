import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900">{value ?? '—'}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function ScoreBadge({ score }) {
  const cls = score >= 7 ? 'bg-green-100 text-green-700' : score >= 4 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{score}/10</span>;
}

export default function Home() {
  const [stats, setStats] = useState({});
  const [recentOffers, setRecentOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [offresRes, candidaturesRes] = await Promise.all([
        supabase.from('offres_alertes').select('id, score', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('candidatures').select('id, lettre_generee', { count: 'exact' }).eq('user_id', user.id),
      ]);

      const envoyees = candidaturesRes.data?.filter(c => c.lettre_generee).length ?? 0;

      setStats({
        offres: offresRes.count ?? 0,
        candidatures: candidaturesRes.count ?? 0,
        lmGenerees: envoyees,
      });

      const { data: recent } = await supabase
        .from('offres_alertes')
        .select('id, titre, entreprise, score, date_trouvee, url')
        .eq('user_id', user.id)
        .order('date_trouvee', { ascending: false })
        .limit(10);

      setRecentOffers(recent ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Offres trouvées" value={stats.offres} icon="🔍" color="bg-indigo-50" />
        <StatCard label="Candidatures" value={stats.candidatures} icon="📋" color="bg-violet-50" />
        <StatCard label="LM générées" value={stats.lmGenerees} icon="✍️" color="bg-green-50" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Dernières offres</h2>
        </div>
        {recentOffers.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">Aucune offre reçue pour l&apos;instant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Poste', 'Entreprise', 'Score', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOffers.map(offer => (
                  <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {offer.url ? (
                        <a href={offer.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline">
                          {offer.titre}
                        </a>
                      ) : offer.titre}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{offer.entreprise ?? '—'}</td>
                    <td className="px-4 py-3"><ScoreBadge score={offer.score} /></td>
                    <td className="px-4 py-3 text-slate-500">{offer.date_trouvee ? new Date(offer.date_trouvee).toLocaleDateString('fr-CH') : '—'}</td>
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
