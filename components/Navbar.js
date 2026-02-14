import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, FileText, LogOut, LayoutDashboard, UserSquare2 } from 'lucide-react';
import { useRouter } from 'next/router';

export default function Navbar() {
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setRole(data?.role);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="w-64 bg-slate-900 text-white min-h-screen p-6 flex flex-col fixed">
      <div className="mb-10 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
        <span className="text-xl font-bold tracking-tight">CONTRACT-PRO</span>
      </div>

      <div className="space-y-2 flex-1">
        {/* Voce visibile a tutti */}
        <a href="/dashboard" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all text-slate-300 hover:text-white">
          <LayoutDashboard size={20} /> Dashboard
        </a>

        {/* Voce visibile SOLO agli Admin */}
        {role === 'admin' && (
          <a href="/admin/agenti" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all text-slate-300 hover:text-white border-l-2 border-transparent hover:border-blue-500">
            <Users size={20} /> Agenti (Admin)
          </a>
        )}

        {/* Voci visibili a tutti */}
        <a href="/clienti" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all text-slate-300 hover:text-white">
          <UserSquare2 size={20} /> Clienti
        </a>
        <a href="/contratti" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all text-slate-300 hover:text-white">
          <FileText size={20} /> Contratti
        </a>
      </div>

      <button 
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 p-3 text-slate-400 hover:text-red-400 transition-colors"
      >
        <LogOut size={20} /> Esci
      </button>
    </nav>
  );
}