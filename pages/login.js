import { useState } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import { FileText, AlertCircle, X, CheckCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Stati per la Modal di Recupero
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverStatus, setRecoverStatus] = useState({ type: '', msg: '' });

  const router = useRouter();
  const favicon = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'/><polyline points='14 2 14 8 20 8'/></svg>";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg('Credenziali non valide');
    else router.push('/dashboard');
    setLoading(false);
  };

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    setRecoverLoading(true);
    setRecoverStatus({ type: '', msg: '' });

    // 1. Verifichiamo se l'email esiste ed è attiva nel nostro database
    const { data: profilo, error: dbError } = await supabase
      .from('profiles')
      .select('attivo')
      .eq('email', recoverEmail.toLowerCase().trim())
      .maybeSingle();

    if (!profilo || !profilo.attivo) {
      setRecoverStatus({ type: 'error', msg: 'Questa email non è abilitata.' });
      setRecoverLoading(false);
      return;
    }

    // 2. Se attiva, inviamo la mail di recupero password
    const { error: authError } = await supabase.auth.resetPasswordForEmail(recoverEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (authError) {
      setRecoverStatus({ type: 'error', msg: 'Errore durante l\'invio: ' + authError.message });
    } else {
      setRecoverStatus({ type: 'success', msg: 'Ti abbiamo inviato una mail con un link per impostare la tua password.' });
    }
    setRecoverLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <Head>
        <title>Contratti | Login</title>
        <link rel="icon" href={favicon} />
      </Head>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-200 mb-4">
            <FileText className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Contratti</h1>
        </div>

        {/* Form Login */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" placeholder="Email" required 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" placeholder="Password" required 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            {errorMsg && <div className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={16}/>{errorMsg}</div>}
            
            <button 
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          <button 
            onClick={() => { setShowRecoverModal(true); setRecoverStatus({type:'', msg:''}); }}
            className="w-full mt-6 text-sm font-medium text-blue-600 hover:text-blue-700 transition-all"
          >
            Ottieni o recupera la password
          </button>
        </div>
      </div>

      {/* Modal Recupero Password */}
      {showRecoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Recupera Password</h2>
              <button onClick={() => setShowRecoverModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>

            {recoverStatus.type === 'success' ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center text-green-500"><CheckCircle size={60} /></div>
                <p className="text-slate-600 leading-relaxed">{recoverStatus.msg}</p>
                <button 
                  onClick={() => setShowRecoverModal(false)}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl"
                >
                  Torna al login
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecoverPassword} className="space-y-4">
                <p className="text-slate-500 text-sm">Inserisci la tua email per ricevere il link di configurazione password.</p>
                <input 
                  type="email" placeholder="La tua email" required 
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500"
                  value={recoverEmail} onChange={(e) => setRecoverEmail(e.target.value)}
                />
                
                {recoverStatus.type === 'error' && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                    <AlertCircle size={18} /> {recoverStatus.msg}
                  </div>
                )}

                <button 
                  type="submit" disabled={recoverLoading}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                >
                  {recoverLoading ? 'Verifica in corso...' : 'Invia Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}