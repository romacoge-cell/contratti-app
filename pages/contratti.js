import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';

// IMPORT DEI COMPONENTI MODULARI
import ContrattiFilters from '../components/ContrattiFilters';
import ContrattiTable from '../components/ContrattiTable';
import ContrattiForm from '../components/ContrattiForm';
import ModalReferente from '../components/ModalReferente';

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

  const initialFormState = {
    cliente_id: '', 
    agente_id: '', 
    tipo: 'A1', 
    stato: 'Bozza',
    ref_nome: '', ref_cognome: '', ref_email: '', ref_telefono: '', ref_cellulare: '',
    via: '', civico: '', localita: '', provincia: '', cap: '',
    rappresentante_nome: '', rappresentante_cognome: '', 
    segnalatore_nome_cognome: '',
    codice_altuofianco: '',
    iban: '', banca: '', intestatario_conto: '', tipologia_intestatario: 'Partita IVA',
    debitore_nome_cognome: '', debitore_cf: '', sdi: '', pec: '',
    data_firma: new Date().toISOString().split('T')[0], 
    luogo_firma: '', 
    data_esito: ''
  };

  const [form, setForm] = useState(initialFormState);

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

  useEffect(() => {
    const t = setTimeout(() => fetchContratti(), 300);
    return () => clearTimeout(t);
  }, [filtri]);

  useEffect(() => {
    if (searchQuery.length > 1 && !form.cliente_id) {
      supabase.from('clienti').select('*').ilike('ragione_sociale', `%${searchQuery}%`).limit(5)
        .then(({data}) => setSuggerimenti(data || []));
    } else setSuggerimenti([]);
  }, [searchQuery, form.cliente_id]);

  // --- AZIONI ---
  const selezionaCliente = async (cli) => {
    setForm({ 
      ...form, 
      cliente_id: cli.id, 
      via: cli.via || '', 
      civico: cli.civico || '', 
      localita: cli.localita || '', 
      provincia: cli.provincia || '', 
      cap: cli.cap || '', 
      rappresentante_nome: cli.rappresentante_nome || '',
      rappresentante_cognome: cli.rappresentante_cognome || '',
      iban: cli.iban || '', 
      banca: cli.banca || '', 
      sdi: cli.sdi || '', 
      pec: cli.pec || '', 
      debitore_nome_cognome: cli.debitore_nome_cognome || '',
      debitore_cf: cli.debitore_cf || '',
      intestatario_conto: cli.intestatario_conto || cli.ragione_sociale || '',
      tipologia_intestatario: cli.tipologia_intestatario || 'Partita IVA',
      codice_altuofianco: cli.codice_altuofianco || ''
    });
    setSearchQuery(cli.ragione_sociale);
    const { data: refs } = await supabase.from('clienti_referenti').select('*').eq('cliente_id', cli.id);
    setReferentiCliente(refs || []);
  };

  const handleEdit = async (c) => {
    setForm(c); 
    setSearchQuery(c.clienti?.ragione_sociale || '');
    setIsEdit(true); 
    
    // Recupero referenti per popolare la select nel form durante la modifica
    if (c.cliente_id) {
      const { data: refs } = await supabase.from('clienti_referenti').select('*').eq('cliente_id', c.cliente_id);
      setReferentiCliente(refs || []);
    } else {
      setReferentiCliente([]);
    }
    
    setView('form'); 
  };

  const salvaContratto = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    // 1. Pulizia oggetti join per evitare errore 400 (PGRST204)
    const { clienti, profiles, ...datiPuliti } = form;

    // 2. Normalizzazione date e campi obbligatori
    const payload = {
      ...datiPuliti,
      agente_id: form.agente_id || userProfile.id,
      data_firma: form.data_firma || null,
      data_esito: form.data_esito || null
    };

    const { error } = await supabase.from('contratti').upsert(payload);

    if (error) {
      console.error("Errore salvataggio:", error);
      alert("Errore durante il salvataggio: " + error.message);
    } else { 
      setView('list'); 
      fetchContratti(); 
    }
    setLoading(false);
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Navbar />
      <main className="flex-1 ml-64 p-10">
        
        {view === 'list' ? (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Gestione Contratti</h1>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Archivio contratti e pratiche</p>
              </div>
              <button 
                onClick={() => { 
                  setView('form'); 
                  setIsEdit(false); 
                  setSearchQuery(''); 
                  setForm(initialFormState);
                  setReferentiCliente([]);
                }} 
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-blue-700 uppercase text-xs transition-all active:scale-95"
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
              onEdit={handleEdit} 
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

        {showRefModal && (
          <ModalReferente 
            clienteId={form.cliente_id} 
            onClose={() => setShowRefModal(false)} 
            onSuccess={(r) => { 
                setReferentiCliente(prev => [...prev, r]); 
                setForm({
                  ...form, 
                  ref_nome: r.nome, 
                  ref_cognome: r.cognome, 
                  ref_email: r.email, 
                  ref_telefono: r.telefono_fisso, 
                  ref_cellulare: r.telefono_cellulare
                }); 
                setShowRefModal(false); 
            }} 
          />
        )}
      </main>
    </div>
  );
}