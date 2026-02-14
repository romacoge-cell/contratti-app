import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';
import { UserPlus, CheckCircle, Ban, AlertCircle, Edit2, X, Plus } from 'lucide-react';

export default function GestioneAgenti() {
  const [agenti, setAgenti] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false); // Stato per la Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', role: 'agente' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const getInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      fetchAgenti();
    };
    getInitialData();
  }, []);

  async function fetchAgenti() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setAgenti(data || []);
  }

  function handleOpenModal(agente = null) {
    if (agente) {
      setForm({ nome: agente.nome, cognome: agente.cognome, email: agente.email, role: agente.role });
      setEditingId(agente.id);
      setIsEditing(true);
    } else {
      setForm({ nome: '', cognome: '', email: '', role: 'agente' });
      setIsEditing(false);
    }
    setErrorMsg('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
  }

  async function salvaAgente(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const emailLimpida = form.email.toLowerCase().trim();

    if (isEditing) {
      const { error } = await supabase.from('profiles').update({ ...form, email: emailLimpida }).eq('id', editingId);
      if (error) setErrorMsg(error.message);
      else { closeModal(); fetchAgenti(); }
    } else {
      const { data: esiste } = await supabase.from('profiles').select('email').eq('email', emailLimpida).maybeSingle();
      if (esiste) {
        setErrorMsg('Email già esistente.');
        setLoading(false);
        return;
      }
      const { error } = await supabase.from('profiles').insert([{ ...form, email: emailLimpida, attivo: true }]);
      if (error) setErrorMsg(error.message);
      else { closeModal(); fetchAgenti(); }
    }
    setLoading(false);
  }

  async function toggleStato(id, statoAttuale) {
    if (id === currentUser?.id) return alert("Non puoi disabilitare te stesso.");
    await supabase.from('profiles').update({ attivo: !statoAttuale }).eq('id', id);
    fetchAgenti();
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Navbar />
      <main className="flex-1 ml-64 p-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Gestione Team Agenti</h1>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} /> Aggiungi Agente
          </button>
        </div>

        {/* Modal Overlay */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Content */}
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    {isEditing ? <Edit2 className="text-blue-600" /> : <UserPlus className="text-blue-600" />}
                    {isEditing ? 'Modifica' : 'Nuovo Agente'}
                  </h2>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={salvaAgente} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-500 ml-1">Nome</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-500 ml-1">Cognome</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" required value={form.cognome} onChange={e => setForm({...form, cognome: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-500 ml-1">Email</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-500 ml-1">Ruolo</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-medium" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                      <option value="agente">Agente</option>
                      <option value="admin">Amministratore</option>
                    </select>
                  </div>
                  
                  {errorMsg && <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium"><AlertCircle size={18} /> {errorMsg}</div>}
                  
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg mt-2">
                    {loading ? 'Attendere...' : isEditing ? 'Salva Modifiche' : 'Censisci Agente'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tabella (Resta invariata ma più pulita) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-6">Nominativo</th>
                <th className="p-6">Email</th>
                <th className="p-6">Stato</th>
                <th className="p-6 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agenti.map(agente => (
                <tr key={agente.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-semibold text-slate-800">{agente.nome} {agente.cognome}</td>
                  <td className="p-6 text-slate-500 text-sm">{agente.email}</td>
                  <td className="p-6">
                    {agente.attivo ? 
                      <span className="text-green-600 flex items-center gap-1 text-sm font-bold bg-green-50 px-3 py-1 rounded-full w-fit"><CheckCircle size={14}/> Attivo</span> : 
                      <span className="text-red-400 flex items-center gap-1 text-sm font-bold bg-red-50 px-3 py-1 rounded-full w-fit"><Ban size={14}/> Disabilitato</span>
                    }
                  </td>
                  <td className="p-6 text-right flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(agente)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={18} /></button>
                    <button 
                      onClick={() => toggleStato(agente.id, agente.attivo)}
                      disabled={agente.id === currentUser?.id}
                      className={`p-2 rounded-lg transition-all ${agente.id === currentUser?.id ? 'opacity-20 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                      {agente.attivo ? <Ban size={18} className="hover:text-red-600" /> : <CheckCircle size={18} className="hover:text-green-600" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}