import { X } from 'lucide-react';

export default function ContrattiFilters({ 
  filtri, setFiltri, agenti, userProfile, suggerimentiFiltro, setSuggerimentiFiltro 
}) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Ragione Sociale con Suggerimenti */}
        <div className="relative col-span-2">
          <input 
            className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500" 
            placeholder="Cerca ragione sociale..." 
            value={filtri.ragione_sociale} 
            onChange={e => setFiltri({...filtri, ragione_sociale: e.target.value})} 
          />
          {suggerimentiFiltro.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white shadow-xl rounded-xl border border-slate-100 overflow-hidden">
              {suggerimentiFiltro.map((s, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    setFiltri({...filtri, ragione_sociale: s.ragione_sociale}); 
                    setSuggerimentiFiltro([]);
                  }} 
                  className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-bold border-b last:border-0"
                >
                  {s.ragione_sociale}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filtro Agente (Solo Admin) */}
        {userProfile?.role === 'admin' && (
          <select 
            className="p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none" 
            value={filtri.agente_id} 
            onChange={e => setFiltri({...filtri, agente_id: e.target.value})}
          >
            <option value="">Tutti gli Agenti</option>
            {agenti.map(a => <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>)}
          </select>
        )}

        <select className="p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none" value={filtri.tipo} onChange={e => setFiltri({...filtri, tipo: e.target.value})}>
          <option value="">Tipo</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
        </select>

        <select className="p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none" value={filtri.stato} onChange={e => setFiltri({...filtri, stato: e.target.value})}>
          <option value="">Stato</option>
          <option value="Bozza">Bozza</option>
          <option value="Firmato">Firmato</option>
          <option value="Perso">Perso</option>
        </select>

        <button 
          onClick={() => setFiltri({agente_id:'', ragione_sociale:'', tipo:'', stato:'', data_esito_da:'', data_esito_a:''})} 
          className="p-3 text-slate-400 hover:text-red-500 text-xs font-black uppercase flex items-center justify-center gap-1 transition-colors"
        >
          <X size={14}/> Reset
        </button>
      </div>

      {/* Range Date */}
      <div className="flex gap-4 pt-2 items-center border-t border-slate-50 mt-2">
        <span className="text-[10px] font-black text-slate-400 uppercase">Esito dal:</span>
        <input type="date" className="p-2 bg-slate-50 rounded-lg text-xs font-bold outline-none" value={filtri.data_esito_da} onChange={e => setFiltri({...filtri, data_esito_da: e.target.value})} />
        <span className="text-[10px] font-black text-slate-400 uppercase">al:</span>
        <input type="date" className="p-2 bg-slate-50 rounded-lg text-xs font-bold outline-none" value={filtri.data_esito_a} onChange={e => setFiltri({...filtri, data_esito_a: e.target.value})} />
      </div>
    </div>
  );
}