import Navbar from '../components/Navbar';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [nome, setNome] = useState('');

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('profiles').select('nome').eq('id', user.id).single();
      setNome(data?.nome || 'Utente');
    }
    getUserData();
  }, []);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Navbar />
      
      <main className="flex-1 ml-64 p-10">
        <header className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h1 className="text-3xl font-bold text-slate-900">Benvenuto, {nome}!</h1>
          <p className="text-slate-500 mt-2 text-lg">Seleziona una voce dal menu per iniziare.</p>
        </header>

        {/* Qui in futuro metteremo le statistiche o gli ultimi contratti */}
      </main>
    </div>
  );
}