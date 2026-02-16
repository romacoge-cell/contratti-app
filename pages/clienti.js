import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import { validaPIVA, validaIBAN } from '../utils/validators';
import { 
  Plus, Edit2, ArrowLeft, Save, Building2, 
  Landmark, User, AlertCircle, MapPin, CreditCard, 
  Users, Trash2, Mail, Phone
} from 'lucide-react';

export default function GestioneClienti() {
  const [clienti, setClienti] = useState([]);
  const [agenti, setAgenti] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  
  const [filtri, setFiltri] = useState({ ragione_sociale: '', partita_iva: '', localita: '', provincia: '', agente_id: '' });

  const initialForm = {
    ragione_sociale: '', partita_iva: '', via: '', civico: '', localita: '', provincia: '', cap: '',
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
    // Recuperiamo i referenti per questo cliente
    const { data: refData } = await supabase.from('clienti_referenti').select('*').eq('cliente_id', cliente.id);
    setReferenti(refData || []);
    setView('form');
  };

  const handleNuovo = () => {
    setForm({ ...initialForm, agente_id: userProfile?.role === 'admin' ? '' : userProfile?.id });
    setReferenti([]);
    setEditingId(null);
    setView('form');
  };

  // --- GESTIONE REFERENTI LOCALE ---
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

  const salvaTutto = async (e) => {
    e.preventDefault();
    setLoading(true);

    const finalAgenteId = userProfile.role === 'admin' ? form.agente_id : userProfile.id;
    const { profiles, created_at, updated_at, ...payload } = form;
    
    const clienteData = { 
      ...payload, 
      id: editingId || undefined,
      agente_id: finalAgenteId
    };

    const { data, error } = await supabase.from('clienti').upsert(clienteData).select();
    
    if (error) {
      alert("Errore salvataggio cliente: " + error.message);
    } else if (data && data.length > 0) {
      const clienteId = data[0].id;
      
      // Eliminiamo i vecchi referenti e inseriamo i nuovi per semplicità di sincronizzazione
      await supabase.from('clienti_referenti').delete().eq('cliente_id', clienteId);
      
      if (referenti.length > 0) {
        const referentiDaSalvare = referenti.map(r => ({
          ...r,
          cliente_id: clienteId,
          agente_id: finalAgenteId
        }));
        await supabase.from('clienti_referenti').insert(referentiDaSalvare);
      }
      
      setView('list');
      fetchClienti();
    }
    setLoading(false);
  };

  const filteredClienti = clienti.filter(c => 
    c.ragione_sociale?.toLowerCase().includes(filtri.ragione_sociale.toLowerCase()) &&
    c.partita_iva?.includes(filtri.partita_iva) &&
    c.localita?.toLowerCase().includes(filtri.localita.toLowerCase()) &&
    (filtri.agente_id === '' || c.agente_id === filtri.agente_id)
  );

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Head><title>CRM | Gestione Clienti</title></Head>
      <Navbar />

      <main className="flex-1 ml-64 p-10">
        {view === 'list' ? (
          <>
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Anagrafica Clienti</h1>
              <button onClick={handleNuovo} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl uppercase text-xs transition-all">
                <Plus size={18} /> Nuovo Cliente
              </button>
            </div>

            {/* FILTRI */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              {userProfile?.role === 'admin' && (
                <select className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold" value={filtri.agente_id} onChange={e => setFiltri({...filtri, agente_id: e.target.value})}>
                  <option value="">Tutti gli Agenti</option>
                  {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                </select>
              )}
              <input placeholder="Ragione Sociale" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.ragione_sociale} onChange={e => setFiltri({...filtri, ragione_sociale: e.target.value})} />
              <input placeholder="Partita IVA" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.partita_iva} onChange={e => setFiltri({...filtri, partita_iva: e.target.value})} />
              <input placeholder="Località" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.localita} onChange={e => setFiltri({...filtri, localita: e.target.value})} />
              <input placeholder="PR" maxLength={2} className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm text-center uppercase" value={filtri.provincia} onChange={e => setFiltri({...filtri, provincia: e.target.value})} />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <tr>
                    {userProfile?.role === 'admin' && <th className="p-6">Agente</th>}
                    <th className="p-6">Cliente</th>
                    <th className="p-6">Partita IVA</th>
                    <th className="p-6">Località</th>
                    <th className="p-6 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClienti.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      {userProfile?.role === 'admin' && (
                        <td className="p-6 text-xs font-bold text-blue-600 uppercase">{c.profiles?.cognome} {c.profiles?.nome}</td>
                      )}
                      <td className="p-6"><span className="font-black text-slate-800 uppercase">{c.ragione_sociale}</span></td>
                      <td className="p-6 text-slate-500 font-bold">{c.partita_iva}</td>
                      <td className="p-6 text-slate-500 font-bold uppercase">{c.localita} ({c.provincia})</td>
                      <td className="p-6 text-right">
                        <button onClick={() => handleEdit(c)} className="p-2 text-slate-300 hover:text-blue-600 transition-all"><Edit2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <form onSubmit={salvaTutto} className="max-w-5xl mx-auto pb-20 space-y-8">
            {/* Header Form */}
            <div className="flex justify-between items-center">
              <button type="button" onClick={() => setView('list')} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-800 transition-all">
                <ArrowLeft size={14} /> Annulla e torna alla lista
              </button>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{editingId ? 'Modifica Scheda Cliente' : 'Creazione Nuovo Cliente'}</h2>
            </div>

            {/* SEZIONE 1: IDENTITÀ & AGENTE */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <Building2 size={20} /> 1. Dati Legali
              </div>
              {userProfile?.role === 'admin' && (
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-2">Agente Assegnato</label>
                  <select required className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none font-bold text-blue-600 mt-1" value={form.agente_id} onChange={e => setForm({...form, agente_id: e.target.value})}>
                    <option value="">Seleziona...</option>
                    {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Ragione Sociale</label>
                  <input required className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.ragione_sociale} onChange={e => setForm({...form, ragione_sociale: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Partita IVA</label>
                  <input required maxLength={11} className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={form.partita_iva} onChange={e => setForm({...form, partita_iva: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
            </section>

            {/* SEZIONE 2: ANAGRAFICA SEDE */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <MapPin size={20} /> 2. Sede Legale & Rappresentante
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Indirizzo (Via/Piazza)</label>
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
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Provincia (PR)</label>
                  <input maxLength={2} className="w-full p-4 bg-slate-50 rounded-2xl mt-1 text-center font-bold uppercase outline-none" value={form.provincia} onChange={e => setForm({...form, provincia: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">CAP</label>
                  <input maxLength={5} className="w-full p-4 bg-slate-50 rounded-2xl mt-1 text-center font-bold outline-none" value={form.cap} onChange={e => setForm({...form, cap: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                <input placeholder="Nome Legale" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.rappresentante_nome} onChange={e => setForm({...form, rappresentante_nome: e.target.value})} />
                <input placeholder="Cognome Legale" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.rappresentante_cognome} onChange={e => setForm({...form, rappresentante_cognome: e.target.value})} />
                <input placeholder="Codice Altuofianco" className="p-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-black outline-none" value={form.codice_altuofianco} onChange={e => setForm({...form, codice_altuofianco: e.target.value})} />
              </div>
            </section>

            {/* SEZIONE 3: REFERENTI (RIPRISTINATA) */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-widest">
                  <Users size={20} /> 3. Contatti e Referenti
                </div>
                <button type="button" onClick={aggiungiReferente} className="text-[10px] bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black uppercase hover:bg-indigo-100 transition-all">
                  + Aggiungi Referente
                </button>
              </div>
              
              <div className="space-y-4">
                {referenti.map((r, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-2xl relative group">
                    <input placeholder="Nome" className="p-3 bg-white rounded-xl text-sm font-bold outline-none" value={r.nome} onChange={e => updateReferente(index, 'nome', e.target.value)} />
                    <input placeholder="Ruolo" className="p-3 bg-white rounded-xl text-sm font-bold outline-none" value={r.ruolo} onChange={e => updateReferente(index, 'ruolo', e.target.value)} />
                    <input placeholder="Email" className="p-3 bg-white rounded-xl text-sm font-bold outline-none" value={r.email} onChange={e => updateReferente(index, 'email', e.target.value)} />
                    <input placeholder="Cellulare" className="p-3 bg-white rounded-xl text-sm font-bold outline-none" value={r.cellulare} onChange={e => updateReferente(index, 'cellulare', e.target.value)} />
                    <button type="button" onClick={() => rimuoviReferente(index)} className="flex items-center justify-center text-red-400 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {referenti.length === 0 && <p className="text-center text-slate-300 text-xs font-bold uppercase py-4">Nessun referente inserito</p>}
              </div>
            </section>

            {/* SEZIONE 4: DATI AMMINISTRATIVI */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-emerald-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <CreditCard size={20} /> 4. Amministrazione & SDI
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="IBAN" className="p-4 bg-slate-50 rounded-2xl font-mono font-bold outline-none col-span-2 uppercase" value={form.iban} onChange={e => setForm({...form, iban: e.target.value.toUpperCase()})} />
                <input placeholder="Banca" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.banca} onChange={e => setForm({...form, banca: e.target.value})} />
                <input placeholder="Intestatario Conto" maxLength={200} className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.intestatario_conto} onChange={e => setForm({...form, intestatario_conto: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Codice SDI (7 Caratteri)" maxLength={7} className="p-4 bg-purple-50 text-purple-700 border border-purple-100 rounded-2xl font-black outline-none uppercase" value={form.sdi} onChange={e => setForm({...form, sdi: e.target.value.toUpperCase()})} />
                <input placeholder="PEC" className="p-4 bg-purple-50 text-purple-700 border border-purple-100 rounded-2xl font-bold outline-none" value={form.pec} onChange={e => setForm({...form, pec: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                 <select className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.tipologia_intestatario} onChange={e => setForm({...form, tipologia_intestatario: e.target.value})}>
                    <option value="Partita IVA">Tipo: Partita IVA</option>
                    <option value="Codice Fiscale">Tipo: Codice Fiscale</option>
                 </select>
                 <input placeholder="Nome/Cognome Debitore" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.debitore_nome_cognome} onChange={e => setForm({...form, debitore_nome_cognome: e.target.value})} />
                 <input placeholder="C.F. Debitore" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none uppercase" value={form.debitore_cf} onChange={e => setForm({...form, debitore_cf: e.target.value.toUpperCase()})} />
              </div>
            </section>

            {/* Pulsante Salva */}
            <div className="flex justify-end pt-6">
              <button 
                type="submit" disabled={loading}
                className="bg-blue-600 text-white px-16 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Salvataggio in corso...' : <><Save size={24} /> Salva Scheda Cliente Completa</>}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}