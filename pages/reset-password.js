import { useState } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import { FileText, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const favicon = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'/><polyline points='14 2 14 8 20 8'/></svg>";

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Le password non coincidono');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setErrorMsg('Errore: ' + error.message);
    } else {
      setSuccess(true);
      // Reindirizza al login dopo 3 secondi
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <Head>
        <title>Contratti | Reset Password</title>
        <link rel="icon" href={favicon} />
      </Head>

      <div className="w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-200 mb-4">
            <KeyRound className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Nuova Password</h1>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 text-left">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center text-green-500"><CheckCircle size={60} /></div>
              <h2 className="text-xl font-bold text-slate-900">Password Aggiornata!</h2>
              <p className="text-slate-500">La tua password è stata salvata. Verrai reindirizzato al login tra pochi istanti...</p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <p className="text-slate-500 text-sm mb-6">Inserisci la tua nuova password di accesso.</p>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nuova Password</label>
                <input 
                  type="password" required 
                  className="w-full p-4 mt-1 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Conferma Password</label>
                <input 
                  type="password" required 
                  className="w-full p-4 mt-1 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                  <AlertCircle size={18} /> {errorMsg}
                </div>
              )}
              
              <button 
                disabled={loading}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg mt-4"
              >
                {loading ? 'Aggiornamento...' : 'Salva Nuova Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}