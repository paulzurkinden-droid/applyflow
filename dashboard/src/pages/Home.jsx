import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function StatCard({ label, value, icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all' : ''}`}
    >
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
  const [profil, setProfil] = useState(null);
  const [stats, setStats] = useState({});
  const [recentOffers, setRecentOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profilData } = await supabase
        .from('profils')
        .select('id, nom, plan, adresse, telephone, ville')
        .eq('user_id', user.id)
        .single();

      if (!profilData) { setLoading(false); return; }
      setProfil(profilData);

      const profilId = profilData.id;

      const [offresRes, candidaturesRes] = await Promise.all([
        supabase.from('offres_alertes').select('id, score', { count: 'exact' }).eq('user_id', profilId),
        supabase.from('candidatures').select('id, lettre_generee', { count: 'exact' }).eq('user_id', user.id),
      ]);

      const lmGenerees = candidaturesRes.data?.filter(c => c.lettre_generee).length ?? 0;

      setStats({
        offres: offresRes.count ?? 0,
        candidatures: candidaturesRes.count ?? 0,
        lmGenerees,
      });

      const { data: recent } = await supabase
        .from('offres_alertes')
        .select('id, titre, entreprise, score, date_trouvee, url')
        .eq('user_id', profilId)
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

  const profilIncomplet = profil && (!profil.adresse || !profil.telephone || !profil.ville);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">
          {profil?.nom ? 'Bonjour ' + profil.nom.split(' ')[0] : 'Tableau de bord'}
        </h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
          profil?.plan === 'booster' ? 'bg-violet-100 text-violet-700' :
          profil?.plan === 'pro' ? 'bg-indigo-100 text-indigo-700' :
          'bg-slate-100 text-slate-700'
        }`}>
          {profil?.plan ?? 'starter'}
        </span>
      </div>

      {profilIncomplet && (
        <div
          onClick={() => navigate('/profil')}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-amber-300 transition-colors"
        >
          <span className="text-2xl">&#9888;&#65039;</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">{'Compl\u00e9tez vos coordonn\u00e9es'}</p>
            <p className="text-xs text-amber-600">{'Adresse, t\u00e9l\u00e9phone et ville sont requis pour g\u00e9n\u00e9rer vos lettres de motivation.'}</p>
          </div>
          <span className="ml-auto text-amber-400 text-lg">&#8594;</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={'Offres trouv\u00e9es'}
          value={stats.offres}
          icon="&#128269;"
          color="bg-indigo-50"
          onClick={() => navigate('/offres')}
        />
        <StatCard
          label="Candidatures"
          value={stats.candidatures}
          icon="&#128203;"
          color="bg-violet-50"
          onClick={() => navigate('/candidatures')}
        />
        <StatCard
          label={'LM g\u00e9n\u00e9r\u00e9es'}
          value={stats.lmGenerees}
          icon="&#9997;&#65039;"
          color="bg-green-50"
          onClick={() => navigate('/candidatures')}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">{'Derni\u00e8res offres'}</h2>
          {recentOffers.length > 0 && (
            <button
              onClick={() => navigate('/offres')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              {'Voir toutes les offres \u2192'}
            </button>
          )}
        </div>
        {recentOffers.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-slate-400 text-sm">{"Aucune offre re\u00e7ue pour l'instant."}</p>
            <p className="text-slate-400 text-xs">{"Les offres correspondant \u00e0 votre profil appara\u00eetront ici automatiquement."}</p>
          </div>
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
                    <td className="px-4 py-3 text-slate-600">{offer.entreprise ?? '\u2014'}</td>
                    <td className="px-4 py-3"><ScoreBadge score={offer.score} /></td>
                    <td className="px-4 py-3 text-slate-500">{offer.date_trouvee ? new Date(offer.date_trouvee).toLocaleDateString('fr-CH') : '\u2014'}</td>
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
