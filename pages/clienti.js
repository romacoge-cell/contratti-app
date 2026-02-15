import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import { 
  Plus, Search, Edit2, ArrowLeft, Save, 
  UserPlus, Trash2, Building2, Landmark, Users 
} from 'lucide-react';

export default function GestioneClienti() {
  const [clienti, setClienti] = useState([]);
  const [view, setView] = useState('list'); // 'list' o 'form'
  const [loading, setLoading] = useState(false);
  
  // Filtri
  const [filtri, setFiltri] = useState({ ragione_sociale: '', sdi: '', localita: '', provincia: '' });

  // Form Cliente
  const [form, setForm] = useState({
    ragione_sociale: '', via: '', civico: '', localita: '', provincia: '', cap: '',
    rappresentante_nome: '', rappresentante_cognome: '', codice_altuofianco: '',
    iban: '', banca: '', intestatario_conto: '', tipologia_intestatario: 'Partita IVA',
    debitore_nome_cognome: '', debitore_cf: '', sdi: '', pec: ''
  });

  // Referenti legati al cliente in modifica
  const [referenti, setReferenti] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchClienti(); }, []);

  async function fetchClienti() {
    const { data } = await supabase.from('clienti').select('*').order('ragione_sociale');
    setClienti(data || []);
  }

  const handleEdit = async (cliente) => {
    setForm(cliente);
    setEditingId(cliente.id);
    // Carica i referenti di questo cliente
    const { data } = await supabase.from('clienti_referenti').select('*').eq('cliente_id', cliente.id);
    setReferenti(data || []);
    setView('form');
  };

  const handleNuovo = () => {
    setForm({
      ragione_sociale: '', via: '', civico: '', localita: '', provincia: '', cap: '',
      rappresentante_nome: '', rappresentante_cognome: '', codice_altuofianco: '',
      iban: '', banca: '', intestatario_conto: '', tipologia_intestatario: 'Partita IVA',
      debitore_nome_cognome: '', debitore_cf: '', sdi: '', pec: ''
    });
    setReferenti([]);
    setEditingId(null);
    setView('form');
  };

  const salvaTutto = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: userData } = await supabase.auth.getUser();
    const clienteData = { ...form, agente_id: userData.user.id };

    let clienteId = editingId;

    if (editingId) {
      await supabase.from('clienti').update(clienteData).eq('id', editingId);
    } else {
      const { data, error } = await supabase.from('clienti').insert([clienteData]).select();
      if (!error) clienteId = data[0].id;
    }

    // Salvataggio referenti (logica semplificata: upsert)
    if (referenti.length > 0) {
      const referentiDaSalvare = referenti.map(r => ({ ...r, cliente_id: clienteId, agente_id: userData.user.id }));
      await supabase.from('clienti_referenti').upsert(referentiDaSalvare);
    }

    setLoading(false);
    setView('list');
    fetchClienti();
  };

  const aggiungiRigaReferente = () => {
    setReferenti([...referenti, { nome: '', cognome: '', email: '', telefono_fisso: '', telefono_cellulare: '' }]);
  };

  const filteredClienti = clienti.filter(c => 
    c.ragione_sociale.toLowerCase().includes(filtri.ragione_sociale.toLowerCase()) &&
    c.sdi.toLowerCase().includes(filtri.sdi.toLowerCase()) &&
    c.localita.toLowerCase().includes(filtri.localita.toLowerCase()) &&
    c.provincia.toLowerCase().includes(filtri.provincia.toLowerCase())
  );

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Head><title>Contratti | Clienti</title></Head>
      <Navbar />

      <main className="flex-1 ml-64 p-10">
        {view === 'list' ? (
          <>
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-3xl font-bold text-slate-900">Anagrafica Clienti</h1>
              <button onClick={handleNuovo} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg">
                <Plus size={20} /> Nuovo Cliente
              </button>
            </div>

            {/* Filtri */}
            <div className="grid grid-cols-4 gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <input placeholder="Ragione Sociale" className="p-3 bg-slate-50 rounded-xl outline-none" value={filtri.ragione_sociale} onChange={e => setFiltri({...filtri, ragione_sociale: e.target.value})} />
              <input placeholder="Partita IVA / SDI" className="p-3 bg-slate-50 rounded-xl outline-none" value={filtri.sdi} onChange={e => setFiltri({...filtri, sdi: e.target.value})} />
              <input placeholder="Località" className="p-3 bg-slate-50 rounded-xl outline-none" value={filtri.localita} onChange={e => setFiltri({...filtri, localita: e.target.value})} />
              <input placeholder="Provincia" maxLength={2} className="p-3 bg-slate-50 rounded-xl outline-none" value={filtri.provincia} onChange={e => setFiltri({...filtri, provincia: e.target.value})} />
            </div>

            {/* Tabella */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-6">Ragione Sociale</th>
                    <th className="p-6">Partita IVA / SDI</th>
                    <th className="p-6">Località</th>
                    <th className="p-6">Prov.</th>
                    <th className="p-6 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClienti.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 font-semibold text-slate-800">{c.ragione_sociale}</td>
                      <td className="p-6 text-slate-500">{c.sdi}</td>
                      <td className="p-6 text-slate-500">{c.localita}</td>
                      <td className="p-6 text-slate-500">{c.provincia}</td>
                      <td className="p-6 text-right">
                        <button onClick={() => handleEdit(c)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* FORM DI INSERIMENTO/MODIFICA */
          <form onSubmit={salvaTutto} className="max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
              <button type="button" onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
                <ArrowLeft size={20} /> Torna all'elenco
              </button>
              <h2 className="text-2xl font-bold">{editingId ? 'Modifica Cliente' : 'Nuovo Cliente'}</h2>
              <button type="submit" disabled={loading} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600">
                <Save size={20} /> {loading ? 'Salvataggio...' : 'Salva Cliente'}
              </button>
            </div>

            <div className="space-y-8">
              {/* ANAGRAFICA */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 text-blue-600">
                  <Building2 size={24} />
                  <h3 className="text-lg font-bold">Anagrafica Cliente</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Ragione Sociale</label>
                    <input required className="w-full p-4 bg-slate-50 rounded-2xl mt-1" value={form.ragione_sociale} onChange={e => setForm({...form, ragione_sociale: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Partita IVA / SDI</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1" value={form.sdi} onChange={e => setForm({...form, sdi: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Indirizzo (Via e Civico)</label>
                    <div className="flex gap-2">
                      <input className="flex-1 p-4 bg-slate-50 rounded-2xl mt-1" placeholder="Via" value={form.via} onChange={e => setForm({...form, via: e.target.value})} />
                      <input className="w-24 p-4 bg-slate-50 rounded-2xl mt-1" placeholder="Civ." value={form.civico} onChange={e => setForm({...form, civico: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:col-span-1">
                    <div className="col-span-2">
                       <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Località</label>
                       <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1" value={form.localita} onChange={e => setForm({...form, localita: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Cap</label>
                       <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1" value={form.cap} onChange={e => setForm({...form, cap: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Pr.</label>
                       <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1" maxLength={2} value={form.provincia} onChange={e => setForm({...form, provincia: e.target.value.toUpperCase()})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Rappresentante (Nome)</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1" value={form.rappresentante_nome} onChange={e => setForm({...form, rappresentante_nome: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Rappresentante (Cognome)</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1" value={form.rappresentante_cognome} onChange={e => setForm({...form, rappresentante_cognome: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase text-blue-600">Codice Altuofianco</label>
                    <input className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl mt-1 font-bold" maxLength={10} value={form.codice_altuofianco} onChange={e => setForm({...form, codice_altuofianco: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* DATI AMMINISTRATIVI */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 text-emerald-600">
                  <Landmark size={24} />
                  <h3 className="text-lg font-bold">Dati Amministrativi e Bancari</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">IBAN</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1 font-mono" value={form.iban} onChange={e => setForm({...form, iban: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Banca</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1" value={form.banca} onChange={e => setForm({...form, banca: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">PEC</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1" value={form.pec} onChange={e => setForm({...form, pec: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Intestatario Conto</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl mt-1" maxLength={200} value={form.intestatario_conto} onChange={e => setForm({...form, intestatario_conto: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Tipologia Intestatario</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl mt-1" value={form.tipologia_intestatario} onChange={e => setForm({...form, tipologia_intestatario: e.target.value})}>
                      <option value="Partita IVA">Partita IVA</option>
                      <option value="Codice Fiscale">Codice Fiscale</option>
                    </select>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl md:col-span-2 grid grid-cols-2 gap-4">
                    <div className="col-span-2 font-bold text-sm text-slate-400 mb-2">DATI DEBITORE (SE DIVERSO)</div>
                    <input className="p-4 bg-white rounded-2xl" placeholder="Nome/Cognome Debitore" value={form.debitore_nome_cognome} onChange={e => setForm({...form, debitore_nome_cognome: e.target.value})} />
                    <input className="p-4 bg-white rounded-2xl" placeholder="C.F. Debitore" value={form.debitore_cf} onChange={e => setForm({...form, debitore_cf: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* REFERENTI */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3 text-purple-600">
                    <Users size={24} />
                    <h3 className="text-lg font-bold">Referenti Aziendali</h3>
                  </div>
                  <button type="button" onClick={aggiungiRigaReferente} className="text-purple-600 font-bold flex items-center gap-1 hover:bg-purple-50 px-4 py-2 rounded-xl transition-all text-sm">
                    <Plus size={18} /> Aggiungi Referente
                  </button>
                </div>
                
                <div className="space-y-4">
                  {referenti.map((ref, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-2xl relative">
                      <input placeholder="Nome" className="p-3 bg-white rounded-xl" value={ref.nome} onChange={e => {
                        const newRefs = [...referenti]; newRefs[index].nome = e.target.value; setReferenti(newRefs);
                      }} />
                      <input placeholder="Cognome" className="p-3 bg-white rounded-xl" value={ref.cognome} onChange={e => {
                        const newRefs = [...referenti]; newRefs[index].cognome = e.target.value; setReferenti(newRefs);
                      }} />
                      <input placeholder="Email" className="p-3 bg-white rounded-xl" value={ref.email} onChange={e => {
                        const newRefs = [...referenti]; newRefs[index].email = e.target.value; setReferenti(newRefs);
                      }} />
                      <input placeholder="Cellulare" className="p-3 bg-white rounded-xl" value={ref.telefono_cellulare} onChange={e => {
                        const newRefs = [...referenti]; newRefs[index].telefono_cellulare = e.target.value; setReferenti(newRefs);
                      }} />
                      <div className="flex gap-2">
                        <input placeholder="Fisso" className="flex-1 p-3 bg-white rounded-xl" value={ref.telefono_fisso} onChange={e => {
                          const newRefs = [...referenti]; newRefs[index].telefono_fisso = e.target.value; setReferenti(newRefs);
                        }} />
                        <button type="button" onClick={() => setReferenti(referenti.filter((_, i) => i !== index))} className="p-3 text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                  {referenti.length === 0 && <p className="text-center text-slate-400 py-4 italic">Nessun referente inserito.</p>}
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}