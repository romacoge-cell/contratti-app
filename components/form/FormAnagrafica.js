import { Building2 } from 'lucide-react';

export default function FormAnagrafica({ form, setForm }) {
  return (
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
  );
}