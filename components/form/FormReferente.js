import { User, UserPlus } from 'lucide-react';

export default function FormReferente({ form, setForm, referentiCliente, setShowRefModal }) {
  return (
    <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center gap-3 text-purple-600 font-black uppercase text-xs tracking-widest"><User size={20}/> 2. Referente</div>
        <button type="button" onClick={() => setShowRefModal(true)} className="flex items-center gap-2 text-[10px] font-black bg-purple-50 text-purple-600 px-4 py-2 rounded-xl uppercase hover:bg-purple-100 transition-colors">
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
        <input placeholder="Nome" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_nome} onChange={e => setForm({...form, ref_nome: e.target.value})} />
        <input placeholder="Cognome" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_cognome} onChange={e => setForm({...form, ref_cognome: e.target.value})} />
        <input placeholder="Email" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_email} onChange={e => setForm({...form, ref_email: e.target.value})} />
        <div className="flex gap-2">
          <input placeholder="Tel. Fisso" className="w-1/2 p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_telefono} onChange={e => setForm({...form, ref_telefono: e.target.value})} />
          <input placeholder="Cellulare" className="w-1/2 p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.ref_cellulare} onChange={e => setForm({...form, ref_cellulare: e.target.value})} />
        </div>
      </div>
    </section>
  );
}