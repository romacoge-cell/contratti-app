import { useState } from 'react';
import FormInquadramento from './form/FormInquadramento';
import FormReferente from './form/FormReferente';
import FormAnagrafica from './form/FormAnagrafica';
import FormAmministrativa from './form/FormAmministrativa';
import FormFirma from './form/FormFirma';
import FormProdotti from './form/FormProdotti'; // <--- Assicurati che esista
import { ArrowLeft, Save, Loader2, Info, Package } from 'lucide-react';

export default function ContrattiForm({ 
  form, setForm, searchQuery, setSearchQuery, suggerimenti, 
  selezionaCliente, referentiCliente, agenti, userProfile, 
  loading, onBack, onSubmit, setShowRefModal 
}) {
  
  // Stato per gestire il cambio tab
  const [activeTab, setActiveTab] = useState('generali');

  return (
    <form onSubmit={onSubmit} className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      
      {/* HEADER: BOTTONE INDIETRO E NAVIGATION TAB */}
      <div className="flex flex-col gap-6">
        <button 
          type="button" 
          onClick={onBack} 
          className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={14}/> Torna alla lista
        </button>

        <div className="flex bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('generali')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all ${
              activeTab === 'generali' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Info size={16} /> Info Generali
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prodotti')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all ${
              activeTab === 'prodotti' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Package size={16} /> Prodotti
          </button>
        </div>
      </div>

      {/* CONTENUTO CONDIZIONALE DELLE TAB */}
      {activeTab === 'generali' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
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
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <FormProdotti form={form} setForm={setForm} />
        </div>
      )}

      {/* BOTTONE SALVA (SEMPRE VISIBILE) */}
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