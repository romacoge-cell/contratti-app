import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Funzione per il Login normale
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Controllo se l'agente è attivo prima di loggare
    const { data: profilo } = await supabase.from('profiles').select('attivo').eq('email', email).single();
    
    if (profilo && !profilo.attivo) {
      alert("Account disabilitato. Contatta l'amministratore.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  // Funzione per l'Agente che deve impostare la password la prima volta
  const handlePrimoAccesso = async () => {
    if (!email) { alert("Inserisci l'email per ricevere il link"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://tua-app.vercel.app/reset-password',
    });
    if (error) alert(error.message);
    else alert("Controlla l'email: ti abbiamo inviato il link per impostare la password.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">Gestionale Contratti</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-3 border rounded-lg" onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold">Accedi</button>
        </form>
        <button onClick={handlePrimoAccesso} className="w-full mt-4 text-sm text-blue-600 hover:underline">
          Primo accesso o password dimenticata?
        </button>
      </div>
    </div>
  );
}