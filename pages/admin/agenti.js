import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';
import { UserPlus, CheckCircle, Ban, Users, AlertCircle, Edit2, XCircle, Plus } from 'lucide-react';

export default function GestioneAgenti() {
  const [agenti, setAgenti] = useState([]);
  const [showForm, setShowForm] = useState(false); // Stato per mostrare/nascondere il form
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', role: 'agente' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAgenti();
  }, []);

  async function fetchAgenti() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setAgenti(data || []);
  }

  async function aggiungiAgente(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data: esiste } = await supabase.from('profiles').select('email').eq('email', form.email.toLowerCase().trim()).maybeSingle();
    if (esiste) {
      setErrorMsg('Questa email è già associata a un agente.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('profiles').insert([{ ...form, email: form.email.toLowerCase().trim(), attivo: true }]);

    if (error) {
      setErrorMsg('Errore: ' + error.message);
    } else {
      setForm({ nome: '', cognome: '', email: '', role: 'agente' });
      setShowForm(false);
      fetchAgenti();
    }
    setLoading(false);
  }

  async function toggleStato(id, statoAttuale) {
    await supabase.from('profiles').update({ attivo: !statoAttuale }).eq('id', id);
    fetchAgenti();
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Navbar />
      <main className="flex-1 ml-64 p-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Gestione Team Agenti</h1>
          
          {/* Pulsante per aprire il form */}
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <Plus size={20} /> Aggiungi Agente
            </button>
          )}
        </div>

        {/* Maschera di inserimento condizionale */}
        {showForm && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <UserPlus className="text-blue-600" /> Nuovo Collaboratore
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={aggiungiAgente} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              <input className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cognome" required value={form.cognome} onChange={e => setForm({...form, cognome: e.target.value})} />
              <input className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <select className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="agente">Agente</option>
                <option value="admin">Amministratore</option>
              </select>
              <button type="submit" disabled={loading} className="md:col-span-4 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all">
                {loading ? 'Salvataggio...' : 'Conferma Inserimento'}
              </button>
            </form>
            {errorMsg && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100"><AlertCircle size={20} /> {errorMsg}</div>}
          </div>
        )}

        {/* Lista Agenti con Pulsanti Azione */}
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
                    {/* Tasto Modifica */}
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Modifica">
                      <Edit2 size={18} />
                    </button>
                    
                    {/* Tasto Switch Stato (Abilita/Disabilita) */}
                    <button 
                      onClick={() => toggleStato(agente.id, agente.attivo)}
                      className={`p-2 rounded-lg transition-all ${agente.attivo ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}
                      title={agente.attivo ? "Disabilita" : "Abilita"}
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