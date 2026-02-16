import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import { validaPIVA, validaIBAN } from '../utils/validators';
import { 
  Plus, Edit2, ArrowLeft, Save, Building2, 
  MapPin, CreditCard, Users, Trash2, X
} from 'lucide-react';

export default function GestioneClienti() {
  const [clienti, setClienti] = useState([]);
  const [agenti, setAgenti] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  
  const [filtri, setFiltri] = useState({ 
    ragione_sociale: '', partita_iva: '', localita: '', provincia: '', agente_id: '' 
  });

  const initialForm = {
    ragione_sociale: '', partita_iva: '', via: '', civico: '', localita: '', provincia: '', cap: '',
    rappresentante_nome: '', rappresentante_cognome: '', codice_altuofianco: '',
    iban: '', banca: '', intestatario_conto: '', tipologia_intestatario: 'Partita IVA',
    debitore_nome_cognome: '', debitore_cf: '', sdi: '', pec: '', agente_id: ''
  };

  const [form, setForm] = useState(initialForm);
  const [referenti, setReferenti] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // --- VALIDATORI IN TEMPO REALE ---
  const isPivaValid = form.partita_iva === '' || validaPIVA(form.partita_iva);
  const isIbanValid = form.iban === '' || validaIBAN(form.iban);
  const canSave = isPivaValid && isIbanValid;

  // --- STATO MODAL REFERENTI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refEditIndex, setRefEditIndex] = useState(null);
  const [currentRef, setCurrentRef] = useState({
    nome: '', cognome: '', email: '', telefono_fisso: '', telefono_cellulare: ''
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
    const { data: refData } = await supabase
      .from('clienti_referenti')
      .select('nome, cognome, email, telefono_fisso, telefono_cellulare')
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

  const openModalReferente = (index = null) => {
    if (index !== null) {
      setCurrentRef(referenti[index]);
      setRefEditIndex(index);
    } else {
      setCurrentRef({ nome: '', cognome: '', email: '', telefono_fisso: '', telefono_cellulare: '' });
      setRefEditIndex(null);
    }
    setIsModalOpen(true);
  };

  const salvaReferenteModal = () => {
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

const salvaTutto = async (e) => {
    e.preventDefault();
    
    // 1. Protezione: se i validatori (PIVA/IBAN) falliscono, interrompiamo subito
    if (!canSave) {
      alert("Controlla i campi evidenziati in rosso (Partita IVA o IBAN non validi).");
      return;
    }

    setLoading(true);

    try {
      // 2. Determiniamo l'agente_id corretto (se admin usa quello del form, se agente usa il proprio profilo)
      // Usiamo una fallback null se la stringa è vuota per evitare errori su campi UUID
      const finalAgenteId = (userProfile.role === 'admin' ? form.agente_id : userProfile.id) || null;

      // 3. Pulizia payload: separiamo i campi di sola lettura (derivati da join) dai dati puri
      const { profiles, created_at, updated_at, ...payload } = form;
      
      const clienteData = { 
        ...payload, 
        id: editingId || undefined, // Se editingId è null, Supabase crea un nuovo record
        agente_id: finalAgenteId,
        provincia: form.provincia?.toUpperCase().substring(0, 2),
        cap: form.cap?.replace(/\D/g, '').substring(0, 5)
      };

      // 4. Upsert del Cliente
      const { data: clienteSalvato, error: errorCliente } = await supabase
        .from('clienti')
        .upsert(clienteData)
        .select();
      
      if (errorCliente) throw new Error(`Errore Cliente: ${errorCliente.message}`);

      if (clienteSalvato && clienteSalvato.length > 0) {
        const clienteId = clienteSalvato[0].id;

        // 5. Gestione Referenti: Pulizia preventiva (Delete)
        // Nota: se ottieni 403 qui, serve una policy DELETE su Supabase
        const { error: errorDelete } = await supabase
          .from('clienti_referenti')
          .delete()
          .eq('cliente_id', clienteId);
        
        if (errorDelete) console.warn("Nota: Impossibile pulire referenti precedenti:", errorDelete.message);

        // 6. Inserimento nuovi Referenti
        if (referenti.length > 0) {
          const referentiDaSalvare = referenti.map(r => ({
            nome: r.nome || '',
            cognome: r.cognome || '',
            email: r.email || '',
            telefono_fisso: r.telefono_fisso || '',
            telefono_cellulare: r.telefono_cellulare || '', // Nome campo corretto
            cliente_id: clienteId,
            agente_id: finalAgenteId
          }));

          const { error: errorInsertRef } = await supabase
            .from('clienti_referenti')
            .insert(referentiDaSalvare);

          if (errorInsertRef) {
            // Se fallisce qui con 403, il problema è la policy INSERT
            throw new Error(`Errore Referenti (403/Forbidden): ${errorInsertRef.message}`);
          }
        }

        // Successo: torna alla lista e rinfresca i dati
        setView('list');
        fetchClienti();
      }
    } catch (err) {
      console.error("Errore durante il salvataggio:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      <main className="flex-1 ml-64 p-10 relative">
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
                          <button onClick={() => handleEdit(c)} className="p-2 text-slate-300 hover:text-blue-600 transition-all"><Edit2 size={18} /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest">{loading ? 'Caricamento...' : 'Nessun cliente'}</td></tr>
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
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{editingId ? 'Modifica Cliente' : 'Nuova Anagrafica'}</h2>
            </div>

            {/* 1. DATI IDENTIFICATIVI - VALIDAZIONE PIVA */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <Building2 size={20} /> 1. Dati Identificativi
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input required placeholder="Ragione Sociale" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500" value={form.ragione_sociale} onChange={e => setForm({...form, ragione_sociale: e.target.value})} />
                <div className="relative">
                  <input 
                    required 
                    placeholder="Partita IVA" 
                    maxLength={11} 
                    className={`w-full p-4 rounded-2xl font-bold outline-none border-2 transition-all ${!isPivaValid ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:border-blue-500'}`}
                    value={form.partita_iva} 
                    onChange={e => setForm({...form, partita_iva: e.target.value.replace(/\D/g, '')})} 
                  />
                  {!isPivaValid && <p className="text-[9px] text-red-500 font-black uppercase mt-1 ml-2">P.IVA non valida</p>}
                </div>
              </div>
            </section>

            {/* 2. INDIRIZZO (Invariato) */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <MapPin size={20} /> 2. Indirizzo Sede Legale
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input className="md:col-span-3 p-4 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="Via / Piazza" value={form.via} onChange={e => setForm({...form, via: e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="Civico" value={form.civico} onChange={e => setForm({...form, civico: e.target.value})} />
                <input className="md:col-span-2 p-4 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="Località" value={form.localita} onChange={e => setForm({...form, localita: e.target.value})} />
                <input maxLength={2} className="p-4 bg-slate-50 rounded-2xl text-center font-bold uppercase outline-none" placeholder="PR" value={form.provincia} onChange={e => setForm({...form, provincia: e.target.value.toUpperCase()})} />
                <input maxLength={5} className="p-4 bg-slate-50 rounded-2xl text-center font-bold outline-none" placeholder="CAP" value={form.cap} onChange={e => setForm({...form, cap: e.target.value.replace(/\D/g, '')})} />
              </div>
            </section>

            {/* 3. REFERENTI (Invariato) */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-widest">
                  <Users size={20} /> 3. Contatti e Referenti
                </div>
                <button type="button" onClick={() => openModalReferente()} className="text-[10px] bg-indigo-600 text-white px-4 py-2 rounded-xl font-black uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                  + Nuovo Referente
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referenti.map((r, index) => (
                  <div key={index} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-xs uppercase">{r.nome?.[0]}{r.cognome?.[0]}</div>
                        <div>
                            <p className="font-black text-slate-800 uppercase text-sm">{r.nome} {r.cognome}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{r.email || 'Nessuna Email'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openModalReferente(index)} className="p-2 bg-white text-blue-600 rounded-full shadow-sm hover:scale-110 transition-transform"><Edit2 size={14} /></button>
                      <button type="button" onClick={() => rimuoviReferente(index)} className="p-2 bg-white text-red-500 rounded-full shadow-sm hover:scale-110 transition-transform"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. AMMINISTRAZIONE - VALIDAZIONE IBAN */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-emerald-600 font-black uppercase text-xs tracking-widest border-b pb-4">
                <CreditCard size={20} /> 4. Amministrazione e Fatturazione
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <input 
                    placeholder="IBAN" 
                    className={`w-full p-4 rounded-2xl font-mono font-bold outline-none uppercase border-2 transition-all ${!isIbanValid ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:border-blue-500'}`}
                    value={form.iban} 
                    onChange={e => setForm({...form, iban: e.target.value.toUpperCase().replace(/\s/g, '')})} 
                  />
                  {!isIbanValid && <p className="text-[9px] text-red-500 font-black uppercase mt-1 ml-2">IBAN non valido</p>}
                </div>
                <input placeholder="Codice SDI" maxLength={7} className="p-4 bg-purple-50 text-purple-700 border border-purple-100 rounded-2xl font-black outline-none uppercase" value={form.sdi} onChange={e => setForm({...form, sdi: e.target.value.toUpperCase()})} />
                <input placeholder="PEC" className="p-4 bg-purple-50 text-purple-700 border border-purple-100 rounded-2xl font-bold outline-none" value={form.pec} onChange={e => setForm({...form, pec: e.target.value.toLowerCase()})} />
              </div>
            </section>

            <div className="flex justify-end pt-6">
              <button 
                type="submit" 
                disabled={loading || !canSave} 
                className={`px-20 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-4 active:scale-95 ${!canSave ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {loading ? 'Salvataggio...' : <><Save size={24} /> Conferma e Salva</>}
              </button>
            </div>
          </form>
        )}

        {/* --- MODAL REFERENTE (Invariata) --- */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center border-b pb-6">
                <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xl">Dati Referente</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Nome</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none focus:border-indigo-500 border-2 border-transparent transition-all" value={currentRef.nome} onChange={e => setCurrentRef({...currentRef, nome: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Cognome</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none focus:border-indigo-500 border-2 border-transparent transition-all" value={currentRef.cognome} onChange={e => setCurrentRef({...currentRef, cognome: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Email</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none focus:border-indigo-500 border-2 border-transparent transition-all" value={currentRef.email} onChange={e => setCurrentRef({...currentRef, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Telefono Fisso</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none focus:border-indigo-500 border-2 border-transparent transition-all" value={currentRef.telefono_fisso} onChange={e => setCurrentRef({...currentRef, telefono_fisso: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Telefono Cellulare</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-bold outline-none focus:border-indigo-500 border-2 border-transparent transition-all" value={currentRef.telefono_cellulare} onChange={e => setCurrentRef({...currentRef, telefono_cellulare: e.target.value})} />
                </div>
              </div>
              <button type="button" onClick={salvaReferenteModal} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-sm shadow-xl hover:bg-indigo-700 transition-all">
                Conferma Referente
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}