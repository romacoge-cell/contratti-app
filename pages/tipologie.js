import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import { Plus, Edit2, Settings, Loader2, X } from 'lucide-react';

export default function Tipologie() {
  const [tipologie, setTipologie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  const [currentTipologia, setCurrentTipologia] = useState({ id: null, tipologia: '' });

  useEffect(() => {
    checkAdmin();
    fetchTipologie();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setUserProfile(profile);
    if (!profile || profile.role !== 'admin') {
      window.location.href = '/'; 
    }
  }

  async function fetchTipologie() {
    setLoading(true);
    const { data } = await supabase.from('tipologie_prodotti').select('*').order('tipologia');
    setTipologie(data || []);
    setLoading(false);
  }

  async function salvaTipologia(e) {
    e.preventDefault();
    if (!currentTipologia.tipologia) return;

    const payload = { tipologia: currentTipologia.tipologia };
    
    let error;
    if (isEdit) {
      const { error: err } = await supabase.from('tipologie_prodotti').update(payload).eq('id', currentTipologia.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('tipologie_prodotti').insert([payload]);
      error = err;
    }

    if (error) {
      alert(error.message);
    } else {
      setShowModal(false);
      setCurrentTipologia({ id: null, tipologia: '' });
      fetchTipologie();
    }
  }

  const apriModifica = (t) => {
    setIsEdit(true);
    setCurrentTipologia(t);
    setShowModal(true);
  };

  const apriNuovo = () => {
    setIsEdit(false);
    setCurrentTipologia({ id: null, tipologia: '' });
    setShowModal(true);
  };

  if (!userProfile || userProfile.role !== 'admin') return null;

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Navbar />
      <main className="flex-1 ml-64 p-10">
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <Settings className="text-blue-600" size={28} /> Tipologie
            </h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Gestione categorie prodotti</p>
          </div>
          <button 
            onClick={apriNuovo}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-blue-700 uppercase text-xs transition-all active:scale-95"
          >
            <Plus size={18} /> Nuova Tipologia
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b border-slate-100 tracking-widest">
                <tr>
                  <th className="p-6">Nome Tipologia</th>
                  <th className="p-6">Data Creazione</th>
                  <th className="p-6 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tipologie.length > 0 ? (
                  tipologie.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6 font-black text-slate-900 uppercase tracking-tight">{t.tipologia}</td>
                      <td className="p-6 text-slate-400 font-bold text-xs">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => apriModifica(t)} 
                          className="p-3 bg-slate-50 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit2 size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">
                      Nessuna tipologia configurata
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">
                  {isEdit ? 'Modifica' : 'Nuova Tipologia'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={salvaTipologia} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Nome della tipologia</label>
                  <input 
                    autoFocus
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all placeholder:text-slate-300"
                    value={currentTipologia.tipologia}
                    onChange={e => setCurrentTipologia({...currentTipologia, tipologia: e.target.value})}
                    placeholder="es. ENERGIA"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                >
                  {isEdit ? 'Salva Modifiche' : 'Crea Tipologia'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}