import FormInquadramento from './form/FormInquadramento';
import FormReferente from './form/FormReferente';
import FormAnagrafica from './form/FormAnagrafica';
import FormAmministrativa from './form/FormAmministrativa';
import FormFirma from './form/FormFirma';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function ContrattiForm({ 
  form, setForm, searchQuery, setSearchQuery, suggerimenti, 
  selezionaCliente, referentiCliente, agenti, userProfile, 
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
      
      <FormInquadramento 
        form={form} setForm={setForm} 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
        suggerimenti={suggerimenti} selezionaCliente={selezionaCliente}
        agenti={agenti} userProfile={userProfile} 
      />

      <FormReferente 
        form={form} setForm={setForm} 
        referentiCliente={referentiCliente} 
        setShowRefModal={setShowRefModal} 
      />

      <FormAnagrafica form={form} setForm={setForm} />

      <FormAmministrativa form={form} setForm={setForm} />

      <FormFirma form={form} setForm={setForm} />

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