import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';

// IMPORT DEI COMPONENTI MODULARI
import ContrattiFilters from '../components/ContrattiFilters';
import ContrattiTable from '../components/ContrattiTable';
import ContrattiForm from '../components/ContrattiForm';
import ModalReferente from '../components/ModalReferente'; // <--- Il tuo componente

import { Plus } from 'lucide-react';

export default function Contratti() {
  const [view, setView] = useState('list');
  const [isEdit, setIsEdit] = useState(false);
  const [contratti, setContratti] = useState([]);
  const [agenti, setAgenti] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showRefModal, setShowRefModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- STATI FILTRI ---
  const [filtri, setFiltri] = useState({
    agente_id: '', ragione_sociale: '', tipo: '', stato: '',
    data_esito_da: '', data_esito_a: ''
  });
  const [suggerimentiFiltro, setSuggerimentiFiltro] = useState([]);

  // --- STATI FORM ---
  const [searchQuery, setSearchQuery] = useState('');
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [referentiCliente, setReferentiCliente] = useState([]);

  const [form, setForm] = useState({
    cliente_id: '', agente_id: '', tipo: 'A1', stato: 'Bozza',
    ref_nome: '', ref_cognome: '', ref_email: '', ref_telefono: '', ref_cellulare: '',
    via: '', civico: '', localita: '', provincia: '', cap: '',
    rappresentante_nome: '', rappresentante_cognome: '', codice_altuofianco: '',
    iban: '', banca: '', intestatario_conto: '', tipologia_intestatario: 'Partita IVA',
    debitore_nome_cognome: '', debitore_cf: '', sdi: '', pec: '',
    data_firma: new Date().toISOString().split('T')[0], luogo_firma: '', data_esito: ''
  });

  // --- LOGICA INIZIALE ---
  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setUserProfile(profile);
    if (profile.role === 'admin') {
      const { data: ags } = await supabase.from('profiles').select('id, nome, cognome');
      setAgenti(ags || []);
    }
    fetchContratti();
  }

  // --- FETCH DATI ---
  async function fetchContratti() {
    let query = supabase
      .from('contratti')
      .select('*, clienti!inner(ragione_sociale), profiles:agente_id(nome, cognome)')
      .order('created_at', { ascending: false });

    if (filtri.agente_id) query = query.eq('agente_id', filtri.agente_id);
    if (filtri.tipo) query = query.eq('tipo', filtri.tipo);
    if (filtri.stato) query = query.eq('stato', filtri.stato);
    if (filtri.ragione_sociale) query = query.ilike('clienti.ragione_sociale', `%${filtri.ragione_sociale}%`);
    if (filtri.data_esito_da) query = query.gte('data_esito', filtri.data_esito_da);
    if (filtri.data_esito_a) query = query.lte('data_esito', filtri.data_esito_a);

    const { data } = await query;
    setContratti(data || []);
  }

  // Trigger filtri con debounce
  useEffect(() => {
    const t = setTimeout(() => fetchContratti(), 300);
    return () => clearTimeout(t);
  }, [filtri]);

  // Suggerimenti filtro ragione sociale
  useEffect(() => {
    if (filtri.ragione_sociale.length > 1) {
      supabase.from('clienti').select('ragione_sociale').ilike('ragione_sociale', `%${filtri.ragione_sociale}%`).limit(5)
        .then(({data}) => setSuggerimentiFiltro(data || []));
    } else setSuggerimentiFiltro([]);
  }, [filtri.ragione_sociale]);

  // Suggerimenti Form Cliente
  useEffect(() => {
    if (searchQuery.length > 1 && !form.cliente_id) {
      supabase.from('clienti').select('*').ilike('ragione_sociale', `%${searchQuery}%`).limit(5)
        .then(({data}) => setSuggerimenti(data || []));
    } else setSuggerimenti([]);
  }, [searchQuery, form.cliente_id]);

  // --- AZIONI ---
const selezionaCliente = async (cli) => {
  setForm({ ...form, 
    cliente_id: cli.id, 
    via: cli.via || '', 
    civico: cli.civico || '', 
    localita: cli.localita || '', 
    provincia: cli.provincia || '', 
    cap: cli.cap || '', 
    // AGGIUNGI QUESTE DUE RIGHE:
    rappresentante_nome: cli.rappresentante_nome || '',
    rappresentante_cognome: cli.rappresentante_cognome || '',
    // -------------------------
    iban: cli.iban || '', 
    banca: cli.banca || '', 
    sdi: cli.sdi || '', 
    pec: cli.pec || '', 
    intestatario_conto: cli.ragione_sociale || '',
    codice_altuofianco: cli.codice_altuofianco || ''
  });
  setSearchQuery(cli.ragione_sociale);
  const { data: refs } = await supabase.from('clienti_referenti').select('*').eq('cliente_id', cli.id);
  setReferentiCliente(refs || []);
};

  const salvaContratto = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('contratti').upsert({ ...form, agente_id: form.agente_id || userProfile.id });
    if (error) alert(error.message);
    else { setView('list'); fetchContratti(); }
    setLoading(false);
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Navbar />
      <main className="flex-1 ml-64 p-10">
        
        {view === 'list' ? (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter uppercase">Gestione Contratti</h1>
              <button 
                onClick={() => { setView('form'); setIsEdit(false); setSearchQuery(''); }} 
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl uppercase text-xs"
              >
                <Plus size={18} /> Nuovo Contratto
              </button>
            </div>

            <ContrattiFilters 
              filtri={filtri} 
              setFiltri={setFiltri} 
              agenti={agenti} 
              userProfile={userProfile} 
              suggerimentiFiltro={suggerimentiFiltro} 
              setSuggerimentiFiltro={setSuggerimentiFiltro} 
            />

            <ContrattiTable 
              contratti={contratti} 
              userProfile={userProfile} 
              onEdit={(c) => { 
                setForm(c); 
                setSearchQuery(c.clienti?.ragione_sociale || '');
                setIsEdit(true); 
                setView('form'); 
              }} 
            />
          </>
        ) : (
          <ContrattiForm 
            form={form} 
            setForm={setForm}
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            suggerimenti={suggerimenti} 
            selezionaCliente={selezionaCliente}
            referentiCliente={referentiCliente}
            agenti={agenti} 
            userProfile={userProfile}
            loading={loading}
            onBack={() => setView('list')}
            onSubmit={salvaContratto}
            setShowRefModal={setShowRefModal}
          />
        )}

        {/* MODAL REFERENTE: Collegato allo stato del file principale */}
        {showRefModal && (
          <ModalReferente 
            clienteId={form.cliente_id} 
            onClose={() => setShowRefModal(false)} 
            onSuccess={(r) => { 
                // 1. Aggiunge il nuovo referente alla lista dei selezionabili
                setReferentiCliente([...referentiCliente, r]); 
                // 2. Autocompila i campi del referente nel form del contratto
                setForm({
                  ...form, 
                  ref_nome: r.nome, 
                  ref_cognome: r.cognome, 
                  ref_email: r.email, 
                  ref_telefono: r.telefono_fisso, 
                  ref_cellulare: r.telefono_cellulare
                }); 
                // 3. Chiude il modal
                setShowRefModal(false); 
            }} 
          />
        )}
      </main>
    </div>
  );
}