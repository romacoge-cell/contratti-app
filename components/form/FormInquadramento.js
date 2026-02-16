import { Building2, ChevronRight, UserPlus } from 'lucide-react';

export default function FormInquadramento({ form, setForm, searchQuery, setSearchQuery, suggerimenti, selezionaCliente, agenti, userProfile }) {
  return (
    <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-xs tracking-widest border-b pb-4">
        <Building2 size={20}/> 1. Inquadramento
      </div>

      {/* RIGA 1: AGENTE E CLIENTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userProfile?.role === 'admin' && (
          <div>
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Agente Assegnato</label>
            <select 
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 mt-1" 
              value={form.agente_id} 
              onChange={e => setForm({...form, agente_id: e.target.value})}
            >
              <option value="">Assegna Agente...</option>
              {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
            </select>
          </div>
        )}
        <div className="relative">
          <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Ragione Sociale Cliente</label>
          <input 
            placeholder="Cerca Cliente..." 
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 mt-1" 
            value={searchQuery} 
            onChange={e => { setSearchQuery(e.target.value); setForm({...form, cliente_id: ''}); }} 
          />
          {suggerimenti.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white shadow-2xl rounded-2xl border overflow-hidden">
              {suggerimenti.map(cli => (
                <div key={cli.id} onClick={() => selezionaCliente(cli)} className="p-4 hover:bg-blue-50 cursor-pointer font-bold flex justify-between items-center text-sm">
                  {cli.ragione_sociale} <ChevronRight size={14}/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGA 2: SEGNALATORE (Nuovo Campo) */}
      <div className="pt-2">
        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase flex items-center gap-1">
          <UserPlus size={12} /> Segnalatore (Nome e Cognome)
        </label>
        <input 
          placeholder="Es: Mario Rossi" 
          className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 mt-1" 
          value={form.segnalatore_nome_cognome || ''} 
          onChange={e => setForm({...form, segnalatore_nome_cognome: e.target.value})} 
        />
      </div>

      <hr className="border-slate-50" />

      {/* RIGA 3: STATO E TIPO */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Stato</label>
          <input disabled className="w-full p-4 bg-slate-100 rounded-2xl font-bold" value={form.stato} />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Tipo</label>
          <select 
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 mt-1" 
            value={form.tipo} 
            onChange={e => setForm({...form, tipo: e.target.value})}
          >
            <option value="A1">Tipo A1</option>
            <option value="A2">Tipo A2</option>
          </select>
        </div>
      </div>
    </section>
  );
}