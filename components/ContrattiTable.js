import { Edit2 } from 'lucide-react';

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
                <td className="p-6 font-bold text-slate-800 uppercase text-sm">{c.clienti?.ragione_sociale}</td>
                {userProfile?.role === 'admin' && (
                  <td className="p-6 text-xs font-bold uppercase text-blue-600">
                    {c.profiles?.cognome} {c.profiles?.nome}
                  </td>
                )}
                <td className="p-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatoStyle(c.stato)}`}>
                    {c.stato}
                  </span>
                </td>
                <td className="p-6 text-slate-400 font-bold">{c.data_firma}</td>
                <td className="p-6 text-right">
                  <button onClick={() => onEdit(c)} className="text-slate-300 hover:text-blue-600 transition-colors">
                    <Edit2 size={18}/>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest">
                Nessun contratto trovato
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}