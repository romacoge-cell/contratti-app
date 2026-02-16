import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import { 
  Plus, Search, ArrowLeft, Save, 
  FileText, Calendar, User, Filter, Edit2
} from 'lucide-react';

export default function GestioneContratti() {
  const [contratti, setContratti] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [agenti, setAgenti] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);

  // Filtri
  const [filtri, setFiltri] = useState({
    agente_id: '',
    ragione_sociale: '',
    stato: '',
    data_esito_da: '',
    data_esito_a: ''
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(profile);
        if (profile?.role === 'admin') {
          const { data: listAgenti } = await supabase.from('profiles').select('id, nome, cognome').order('cognome');
          setAgenti(listAgenti || []);
        }
      }
      fetchContratti();
    };
    init();
  }, []);

  async function fetchContratti() {
    const { data, error } = await supabase
      .from('contratti')
      .select('*, clienti(ragione_sociale), profiles:agente_id(nome, cognome)')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Errore fetch contratti:", error);
    else setContratti(data || []);
  }

  // Funzione per il colore dei tag di stato
  const getStatusBadge = (stato) => {
    const styles = {
      'Firmato': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Perso': 'bg-red-100 text-red-700 border-red-200',
      'In attesa firma': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Annullato': 'bg-slate-100 text-slate-500 border-slate-200',
      'Bozza': 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return styles[stato] || 'bg-slate-100 text-slate-500';
  };

  const filteredContratti = contratti.filter(c => {
    const matchAgente = filtri.agente_id === '' || c.agente_id === filtri.agente_id;
    const matchRagione = c.clienti?.ragione_sociale.toLowerCase().includes(filtri.ragione_sociale.toLowerCase());
    const matchStato = filtri.stato === '' || c.stato === filtri.stato;
    
    // Filtro per data esito
    const dataEsito = c.data_esito ? new Date(c.data_esito) : null;
    const da = filtri.data_esito_da ? new Date(filtri.data_esito_da) : null;
    const a = filtri.data_esito_a ? new Date(filtri.data_esito_a) : null;
    
    let matchData = true;
    if (da && (!dataEsito || dataEsito < da)) matchData = false;
    if (a && (!dataEsito || dataEsito > a)) matchData = false;

    return matchAgente && matchRagione && matchStato && matchData;
  });

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Head><title>Contratti | Gestione</title></Head>
      <Navbar />

      <main className="flex-1 ml-64 p-10">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Archivio Contratti</h1>
          <button 
            onClick={() => setView('form')}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            <Plus size={20} /> Nuovo Contratto
          </button>
        </div>

        {/* FILTRI DI RICERCA */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {userProfile?.role === 'admin' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Agente</label>
                <select 
                  className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                  value={filtri.agente_id} 
                  onChange={e => setFiltri({...filtri, agente_id: e.target.value})}
                >
                  <option value="">Tutti gli Agenti</option>
                  {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Ragione Sociale</label>
              <input 
                className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                placeholder="Cerca cliente..."
                value={filtri.ragione_sociale}
                onChange={e => setFiltri({...filtri, ragione_sociale: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Stato</label>
              <select 
                className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                value={filtri.stato}
                onChange={e => setFiltri({...filtri, stato: e.target.value})}
              >
                <option value="">Tutti gli stati</option>
                <option value="Bozza">Bozza</option>
                <option value="In attesa firma">In attesa firma</option>
                <option value="Firmato">Firmato</option>
                <option value="Perso">Perso</option>
                <option value="Annullato">Annullato</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Esito Da</label>
              <input 
                type="date" 
                className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                value={filtri.data_esito_da}
                onChange={e => setFiltri({...filtri, data_esito_da: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Esito A</label>
              <input 
                type="date" 
                className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                value={filtri.data_esito_a}
                onChange={e => setFiltri({...filtri, data_esito_a: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* TABELLA CONTRATTI */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
              <tr>
                {userProfile?.role === 'admin' && <th className="p-6">Agente</th>}
                <th className="p-6">Ragione Sociale</th>
                <th className="p-6">Stato</th>
                <th className="p-6">Data Firma</th>
                <th className="p-6">Data Esito</th>
                <th className="p-6 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContratti.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  {userProfile?.role === 'admin' && (
                    <td className="p-6 text-sm font-bold text-blue-600">
                      {c.profiles?.cognome} {c.profiles?.nome}
                    </td>
                  )}
                  <td className="p-6 font-bold text-slate-800">
                    {c.clienti?.ragione_sociale}
                  </td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black border uppercase ${getStatusBadge(c.stato)}`}>
                      {c.stato}
                    </span>
                  </td>
                  <td className="p-6 text-sm font-medium text-slate-500">
                    {c.data_firma ? new Date(c.data_firma).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-6 text-sm font-bold text-slate-700">
                    {c.data_esito ? new Date(c.data_esito).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-6 text-right">
                    <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredContratti.length === 0 && (
            <div className="p-20 text-center">
              <FileText className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold">Nessun contratto trovato con questi filtri.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}