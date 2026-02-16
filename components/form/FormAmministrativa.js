import { CreditCard } from 'lucide-react';

export default function FormAmministrativa({ form, setForm }) {
  return (
    <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
      <div className="flex items-center gap-3 text-emerald-600 font-black uppercase text-xs tracking-widest border-b pb-4"><CreditCard size={20}/> 4. Dati Amministrativi e RID</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">IBAN</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-mono font-bold outline-none border-2 border-transparent focus:border-emerald-500" value={form.iban} onChange={e => setForm({...form, iban: e.target.value.toUpperCase()})} /></div>
        <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Banca</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.banca} onChange={e => setForm({...form, banca: e.target.value})} /></div>
        <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Intestatario Conto Corrente</label><input maxLength={200} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.intestatario_conto} onChange={e => setForm({...form, intestatario_conto: e.target.value})} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
        <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Tipologia Intestatario</label>
          <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.tipologia_intestatario} onChange={e => setForm({...form, tipologia_intestatario: e.target.value})}>
            <option value="Partita IVA">Partita IVA</option><option value="Codice Fiscale">Codice Fiscale</option>
          </select>
        </div>
        <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Nome/Cognome Debitore</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.debitore_nome_cognome} onChange={e => setForm({...form, debitore_nome_cognome: e.target.value})} /></div>
        <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">C.F. Debitore</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none uppercase" value={form.debitore_cf} onChange={e => setForm({...form, debitore_cf: e.target.value.toUpperCase()})} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Codice SDI</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none uppercase" value={form.sdi} onChange={e => setForm({...form, sdi: e.target.value.toUpperCase()})} /></div>
        <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">PEC</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.pec} onChange={e => setForm({...form, pec: e.target.value})} /></div>
      </div>
    </section>
  );
}