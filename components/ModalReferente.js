import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, UserPlus, Loader2 } from 'lucide-react';

export default function ModalReferente({ clienteId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', cognome: '', email: '', telefono: '', cellulare: '', ruolo: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId) return alert("Seleziona prima un cliente!");

    setLoading(true);
    const { data, error } = await supabase
      .from('clienti_referenti')
      .insert([{ cliente_id: clienteId, ...formData }])
      .select().single();

    if (error) alert("Errore: " + error.message);
    else onSuccess(data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-8 bg-purple-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <UserPlus size={24} />
            <h3 className="text-xl font-black uppercase">Nuovo Referente</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Nome" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
            <input required placeholder="Cognome" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.cognome} onChange={e => setFormData({...formData, cognome: e.target.value})} />
          </div>
          <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Telefono" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
            <input placeholder="Cellulare" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.cellulare} onChange={e => setFormData({...formData, cellulare: e.target.value})} />
          </div>
          <input placeholder="Ruolo (es. Titolare)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={formData.ruolo} onChange={e => setFormData({...formData, ruolo: e.target.value})} />
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 p-4 font-black text-slate-400">Annulla</button>
            <button type="submit" disabled={loading} className="flex-[2] bg-purple-600 text-white p-4 rounded-2xl font-black shadow-lg">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "SALVA E COLLEGA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}