import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router'; // Serve per cambiare pagina

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Funzione per gestire l'accesso
  const handleLogin = async (e) => {
    e.preventDefault(); // Evita che la pagina si ricarichi
    setLoading(true);

    // Controllo se l'agente è attivo nel database prima di farlo entrare
    const { data: profilo, error: errorProfilo } = await supabase
      .from('profiles')
      .select('attivo')
      .eq('email', email)
      .single();

    if (profilo && !profilo.attivo) {
      alert("Il tuo account è stato disabilitato dall'amministratore.");
      setLoading(false);
      return;
    }

    // Login effettivo
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Errore: Credenziali non valide o utente non trovato.");
      setLoading(false);
    } else {
      // Successo! Mandiamo l'utente alla dashboard universale
      router.push('/dashboard');
    }
  };

  // 2. Funzione per il Primo Accesso (Reset Password)
  const handlePrimoAccesso = async () => {
    if (!email) {
      alert("Inserisci la tua email aziendale nel campo sopra per ricevere il link di attivazione.");
      return;
    }
    
    // Verifica se l'email esiste tra i profili creati dall'admin
    const { data: esiste } = await supabase.from('profiles').select('email').eq('email', email).single();
    
    if (!esiste) {
      alert("Questa email non risulta registrata. Contatta l'amministratore.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) alert(error.message);
    else alert("Controlla la tua email! Ti abbiamo inviato il link per impostare la tua password.");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-10 border border-slate-100">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Area Agenti</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestione Contratti Digitale</p>
        </div>

        {/* AGGIUNTO: onSubmit alla form */}
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Email Aziendale</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="email" 
                required
                placeholder="nome@azienda.it"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-200 hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'Accesso in corso...' : 'Entra nel portale'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50">
          {/* AGGIUNTO: onClick al bottone primo accesso */}
          <button 
            onClick={handlePrimoAccesso}
            className="w-full text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Primo accesso? Configura la tua password
          </button>
        </div>
      </div>
    </div>
  );
}