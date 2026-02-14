import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function GestioneAgenti() {
  const [agenti, setAgenti] = useState([]);
  const [nuovoAgente, setNuovoAgente] = useState({ nome: '', cognome: '', email: '', role: 'agente' });

  // Carica lista agenti
  useEffect(() => { fetchAgenti(); }, []);

  async function fetchAgenti() {
    const { data } = await supabase.from('profiles').select('*');
    setAgenti(data);
  }

  async function aggiungiAgente() {
    // 1. Verifica se esiste già
    const { data: esiste } = await supabase.from('profiles').select('email').eq('email', nuovoAgente.email).single();
    if (esiste) { alert("Email già presente!"); return; }

    // 2. Inserimento (L'utente si creerà nel sistema auth al suo primo reset password)
    const { error } = await supabase.from('profiles').insert([nuovoAgente]);
    if (error) alert(error.message);
    else { alert("Agente aggiunto!"); fetchAgenti(); }
  }

  async function toggleAttivo(id, statoAttuale) {
    await supabase.from('profiles').update({ attivo: !statoAttuale }).eq('id', id);
    fetchAgenti();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Gestione Team Agenti</h2>
      
      {/* Form Aggiunta */}
      <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-6 rounded-xl">
        <input placeholder="Nome" className="p-2 border rounded" onChange={e => setNuovoAgente({...nuovoAgente, nome: e.target.value})} />
        <input placeholder="Cognome" className="p-2 border rounded" onChange={e => setNuovoAgente({...nuovoAgente, cognome: e.target.value})} />
        <input placeholder="Email" className="p-2 border rounded" onChange={e => setNuovoAgente({...nuovoAgente, email: e.target.value})} />
        <button onClick={aggiungiAgente} className="bg-green-600 text-white rounded font-bold">Registra Agente</button>
      </div>

      {/* Tabella Lista */}
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Nome</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Stato</th>
            <th className="p-3 text-left">Azione</th>
          </tr>
        </thead>
        <tbody>
          {agenti.map(a => (
            <tr key={a.id} className="border-t">
              <td className="p-3">{a.nome} {a.cognome}</td>
              <td className="p-3">{a.email}</td>
              <td className="p-3">{a.attivo ? '✅ Attivo' : '🚫 Disabilitato'}</td>
              <td className="p-3">
                <button onClick={() => toggleAttivo(a.id, a.attivo)} className="text-blue-600">
                  {a.attivo ? 'Disabilita' : 'Riabilita'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}