import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import { Plus, Edit2, Loader2, X, layers, DollarSign } from 'lucide-react';

export default function Sottotipologie() {
  const [sottotipologie, setSottotipologie] = useState([]);
  const [tipologie, setTipologie] = useState([]); // Necessarie per la select nella modal
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  const [currentSub, setCurrentSub] = useState({ 
    id: null, 
    tipologia_id: '', 
    sottotipologia: '',
    prezzo_minimo: 0
  });

  useEffect(() => {
    checkAdmin();
    fetchData();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setUserProfile(profile);
    if (!profile || profile.role !== 'admin') {
      window.location.href = '/'; 
    }
  }

  async function fetchData() {
    setLoading(true);
    // Carichiamo le sottotipologie con il join sulla tipologia madre
    const { data: subs } = await supabase
      .from('sotto_tipologie_prodotti')
      .select('*, tipologie_prodotti(tipologia)')
      .order('sottotipologia');
    
    // Carichiamo le tipologie per popolare la select della modal
    const { data: tips } = await supabase
      .from('tipologie_prodotti')
      .select('id, tipologia')
      .order('tipologia');

    setSottotipologie(subs || []);
    setTipologie(tips || []);
    setLoading(false);
  }

  async function salvaSottotipologia(e) {
    e.preventDefault();
    if (!currentSub.sottotipologia || !currentSub.tipologia_id) return;

    const payload = { 
        tipologia_id: currentSub.tipologia_id,
        sottotipologia: currentSub.sottotipologia,
        prezzo_minimo: parseInt(currentSub.prezzo_minimo) || 0
    };
    
    let error;
    if (isEdit) {
      const { error: err } = await supabase.from('sotto_tipologie_prodotti').update(payload).eq('id', currentSub.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('sotto_tipologie_prodotti').insert([payload]);
      error = err;
    }

    if (error) {
      alert("Errore: " + error.message);
    } else {
      setShowModal(false);
      setCurrentSub({ id: null, tipologia_id: '', sottotipologia: '', prezzo_minimo: 0 });
      fetchData();
    }
  }

  const apriModifica = (s) => {
    setIsEdit(true);
    setCurrentSub({
        id: s.id,
        tipologia_id: s.tipologia_id,
        sottotipologia: s.sottotipologia,
        prezzo_minimo: s.prezzo_minimo
    });
    setShowModal(true);
  };

  const apriNuovo = () => {
    setIsEdit(false);
    setCurrentSub({ 
        id: null, 
        tipologia_id: tipologie[0]?.id || '', 
        sottotipologia: '', 
        prezzo_minimo: 0 
    });
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
              <layers className="text-blue-600" size={28} /> Sottotipologie
            </h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Gestione prodotti e prezzi minimi</p>
          </div>
          <button 
            onClick={apriNuovo}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-blue-700 uppercase text-xs transition-all active:scale-95"
          >
            <Plus size={18} /> Nuova Sottotipologia
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b border-slate-100 tracking-widest">
                <tr>
                  <th className="p-6">Tipologia Madre</th>
                  <th className="p-6">Sottotipologia (Prodotto)</th>
                  <th className="p-6">Prezzo Minimo</th>
                  <th className="p-6 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sottotipologie.length > 0 ? (
                  sottotipologie.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6">
                        <span className="text-[10px] font-black uppercase px-3 py-1 bg-slate-100 text-slate-500 rounded-lg">
                            {s.tipologie_prodotti?.tipologia}
                        </span>
                      </td>
                      <td className="p-6 font-black text-slate-900 uppercase tracking-tight">{s.sottotipologia}</td>
                      <td className="p-6">
                        <div className="flex items-center gap-1 font-bold text-emerald-600">
                            <span className="text-xs">€</span>
                            <span>{s.prezzo_minimo.toLocaleString('it-IT')}</span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => apriModifica(s)} 
                          className="p-3 bg-slate-50 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit2 size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">
                      Nessun prodotto configurato
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
            <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
              <div className="flex justify-between items-center mb-8 border-b pb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">
                  {isEdit ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={salvaSottotipologia} className="space-y-6">
                {/* SELECT TIPOLOGIA MADRE */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Tipologia di riferimento</label>
                  <select 
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    value={currentSub.tipologia_id}
                    onChange={e => setCurrentSub({...currentSub, tipologia_id: e.target.value})}
                  >
                    {tipologie.map(t => (
                        <option key={t.id} value={t.id}>{t.tipologia.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* INPUT NOME SOTTOTIPOLOGIA */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Nome Sottotipologia</label>
                  <input 
                    autoFocus
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all"
                    value={currentSub.sottotipologia}
                    onChange={e => setCurrentSub({...currentSub, sottotipologia: e.target.value})}
                    placeholder="es. RESIDENZIALE"
                  />
                </div>

                {/* INPUT PREZZO MINIMO */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Prezzo Minimo (€)</label>
                  <div className="relative">
                    <input 
                        type="number"
                        className="w-full p-4 pl-10 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all"
                        value={currentSub.prezzo_minimo}
                        onChange={e => setCurrentSub({...currentSub, prezzo_minimo: e.target.value})}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                >
                  {isEdit ? 'Salva Modifiche' : 'Crea Sottotipologia'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}