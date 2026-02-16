import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import { validaPIVA, validaIBAN } from '../utils/validators';
import { 
  Plus, Edit2, ArrowLeft, Save, Building2, 
  Landmark, User, AlertCircle, MapPin, CreditCard, Mail
} from 'lucide-react';

export default function GestioneClienti() {
  const [clienti, setClienti] = useState([]);
  const [agenti, setAgenti] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  
  const [filtri, setFiltri] = useState({ ragione_sociale: '', sdi: '', localita: '', provincia: '', agente_id: '' });

  const initialForm = {
    ragione_sociale: '', via: '', civico: '', localita: '', provincia: '', cap: '',
    rappresentante_nome: '', rappresentante_cognome: '', codice_altuofianco: '',
    iban: '', banca: '', intestatario_conto: '', tipologia_intestatario: 'Partita IVA',
    debitore_nome_cognome: '', debitore_cf: '', sdi: '', pec: '', agente_id: ''
  };

  const [form, setForm] = useState(initialForm);
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
    setForm({ ...initialForm, agente_id: userProfile?.role === 'admin' ? '' : userProfile?.id });
    setReferenti([]);
    setEditingId(null);
    setView('form');
  };

  const salvaTutto = async (e) => {
    e.preventDefault();
    setLoading(true);

    const finalAgenteId = userProfile.role === 'admin' ? form.agente_id : userProfile.id;
    const { profiles, created_at, updated_at, ...payload } = form;
    
    const clienteData = { 
      ...payload, 
      id: editingId || undefined,
      agente_id: finalAgenteId,
      provincia: form.provincia?.substring(0, 2).toUpperCase(),
      cap: form.cap?.substring(0, 5)
    };

    const { data, error } = await supabase.from('clienti').upsert(clienteData).select();
    
    if (error) {
      alert("Errore salvataggio: " + error.message);
    } else if (data && data.length > 0) {
      setView('list');
      fetchClienti();
    }
    setLoading(false);
  };

  const isPivaValida = form.sdi ? form.sdi.length === 11 : false; 
  const isIbanValido = form.iban ? form.iban.length >= 15 : false; 
  const canSave = !loading && (userProfile?.role !== 'admin' || form.agente_id !== '');

  const filteredClienti = clienti.filter(c => 
    c.ragione_sociale.toLowerCase().includes(filtri.ragione_sociale.toLowerCase()) &&
    c.sdi.toLowerCase().includes(filtri.sdi.toLowerCase()) &&
    c.localita.toLowerCase().includes(filtri.localita.toLowerCase()) &&
    c.provincia.toLowerCase().includes(filtri.provincia.toLowerCase()) &&
    (filtri.agente_id === '' || c.agente_id === filtri.agente_id)
  );

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Head><title>Anagrafica | Clienti</title></Head>
      <Navbar />

      <main className="flex-1 ml-64 p-10">
        {view === 'list' ? (
          <>
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Anagrafica Clienti</h1>
              <button onClick={handleNuovo} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-200 uppercase text-xs">
                <Plus size={18} /> Nuovo Cliente
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              {userProfile?.role === 'admin' && (
                <select className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold" value={filtri.agente_id} onChange={e => setFiltri({...filtri, agente_id: e.target.value})}>
                  <option value="">Tutti gli Agenti</option>
                  {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                </select>
              )}
              <input placeholder="Ragione Sociale" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.ragione_sociale} onChange={e => setFiltri({...filtri, ragione_sociale: e.target.value})} />
              <input placeholder="P.IVA" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.sdi} onChange={e => setFiltri({...filtri, sdi: e.target.value})} />
              <input placeholder="Località" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.localita} onChange={e => setFiltri({...filtri, localita: e.target.value})} />
              <input placeholder="PR" maxLength={2} className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm text-center" value={filtri.provincia} onChange={e => setFiltri({...filtri, provincia: e.target.value})} />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    {userProfile?.role === 'admin' && <th className="p-6">Agente</th>}
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
                        <td className="p-6 text-xs font-bold text-blue-600 uppercase">{c.profiles?.cognome} {c.profiles?.nome}</td>
                      )}
                      <td className="p-6 font-bold text-slate-800">{c.ragione_sociale}</td>
                      <td className="p-6 text-slate-500 font-bold">{c.sdi}</td>
                      <td className="p-6 text-slate-500 font-bold">{c.localita}</td>
                      <td className="p-6 text-slate-500 font-bold uppercase">{c.provincia}</td>
                      <td className="p-6 text-right">
                        <button onClick={() => handleEdit(c)} className="text-slate-300 hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <form onSubmit={salvaTutto} className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <button type="button" onClick={() => setView('list')} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-800 transition-colors">
                <ArrowLeft size={14} /> Torna all&apos;elenco
              </button>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{editingId ? 'Modifica Cliente' : 'Nuovo Cliente'}</h2>
            </div>

            {/* SEZIONE 1: IDENTITÀ E ASSEGNAZIONE */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <Building2 size={20} /> 1. Identità Societaria
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userProfile?.role === 'admin' && (
                  <div className="md:col-span-2 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <label className="text-[10px] font-black text-blue-400 uppercase ml-2">Assegna ad Agente</label>
                    <select required className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none font-bold text-blue-600 mt-1" value={form.agente_id} onChange={e => setForm({...form, agente_id: e.target.value})}>
                      <option value="">Seleziona l&apos;agente...</option>
                      {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Ragione Sociale</label>
                  <input required className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={form.ragione_sociale} onChange={e => setForm({...form, ragione_sociale: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Partita IVA</label>
                  <input required maxLength={11} className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.sdi} onChange={e => setForm({...form, sdi: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
            </div>

            {/* SEZIONE 2: ANAGRAFICA E SEDE */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <MapPin size={20} /> 2. Sede e Legale Rappresentante
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Via</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.via} onChange={e => setForm({...form, via: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Civico</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.civico} onChange={e => setForm({...form, civico: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Località</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.localita} onChange={e => setForm({...form, localita: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">PR (Sigla)</label>
                  <input maxLength={2} className="w-full p-4 bg-slate-50 rounded-2xl mt-1 text-center font-bold uppercase outline-none" value={form.provincia} onChange={e => setForm({...form, provincia: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">CAP</label>
                  <input maxLength={5} className="w-full p-4 bg-slate-50 rounded-2xl mt-1 text-center font-bold outline-none" value={form.cap} onChange={e => setForm({...form, cap: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Nome Rappr. Legale</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.rappresentante_nome} onChange={e => setForm({...form, rappresentante_nome: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Cognome Rappr. Legale</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.rappresentante_cognome} onChange={e => setForm({...form, rappresentante_cognome: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-blue-600 ml-2 uppercase">Codice Altuofianco</label>
                  <input className="w-full p-4 bg-blue-50 rounded-2xl mt-1 font-black outline-none border border-blue-100" value={form.codice_altuofianco} onChange={e => setForm({...form, codice_altuofianco: e.target.value})} />
                </div>
              </div>
            </div>

            {/* SEZIONE 3: DATI AMMINISTRATIVI */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-emerald-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <CreditCard size={20} /> 3. Dati Amministrativi e Pagamento
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">IBAN</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-mono font-bold outline-none uppercase" value={form.iban} onChange={e => setForm({...form, iban: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Banca</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.banca} onChange={e => setForm({...form, banca: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Intestatario Conto (Max 200)</label>
                  <input maxLength={200} className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.intestatario_conto} onChange={e => setForm({...form, intestatario_conto: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Tipo Intestatario</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.tipologia_intestatario} onChange={e => setForm({...form, tipologia_intestatario: e.target.value})}>
                    <option value="Partita IVA">Partita IVA</option>
                    <option value="Codice Fiscale">Codice Fiscale</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Debitore (Nome e Cognome)</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.debitore_nome_cognome} onChange={e => setForm({...form, debitore_nome_cognome: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Codice Fiscale Debitore</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none uppercase" value={form.debitore_cf} onChange={e => setForm({...form, debitore_cf: e.target.value.toUpperCase()})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-purple-600 ml-2 uppercase">Codice SDI</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none uppercase" value={form.sdi} onChange={e => setForm({...form, sdi: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-purple-600 ml-2 uppercase">PEC</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.pec} onChange={e => setForm({...form, pec: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" disabled={!canSave}
                className={`px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl ${canSave ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
              >
                {loading ? 'Salvataggio...' : <><Save size={20} /> Salva Tutto</>}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}