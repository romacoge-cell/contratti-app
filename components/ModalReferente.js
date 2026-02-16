import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, UserPlus, Loader2 } from 'lucide-react';

export default function ModalReferente({ clienteId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', 
    cognome: '', 
    email: '', 
    telefono_fisso: '', 
    telefono_cellulare: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId) return alert("Seleziona prima un cliente!");

    setLoading(true);
    const { data, error } = await supabase
      .from('clienti_referenti')
      .insert([{ cliente_id: clienteId, ...formData }])
      .select().single();

    if (error) {
        console.error(error);
        alert("Errore: " + error.message);
    } else {
        onSuccess(data);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 bg-purple-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <UserPlus size={24} />
            <h3 className="text-xl font-black uppercase tracking-tight">Nuovo Referente</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Nome" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
            <input required placeholder="Cognome" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.cognome} onChange={e => setFormData({...formData, cognome: e.target.value})} />
          </div>
          <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Tel. Fisso" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.telefono_fisso} onChange={e => setFormData({...formData, telefono_fisso: e.target.value})} />
            <input placeholder="Cellulare" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.telefono_cellulare} onChange={e => setFormData({...formData, telefono_cellulare: e.target.value})} />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 p-4 font-black text-slate-400 uppercase text-xs">Annulla</button>
            <button type="submit" disabled={loading} className="flex-[2] bg-purple-600 text-white p-4 rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest">
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Salva e Collega"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}