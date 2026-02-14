import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';
import { UserPlus, Shield, User, Mail, Trash2, Ban, CheckCircle } from 'lucide-react';

export default function GestioneAgenti() {
  const [agenti, setAgenti] = useState([]);
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', role: 'agente' });
  const [loading, setLoading] = useState(false);

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

    // 1. Verifica se l'email esiste già
    const { data: esiste } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', form.email)
      .single();

    if (esiste) {
      alert("Attenzione: Un utente con questa email è già registrato.");
      setLoading(false);
      return;
    }

    // 2. Inserimento anagrafica
    const { error } = await supabase.from('profiles').insert([
      { 
        nome: form.nome, 
        cognome: form.cognome, 
        email: form.email, 
        role: form.role,
        attivo: true 
      }
    ]);

    if (error) {
      alert("Errore durante l'inserimento: " + error.message);
    } else {
      alert("Agente registrato con successo!");
      setForm({ nome: '', cognome: '', email: '', role: 'agente' });
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
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Gestione Team Agenti</h1>

        {/* Form di Inserimento */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-10">
          <div className="flex items-center gap-3 mb-6 text-blue-600">
            <UserPlus size={24} />
            <h2 className="text-xl font-bold text-slate-800">Nuovo Collaboratore</h2>
          </div>
          
          <form onSubmit={aggiungiAgente} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              type="text" placeholder="Nome" required
              className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
              value={form.nome} onChange={e => setForm({...form, nome: e.target.value})}
            />
            <input 
              type="text" placeholder="Cognome" required
              className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
              value={form.cognome} onChange={e => setForm({...form, cognome: e.target.value})}
            />
            <input 
              type="email" placeholder="Email aziendale" required
              className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            />
            <select 
              className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
              value={form.role} onChange={e => setForm({...form, role: e.target.value})}
            >
              <option value="agente">Agente</option>
              <option value="admin">Amministratore</option>
            </select>
            <button 
              type="submit" disabled={loading}
              className="md:col-span-4 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Registrazione...' : 'Censisci Agente'}
            </button>
          </form>
        </div>

        {/* Tabella Agenti */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="p-6 font-semibold">Nominativo</th>
                <th className="p-6 font-semibold">Email</th>
                <th className="p-6 font-semibold">Ruolo</th>
                <th className="p-6 font-semibold">Stato</th>
                <th className="p-6 font-semibold text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agenti.map(agente => (
                <tr key={agente.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-medium text-slate-900">{agente.nome} {agente.cognome}</td>
                  <td className="p-6 text-slate-600">{agente.email}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${agente.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {agente.role}
                    </span>
                  </td>
                  <td className="p-6">
                    {agente.attivo ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle size={16}/> Attivo</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 font-medium"><Ban size={16}/> Disabilitato</span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => toggleStato(agente.id, agente.attivo)}
                      className={`text-sm font-bold ${agente.attivo ? 'text-red-500' : 'text-blue-600'} hover:underline`}
                    >
                      {agente.attivo ? 'Disabilita' : 'Attiva'}
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