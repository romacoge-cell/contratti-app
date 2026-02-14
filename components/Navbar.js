import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, FileText, LogOut, LayoutDashboard, UserSquare2 } from 'lucide-react';
import { useRouter } from 'next/router';

export default function Navbar() {
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
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
    getProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-white flex flex-col shadow-2xl">
      {/* LOGO E TITOLO */}
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <FileText className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight">Contratti</span>
        </div>
      </div>

      {/* VOCI DI MENU */}
      <div className="flex-1 px-4 space-y-2">
        <a href="/dashboard" className="flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-all text-slate-300 hover:text-white group">
          <LayoutDashboard size={20} className="group-hover:text-blue-400" /> Dashboard
        </a>

        {role === 'admin' && (
          <a href="/admin/agenti" className="flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-all text-slate-300 hover:text-white group">
            <Users size={20} className="group-hover:text-blue-400" /> Agenti
          </a>
        )}

        <a href="/clienti" className="flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-all text-slate-300 hover:text-white group">
          <UserSquare2 size={20} className="group-hover:text-blue-400" /> Clienti
        </a>

        <a href="/contratti" className="flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-all text-slate-300 hover:text-white group">
          <FileText size={20} className="group-hover:text-blue-400" /> Contratti
        </a>
      </div>

      {/* LOGOUT */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-medium"
        >
          <LogOut size={20} /> Esci
        </button>
      </div>
    </nav>
  );
}