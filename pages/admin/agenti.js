import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';
import { UserPlus, CheckCircle, Ban, Users, AlertCircle, Edit2, XCircle, Plus } from 'lucide-react';

export default function GestioneAgenti() {
  const [agenti, setAgenti] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Nuovo: capisce se stiamo modificando
  const [editingId, setEditingId] = useState(null); // Nuovo: ID dell'agente in modifica
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

  // Funzione per preparare il form alla modifica
  function handleEdit(agente) {
    setForm({
      nome: agente.nome,
      cognome: agente.cognome,
      email: agente.email,
      role: agente.role
    });
    setEditingId(agente.id);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function salvaAgente(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const emailLimpida = form.email.toLowerCase().trim();

    if (isEditing) {
      // LOGICA MODIFICA
      const { error } = await supabase
        .from('profiles')
        .update({ ...form, email: emailLimpida })
        .eq('id', editingId);

      if (error) {
        setErrorMsg('Errore durante la modifica: ' + error.message);
      } else {
        resetForm();
        fetchAgenti();
      }
    } else {
      // LOGICA NUOVO INSERIMENTO
      const { data: esiste } = await supabase.from('profiles').select('email').eq('email', emailLimpida).maybeSingle();
      if (esiste) {
        setErrorMsg('Questa email è già associata a un agente.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('profiles').insert([{ ...form, email: emailLimpida, attivo: true }]);
      if (error) {
        setErrorMsg('Errore: ' + error.message);
      } else {
        resetForm();
        fetchAgenti();
      }
    }
    setLoading(false);
  }

  function resetForm() {
    setForm({ nome: '', cognome: '', email: '', role: 'agente' });
    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
    setErrorMsg('');
  }

  async function toggleStato(id, statoAttuale) {
    // PROTEZIONE: Non bloccare se stessi
    if (id === currentUser?.id) {
      alert("Non puoi disabilitare il tuo stesso account amministratore.");
      return;
    }

    const { error } = await supabase.from('profiles').update({ attivo: !statoAttuale }).eq('id', id);
    if (error) {
      alert("Errore: " + error.message);
    } else {
      fetchAgenti();
    }
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Navbar />
      <main className="flex-1 ml-64 p-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Gestione Team Agenti</h1>
          
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <Plus size={20} /> Aggiungi Agente
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                {isEditing ? <Edit2 className="text-blue-600" /> : <UserPlus className="text-blue-600" />}
                {isEditing ? 'Modifica Agente' : 'Nuovo Collaboratore'}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={salvaAgente} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              <input className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cognome" required value={form.cognome} onChange={e => setForm({...form, cognome: e.target.value})} />
              <input className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <select className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="agente">Agente</option>
                <option value="admin">Amministratore</option>
              </select>
              <button type="submit" disabled={loading} className="md:col-span-4 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all">
                {loading ? 'Salvataggio...' : isEditing ? 'Aggiorna Dati' : 'Conferma Inserimento'}
              </button>
            </form>
            {errorMsg && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100"><AlertCircle size={20} /> {errorMsg}</div>}
          </div>
        )}

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
                  <td className="p-6 text-slate-500">{agente.email}</td>
                  <td className="p-6">
                    {agente.attivo ? 
                      <span className="text-green-600 flex items-center gap-1 text-sm font-bold"><CheckCircle size={16}/> Attivo</span> : 
                      <span className="text-red-400 flex items-center gap-1 text-sm font-bold"><Ban size={16}/> Disabilitato</span>
                    }
                  </td>
                  <td className="p-6 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(agente)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                      title="Modifica"
                    >
                      <Edit2 size={18} />
                    </button>
                    
                    <button 
                      onClick={() => toggleStato(agente.id, agente.attivo)}
                      disabled={agente.id === currentUser?.id}
                      className={`p-2 rounded-lg transition-all ${
                        agente.id === currentUser?.id 
                        ? 'opacity-20 cursor-not-allowed' 
                        : agente.attivo 
                          ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' 
                          : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                      title={agente.id === currentUser?.id ? "Account attuale" : (agente.attivo ? "Disabilita" : "Abilita")}
                    >
                      {agente.attivo ? <Ban size={18} /> : <CheckCircle size={18} />}
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