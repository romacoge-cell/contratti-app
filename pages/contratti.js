import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import ModalReferente from '../components/ModalReferente';
import { 
  Plus, ArrowLeft, Save, Building2, User, 
  CreditCard, PenTool, ChevronRight, UserPlus, Edit2, Loader2 
} from 'lucide-react';

export default function Contratti() {
  const [view, setView] = useState('list');
  const [isEdit, setIsEdit] = useState(false);
  const [contratti, setContratti] = useState([]);
  const [agenti, setAgenti] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showRefModal, setShowRefModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ricerca e Referenti
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
    const { data } = await supabase.from('contratti').select('*, clienti(ragione_sociale)').order('created_at', { ascending: false });
    setContratti(data || []);
  }

  // Stili per gli stati (Tag colorati)
  const getStatoStyle = (stato) => {
    switch (stato) {
      case 'Firmato': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Perso': return 'bg-red-100 text-red-700 border-red-200';
      case 'In attesa firma': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Annullato': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  // Caricamento Referente completo
  const handleSelectReferente = (e) => {
    if (!e.target.value) return;
    const r = JSON.parse(e.target.value);
    setForm({
      ...form,
      ref_nome: r.nome || '',
      ref_cognome: r.cognome || '',
      ref_email: r.email || '',
      ref_telefono: r.telefono_fisso || '',
      ref_cellulare: r.telefono_cellulare || ''
    });
  };

  // Ricerca Cliente Live
  useEffect(() => {
    if (searchQuery.length > 1 && !form.cliente_id) {
      const search = async () => {
        const { data } = await supabase.from('clienti').select('*').ilike('ragione_sociale', `%${searchQuery}%`).limit(5);
        setSuggerimenti(data || []);
      };
      search();
    } else { setSuggerimenti([]); }
  }, [searchQuery, form.cliente_id]);

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
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Archivio Contratti</h1>
              <button onClick={() => { setView('form'); setIsEdit(false); setForm({...form, cliente_id: '', stato: 'Bozza'}); setSearchQuery(''); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-200 uppercase text-xs">
                <Plus size={18} /> Nuovo Contratto
              </button>
            </div>
            
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-6">Tipo</th>
                    <th className="p-6">Ragione Sociale</th>
                    <th className="p-6">Stato</th>
                    <th className="p-6">Data Firma</th>
                    <th className="p-6 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contratti.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-[11px] text-white font-black shadow-sm">
                          {c.tipo}
                        </div>
                      </td>
                      <td className="p-6 font-bold text-slate-800">{c.clienti?.ragione_sociale}</td>
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
          <form onSubmit={salvaContratto} className="max-w-4xl mx-auto space-y-6 pb-20">
            <button type="button" onClick={() => setView('list')} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 tracking-widest"><ArrowLeft size={14}/> Torna alla lista</button>
            
            {/* 1. INQUADRAMENTO */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-xs tracking-widest border-b pb-4"><Building2 size={20}/> 1. Inquadramento</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile?.role === 'admin' && (
                  <select className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.agente_id} onChange={e => setForm({...form, agente_id: e.target.value})}>
                    <option value="">Assegna Agente...</option>
                    {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                  </select>
                )}
                <div className="relative">
                  <input placeholder="Cerca Cliente..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setForm({...form, cliente_id: ''}); }} />
                  {suggerimenti.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white shadow-2xl rounded-2xl border overflow-hidden">
                      {suggerimenti.map(cli => (
                        <div key={cli.id} onClick={() => selezionaCliente(cli)} className="p-4 hover:bg-blue-50 cursor-pointer font-bold text-slate-600 flex justify-between items-center text-sm">{cli.ragione_sociale} <ChevronRight size={14}/></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-tighter">Stato (Non modificabile in creazione)</label><input disabled={!isEdit} className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-none text-slate-500" value={form.stato} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Tipo</label><select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}><option value="A1">Tipo A1</option><option value="A2">Tipo A2</option></select></div>
              </div>
            </section>

            {/* 2. REFERENTE */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3 text-purple-600 font-black uppercase text-xs tracking-widest"><User size={20}/> 2. Referente</div>
                <button type="button" onClick={() => setShowRefModal(true)} className="flex items-center gap-2 text-[10px] font-black bg-purple-50 text-purple-600 px-4 py-2 rounded-xl hover:bg-purple-100 transition-all uppercase"><UserPlus size={14}/> Nuovo Referente</button>
              </div>
              <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-none text-sm" onChange={handleSelectReferente}>
                <option value="">Scegli referente esistente...</option>
                {referentiCliente.map(r => <option key={r.id} value={JSON.stringify(r)}>{r.nome} {r.cognome}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Nome" className="p-4 bg-slate-50 rounded-2xl font-bold" value={form.ref_nome} onChange={e => setForm({...form, ref_nome: e.target.value})} />
                <input placeholder="Cognome" className="p-4 bg-slate-50 rounded-2xl font-bold" value={form.ref_cognome} onChange={e => setForm({...form, ref_cognome: e.target.value})} />
                <input placeholder="Email" className="p-4 bg-slate-50 rounded-2xl font-bold" value={form.ref_email} onChange={e => setForm({...form, ref_email: e.target.value})} />
                <div className="flex gap-2">
                    <input placeholder="Tel. Fisso" className="w-1/2 p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_telefono} onChange={e => setForm({...form, ref_telefono: e.target.value})} />
                    <input placeholder="Cellulare" className="w-1/2 p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_cellulare} onChange={e => setForm({...form, ref_cellulare: e.target.value})} />
                </div>
              </div>
            </section>

            {/* 3. DATI CONTRATTO EDITABILI */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest border-b pb-4"><CreditCard size={20}/> 3. Dati Contratto (Indipendenti dall'Anagrafica)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Via" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.via} onChange={e => setForm({...form, via: e.target.value})} />
                <input placeholder="Località" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.localita} onChange={e => setForm({...form, localita: e.target.value})} />
                <input placeholder="IBAN" className="p-4 bg-slate-50 rounded-2xl font-mono font-bold outline-none" value={form.iban} onChange={e => setForm({...form, iban: e.target.value.toUpperCase()})} />
                <input placeholder="PEC" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.pec} onChange={e => setForm({...form, pec: e.target.value})} />
              </div>
            </section>

            {/* 4. SOTTOSCRIZIONE */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-slate-800 font-black uppercase text-xs tracking-widest border-b pb-4"><PenTool size={20}/> 4. Sottoscrizione</div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.data_firma} onChange={e => setForm({...form, data_firma: e.target.value})} />
                <input placeholder="Luogo Firma" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.luogo_firma} onChange={e => setForm({...form, luogo_firma: e.target.value})} />
              </div>
            </section>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-200 flex justify-center gap-3 items-center hover:bg-blue-700 transition-all">
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={24}/> Salva Contratto</>}
            </button>
          </form>
        )}

        {showRefModal && (
          <ModalReferente 
            clienteId={form.cliente_id} 
            onClose={() => setShowRefModal(false)} 
            onSuccess={(r) => { 
                setReferentiCliente([...referentiCliente, r]); 
                setForm({
                    ...form, 
                    ref_nome: r.nome, 
                    ref_cognome: r.cognome, 
                    ref_email: r.email, 
                    ref_telefono: r.telefono_fisso, 
                    ref_cellulare: r.telefono_cellulare
                }); 
                setShowRefModal(false); 
            }} 
          />
        )}
      </main>
    </div>
  );
}