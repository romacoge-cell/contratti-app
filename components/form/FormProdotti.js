// components/FormProdotti.js
import { Package } from 'lucide-react';

export default function FormProdotti({ form, setForm }) {
  return (
    <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[400px]">
      <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest border-b pb-4 mb-6">
        <Package size={20}/> Sezione Prodotti
      </div>
      
      <div className="flex flex-col items-center justify-center h-64 text-slate-300 italic">
        <p>Il configuratore prodotti sarà disponibile a breve.</p>
      </div>
    </section>
  );
}