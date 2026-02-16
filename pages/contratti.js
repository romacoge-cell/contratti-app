import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import ModalReferente from '../components/ModalReferente';
import { 
  Plus, ArrowLeft, Save, Building2, User, 
  CreditCard, PenTool, ChevronRight, UserPlus, Edit2, Loader2, Filter, X 
} from 'lucide-react';

export default function Contratti() {
  const [view, setView] = useState('list');
  const [isEdit, setIsEdit] = useState(false);
  const [contratti, setContratti] = useState([]);
  const [agenti, setAgenti] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showRefModal, setShowRefModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- STATI FILTRI ---
  const [filtri, setFiltri] = useState({
    agente_id: '', ragione_sociale: '', tipo: '', stato: '',
    data_esito_da: '', data_esito_a: ''
  });
  const [suggerimentiFiltro, setSuggerimentiFiltro] = useState([]);

  // --- STATI FORM ---
  const [searchQuery, setSearchQuery] = useState('');
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [referentiCliente, setReferentiCliente] = useState([]);

  const [form, setForm] = useState({
    cliente_id: '', agente_id: '', tipo: 'A1', stato: 'Bozza',
    // Referente
    ref_nome: '', ref_cognome: '', ref_email: '', ref_telefono: '', ref_cellulare: '',
    // Anagrafica Sede/Legale
    via: '', civico: '', localita: '', provincia: '', cap: '',
    rappresentante_nome: '', rappresentante_cognome: '', codice_altuofianco: '',
    // Amministrativi
    iban: '', banca: '', intestatario_conto: '', tipologia_intestatario: 'Partita IVA',
    debitore_nome_cognome: '', debitore_cf: '', sdi: '', pec: '',
    // Firma
    data_firma: new Date().toISOString().split('T')[0], luogo_firma: '', data_esito: ''
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

    if (filtri.agente_id) query = query.eq('agente_id', filtri.agente_id);
    if (filtri.tipo) query = query.eq('tipo', filtri.tipo);
    if (filtri.stato) query = query.eq('stato', filtri.stato);
    if (filtri.ragione_sociale) query = query.ilike('clienti.ragione_sociale', `%${filtri.ragione_sociale}%`);
    if (filtri.data_esito_da) query = query.gte('data_esito', filtri.data_esito_da);
    if (filtri.data_esito_a) query = query.lte('data_esito', filtri.data_esito_a);

    const { data } = await query;
    setContratti(data || []);
  }

  // Trigger filtri
  useEffect(() => {
    const t = setTimeout(() => fetchContratti(), 300);
    return () => clearTimeout(t);
  }, [filtri]);

  // Suggerimenti filtro ragione sociale
  useEffect(() => {
    if (filtri.ragione_sociale.length > 1) {
      supabase.from('clienti').select('ragione_sociale').ilike('ragione_sociale', `%${filtri.ragione_sociale}%`).limit(5)
        .then(({data}) => setSuggerimentiFiltro(data || []));
    } else setSuggerimentiFiltro([]);
  }, [filtri.ragione_sociale]);

  // Suggerimenti Form Cliente
  useEffect(() => {
    if (searchQuery.length > 1 && !form.cliente_id) {
      supabase.from('clienti').select('*').ilike('ragione_sociale', `%${searchQuery}%`).limit(5)
        .then(({data}) => setSuggerimenti(data || []));
    } else setSuggerimenti([]);
  }, [searchQuery, form.cliente_id]);

  const selezionaCliente = async (cli) => {
    setForm({ ...form, 
      cliente_id: cli.id, via: cli.via || '', civico: cli.civico || '', localita: cli.localita || '', 
      provincia: cli.provincia || '', cap: cli.cap || '', iban: cli.iban || '', banca: cli.banca || '', 
      sdi: cli.sdi || '', pec: cli.pec || '', intestatario_conto: cli.ragione_sociale || '',
      codice_altuofianco: cli.codice_altuofianco || ''
    });
    setSearchQuery(cli.ragione_sociale);
    const { data: refs } = await supabase.from('clienti_referenti').select('*').eq('cliente_id', cli.id);
    setReferentiCliente(refs || []);
  };

  const getStatoStyle = (stato) => {
    switch (stato) {
      case 'Firmato': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Perso': return 'bg-red-100 text-red-700 border-red-200';
      case 'In attesa firma': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Annullato': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const salvaContratto = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('contratti').upsert({ ...form, agente_id: form.agente_id || userProfile.id });
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
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Gestione Contratti</h1>
              <button onClick={() => { setView('form'); setIsEdit(false); setSearchQuery(''); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl uppercase text-xs">
                <Plus size={18} /> Nuovo Contratto
              </button>
            </div>

            {/* FILTRI */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="relative col-span-2">
                  <input className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none" placeholder="Cerca ragione sociale..." value={filtri.ragione_sociale} onChange={e => setFiltri({...filtri, ragione_sociale: e.target.value})} />
                  {suggerimentiFiltro.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white shadow-xl rounded-xl border border-slate-100 overflow-hidden">
                      {suggerimentiFiltro.map((s, i) => <div key={i} onClick={() => {setFiltri({...filtri, ragione_sociale: s.ragione_sociale}); setSuggerimentiFiltro([]);}} className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-bold">{s.ragione_sociale}</div>)}
                    </div>
                  )}
                </div>
                {userProfile?.role === 'admin' && (
                  <select className="p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none" value={filtri.agente_id} onChange={e => setFiltri({...filtri, agente_id: e.target.value})}>
                    <option value="">Tutti gli Agenti</option>
                    {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
                  </select>
                )}
                <select className="p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none" value={filtri.tipo} onChange={e => setFiltri({...filtri, tipo: e.target.value})}><option value="">Tipo</option><option value="A1">A1</option><option value="A2">A2</option></select>
                <select className="p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none" value={filtri.stato} onChange={e => setFiltri({...filtri, stato: e.target.value})}><option value="">Stato</option><option value="Bozza">Bozza</option><option value="Firmato">Firmato</option><option value="Perso">Perso</option></select>
                <button onClick={() => setFiltri({agente_id:'', ragione_sociale:'', tipo:'', stato:'', data_esito_da:'', data_esito_a:''})} className="p-3 text-slate-400 hover:text-red-500 text-xs font-black uppercase flex items-center justify-center gap-1"><X size={14}/> Reset</button>
              </div>
              <div className="flex gap-4 pt-2 items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Esito dal:</span>
                <input type="date" className="p-2 bg-slate-50 rounded-lg text-xs font-bold" value={filtri.data_esito_da} onChange={e => setFiltri({...filtri, data_esito_da: e.target.value})} />
                <span className="text-[10px] font-black text-slate-400 uppercase">al:</span>
                <input type="date" className="p-2 bg-slate-50 rounded-lg text-xs font-bold" value={filtri.data_esito_a} onChange={e => setFiltri({...filtri, data_esito_a: e.target.value})} />
              </div>
            </div>

            {/* TABELLA */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b border-slate-100">
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
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="p-6 font-black text-slate-900">{c.tipo}</td>
                      <td className="p-6 font-bold text-slate-800">{c.clienti?.ragione_sociale}</td>
                      {userProfile?.role === 'admin' && <td className="p-6 text-xs font-bold uppercase">{c.profiles?.cognome} {c.profiles?.nome}</td>}
                      <td className="p-6"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatoStyle(c.stato)}`}>{c.stato}</span></td>
                      <td className="p-6 text-slate-400 font-bold">{c.data_firma}</td>
                      <td className="p-6 text-right"><button className="text-slate-300 hover:text-blue-600"><Edit2 size={18}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <form onSubmit={salvaContratto} className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
            <button type="button" onClick={() => setView('list')} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest"><ArrowLeft size={14}/> Torna alla lista</button>
            
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
                        <div key={cli.id} onClick={() => selezionaCliente(cli)} className="p-4 hover:bg-blue-50 cursor-pointer font-bold flex justify-between items-center text-sm">{cli.ragione_sociale} <ChevronRight size={14}/></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Stato</label><input disabled className="w-full p-4 bg-slate-100 rounded-2xl font-bold" value={form.stato} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Tipo</label><select className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}><option value="A1">Tipo A1</option><option value="A2">Tipo A2</option></select></div>
              </div>
            </section>

            {/* 2. REFERENTE */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3 text-purple-600 font-black uppercase text-xs tracking-widest"><User size={20}/> 2. Referente</div>
                <button type="button" onClick={() => setShowRefModal(true)} className="flex items-center gap-2 text-[10px] font-black bg-purple-50 text-purple-600 px-4 py-2 rounded-xl uppercase"><UserPlus size={14}/> Nuovo Referente</button>
              </div>
              <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" onChange={e => {
                if(!e.target.value) return;
                const r = JSON.parse(e.target.value);
                setForm({...form, ref_nome: r.nome, ref_cognome: r.cognome, ref_email: r.email, ref_telefono: r.telefono_fisso, ref_cellulare: r.telefono_cellulare});
              }}>
                <option value="">Scegli referente esistente...</option>
                {referentiCliente.map(r => <option key={r.id} value={JSON.stringify(r)}>{r.nome} {r.cognome}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Nome" className="p-4 bg-slate-50 rounded-2xl font-bold" value={form.ref_nome} onChange={e => setForm({...form, ref_nome: e.target.value})} />
                <input placeholder="Cognome" className="p-4 bg-slate-50 rounded-2xl font-bold" value={form.ref_cognome} onChange={e => setForm({...form, ref_cognome: e.target.value})} />
                <input placeholder="Email" className="p-4 bg-slate-50 rounded-2xl font-bold" value={form.ref_email} onChange={e => setForm({...form, ref_email: e.target.value})} />
                <div className="flex gap-2">
                  <input placeholder="Tel. Fisso" className="w-1/2 p-4 bg-slate-50 rounded-2xl font-bold" value={form.ref_telefono} onChange={e => setForm({...form, ref_telefono: e.target.value})} />
                  <input placeholder="Cellulare" className="w-1/2 p-4 bg-slate-50 rounded-2xl font-bold" value={form.ref_cellulare} onChange={e => setForm({...form, ref_cellulare: e.target.value})} />
                </div>
              </div>
            </section>

            {/* 3. ANAGRAFICA SEDE E LEGALE */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest border-b pb-4"><Building2 size={20}/> 3. Anagrafica Sede e Legale</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Via</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.via} onChange={e => setForm({...form, via: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Civico</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.civico} onChange={e => setForm({...form, civico: e.target.value})} /></div>
                <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Località</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.localita} onChange={e => setForm({...form, localita: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Provincia (Sigla)</label><input maxLength={2} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none uppercase" value={form.provincia} onChange={e => setForm({...form, provincia: e.target.value.toUpperCase()})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">CAP</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.cap} onChange={e => setForm({...form, cap: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Nome Rappr. Legale</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.rappresentante_nome} onChange={e => setForm({...form, rappresentante_nome: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Cognome Rappr. Legale</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.rappresentante_cognome} onChange={e => setForm({...form, rappresentante_cognome: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Codice Altuofianco</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.codice_altuofianco} onChange={e => setForm({...form, codice_altuofianco: e.target.value})} /></div>
              </div>
            </section>

            {/* 4. DATI AMMINISTRATIVI */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-emerald-600 font-black uppercase text-xs tracking-widest border-b pb-4"><CreditCard size={20}/> 4. Dati Amministrativi e RID</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">IBAN</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-mono font-bold outline-none" value={form.iban} onChange={e => setForm({...form, iban: e.target.value.toUpperCase()})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Banca</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.banca} onChange={e => setForm({...form, banca: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Intestatario Conto Corrente (max 200 car.)</label><input maxLength={200} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.intestatario_conto} onChange={e => setForm({...form, intestatario_conto: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Tipologia Intestatario</label><select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.tipologia_intestatario} onChange={e => setForm({...form, tipologia_intestatario: e.target.value})}><option value="Partita IVA">Partita IVA</option><option value="Codice Fiscale">Codice Fiscale</option></select></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Nome e Cognome Debitore</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.debitore_nome_cognome} onChange={e => setForm({...form, debitore_nome_cognome: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Codice Fiscale Debitore</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none uppercase" value={form.debitore_cf} onChange={e => setForm({...form, debitore_cf: e.target.value.toUpperCase()})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Codice SDI</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none uppercase" value={form.sdi} onChange={e => setForm({...form, sdi: e.target.value.toUpperCase()})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">PEC</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.pec} onChange={e => setForm({...form, pec: e.target.value})} /></div>
              </div>
            </section>

            {/* 5. FIRMA */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-slate-800 font-black uppercase text-xs tracking-widest border-b pb-4"><PenTool size={20}/> 5. Sottoscrizione</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Data Firma</label><input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.data_firma} onChange={e => setForm({...form, data_firma: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Luogo Firma</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.luogo_firma} onChange={e => setForm({...form, luogo_firma: e.target.value})} /></div>
              </div>
            </section>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl flex justify-center gap-3 items-center hover:bg-blue-700 transition-all">
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
                setForm({...form, ref_nome: r.nome, ref_cognome: r.cognome, ref_email: r.email, ref_telefono: r.telefono_fisso, ref_cellulare: r.telefono_cellulare}); 
                setShowRefModal(false); 
            }} 
          />
        )}
      </main>
    </div>
  );
}