import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import { 
  Plus, Edit2, ArrowLeft, Save, Building2, 
  MapPin, CreditCard, Users, Trash2, X, Check
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

  // --- STATO PER LA MODAL REFERENTI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRef, setCurrentRef] = useState({ nome: '', cognome: '', email: '', telefono_fisso: '', cellulare: '' });
  const [refEditIndex, setRefEditIndex] = useState(null);

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
    const { data, error } = await supabase.from('clienti').select('*, profiles(nome, cognome)').order('ragione_sociale');
    if (error) console.error("Errore fetch:", error);
    else setClienti(data || []);
  }

  const handleEdit = async (cliente) => {
    setForm(cliente);
    setEditingId(cliente.id);
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

  // --- LOGICA MODAL REFERENTI ---
  const openModal = (index = null) => {
    if (index !== null) {
      setCurrentRef(referenti[index]);
      setRefEditIndex(index);
    } else {
      setCurrentRef({ nome: '', cognome: '', email: '', telefono_fisso: '', cellulare: '' });
      setRefEditIndex(null);
    }
    setIsModalOpen(true);
  };

  const salvaReferenteInLista = () => {
    if (refEditIndex !== null) {
      const nuoviRef = [...referenti];
      nuoviRef[refEditIndex] = currentRef;
      setReferenti(nuoviRef);
    } else {
      setReferenti([...referenti, currentRef]);
    }
    setIsModalOpen(false);
  };

  const rimuoviReferente = (index) => {
    setReferenti(referenti.filter((_, i) => i !== index));
  };

  // --- SALVATAGGIO FINALE ---
  const salvaTutto = async (e) => {
    e.preventDefault();
    setLoading(true);
    const finalAgenteId = userProfile.role === 'admin' ? form.agente_id : userProfile.id;
    const { profiles, created_at, updated_at, ...payload } = form;
    
    const clienteData = { ...payload, id: editingId || undefined, agente_id: finalAgenteId };

    const { data, error } = await supabase.from('clienti').upsert(clienteData).select();
    
    if (error) {
      alert("Errore salvataggio: " + error.message);
    } else if (data && data.length > 0) {
      const clienteId = data[0].id;
      await supabase.from('clienti_referenti').delete().eq('cliente_id', clienteId);
      if (referenti.length > 0) {
        const referentiDaSalvare = referenti.map(r => ({ ...r, cliente_id: clienteId, agente_id: finalAgenteId }));
        await supabase.from('clienti_referenti').insert(referentiDaSalvare);
      }
      setView('list');
      fetchClienti();
    }
    setLoading(false);
  };

  const filteredClienti = clienti.filter(c => 
    (c.ragione_sociale || "").toLowerCase().includes(filtri.ragione_sociale.toLowerCase()) &&
    (c.partita_iva || "").includes(filtri.partita_iva)
  );

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Head><title>Anagrafica | CRM</title></Head>
      <Navbar />

      <main className="flex-1 ml-64 p-10 relative">
        {view === 'list' ? (
          <>
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Anagrafica Clienti</h1>
              <button onClick={handleNuovo} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl uppercase text-xs transition-all">
                <Plus size={18} /> Nuovo Cliente
              </button>
            </div>

            {/* FILTRI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <input placeholder="Ragione Sociale" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.ragione_sociale} onChange={e => setFiltri({...filtri, ragione_sociale: e.target.value})} />
              <input placeholder="Partita IVA" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.partita_iva} onChange={e => setFiltri({...filtri, partita_iva: e.target.value})} />
              <input placeholder="Località" className="p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={filtri.localita} onChange={e => setFiltri({...filtri, localita: e.target.value})} />
              {userProfile?.role === 'admin' && (
                <select className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold" value={filtri.agente_id} onChange={e => setFiltri({...filtri, agente_id: e.target.value})}>
                  <option value="">Tutti gli Agenti</option>
                  {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                </select>
              )}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <tr>
                    <th className="p-6">Cliente</th>
                    <th className="p-6">Partita IVA</th>
                    <th className="p-6">Località</th>
                    <th className="p-6 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClienti.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 font-black text-slate-800 uppercase">{c.ragione_sociale}</td>
                      <td className="p-6 text-slate-500 font-bold">{c.partita_iva}</td>
                      <td className="p-6 text-slate-500 font-bold uppercase">{c.localita}</td>
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
            <div className="flex justify-between items-center">
              <button type="button" onClick={() => setView('list')} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-800 transition-all">
                <ArrowLeft size={14} /> Annulla
              </button>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{editingId ? 'Modifica' : 'Nuovo'} Cliente</h2>
            </div>

            {/* SEZIONE 1 & 2: DATI E INDIRIZZO (INVARIATI) */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
               <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <Building2 size={20} /> 1. Dati Legali
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input required placeholder="Ragione Sociale" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ragione_sociale} onChange={e => setForm({...form, ragione_sociale: e.target.value})} />
                <input required placeholder="Partita IVA" maxLength={11} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.partita_iva} onChange={e => setForm({...form, partita_iva: e.target.value.replace(/\D/g, '')})} />
              </div>
            </section>

            {/* SEZIONE 3: REFERENTI (MODAL) */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-widest">
                  <Users size={20} /> 3. Referenti Aziendali
                </div>
                <button type="button" onClick={() => openModal()} className="text-[10px] bg-indigo-600 text-white px-4 py-2 rounded-xl font-black uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                  + Nuovo Referente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referenti.map((r, index) => (
                  <div key={index} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                    <div>
                      <p className="font-black text-slate-800 uppercase text-sm">{r.nome} {r.cognome}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{r.email || 'Nessuna Email'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openModal(index)} className="p-2 bg-white text-blue-600 rounded-full shadow-sm hover:scale-110 transition-transform">
                        <Edit2 size={14} />
                      </button>
                      <button type="button" onClick={() => rimuoviReferente(index)} className="p-2 bg-white text-red-500 rounded-full shadow-sm hover:scale-110 transition-transform">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SEZIONE 4: AMMINISTRAZIONE (INVARIATA) */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-emerald-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <CreditCard size={20} /> 4. Amministrazione
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Codice SDI" maxLength={7} className="p-4 bg-slate-50 rounded-2xl font-black outline-none uppercase" value={form.sdi} onChange={e => setForm({...form, sdi: e.target.value.toUpperCase()})} />
                <input placeholder="PEC" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.pec} onChange={e => setForm({...form, pec: e.target.value})} />
              </div>
            </section>

            <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all active:scale-95">
              {loading ? 'Salvataggio...' : 'Salva Scheda Cliente'}
            </button>
          </form>
        )}

        {/* MODAL REFERENTE */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-8 space-y-6 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xl">Dati Referente</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Nome</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={currentRef.nome} onChange={e => setCurrentRef({...currentRef, nome: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Cognome</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={currentRef.cognome} onChange={e => setCurrentRef({...currentRef, cognome: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Email</label>
                <input type="email" className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={currentRef.email} onChange={e => setCurrentRef({...currentRef, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Tel. Fisso</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={currentRef.telefono_fisso} onChange={e => setCurrentRef({...currentRef, telefono_fisso: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Cellulare</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none" value={currentRef.cellulare} onChange={e => setCurrentRef({...currentRef, cellulare: e.target.value})} />
                </div>
              </div>
              <button onClick={salvaReferenteInLista} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-lg hover:bg-indigo-700 transition-all">
                Conferma Referente
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}