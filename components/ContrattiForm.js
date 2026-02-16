import { 
  ArrowLeft, Save, Building2, User, CreditCard, 
  PenTool, ChevronRight, UserPlus, Loader2 
} from 'lucide-react';

export default function ContrattiForm({ 
  form, setForm, 
  searchQuery, setSearchQuery, 
  suggerimenti, selezionaCliente,
  referentiCliente, 
  agenti, userProfile, 
  loading, onBack, onSubmit, setShowRefModal 
}) {
  return (
    <form onSubmit={onSubmit} className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <button 
        type="button" 
        onClick={onBack} 
        className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={14}/> Torna alla lista
      </button>
      
      {/* 1. INQUADRAMENTO */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-xs tracking-widest border-b pb-4">
            <Building2 size={20}/> 1. Inquadramento
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userProfile?.role === 'admin' && (
            <select 
              className="p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500" 
              value={form.agente_id} 
              onChange={e => setForm({...form, agente_id: e.target.value})}
            >
              <option value="">Assegna Agente...</option>
              {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
            </select>
          )}
          <div className="relative">
            <input 
              placeholder="Cerca Cliente..." 
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" 
              value={searchQuery} 
              onChange={e => { setSearchQuery(e.target.value); setForm({...form, cliente_id: ''}); }} 
            />
            {suggerimenti.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white shadow-2xl rounded-2xl border overflow-hidden">
                {suggerimenti.map(cli => (
                  <div 
                    key={cli.id} 
                    onClick={() => selezionaCliente(cli)} 
                    className="p-4 hover:bg-blue-50 cursor-pointer font-bold flex justify-between items-center text-sm"
                  >
                    {cli.ragione_sociale} <ChevronRight size={14}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Stato</label>
            <input disabled className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-slate-500" value={form.stato} />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Tipo</label>
            <select 
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
              value={form.tipo} 
              onChange={e => setForm({...form, tipo: e.target.value})}
            >
              <option value="A1">Tipo A1</option>
              <option value="A2">Tipo A2</option>
            </select>
          </div>
        </div>
      </section>

      {/* 2. REFERENTE */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-3 text-purple-600 font-black uppercase text-xs tracking-widest"><User size={20}/> 2. Referente</div>
          <button 
            type="button" 
            onClick={() => setShowRefModal(true)} 
            className="flex items-center gap-2 text-[10px] font-black bg-purple-50 text-purple-600 px-4 py-2 rounded-xl uppercase hover:bg-purple-100 transition-colors"
          >
            <UserPlus size={14}/> Nuovo Referente
          </button>
        </div>
        <select 
          className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-purple-500" 
          onChange={e => {
            if(!e.target.value) return;
            const r = JSON.parse(e.target.value);
            setForm({...form, ref_nome: r.nome, ref_cognome: r.cognome, ref_email: r.email, ref_telefono: r.telefono_fisso, ref_cellulare: r.telefono_cellulare});
          }}
        >
          <option value="">Scegli referente esistente...</option>
          {referentiCliente.map(r => <option key={r.id} value={JSON.stringify(r)}>{r.nome} {r.cognome}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Nome" className="p-4 bg-slate-50 rounded-2xl font-bold" value={form.ref_nome} onChange={e => setForm({...form, ref_nome: e.target.value})} />
          <input placeholder="Cognome" className="p-4 bg-slate-50 rounded-2xl font-bold" value={form.ref_cognome} onChange={e => setForm({...form, ref_cognome: e.target.value})} />
          <input placeholder="Email" className="p-4 bg-slate-50 rounded-2xl font-bold col-span-2 md:col-span-1" value={form.ref_email} onChange={e => setForm({...form, ref_email: e.target.value})} />
          <div className="flex gap-2 col-span-2 md:col-span-1">
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
        {/* ... Altri campi Anagrafica (omessi per brevità ma uguali al tuo originale) ... */}
      </section>

      {/* 4. DATI AMMINISTRATIVI */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 text-emerald-600 font-black uppercase text-xs tracking-widest border-b pb-4"><CreditCard size={20}/> 4. Dati Amministrativi e RID</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">IBAN</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-mono font-bold outline-none border-2 border-transparent focus:border-emerald-500" value={form.iban} onChange={e => setForm({...form, iban: e.target.value.toUpperCase()})} /></div>
          {/* ... Altri campi Amministrativi ... */}
        </div>
      </section>

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-blue-600 text-white p-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl flex justify-center gap-3 items-center hover:bg-blue-700 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <><Save size={24}/> Salva Contratto</>}
      </button>
    </form>
  );
}