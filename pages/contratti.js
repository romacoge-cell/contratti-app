import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
// Importiamo i validatori creati in precedenza
import { validaIBAN } from '../utils/validators';
import { 
  Plus, Search, ArrowLeft, Save, 
  FileText, User, Edit2, AlertCircle,
  Building2, CreditCard, PenTool, Landmark
} from 'lucide-react';

export default function GestioneContratti() {
  const [contratti, setContratti] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [agenti, setAgenti] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);

  // Filtri ricerca
  const [filtri, setFiltri] = useState({
    agente_id: '',
    ragione_sociale: '',
    stato: '',
    data_esito_da: '',
    data_esito_a: ''
  });

  // Stato del Form
  const [form, setForm] = useState({
    cliente_id: '',
    ref_nome: '', ref_cognome: '', ref_email: '', ref_telefono: '', ref_cellulare: '',
    iban: '', banca: '', intestatario_conto: '', tipologia_intestatario: 'Partita IVA',
    debitore_nome_cognome: '', debitore_cf: '', sdi: '', pec: '',
    data_firma: new Date().toISOString().split('T')[0],
    luogo_firma: '',
    stato: 'Bozza',
    data_esito: ''
  });

  useEffect(() => {
    init();
  }, []);

  async function init() {
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
    fetchClienti();
  }

  async function fetchContratti() {
    const { data, error } = await supabase
      .from('contratti')
      .select('*, clienti(ragione_sociale), profiles:agente_id(nome, cognome)')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Errore fetch:", error);
    else setContratti(data || []);
  }

  async function fetchClienti() {
    const { data } = await supabase.from('clienti').select('*').order('ragione_sociale');
    setClienti(data || []);
  }

  // Funzione per auto-compilare il contratto scegliendo il cliente
  const handleSelectCliente = (clienteId) => {
    const cli = clienti.find(c => c.id === clienteId);
    if (cli) {
      setForm({
        ...form,
        cliente_id: clienteId,
        iban: cli.iban || '',
        banca: cli.banca || '',
        sdi: cli.sdi || '',
        pec: cli.pec || '',
        luogo_firma: cli.localita || '',
        intestatario_conto: cli.ragione_sociale || '',
        debitore_nome_cognome: cli.rappresentante_nome ? `${cli.rappresentante_nome} ${cli.rappresentante_cognome}` : '',
        debitore_cf: cli.sdi || ''
      });
    }
  };

  const salvaContratto = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Rimuoviamo campi virtuali del join se presenti (profiles, clienti)
    const { profiles, clienti: cliJoin, ...payload } = form;

    const { error } = await supabase.from('contratti').upsert({
      ...payload,
      agente_id: userProfile.id // Assegna l'agente che sta creando il contratto
    });

    if (error) {
      alert("Errore salvataggio: " + error.message);
    } else {
      setView('list');
      fetchContratti();
    }
    setLoading(false);
  };

  const getStatusBadge = (stato) => {
    const styles = {
      'Firmato': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Perso': 'bg-red-100 text-red-700 border-red-200',
      'In attesa firma': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Annullato': 'bg-slate-100 text-slate-500 border-slate-200',
      'Bozza': 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return styles[stato] || 'bg-slate-50 text-slate-500';
  };

  const filteredContratti = contratti.filter(c => {
    const matchAgente = filtri.agente_id === '' || c.agente_id === filtri.agente_id;
    const matchRagione = c.clienti?.ragione_sociale.toLowerCase().includes(filtri.ragione_sociale.toLowerCase());
    const matchStato = filtri.stato === '' || c.stato === filtri.stato;
    
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
      <Head><title>Contratti | Archivio</title></Head>
      <Navbar />

      <main className="flex-1 ml-64 p-10">
        {view === 'list' ? (
          <>
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-3xl font-bold text-slate-900">Archivio Contratti</h1>
              <button 
                onClick={() => setView('form')}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                <Plus size={20} /> Nuovo Contratto
              </button>
            </div>

            {/* FILTRI */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {userProfile?.role === 'admin' && (
                  <select 
                    className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                    value={filtri.agente_id} onChange={e => setFiltri({...filtri, agente_id: e.target.value})}
                  >
                    <option value="">Tutti gli Agenti</option>
                    {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                  </select>
                )}
                <input 
                  className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                  placeholder="Ragione Sociale..."
                  value={filtri.ragione_sociale} onChange={e => setFiltri({...filtri, ragione_sociale: e.target.value})}
                />
                <select 
                  className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                  value={filtri.stato} onChange={e => setFiltri({...filtri, stato: e.target.value})}
                >
                  <option value="">Tutti gli stati</option>
                  <option value="Bozza">Bozza</option>
                  <option value="In attesa firma">In attesa firma</option>
                  <option value="Firmato">Firmato</option>
                  <option value="Perso">Perso</option>
                  <option value="Annullato">Annullato</option>
                </select>
                <input 
                  type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                  value={filtri.data_esito_da} onChange={e => setFiltri({...filtri, data_esito_da: e.target.value})}
                />
                <input 
                  type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                  value={filtri.data_esito_a} onChange={e => setFiltri({...filtri, data_esito_a: e.target.value})}
                />
              </div>
            </div>

            {/* TABELLA */}
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
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-all group">
                      {userProfile?.role === 'admin' && (
                        <td className="p-6 text-sm font-bold text-blue-600">{c.profiles?.cognome} {c.profiles?.nome}</td>
                      )}
                      <td className="p-6 font-bold text-slate-800">{c.clienti?.ragione_sociale}</td>
                      <td className="p-6">
                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-black border uppercase ${getStatusBadge(c.stato)}`}>
                          {c.stato}
                        </span>
                      </td>
                      <td className="p-6 text-sm font-medium text-slate-500">{c.data_firma ? new Date(c.data_firma).toLocaleDateString() : '-'}</td>
                      <td className="p-6 text-sm font-bold text-slate-700">{c.data_esito ? new Date(c.data_esito).toLocaleDateString() : '-'}</td>
                      <td className="p-6 text-right">
                        <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <form onSubmit={salvaContratto} className="max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
              <button type="button" onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold">
                <ArrowLeft size={20} /> Torna all&apos;elenco
              </button>
              <h2 className="text-2xl font-black text-slate-800">Nuovo Contratto</h2>
              <select 
                className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none"
                value={form.stato} onChange={e => setForm({...form, stato: e.target.value})}
              >
                <option value="Bozza">Bozza</option>
                <option value="In attesa firma">In attesa firma</option>
                <option value="Firmato">Firmato</option>
                <option value="Perso">Perso</option>
                <option value="Annullato">Annullato</option>
              </select>
            </div>

            <div className="space-y-6">
              {/* SEZIONE 1: CLIENTE */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 text-blue-600">
                  <Building2 size={24} />
                  <h3 className="text-lg font-bold">1. Selezione Cliente</h3>
                </div>
                <select 
                  required className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none"
                  value={form.cliente_id} onChange={(e) => handleSelectCliente(e.target.value)}
                >
                  <option value="">Scegli un cliente...</option>
                  {clienti.map(cli => <option key={cli.id} value={cli.id}>{cli.ragione_sociale}</option>)}
                </select>
              </div>

              {/* SEZIONE 2: REFERENTE */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 text-purple-600">
                  <User size={24} />
                  <h3 className="text-lg font-bold">2. Referente Pratica</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Nome Referente" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_nome} onChange={e => setForm({...form, ref_nome: e.target.value})} />
                  <input placeholder="Cognome Referente" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_cognome} onChange={e => setForm({...form, ref_cognome: e.target.value})} />
                  <input placeholder="Email" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_email} onChange={e => setForm({...form, ref_email: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Telefono" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_telefono} onChange={e => setForm({...form, ref_telefono: e.target.value})} />
                    <input placeholder="Cellulare" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_cellulare} onChange={e => setForm({...form, ref_cellulare: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* SEZIONE 3: AMMINISTRATIVI RID */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 text-emerald-600">
                  <Landmark size={24} />
                  <h3 className="text-lg font-bold">3. Dati Amministrativi per RID</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input placeholder="IBAN" className="w-full p-4 bg-slate-50 rounded-2xl font-mono font-bold outline-none" value={form.iban} onChange={e => setForm({...form, iban: e.target.value.toUpperCase()})} />
                  </div>
                  <input placeholder="Banca" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.banca} onChange={e => setForm({...form, banca: e.target.value})} />
                  <input placeholder="Intestatario Conto" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.intestatario_conto} onChange={e => setForm({...form, intestatario_conto: e.target.value})} />
                  <input placeholder="Debitore Nome/Cognome" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.debitore_nome_cognome} onChange={e => setForm({...form, debitore_nome_cognome: e.target.value})} />
                  <input placeholder="C.F. Debitore" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.debitore_cf} onChange={e => setForm({...form, debitore_cf: e.target.value})} />
                  <input placeholder="SDI" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.sdi} onChange={e => setForm({...form, sdi: e.target.value})} />
                  <input placeholder="PEC" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.pec} onChange={e => setForm({...form, pec: e.target.value})} />
                </div>
              </div>

              {/* SEZIONE 4: FIRMA ED ESITO */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 text-orange-600">
                  <PenTool size={24} />
                  <h3 className="text-lg font-bold">4. Dati Firma ed Esito</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Data Firma</label>
                    <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.data_firma} onChange={e => setForm({...form, data_firma: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Luogo Firma</label>
                    <input placeholder="Luogo" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.luogo_firma} onChange={e => setForm({...form, luogo_firma: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-blue-600 ml-2 uppercase">Data Esito</label>
                    <input type="date" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-bold outline-none" value={form.data_esito} onChange={e => setForm({...form, data_esito: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit" disabled={loading}
                  className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
                >
                  <Save size={20} /> {loading ? 'Salvataggio...' : 'Salva Contratto'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}