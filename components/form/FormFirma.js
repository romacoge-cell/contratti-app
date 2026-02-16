import { PenTool } from 'lucide-react';

export default function FormFirma({ form, setForm }) {
  return (
    <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
      <div className="flex items-center gap-3 text-slate-800 font-black uppercase text-xs tracking-widest border-b pb-4"><PenTool size={20}/> 5. Sottoscrizione</div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Data Firma</label><input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.data_firma} onChange={e => setForm({...form, data_firma: e.target.value})} /></div>
        <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Luogo Firma</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.luogo_firma} onChange={e => setForm({...form, luogo_firma: e.target.value})} /></div>
      </div>
    </section>
  );
}