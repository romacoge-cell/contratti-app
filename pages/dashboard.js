import { useEffect, useState } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [nome, setNome] = useState('');
  const favicon = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'/><polyline points='14 2 14 8 20 8'/></svg>";

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', user.id)
          .maybeSingle();
        setNome(data?.nome || 'Utente');
      }
    }
    getUserData();
  }, []);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Head>
        <title>Contratti | Dashboard</title>
        <link rel="icon" href={favicon} />
      </Head>

      <Navbar />

      <main className="flex-1 ml-64 p-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Benvenuto, {nome}</h1>
        <p className="text-slate-500 mb-8">Ecco cosa sta succedendo nel tuo team oggi.</p>

        {/* ESEMPIO CARD STATISTICHE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-slate-500 font-medium mb-1">Contratti Attivi</p>
            <p className="text-4xl font-bold text-slate-900">24</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-slate-500 font-medium mb-1">Nuovi Clienti</p>
            <p className="text-4xl font-bold text-blue-600">12</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-slate-500 font-medium mb-1">Fatturato Mese</p>
            <p className="text-4xl font-bold text-green-600">€ 4.500</p>
          </div>
        </div>
      </main>
    </div>
  );
}