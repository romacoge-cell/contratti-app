import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import ModalReferente from '../components/ModalReferente';
import { 
  Plus, ArrowLeft, Save, Building2, User, 
  CreditCard, PenTool, ChevronRight, UserPlus, Edit2, Loader2, Search, Filter, X
} from 'lucide-react';

export default function Contratti() {
  const [view, setView] = useState('list');
  const [isEdit, setIsEdit] = useState(false);
  const [contratti, setContratti] = useState([]);
  const [agenti, setAgenti] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showRefModal, setShowRefModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- STATI PER FILTRI ---
  const [filtri, setFiltri] = useState({
    agente_id: '',
    ragione_sociale: '',
    tipo: '',
    stato: '',
    data_esito_da: '',
    data_esito_a: ''
  });
  const [suggerimentiFiltro, setSuggerimentiFiltro] = useState([]);

  // --- STATI PER FORM ---
  const [searchQuery, setSearchQuery] = useState('');
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [referentiCliente, setReferentiCliente] = useState([]);

  const [form, setForm] = useState({
    cliente_id: '', agente_id: '', tipo: 'A1', stato: 'Bozza',
    ref_nome: '', ref_cognome: '', ref_email: '', ref_telefono: '', ref_cellulare: '',
    via: '', civico: '', localita: '', provincia: '', cap: '',
    iban: '', banca: '', intestatario_conto: '', sdi: '', pec: '',
    data_firma: new Date().toISOString().split('T')[0], luogo_firma: ''
  });

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setUserProfile(profile);
    if (profile.role === 'admin') {
      const { data: ags } = await supabase.from('profiles').select('id, nome, cognome');
      setAgenti(ags || []);
    }
    fetchContratti();
  }

  async function fetchContratti() {
    let query = supabase
      .from('contratti')
      .select('*, clienti!inner(ragione_sociale), profiles:agente_id(nome, cognome)')
      .order('created_at', { ascending: false });

    // Applica filtri lato server per efficienza
    if (filtri.agente_id) query = query.eq('agente_id', filtri.agente_id);
    if (filtri.tipo) query = query.eq('tipo', filtri.tipo);
    if (filtri.stato) query = query.eq('stato', filtri.stato);
    if (filtri.ragione_sociale) query = query.ilike('clienti.ragione_sociale', `%${filtri.ragione_sociale}%`);
    if (filtri.data_esito_da) query = query.gte('data_esito', filtri.data_esito_da);
    if (filtri.data_esito_a) query = query.lte('data_esito', filtri.data_esito_a);

    const { data, error } = await query;
    if (error) console.error(error);
    else setContratti(data || []);
  }

  // Effetto per aggiornare la lista quando i filtri cambiano (debounced per la ragione sociale)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchContratti();
    }, 300);
    return () => clearTimeout(handler);
  }, [filtri]);

  // Suggerimenti per il filtro ragione sociale
  useEffect(() => {
    if (filtri.ragione_sociale.length > 1) {
      const getSuggerimenti = async () => {
        const { data } = await supabase.from('clienti').select('ragione_sociale').ilike('ragione_sociale', `%${filtri.ragione_sociale}%`).limit(5);
        setSuggerimentiFiltro(data || []);
      };
      getSuggerimenti();
    } else { setSuggerimentiFiltro([]); }
  }, [filtri.ragione_sociale]);

  const getStatoStyle = (stato) => {
    switch (stato) {
      case 'Firmato': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Perso': return 'bg-red-100 text-red-700 border-red-200';
      case 'In attesa firma': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Annullato': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const selezionaCliente = async (cli) => {
    setForm({ ...form, 
      cliente_id: cli.id, via: cli.via, civico: cli.civico, localita: cli.localita, 
      provincia: cli.provincia, cap: cli.cap, iban: cli.iban, banca: cli.banca, 
      sdi: cli.sdi, pec: cli.pec, intestatario_conto: cli.ragione_sociale 
    });
    setSearchQuery(cli.ragione_sociale);
    const { data: refs } = await supabase.from('clienti_referenti').select('*').eq('cliente_id', cli.id);
    setReferentiCliente(refs || []);
  };

  const salvaContratto = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, agente_id: form.agente_id || userProfile.id };
    const { error } = await supabase.from('contratti').upsert(payload);
    if (error) alert(error.message);
    else { setView('list'); fetchContratti(); }
    setLoading(false);
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Navbar />
      <main className="flex-1 ml-64 p-10">
        {view === 'list' ? (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Archivio Contratti</h1>
              <button onClick={() => { setView('form'); setIsEdit(false); setForm({...form, cliente_id: '', stato: 'Bozza'}); setSearchQuery(''); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-200 uppercase text-xs">
                <Plus size={18} /> Nuovo Contratto
              </button>
            </div>

            {/* --- BARRA DEI FILTRI --- */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 space-y-4">
              <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">
                <Filter size={14} /> Filtra Risultati
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                
                {/* Ragione Sociale con Suggerimenti */}
                <div className="relative col-span-1 md:col-span-2">
                  <input 
                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-blue-300 transition-all"
                    placeholder="Ragione sociale..."
                    value={filtri.ragione_sociale}
                    onChange={(e) => setFiltri({...filtri, ragione_sociale: e.target.value})}
                  />
                  {suggerimentiFiltro.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white shadow-xl rounded-xl border border-slate-100 overflow-hidden">
                      {suggerimentiFiltro.map((s, idx) => (
                        <div key={idx} onClick={() => {setFiltri({...filtri, ragione_sociale: s.ragione_sociale}); setSuggerimentiFiltro([]);}} className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-bold text-slate-600">
                          {s.ragione_sociale}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agente (Solo Admin) */}
                {userProfile?.role === 'admin' && (
                  <select 
                    className="p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-blue-300"
                    value={filtri.agente_id}
                    onChange={(e) => setFiltri({...filtri, agente_id: e.target.value})}
                  >
                    <option value="">Tutti gli Agenti</option>
                    {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                  </select>
                )}

                {/* Tipo */}
                <select 
                  className="p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-blue-300"
                  value={filtri.tipo}
                  onChange={(e) => setFiltri({...filtri, tipo: e.target.value})}
                >
                  <option value="">Tutti i Tipi</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                </select>

                {/* Stato */}
                <select 
                  className="p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-blue-300"
                  value={filtri.stato}
                  onChange={(e) => setFiltri({...filtri, stato: e.target.value})}
                >
                  <option value="">Tutti gli Stati</option>
                  <option value="Bozza">Bozza</option>
                  <option value="In attesa firma">In attesa firma</option>
                  <option value="Firmato">Firmato</option>
                  <option value="Perso">Perso</option>
                  <option value="Annullato">Annullato</option>
                </select>

                {/* Reset Filtri */}
                <button 
                  onClick={() => setFiltri({agente_id: '', ragione_sociale: '', tipo: '', stato: '', data_esito_da: '', data_esito_a: ''})}
                  className="p-3 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center gap-2 text-xs font-black uppercase"
                >
                  <X size={14}/> Reset
                </button>
              </div>

              {/* Range Date Esito */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Esito dal:</label>
                  <input type="date" className="p-2 bg-slate-50 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-blue-300" value={filtri.data_esito_da} onChange={(e) => setFiltri({...filtri, data_esito_da: e.target.value})} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">al:</label>
                  <input type="date" className="p-2 bg-slate-50 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-blue-300" value={filtri.data_esito_a} onChange={(e) => setFiltri({...filtri, data_esito_a: e.target.value})} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-6">Tipo</th>
                    <th className="p-6">Ragione Sociale</th>
                    {userProfile?.role === 'admin' && <th className="p-6">Agente</th>}
                    <th className="p-6">Stato</th>
                    <th className="p-6">Data Firma</th>
                    <th className="p-6 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contratti.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <span className="font-black text-slate-900 text-sm">{c.tipo}</span>
                      </td>
                      <td className="p-6 font-bold text-slate-800">{c.clienti?.ragione_sociale}</td>
                      {userProfile?.role === 'admin' && (
                        <td className="p-6 text-xs font-bold text-slate-500 uppercase">{c.profiles?.cognome} {c.profiles?.nome}</td>
                      )}
                      <td className="p-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatoStyle(c.stato)}`}>
                          {c.stato}
                        </span>
                      </td>
                      <td className="p-6 text-slate-400 font-bold">{c.data_firma}</td>
                      <td className="p-6 text-right"><button className="text-slate-300 hover:text-blue-600"><Edit2 size={18}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* FORM DI INSERIMENTO (RIMASTO INVARIATO COME DA ULTIMA VERSIONE) */
          <form onSubmit={salvaContratto} className="max-w-4xl mx-auto space-y-6 pb-20">
             {/* ... (Codice form esistente) ... */}
          </form>
        )}

        {showRefModal && (
          <ModalReferente 
            clienteId={form.cliente_id} 
            onClose={() => setShowRefModal(false)} 
            onSuccess={(r) => { 
                setReferentiCliente([...referentiCliente, r]); 
                setForm({...form, ref_nome: r.nome, ref_cognome: r.cognome, ref_email: r.email, ref_telefono: r.telefono_fisso, ref_cellulare: r.telefono_cellulare}); 
                setShowRefModal(false); 
            }} 
          />
        )}
      </main>
    </div>
  );
}