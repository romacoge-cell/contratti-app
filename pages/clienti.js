import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
// Importiamo i validatori dalla cartella utils
import { validaPIVA, validaIBAN } from '../utils/validators';
import { 
  Plus, Edit2, ArrowLeft, Save, 
  Trash2, Building2, Landmark, Users, User, AlertCircle 
} from 'lucide-react';

export default function GestioneClienti() {
  const [clienti, setClienti] = useState([]);
  const [agenti, setAgenti] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  
  const [filtri, setFiltri] = useState({ ragione_sociale: '', sdi: '', localita: '', provincia: '', agente_id: '' });

  const [form, setForm] = useState({
    ragione_sociale: '', via: '', civico: '', localita: '', provincia: '', cap: '',
    rappresentante_nome: '', rappresentante_cognome: '', codice_altuofianco: '',
    iban: '', banca: '', intestatario_conto: '', tipologia_intestatario: 'Partita IVA',
    debitore_nome_cognome: '', debitore_cf: '', sdi: '', pec: '', agente_id: ''
  });

  const [referenti, setReferenti] = useState([]);
  const [editingId, setEditingId] = useState(null);

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
      fetchClienti();
    };
    init();
  }, []);

  async function fetchClienti() {
    const { data, error } = await supabase
      .from('clienti')
      .select('*, profiles(nome, cognome)')
      .order('ragione_sociale');
    
    if (error) console.error("Errore fetch:", error);
    else setClienti(data || []);
  }

  const handleEdit = async (cliente) => {
    setForm(cliente);
    setEditingId(cliente.id);
    const { data } = await supabase.from('clienti_referenti').select('*').eq('cliente_id', cliente.id);
    setReferenti(data || []);
    setView('form');
  };

  const handleNuovo = () => {
    setForm({
      ragione_sociale: '', via: '', civico: '', localita: '', provincia: '', cap: '',
      rappresentante_nome: '', rappresentante_cognome: '', codice_altuofianco: '',
      iban: '', banca: '', intestatario_conto: '', tipologia_intestatario: 'Partita IVA',
      debitore_nome_cognome: '', debitore_cf: '', sdi: '', pec: '',
      agente_id: userProfile?.role === 'admin' ? '' : userProfile?.id
    });
    setReferenti([]);
    setEditingId(null);
    setView('form');
  };

  const salvaTutto = async (e) => {
    e.preventDefault();
    setLoading(true);

    const finalAgenteId = userProfile.role === 'admin' ? form.agente_id : userProfile.id;

    // --- PULIZIA DATI (Anti-Errore 400 e Anti-RLS Error) ---
    const { profiles, created_at, updated_at, ...payload } = form;
    
    const clienteData = { 
      ...payload, 
      id: editingId || undefined,
      agente_id: finalAgenteId,
      // Sanificazione lunghezze per evitare "value too long"
      cap: form.cap?.replace(/\D/g, '').substring(0, 5),
      provincia: form.provincia?.substring(0, 2).toUpperCase(),
      sdi: form.sdi?.substring(0, 20) // Assicurati che SDI sia varchar(20) nel DB
    };

    const { data, error } = await supabase
      .from('clienti')
      .upsert(clienteData)
      .select();
    
    if (error) {
      alert("Errore salvataggio: " + error.message);
    } else if (data && data.length > 0) {
      const clienteId = data[0].id;
      // Salvataggio Referenti
      if (referenti.length > 0) {
        const referentiDaSalvare = referenti.map(({ profiles, created_at, id, ...r }) => ({ 
          ...r, 
          cliente_id: clienteId, 
          agente_id: finalAgenteId 
        }));
        await supabase.from('clienti_referenti').upsert(referentiDaSalvare);
      }
      setView('list');
      fetchClienti();
    }
    setLoading(false);
  };

  const isPivaValida = validaPIVA(form.sdi);
  const isIbanValido = validaIBAN(form.iban);
  const canSave = !loading && isPivaValida && isIbanValido && (userProfile?.role !== 'admin' || form.agente_id !== '');

  const filteredClienti = clienti.filter(c => 
    c.ragione_sociale.toLowerCase().includes(filtri.ragione_sociale.toLowerCase()) &&
    c.sdi.toLowerCase().includes(filtri.sdi.toLowerCase()) &&
    c.localita.toLowerCase().includes(filtri.localita.toLowerCase()) &&
    c.provincia.toLowerCase().includes(filtri.provincia.toLowerCase()) &&
    (filtri.agente_id === '' || c.agente_id === filtri.agente_id)
  );

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Head><title>Contratti | Clienti</title></Head>
      <Navbar />

      <main className="flex-1 ml-64 p-10">
        {view === 'list' ? (
          <>
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-3xl font-bold text-slate-900">Anagrafica Clienti</h1>
              <button onClick={handleNuovo} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200">
                <Plus size={20} /> Nuovo Cliente
              </button>
            </div>

            {/* FILTRI */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              {userProfile?.role === 'admin' && (
                <select className="p-3 bg-slate-50 rounded-xl outline-none" value={filtri.agente_id} onChange={e => setFiltri({...filtri, agente_id: e.target.value})}>
                  <option value="">Tutti gli Agenti</option>
                  {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                </select>
              )}
              <input placeholder="Ragione Sociale" className="p-3 bg-slate-50 rounded-xl outline-none font-medium" value={filtri.ragione_sociale} onChange={e => setFiltri({...filtri, ragione_sociale: e.target.value})} />
              <input placeholder="P.IVA / SDI" className="p-3 bg-slate-50 rounded-xl outline-none font-medium" value={filtri.sdi} onChange={e => setFiltri({...filtri, sdi: e.target.value})} />
              <input placeholder="Località" className="p-3 bg-slate-50 rounded-xl outline-none font-medium" value={filtri.localita} onChange={e => setFiltri({...filtri, localita: e.target.value})} />
              <input placeholder="PR" maxLength={2} className="p-3 bg-slate-50 rounded-xl outline-none font-medium text-center" value={filtri.provincia} onChange={e => setFiltri({...filtri, provincia: e.target.value})} />
            </div>

            {/* TABELLA */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    {userProfile?.role === 'admin' && <th className="p-6 text-blue-600">Agente</th>}
                    <th className="p-6">Ragione Sociale</th>
                    <th className="p-6">P.IVA</th>
                    <th className="p-6">Località</th>
                    <th className="p-6">PR</th>
                    <th className="p-6 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClienti.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      {userProfile?.role === 'admin' && (
                        <td className="p-6 text-sm font-bold text-blue-600">{c.profiles?.cognome} {c.profiles?.nome}</td>
                      )}
                      <td className="p-6 font-bold text-slate-800">{c.ragione_sociale}</td>
                      <td className="p-6 text-slate-500 font-medium">{c.sdi}</td>
                      <td className="p-6 text-slate-500 font-medium">{c.localita}</td>
                      <td className="p-6 text-slate-500 font-medium">{c.provincia}</td>
                      <td className="p-6 text-right">
                        <button onClick={() => handleEdit(c)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <form onSubmit={salvaTutto} className="max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
              <button type="button" onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">
                <ArrowLeft size={20} /> Torna all&apos;elenco
              </button>
              <h2 className="text-2xl font-black text-slate-800">{editingId ? 'Modifica Cliente' : 'Nuovo Cliente'}</h2>
              <div className="w-40"></div>
            </div>

            <div className="space-y-8">
              {/* ASSEGNAZIONE AGENTE (SOLO ADMIN) */}
              {userProfile?.role === 'admin' && (
                <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-blue-700">
                    <User size={24} />
                    <h3 className="text-lg font-bold">Assegnazione Agente</h3>
                  </div>
                  <select required className="w-full md:w-1/2 p-4 bg-white border border-blue-200 rounded-2xl outline-none font-bold text-blue-600" value={form.agente_id} onChange={e => setForm({...form, agente_id: e.target.value})}>
                    <option value="">Seleziona l&apos;agente...</option>
                    {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                  </select>
                </div>
              )}

              {/* ANAGRAFICA */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 text-blue-600">
                  <Building2 size={24} />
                  <h3 className="text-lg font-bold">Anagrafica Cliente</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Ragione Sociale</label>
                    <input required className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={form.ragione_sociale} onChange={e => setForm({...form, ragione_sociale: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Partita IVA</label>
                    <input 
                      className={`w-full p-4 rounded-2xl mt-1 outline-none border-2 transition-all font-bold ${form.sdi && !isPivaValida ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:border-blue-500'}`}
                      value={form.sdi} maxLength={11} onChange={e => setForm({...form, sdi: e.target.value.replace(/\D/g, '')})} 
                    />
                    {form.sdi && !isPivaValida && <p className="text-red-500 text-[10px] font-bold mt-1 ml-2 uppercase flex items-center gap-1"><AlertCircle size={12}/> P.IVA Non Valida</p>}
                  </div>
                  {/* Indirizzo, Cap, Prov, Località */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Via e Civico</label>
                    <div className="flex gap-2">
                      <input className="flex-1 p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={form.via} onChange={e => setForm({...form, via: e.target.value})} />
                      <input className="w-24 p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={form.civico} onChange={e => setForm({...form, civico: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:col-span-1">
                    <div className="col-span-2">
                       <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Località</label>
                       <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold" value={form.localita} onChange={e => setForm({...form, localita: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Cap</label>
                       <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 text-center font-bold" maxLength={5} value={form.cap} onChange={e => setForm({...form, cap: e.target.value.replace(/\D/g, '')})} />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-400 ml-2 uppercase">PR</label>
                       <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 text-center font-bold" maxLength={2} value={form.provincia} onChange={e => setForm({...form, provincia: e.target.value.toUpperCase()})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* DATI AMMINISTRATIVI */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 text-emerald-600">
                  <Landmark size={24} />
                  <h3 className="text-lg font-bold">Dati Amministrativi e Bancari</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">IBAN</label>
                    <input 
                      className={`w-full p-4 rounded-2xl mt-1 font-mono outline-none border-2 transition-all font-bold ${form.iban && !isIbanValido ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:border-blue-500'}`}
                      value={form.iban} onChange={e => setForm({...form, iban: e.target.value.toUpperCase()})} 
                    />
                    {form.iban && !isIbanValido && <p className="text-red-500 text-[10px] font-bold mt-1 ml-2 uppercase flex items-center gap-1"><AlertCircle size={12}/> IBAN Non Valido</p>}
                  </div>
                  {/* Banca, Pec, etc */}
                  <div className="grid grid-cols-2 gap-6 md:col-span-2">
                    <div>
                      <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Banca</label>
                      <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold" value={form.banca} onChange={e => setForm({...form, banca: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 ml-2 uppercase">PEC</label>
                      <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold" value={form.pec} onChange={e => setForm({...form, pec: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* PULSANTE SALVA */}
              <div className="flex justify-end pt-4">
                <button 
                  type="submit" disabled={!canSave}
                  className={`px-12 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl ${canSave ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 scale-100 hover:scale-105 active:scale-95' : 'bg-slate-300 cursor-not-allowed shadow-none text-slate-500'}`}
                >
                  <Save size={20} /> {loading ? 'Salvataggio...' : 'Salva Cliente'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}