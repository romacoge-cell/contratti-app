import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import { validaPIVA, validaIBAN } from '../utils/validators';
import { 
  Plus, Edit2, ArrowLeft, Save, Building2, 
  Landmark, User, AlertCircle, MapPin, CreditCard, 
  Users, Trash2, Mail, Phone, Search
} from 'lucide-react';

export default function GestioneClienti() {
  const [clienti, setClienti] = useState([]);
  const [agenti, setAgenti] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  
  // Filtri iniziali
  const [filtri, setFiltri] = useState({ 
    ragione_sociale: '', 
    partita_iva: '', 
    localita: '', 
    provincia: '', 
    agente_id: '' 
  });

  const initialForm = {
    ragione_sociale: '',
    partita_iva: '',
    via: '',
    civico: '',
    localita: '',
    provincia: '',
    cap: '',
    rappresentante_nome: '',
    rappresentante_cognome: '',
    codice_altuofianco: '',
    iban: '',
    banca: '',
    intestatario_conto: '',
    tipologia_intestatario: 'Partita IVA',
    debitore_nome_cognome: '',
    debitore_cf: '',
    sdi: '',
    pec: '',
    agente_id: ''
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
    setLoading(true);
    const { data, error } = await supabase
      .from('clienti')
      .select('*, profiles(nome, cognome)')
      .order('ragione_sociale');
    
    if (error) console.error("Errore fetch:", error);
    else setClienti(data || []);
    setLoading(false);
  }

  const handleEdit = async (cliente) => {
    setForm(cliente);
    setEditingId(cliente.id);
    // Recupero referenti dal DB
    const { data: refData } = await supabase
      .from('clienti_referenti')
      .select('*')
      .eq('cliente_id', cliente.id);
    setReferenti(refData || []);
    setView('form');
  };

  const handleNuovo = () => {
    setForm({ ...initialForm, agente_id: userProfile?.role === 'admin' ? '' : userProfile?.id });
    setReferenti([]);
    setEditingId(null);
    setView('form');
  };

  // --- LOGICA REFERENTI ---
  const aggiungiReferente = () => {
    setReferenti([...referenti, { nome: '', ruolo: '', email: '', cellulare: '' }]);
  };

  const rimuoviReferente = (index) => {
    setReferenti(referenti.filter((_, i) => i !== index));
  };

  const updateReferente = (index, field, value) => {
    const nuoviRef = [...referenti];
    nuoviRef[index][field] = value;
    setReferenti(nuoviRef);
  };

  // --- SALVATAGGIO ---
  const salvaTutto = async (e) => {
    e.preventDefault();
    setLoading(true);

    const finalAgenteId = userProfile.role === 'admin' ? form.agente_id : userProfile.id;
    const { profiles, created_at, updated_at, ...payload } = form;
    
    const clienteData = { 
      ...payload, 
      id: editingId || undefined,
      agente_id: finalAgenteId,
      provincia: form.provincia?.toUpperCase().substring(0, 2),
      cap: form.cap?.replace(/\D/g, '').substring(0, 5)
    };

    const { data, error } = await supabase.from('clienti').upsert(clienteData).select();
    
    if (error) {
      alert("Errore salvataggio cliente: " + error.message);
    } else if (data && data.length > 0) {
      const clienteId = data[0].id;
      
      // Sincronizzazione Referenti (Delete + Insert)
      await supabase.from('clienti_referenti').delete().eq('cliente_id', clienteId);
      
      if (referenti.length > 0) {
        const referentiDaSalvare = referenti.map(r => ({
          ...r,
          cliente_id: clienteId,
          agente_id: finalAgenteId
        }));
        const { error: refError } = await supabase.from('clienti_referenti').insert(referentiDaSalvare);
        if (refError) console.error("Errore salvataggio referenti:", refError);
      }
      
      setView('list');
      fetchClienti();
    }
    setLoading(false);
  };

  // --- FILTRAGGIO SICURO (Evita crash se campi sono null) ---
  const filteredClienti = clienti.filter(c => {
    const ragioneSociale = (c.ragione_sociale || "").toLowerCase();
    const piva = (c.partita_iva || "").toLowerCase();
    const localita = (c.localita || "").toLowerCase();
    const provincia = (c.provincia || "").toLowerCase();

    return (
      ragioneSociale.includes(filtri.ragione_sociale.toLowerCase()) &&
      piva.includes(filtri.partita_iva.toLowerCase()) &&
      localita.includes(filtri.localita.toLowerCase()) &&
      provincia.includes(filtri.provincia.toLowerCase()) &&
      (filtri.agente_id === '' || c.agente_id === filtri.agente_id)
    );
  });

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Head><title>Anagrafica | CRM</title></Head>
      <Navbar />

      <main className="flex-1 ml-64 p-10">
        {view === 'list' ? (
          <>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Anagrafica Clienti</h1>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Gestione database aziendale</p>
              </div>
              <button onClick={handleNuovo} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 uppercase text-xs transition-all active:scale-95">
                <Plus size={18} /> Nuovo Cliente
              </button>
            </div>

            {/* FILTRI */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              {userProfile?.role === 'admin' && (
                <select className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold text-blue-600" value={filtri.agente_id} onChange={e => setFiltri({...filtri, agente_id: e.target.value})}>
                  <option value="">Tutti gli Agenti</option>
                  {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                </select>
              )}
              <input placeholder="Ragione Sociale" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.ragione_sociale} onChange={e => setFiltri({...filtri, ragione_sociale: e.target.value})} />
              <input placeholder="P.IVA" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.partita_iva} onChange={e => setFiltri({...filtri, partita_iva: e.target.value})} />
              <input placeholder="Località" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.localita} onChange={e => setFiltri({...filtri, localita: e.target.value})} />
              <input placeholder="PR" maxLength={2} className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm text-center uppercase" value={filtri.provincia} onChange={e => setFiltri({...filtri, provincia: e.target.value})} />
            </div>

            {/* TABELLA */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <tr>
                    {userProfile?.role === 'admin' && <th className="p-6">Agente</th>}
                    <th className="p-6">Ragione Sociale</th>
                    <th className="p-6">Partita IVA</th>
                    <th className="p-6">Località</th>
                    <th className="p-6 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClienti.length > 0 ? (
                    filteredClienti.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                        {userProfile?.role === 'admin' && (
                          <td className="p-6 text-xs font-bold text-blue-600 uppercase">{c.profiles?.cognome} {c.profiles?.nome}</td>
                        )}
                        <td className="p-6 font-black text-slate-800 uppercase">{c.ragione_sociale}</td>
                        <td className="p-6 text-slate-500 font-bold">{c.partita_iva || '---'}</td>
                        <td className="p-6 text-slate-500 font-bold uppercase">{c.localita || '---'} ({c.provincia || '--'})</td>
                        <td className="p-6 text-right">
                          <button onClick={() => handleEdit(c)} className="p-2 text-slate-300 hover:text-blue-600 transition-all">
                            <Edit2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest">
                        {loading ? 'Caricamento in corso...' : 'Nessun cliente in archivio'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <form onSubmit={salvaTutto} className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <button type="button" onClick={() => setView('list')} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-800 transition-all">
                <ArrowLeft size={14} /> Torna alla lista
              </button>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                {editingId ? 'Modifica Cliente' : 'Nuova Anagrafica'}
              </h2>
            </div>

            {/* 1. DATI LEGALI */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <Building2 size={20} /> 1. Dati Identificativi
              </div>
              {userProfile?.role === 'admin' && (
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-2">Assegna a un Agente</label>
                  <select required className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none font-bold text-blue-600 mt-1" value={form.agente_id} onChange={e => setForm({...form, agente_id: e.target.value})}>
                    <option value="">Seleziona Agente...</option>
                    {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Ragione Sociale</label>
                  <input required className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" value={form.ragione_sociale} onChange={e => setForm({...form, ragione_sociale: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Partita IVA</label>
                  <input required maxLength={11} className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.partita_iva} onChange={e => setForm({...form, partita_iva: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
            </section>

            {/* 2. SEDE E RECAPITI */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <MapPin size={20} /> 2. Indirizzo Sede Legale
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Via / Piazza</label>
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
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Provincia (Sigla)</label>
                  <input maxLength={2} className="w-full p-4 bg-slate-50 rounded-2xl mt-1 text-center font-bold uppercase outline-none" value={form.provincia} onChange={e => setForm({...form, provincia: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">CAP</label>
                  <input maxLength={5} className="w-full p-4 bg-slate-50 rounded-2xl mt-1 text-center font-bold outline-none" value={form.cap} onChange={e => setForm({...form, cap: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                <input placeholder="Nome Legale Rappr." className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.rappresentante_nome} onChange={e => setForm({...form, rappresentante_nome: e.target.value})} />
                <input placeholder="Cognome Legale Rappr." className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.rappresentante_cognome} onChange={e => setForm({...form, rappresentante_cognome: e.target.value})} />
                <input placeholder="Codice Altuofianco" className="p-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-black outline-none" value={form.codice_altuofianco} onChange={e => setForm({...form, codice_altuofianco: e.target.value})} />
              </div>
            </section>

            {/* 3. REFERENTI DYN */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-widest">
                  <Users size={20} /> 3. Contatti e Referenti
                </div>
                <button type="button" onClick={aggiungiReferente} className="text-[10px] bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black uppercase hover:bg-indigo-100 transition-all">
                  + Aggiungi Contatto
                </button>
              </div>
              
              <div className="space-y-3">
                {referenti.map((r, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-2xl relative">
                    <input placeholder="Nome e Cognome" className="p-3 bg-white rounded-xl text-sm font-bold outline-none" value={r.nome} onChange={e => updateReferente(index, 'nome', e.target.value)} />
                    <input placeholder="Qualifica/Ruolo" className="p-3 bg-white rounded-xl text-sm font-bold outline-none" value={r.ruolo} onChange={e => updateReferente(index, 'ruolo', e.target.value)} />
                    <input placeholder="Email" className="p-3 bg-white rounded-xl text-sm font-bold outline-none" value={r.email} onChange={e => updateReferente(index, 'email', e.target.value)} />
                    <input placeholder="Telefono/Cell" className="p-3 bg-white rounded-xl text-sm font-bold outline-none" value={r.cellulare} onChange={e => updateReferente(index, 'cellulare', e.target.value)} />
                    <button type="button" onClick={() => rimuoviReferente(index)} className="flex items-center justify-center text-red-300 hover:text-red-500 transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                {referenti.length === 0 && (
                  <div className="text-center py-6 text-slate-300 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-100 rounded-2xl">
                    Nessun referente associato
                  </div>
                )}
              </div>
            </section>

            {/* 4. DATI BANCARI E SDI */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-emerald-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <CreditCard size={20} /> 4. Amministrazione e Fatturazione
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">IBAN</label>
                  <input placeholder="IT..." className="w-full p-4 bg-slate-50 rounded-2xl font-mono font-bold outline-none uppercase border-2 border-transparent focus:border-emerald-500" value={form.iban} onChange={e => setForm({...form, iban: e.target.value.toUpperCase()})} />
                </div>
                <input placeholder="Nome Banca" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.banca} onChange={e => setForm({...form, banca: e.target.value})} />
                <input placeholder="Intestatario del Conto" maxLength={200} className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.intestatario_conto} onChange={e => setForm({...form, intestatario_conto: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div>
                  <label className="text-[10px] font-black text-purple-600 ml-2 uppercase">Codice Destinatario SDI (7 char)</label>
                  <input maxLength={7} className="w-full p-4 bg-purple-50 text-purple-700 border border-purple-100 rounded-2xl font-black outline-none uppercase" value={form.sdi} onChange={e => setForm({...form, sdi: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-purple-600 ml-2 uppercase tracking-widest">Email PEC</label>
                  <input className="w-full p-4 bg-purple-50 text-purple-700 border border-purple-100 rounded-2xl font-bold outline-none" value={form.pec} onChange={e => setForm({...form, pec: e.target.value.toLowerCase()})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                 <select className="p-4 bg-slate-100 rounded-2xl font-bold outline-none text-slate-600" value={form.tipologia_intestatario} onChange={e => setForm({...form, tipologia_intestatario: e.target.value})}>
                    <option value="Partita IVA">Addebito su: P.IVA</option>
                    <option value="Codice Fiscale">Addebito su: C.F.</option>
                 </select>
                 <input placeholder="Nome/Cognome Debitore" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none text-sm" value={form.debitore_nome_cognome} onChange={e => setForm({...form, debitore_nome_cognome: e.target.value})} />
                 <input placeholder="Codice Fiscale Debitore" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none uppercase text-sm" value={form.debitore_cf} onChange={e => setForm({...form, debitore_cf: e.target.value.toUpperCase()})} />
              </div>
            </section>

            {/* SALVA */}
            <div className="flex justify-end pt-6">
              <button 
                type="submit" disabled={loading}
                className="bg-blue-600 text-white px-20 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-4 disabled:opacity-50 active:scale-95"
              >
                {loading ? 'Sincronizzazione...' : <><Save size={24} /> Conferma e Salva</>}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}