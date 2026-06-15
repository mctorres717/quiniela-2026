"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE SUPABASE ---
const supabase = createClient(
  'https://spdhfslvbslsuuzckmqr.supabase.co',
  'sb_publishable_DH68PA1DWbc66PALwVDyXA_dHLQPrL1'
);

const getGrupoPorId = (id: number) => {
  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  return groups[Math.floor((id - 1) / 6)];
};

export default function QuinielaApp() {
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'DASHBOARD'>('LOGIN');
  // SE AGREGA LA PESTAÑA CALENDARIO
  const [activeTab, setActiveTab] = useState<'CALENDARIO' | 'VOTAR' | 'MIS_VOTOS' | 'RESULTADOS' | 'TABLA'>('CALENDARIO');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Datos
  const [users, setUsers] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [fechasMundial, setFechasMundial] = useState<string[]>([]);
  const [fechaHoyStr, setFechaHoyStr] = useState('');
  const [grupoActivo, setGrupoActivo] = useState('HOY');

  // Formularios
  const [form, setForm] = useState({ nombre: '', apellido: '', usuario: '', pin: '' });
  const [loginForm, setLoginForm] = useState({ usuario: '', pin: '' });
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [golesA, setGolesA] = useState('');
  const [golesB, setGolesB] = useState('');

  useEffect(() => {
    const fetchSupabaseData = async () => {
      const { data: usuariosData } = await supabase.from('usuarios').select('*');
      if (usuariosData) setUsers(usuariosData);

      const { data: votosData } = await supabase.from('votos').select('*');
      if (votosData) setVotes(votosData);

      const { data: partidosData } = await supabase.from('partidos').select('*').order('id', { ascending: true });
      if (partidosData) {
        setPartidos(partidosData);
        const fechas = Array.from(new Set(partidosData.map((p: any) => p.date.split(" | ")[0]))).sort((a: any, b: any) => {
          return parseInt(a.split(" ")[0]) - parseInt(b.split(" ")[0]);
        }) as string[];
        setFechasMundial(fechas);
        if (fechas.length > 0 && !fechaHoyStr) setFechaHoyStr(fechas[0]);
      }
    };

    fetchSupabaseData();

    const channel = supabase.channel('cambios-db')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votos' }, fetchSupabaseData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partidos' }, fetchSupabaseData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fechaHoyStr]);

  const handleRegister = async () => {
    if (!form.nombre || !form.apellido || !form.usuario || form.pin.length !== 4) return alert('Llena todos los campos');
    const { error } = await supabase.from('usuarios').insert([form]);
    if (error) alert(`Error: ${error.message}`);
    else { alert('Registro exitoso.'); setView('LOGIN'); }
  };

  const handleLogin = () => {
    const user = users.find(u => u.usuario === loginForm.usuario && u.pin === loginForm.pin);
    if (user) { setCurrentUser(user); setView('DASHBOARD'); }
    else alert('Usuario o PIN incorrecto.');
  };

  const handleVote = async () => {
    if (!selectedMatchId || golesA === '' || golesB === '') return alert('Completa los campos');
    const newVote = { usuario: currentUser.usuario, partido_id: Number(selectedMatchId), goles_local: Number(golesA), goles_visitante: Number(golesB) };
    const { error } = await supabase.from('votos').insert([newVote]);
    if (error) alert(`Error: ${error.message}`);
    else { alert('¡Predicción guardada!'); setGolesA(''); setGolesB(''); setSelectedMatchId(''); setVotes([...votes, newVote]); }
  };

  const calcularPuntos = () => {
    return users.map(user => {
      let ptos = 0;
      votes.filter(v => v.usuario === user.usuario).forEach(voto => {
        const p = partidos.find(pa => pa.id === voto.partido_id);
        if (p && p.status === 'FINISHED' && p.goles_local !== null) {
          if (voto.goles_local === p.goles_local && voto.goles_visitante === p.goles_visitante) ptos += 3;
          else if ((voto.goles_local > voto.goles_visitante && p.goles_local > p.goles_visitante) || (voto.goles_local < voto.goles_visitante && p.goles_local < p.goles_visitante) || (voto.goles_local === voto.goles_visitante && p.goles_local === p.goles_visitante)) ptos += 1;
        }
      });
      return { ...user, puntos: ptos };
    }).sort((a, b) => b.puntos - a.puntos);
  };

  // Login Screen (Simplificada para espacio)
  if (view === 'LOGIN' || view === 'REGISTER') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'); .font-sports { font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; }`}</style>
        <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md border border-gray-800">
          <h1 className="text-4xl font-sports text-red-500 mb-6 text-center">Quiniela 2026</h1>
          {view === 'LOGIN' ? (
            <div className="space-y-4">
              <input type="text" placeholder="Usuario" className="w-full p-3 rounded bg-black border border-gray-700 text-white" onChange={e => setLoginForm({...loginForm, usuario: e.target.value})} />
              <input type="password" placeholder="PIN" className="w-full p-3 rounded bg-black border border-gray-700 text-center tracking-widest text-white" onChange={e => setLoginForm({...loginForm, pin: e.target.value})} />
              <button onClick={handleLogin} className="w-full bg-red-600 text-white font-bold py-3 rounded">Ingresar</button>
              <p className="text-center text-gray-400 mt-4 cursor-pointer" onClick={() => setView('REGISTER')}>Regístrate</p>
            </div>
          ) : (
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" className="w-full p-3 rounded bg-black border border-gray-700 text-white" onChange={e => setForm({...form, nombre: e.target.value})} />
              <input type="text" placeholder="Apellido" className="w-full p-3 rounded bg-black border border-gray-700 text-white" onChange={e => setForm({...form, apellido: e.target.value})} />
              <input type="text" placeholder="Usuario" className="w-full p-3 rounded bg-black border border-gray-700 text-white" onChange={e => setForm({...form, usuario: e.target.value})} />
              <input type="password" placeholder="PIN (4 dígitos)" className="w-full p-3 rounded bg-black border border-gray-700 text-center tracking-widest text-white" onChange={e => setForm({...form, pin: e.target.value})} />
              <button onClick={handleRegister} className="w-full bg-red-600 text-white font-bold py-3 rounded">Registrarme</button>
              <p className="text-center text-gray-400 mt-4 cursor-pointer" onClick={() => setView('LOGIN')}>Inicia Sesión</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lógica Calendario
  const partidosFiltrados = grupoActivo === 'HOY' 
    ? partidos.filter(match => match.date.includes(fechaHoyStr))
    : partidos.filter(match => getGrupoPorId(match.id) === grupoActivo);

  const partidosPendientes = partidos.filter(p => p.status === 'PENDING' && !votes.some(v => v.partido_id === p.id && v.usuario === currentUser?.usuario));

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'); .font-sports { font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; }`}</style>
      
      <header className="bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-sports text-red-500">Mundial 2026</h1>
        <div className="flex gap-4 items-center">
          <span className="hidden md:inline">{currentUser?.nombre}</span>
          <button onClick={() => setView('LOGIN')} className="text-xs bg-gray-800 px-3 py-1 rounded">SALIR</button>
        </div>
      </header>

      {/* Pestañas Horizontales Scrolleables (Mobile friendly) */}
      <div className="flex overflow-x-auto bg-gray-900 border-b border-gray-800 scrollbar-hide">
        {[{ id: 'CALENDARIO', label: 'Calendario' }, { id: 'VOTAR', label: 'Votar' }, { id: 'MIS_VOTOS', label: 'Mis Votos' }, { id: 'RESULTADOS', label: 'Resultados' }, { id: 'TABLA', label: 'Posiciones' }].map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-none min-w-[120px] py-4 text-xs md:text-sm font-bold uppercase transition ${activeTab === tab.id ? 'text-red-500 border-b-2 border-red-500 bg-red-900/10' : 'text-gray-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="p-4 md:p-6 max-w-6xl mx-auto">
        
        {/* PESTAÑA 1: CALENDARIO OFICIAL */}
        {activeTab === 'CALENDARIO' && (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Controles de Grupo/Fecha (Arriba en móvil, lado en PC) */}
            <div className="w-full md:w-48 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button onClick={() => setGrupoActivo('HOY')} className={`px-4 py-2 flex-none md:w-full rounded text-xs font-bold ${grupoActivo === 'HOY' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}>FECHAS</button>
              {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => (
                <button key={g} onClick={() => setGrupoActivo(g)} className={`px-4 py-2 flex-none md:w-full rounded text-xs font-bold ${grupoActivo === g ? 'bg-amber-500 text-black' : 'bg-gray-900 border border-gray-800'}`}>GRUPO {g}</button>
              ))}
            </div>

            {/* Grid de Partidos (Responsive) */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4 bg-gray-900 p-3 rounded-lg border border-gray-800">
                {grupoActivo === 'HOY' ? (
                  <select value={fechaHoyStr} onChange={(e) => setFechaHoyStr(e.target.value)} className="bg-black text-amber-500 font-bold border border-gray-700 rounded p-2 text-sm outline-none w-full md:w-auto">
                    {fechasMundial.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                ) : (
                  <h2 className="text-amber-500 font-bold uppercase tracking-widest">Partidos Grupo {grupoActivo}</h2>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {partidosFiltrados.map((match) => (
                  <div key={match.id} className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 flex justify-between items-center shadow-lg">
                    <div className="flex flex-col items-center w-2/5">
                      <span className="font-sports text-xl truncate w-full text-center">{match.equipo_local}</span>
                    </div>
                    <div className="flex flex-col items-center w-1/5">
                      <span className="text-[10px] text-gray-500 mb-1">{match.date.split(' | ')[1]}</span>
                      <span className={`px-3 py-1 rounded text-lg font-sports ${match.status === 'FINISHED' ? 'bg-emerald-600 text-white' : 'bg-black text-gray-500 border border-gray-800'}`}>
                        {match.status === 'FINISHED' ? `${match.goles_local} - ${match.goles_visitante}` : 'VS'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center w-2/5">
                      <span className="font-sports text-xl truncate w-full text-center">{match.equipo_visitante}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LAS OTRAS PESTAÑAS (Simplificadas para mantener estructura) */}
        {activeTab === 'VOTAR' && (
           <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 max-w-xl mx-auto">
             <select className="w-full p-4 mb-6 rounded-lg bg-black text-white" value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}>
               <option value="">-- Elige un partido --</option>
               {partidosPendientes.map(p => <option key={p.id} value={p.id}>{p.date} | {p.equipo_local} vs {p.equipo_visitante}</option>)}
             </select>
             {selectedMatchId && (
               <div className="flex justify-between items-center mb-6 bg-black p-4 rounded border border-gray-800">
                 <input type="number" value={golesA} onChange={e => setGolesA(e.target.value)} className="w-16 text-center text-2xl font-bold bg-gray-900 p-2 rounded text-white outline-none" />
                 <span className="font-sports text-xl">VS</span>
                 <input type="number" value={golesB} onChange={e => setGolesB(e.target.value)} className="w-16 text-center text-2xl font-bold bg-gray-900 p-2 rounded text-white outline-none" />
               </div>
             )}
             <button onClick={handleVote} className="w-full bg-red-600 font-bold py-4 rounded text-white uppercase">Confirmar Predicción</button>
           </div>
        )}

        {activeTab === 'MIS_VOTOS' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {votes.filter(v => v.usuario === currentUser.usuario).map((voto, idx) => {
               const p = partidos.find(pa => pa.id === voto.partido_id);
               return (
                 <div key={idx} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex justify-between items-center">
                   <div><p className="text-xs text-gray-500">{p?.date}</p><p className="font-sports text-xl">{p?.equipo_local} vs {p?.equipo_visitante}</p></div>
                   <div className="bg-black px-4 py-2 rounded text-center"><p className="text-2xl font-sports text-red-500">{voto.goles_local} - {voto.goles_visitante}</p></div>
                 </div>
               )
             })}
           </div>
        )}

        {activeTab === 'RESULTADOS' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {partidos.filter(p => p.status === 'FINISHED').map(p => (
               <div key={p.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex justify-between items-center">
                 <div><p className="text-xs text-gray-500">{p.date}</p><p className="font-sports text-xl">{p.equipo_local} vs {p.equipo_visitante}</p></div>
                 <div className="bg-red-900/30 px-4 py-2 rounded text-center"><p className="text-2xl font-sports text-emerald-500">{p.goles_local} - {p.goles_visitante}</p></div>
               </div>
             ))}
           </div>
        )}

        {activeTab === 'TABLA' && (
           <div className="bg-gray-900 rounded-xl border border-gray-800">
             {calcularPuntos().map((user, idx) => (
               <div key={user.usuario} className="p-4 flex justify-between items-center border-b border-gray-800/50">
                 <span className="w-12 font-sports text-2xl text-gray-500">{idx + 1}°</span>
                 <span className="flex-1 font-bold">{user.nombre} {user.apellido}</span>
                 <span className="w-20 text-center font-sports text-3xl text-red-500">{user.puntos}</span>
               </div>
             ))}
           </div>
        )}
      </main>
    </div>
  );
}