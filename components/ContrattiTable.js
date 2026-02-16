import { Edit2, Calendar } from 'lucide-react';

export default function ContrattiTable({ contratti, userProfile, onEdit }) {
  const getStatoStyle = (stato) => {
    switch (stato) {
      case 'Firmato': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Perso': return 'bg-red-100 text-red-700 border-red-200';
      case 'In attesa firma': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Annullato': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  // Funzione per formattare la data in modo leggibile (opzionale)
  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return dateString.split('-').reverse().join('/');
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b border-slate-100 tracking-widest">
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
          {contratti.length > 0 ? (
            contratti.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-6 font-black text-slate-900">{c.tipo}</td>
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 uppercase text-sm">{c.clienti?.ragione_sociale || 'Cliente rimosso'}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {c.id.substring(0, 8)}</span>
                  </div>
                </td>
                {userProfile?.role === 'admin' && (
                  <td className="p-6 text-xs font-bold uppercase text-blue-600">
                    {c.profiles ? `${c.profiles.cognome} ${c.profiles.nome}` : 'Non assegnato'}
                  </td>
                )}
                <td className="p-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatoStyle(c.stato)}`}>
                    {c.stato}
                  </span>
                </td>
                <td className="p-6 text-slate-500 font-bold text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-slate-300" />
                    {formatDate(c.data_firma)}
                  </div>
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => onEdit(c)} 
                    className="p-3 bg-slate-50 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
                    title="Modifica Contratto"
                  >
                    <Edit2 size={18}/>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={userProfile?.role === 'admin' ? 6 : 5} className="p-20 text-center">
                <div className="flex flex-col items-center gap-2">
                   <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <Edit2 size={24} />
                   </div>
                   <span className="text-slate-300 font-black uppercase tracking-widest text-xs">Nessun contratto trovato</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}