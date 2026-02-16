import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
// Aggiunta l'icona Layers per Sottotipologie
import { Users, FileText, LogOut, LayoutDashboard, UserSquare2, Settings, Layers } from 'lucide-react';
import { useRouter } from 'next/router';

export default function Navbar() {
  const [role, setRole] = useState(null);
  const router = useRouter();

  // ... (restante logica useEffect e logout invariata)

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
          <>
            <a href="/admin/agenti" className="flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-all text-slate-300 hover:text-white group">
              <Users size={20} className="group-hover:text-blue-400" /> Agenti
            </a>
            
            <a href="/tipologie" className="flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-all text-slate-300 hover:text-white group">
              <Settings size={20} className="group-hover:text-blue-400" /> Tipologie
            </a>

            {/* VOCE SOTTOTIPOLOGIE CON ICONA LAYERS */}
            <a href="/sottotipologie" className="flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-all text-slate-300 hover:text-white group">
              <Layers size={20} className="group-hover:text-blue-400" /> Sottotipologie
            </a>
          </>
        )}

        {/* ... (restanti voci Clienti e Contratti) */}
        <a href="/clienti" className="flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-all text-slate-300 hover:text-white group">
          <UserSquare2 size={20} className="group-hover:text-blue-400" /> Clienti
        </a>

        <a href="/contratti" className="flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-all text-slate-300 hover:text-white group">
          <FileText size={20} className="group-hover:text-blue-400" /> Contratti
        </a>
      </div>

      {/* ... (Logout) */}
    </nav>
  );
}