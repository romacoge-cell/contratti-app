import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';
import { UserPlus, CheckCircle, Ban, AlertCircle, Edit2, X, Plus } from 'lucide-react';

export default function GestioneAgenti() {
  const [agenti, setAgenti] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', role: 'agente' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const favicon = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'/><polyline points='14 2 14 8 20 8'/></svg>";

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      fetchAgenti();
    };
    init();
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

  async function salvaAgente(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const emailLimpa = form.email.toLowerCase().trim();

    if (isEditing) {
      // MODIFICA: Aggiorna solo i dati del profilo esistente
      const { error } = await supabase.from('profiles').update({ ...form, email: emailLimpa }).eq('id', editingId);
      if (error) setErrorMsg(error.message);
      else { setShowModal(false); fetchAgenti(); }
    } else {
      // NUOVO AGENTE: 
      // 1. Verifichiamo se esiste già nel database dei profili
      const { data: esiste } = await supabase.from('profiles').select('email').eq('email', emailLimpa).maybeSingle();
      if (esiste) {
        setErrorMsg('Questa email è già registrata nel sistema.');
        setLoading(false);
        return;
      }

      // 2. Usiamo la funzione di invito di Supabase Auth
      // Nota: Questo invia la mail e crea l'utente in Authentication > Users
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(emailLimpa, {
        redirectTo: `${window.location.origin}/reset-password`,
        data: { nome: form.nome, cognome: form.cognome } // Metadati opzionali
      });

      if (authError) {
        // Se ricevi errore "401 Unauthorized" qui, significa che devi usare la Service Role Key 
        // o, più semplicemente per il tuo caso, creare l'utente e mandargli il reset.
        setErrorMsg("Errore creazione account: " + authError.message);
      } else {
        // 3. Creiamo la riga nella tabella profiles usando l'ID appena generato
        const { error: profError } = await supabase.from('profiles').insert([
          { 
            id: authData.user.id, // Colleghiamo l'ID di Authentication al profilo
            nome: form.nome, 
            cognome: form.cognome, 
            email: emailLimpa, 
            role: form.role,
            attivo: true 
          }
        ]);

        if (profError) setErrorMsg(profError.message);
        else { setShowModal(false); fetchAgenti(); }
      }
    }
    setLoading(false);
  }

  async function toggleStato(id, statoAttuale) {
    if (id === currentUser?.id) return alert("Azione non permessa sul proprio account.");
    await supabase.from('profiles').update({ attivo: !statoAttuale }).eq('id', id);
    fetchAgenti();
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Head>
        <title>Contratti | Agenti</title>
        <link rel="icon" href={favicon} />
      </Head>

      <Navbar />

      <main className="flex-1 ml-64 p-10">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Gestione Team Agenti</h1>
          <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            <Plus size={20} /> Aggiungi Agente
          </button>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{isEditing ? 'Modifica' : 'Nuovo Agente'}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={salvaAgente} className="space-y-4">
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" placeholder="Nome" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" placeholder="Cognome" required value={form.cognome} onChange={e => setForm({...form, cognome: e.target.value})} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-medium" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="agente">Agente</option>
                  <option value="admin">Amministratore</option>
                </select>
                
                {/* Nota informativa */}
                {!isEditing && <p className="text-[10px] text-slate-400 px-1">Al salvataggio verrà inviata una mail di invito per impostare la password.</p>}
                
                {errorMsg && <p className="text-red-500 text-sm font-medium">{errorMsg}</p>}
                
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg">
                  {loading ? 'Elaborazione...' : 'Conferma e Invia Invito'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tabella (Invariata) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${agente.attivo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'}`}>
                      {agente.attivo ? 'ATTIVO' : 'DISABILITATO'}
                    </span>
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