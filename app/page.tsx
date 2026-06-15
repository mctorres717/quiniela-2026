"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 1. CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://spdhfslvbslsuuzckmqr.supabase.co';
const supabaseKey = 'sb_publishable_DH68PA1DWbc66PALwVDyXA_dHLQPrL1';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function QuinielaApp() {
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'DASHBOARD'>('LOGIN');
  const [activeTab, setActiveTab] = useState<'VOTAR' | 'MIS_VOTOS' | 'RESULTADOS' | 'TABLA'>('VOTAR');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Datos de Base de Datos
  const [dbStatus, setDbStatus] = useState('Conectando a Supabase...');
  const [users, setUsers] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);

  // Formularios
  const [form, setForm] = useState({ nombre: '', apellido: '', usuario: '', pin: '' });
  const [loginForm, setLoginForm] = useState({ usuario: '', pin: '' });
  
  // Votación
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [golesA, setGolesA] = useState('');
  const [golesB, setGolesB] = useState('');

  // --- EFECTO: CARGAR DATOS DESDE SUPABASE ---
  useEffect(() => {
    const fetchSupabaseData = async () => {
      try {
        // Corrección: Llamada a la tabla 'usuarios'
        const { data: usuariosData, error: errUsr } = await supabase.from('usuarios').select('*');
        if (!errUsr) setUsers(usuariosData || []);

        const { data: votosData, error: errVot } = await supabase.from('votos').select('*');
        if (!errVot) setVotes(votosData || []);

        const { data: partidosData, error: errPart } = await supabase.from('partidos').select('*');
        if (!errPart) setPartidos(partidosData || []);

        setDbStatus('🟢 Conectado a la BD');
      } catch (error: any) {
        setDbStatus(`🔴 Error: ${error.message}`);
      }
    };

    fetchSupabaseData();

    // Escuchar cambios en tiempo real
    const channel = supabase.channel('cambios-db')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votos' }, fetchSupabaseData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partidos' }, fetchSupabaseData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- LÓGICA DE REGISTRO E INICIO DE SESIÓN ---
  const handleRegister = async () => {
    if (!form.nombre || !form.apellido || !form.usuario || form.pin.length !== 4) {
      alert('Llena todos los campos. El PIN debe ser de 4 dígitos.'); return;
    }
    try {
      // Corrección: Inserción en la tabla 'usuarios'
      const { error } = await supabase.from('usuarios').insert([form]);
      if (error) throw error;
      alert('Registro exitoso. Ahora inicia sesión.');
      setView('LOGIN');
    } catch (error: any) {
      alert(`Error al registrar: ${error.message}`);
    }
  };

  const handleLogin = () => {
    const user = users.find(u => u.usuario === loginForm.usuario && u.pin === loginForm.pin);
    if (user) {
      setCurrentUser(user);
      setView('DASHBOARD');
    } else {
      alert('Usuario o PIN incorrecto.');
    }
  };

  // --- LÓGICA DE VOTACIÓN ---
  const handleVote = async () => {
    if (!selectedMatchId || golesA === '' || golesB === '') {
      alert('Selecciona un partido y coloca los goles.'); return;
    }
    const newVote = {
      usuario: currentUser.usuario,
      partido_id: Number(selectedMatchId),
      goles_local: Number(golesA),
      goles_visitante: Number(golesB)
    };
    try {
      const { error } = await supabase.from('votos').insert([newVote]);
      if (error) throw error;
      alert('¡Predicción guardada!');
      setGolesA(''); setGolesB(''); setSelectedMatchId('');
      
      // Actualizar vista local rápido para desaparecer el partido de la lista
      setVotes([...votes, newVote]);
    } catch (error: any) {
      alert(`Error al guardar: ${error.message}`);
    }
  };

  // --- CÁLCULO DE PUNTOS ---
  const calcularPuntos = () => {
    return users.map(user => {
      let puntosTotales = 0;
      const userVotes = votes.filter(v => v.usuario === user.usuario);

      userVotes.forEach(voto => {
        const partido = partidos.find(p => p.id === voto.partido_id);
        if (partido && partido.status === 'FINISHED' && partido.goles_local !== null) {
          const predA = voto.goles_local;
          const predB = voto.goles_visitante;
          const realA = partido.goles_local;
          const realB = partido.goles_visitante;

          const acertoMarcador = (predA === realA && predB === realB);
          const acertoGanador = (predA > predB && realA > realB) || 
                                (predA < predB && realA < realB) || 
                                (predA === predB && realA === realB);

          if (acertoMarcador) puntosTotales += 3;
          else if (acertoGanador) puntosTotales += 1;
        }
      });
      return { ...user, puntos: puntosTotales };
    }).sort((a, b) => b.puntos - a.puntos);
  };

  // --- ALGORITMO DE ORDENAMIENTO Y FILTRADO ---
  const partidosPendientes = partidos
    .filter(p => 
      // 1. Que el partido esté pendiente
      p.status === 'PENDING' && 
      // 2. Que el usuario actual NO haya votado por este partido
      !votes.some(v => v.partido_id === p.id && v.usuario === currentUser?.usuario)
    )
    .sort((a, b) => {
      // Ordenamiento cronológico por fecha y hora (Ej: "11 Jun | 15:00")
      const dayA = parseInt(a.date?.split(' ')[0]) || 0;
      const dayB = parseInt(b.date?.split(' ')[0]) || 0;
      if (dayA !== dayB) return dayA - dayB; // Ordena por día primero
      
      const timeA = a.date?.split('|')[1]?.trim() || "00:00";
      const timeB = b.date?.split('|')[1]?.trim() || "00:00";
      return timeA.localeCompare(timeB); // Si es el mismo día, ordena por hora
    });

  // --- PANTALLAS DE ACCESO ---
  if (view === 'LOGIN' || view === 'REGISTER') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 text-white relative overflow-hidden">
        {/* IMPORTACIÓN DE FUENTE DEPORTIVA */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
          .font-sports { font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; }
        `}</style>
        
        {/* BALONES DE FONDO */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]">
          <div className="absolute top-10 left-10 text-9xl rotate-12">⚽</div>
          <div className="absolute bottom-20 right-10 text-9xl -rotate-12">⚽</div>
          <div className="absolute top-1/2 left-2/3 text-8xl rotate-45">⚽</div>
        </div>

        <div className="absolute top-4 left-4 text-xs font-mono z-10 text-gray-500">{dbStatus}</div>
        
        <div className="bg-gray-900/90 backdrop-blur p-8 rounded-xl border border-gray-800 w-full max-w-md shadow-2xl z-10">
          <h1 className="text-4xl font-sports text-red-500 mb-6 text-center">Quiniela Copa Mundial de Fútbol de 2026</h1>
          
          {view === 'LOGIN' ? (
            <div className="space-y-4">
              <input type="text" placeholder="Usuario" className="w-full p-3 rounded bg-black border border-gray-700 outline-none focus:border-red-500 text-white" onChange={e => setLoginForm({...loginForm, usuario: e.target.value})} />
              <input type="password" placeholder="PIN de 4 dígitos" maxLength={4} className="w-full p-3 rounded bg-black border border-gray-700 outline-none focus:border-red-500 text-center tracking-[0.5em] font-bold text-white" onChange={e => setLoginForm({...loginForm, pin: e.target.value})} />
              <button onClick={handleLogin} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded uppercase tracking-wider">Ingresar</button>
              <p className="text-center text-gray-400 text-sm mt-4">¿No tienes cuenta? <span className="text-red-500 cursor-pointer font-bold" onClick={() => setView('REGISTER')}>Regístrate</span></p>
            </div>
          ) : (
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" className="w-full p-3 rounded bg-black border border-gray-700 outline-none focus:border-red-500 text-white" onChange={e => setForm({...form, nombre: e.target.value})} />
              <input type="text" placeholder="Apellido" className="w-full p-3 rounded bg-black border border-gray-700 outline-none focus:border-red-500 text-white" onChange={e => setForm({...form, apellido: e.target.value})} />
              <input type="text" placeholder="Usuario" className="w-full p-3 rounded bg-black border border-gray-700 outline-none focus:border-red-500 text-white" onChange={e => setForm({...form, usuario: e.target.value})} />
              <input type="password" placeholder="Crear PIN (4 dígitos)" maxLength={4} className="w-full p-3 rounded bg-black border border-gray-700 outline-none focus:border-red-500 text-center tracking-[0.5em] font-bold text-white" onChange={e => setForm({...form, pin: e.target.value})} />
              <button onClick={handleRegister} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded uppercase tracking-wider">Registrarme</button>
              <p className="text-center text-gray-400 text-sm mt-4">¿Ya tienes cuenta? <span className="text-red-500 cursor-pointer font-bold" onClick={() => setView('LOGIN')}>Inicia Sesión</span></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        .font-sports { font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; }
      `}</style>

      {/* BALONES DE FONDO DASHBOARD */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]">
        <div className="absolute top-20 left-5 text-[10rem] rotate-12">⚽</div>
        <div className="absolute bottom-10 right-20 text-[12rem] -rotate-12">⚽</div>
        <div className="absolute top-1/3 right-10 text-[8rem] rotate-45">⚽</div>
      </div>

      <header className="bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center relative z-10">
        <h1 className="text-2xl font-sports text-red-500 uppercase">Quiniela Copa Mundial de Fútbol de 2026</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden md:inline">Analista: <strong className="text-white">{currentUser?.nombre}</strong></span>
          <button onClick={() => { setCurrentUser(null); setView('LOGIN'); }} className="text-gray-500 hover:text-white px-3 py-1 rounded text-xs font-bold border border-gray-700 hover:border-gray-500">SALIR</button>
        </div>
      </header>

      {/* PESTAÑAS */}
      <div className="flex border-b border-gray-800 bg-black overflow-x-auto relative z-10">
        {[
          { id: 'VOTAR', label: 'Votar' },
          { id: 'MIS_VOTOS', label: 'Mi vestuario' },
          { id: 'RESULTADOS', label: 'Resultados' },
          { id: 'TABLA', label: 'Tabla de Posiciones' }
        ].map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[140px] py-4 text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'text-red-500 border-b-2 border-red-500 bg-red-900/10' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="max-w-5xl mx-auto p-4 md:p-6 relative z-10">
        
        {/* PESTAÑA: VOTAR */}
        {activeTab === 'VOTAR' && (
          <div className="bg-gray-900/90 backdrop-blur p-6 rounded-xl border border-gray-800 shadow-xl max-w-xl mx-auto">
            <h2 className="text-xl font-sports text-red-500 mb-6 uppercase border-b border-gray-800 pb-2">Seleccionar Partido</h2>
            
            <select 
              className="w-full p-4 mb-6 rounded-lg bg-black border border-gray-700 outline-none text-sm font-semibold text-white"
              value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}
            >
              <option value="">-- Elige un partido pendiente --</option>
              {partidosPendientes.map(p => (
                <option key={p.id} value={p.id}>{p.date} | {p.equipo_local} vs {p.equipo_visitante}</option>
              ))}
            </select>

            {selectedMatchId && (
              <div className="grid grid-cols-2 gap-6 bg-black p-6 rounded-lg border border-gray-800">
                <div className="text-center">
                  <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold truncate">Local</label>
                  <p className="font-sports text-2xl mb-2 text-white tracking-wider">{partidos.find(p => p.id === Number(selectedMatchId))?.equipo_local}</p>
                  <input type="number" min="0" value={golesA} onChange={e => setGolesA(e.target.value)} className="w-20 text-center p-3 text-3xl font-sports rounded bg-gray-900 border border-gray-700 outline-none text-white focus:border-red-500" />
                </div>
                <div className="text-center border-l border-gray-800">
                  <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold truncate">Visitante</label>
                  <p className="font-sports text-2xl mb-2 text-white tracking-wider">{partidos.find(p => p.id === Number(selectedMatchId))?.equipo_visitante}</p>
                  <input type="number" min="0" value={golesB} onChange={e => setGolesB(e.target.value)} className="w-20 text-center p-3 text-3xl font-sports rounded bg-gray-900 border border-gray-700 outline-none text-white focus:border-red-500" />
                </div>
              </div>
            )}
            <button onClick={handleVote} disabled={!selectedMatchId} className={`w-full mt-6 font-bold py-4 rounded-lg uppercase tracking-widest transition ${selectedMatchId ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg cursor-pointer' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
              Confirmar Predicción
            </button>
            {partidosPendientes.length === 0 && <p className="text-center text-green-500 mt-4 font-bold tracking-widest uppercase">⚽ ¡Has completado todas tus predicciones! ⚽</p>}
          </div>
        )}

        {/* PESTAÑA: MI VESTUARIO */}
        {activeTab === 'MIS_VOTOS' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-sports text-red-500 mb-4 uppercase border-b border-gray-800 pb-2">Tu Historial de Predicciones</h2>
            {votes.filter(v => v.usuario === currentUser.usuario).length > 0 ? (
              votes.filter(v => v.usuario === currentUser.usuario).map((voto, idx) => {
                const partido = partidos.find(p => p.id === voto.partido_id);
                
                let puntosGanados = 0;
                let colorPuntos = "text-gray-500";
                if (partido?.status === 'FINISHED' && partido?.goles_local !== null) {
                  const acertoMarcador = (voto.goles_local === partido.goles_local && voto.goles_visitante === partido.goles_visitante);
                  const acertoGanador = (voto.goles_local > voto.goles_visitante && partido.goles_local > partido.goles_visitante) || 
                                        (voto.goles_local < voto.goles_visitante && partido.goles_local < partido.goles_visitante) || 
                                        (voto.goles_local === voto.goles_visitante && partido.goles_local === partido.goles_visitante);
                  if (acertoMarcador) { puntosGanados = 3; colorPuntos = "text-green-500"; }
                  else if (acertoGanador) { puntosGanados = 1; colorPuntos = "text-yellow-500"; }
                  else { colorPuntos = "text-red-500"; }
                }

                return (
                  <div key={idx} className="bg-gray-900/90 backdrop-blur p-4 rounded-lg border border-gray-800 flex justify-between items-center shadow-md">
                    <div>
                      <p className="text-xs text-gray-500">{partido?.date}</p>
                      <p className="font-sports text-xl md:text-2xl text-white tracking-widest">{partido?.equipo_local} <span className="text-gray-600 mx-2 text-sm font-sans">vs</span> {partido?.equipo_visitante}</p>
                      
                      {partido?.status === 'FINISHED' && (
                        <div className={`mt-1 text-xs font-bold ${colorPuntos}`}>
                          {puntosGanados > 0 ? `+${puntosGanados} Puntos ganados` : '0 Puntos (Fallaste)'}
                        </div>
                      )}
                    </div>
                    <div className="bg-black px-4 md:px-6 py-2 rounded-lg border border-gray-800 text-center">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Tú dijiste</p>
                      <p className="text-2xl md:text-3xl font-sports text-white tracking-widest">{voto.goles_local} - {voto.goles_visitante}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-600 text-center py-10 border border-dashed border-gray-800 rounded-lg">Aún no has registrado ninguna predicción.</p>
            )}
          </div>
        )}

        {/* PESTAÑA: RESULTADOS */}
        {activeTab === 'RESULTADOS' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-sports text-red-500 mb-4 uppercase border-b border-gray-800 pb-2">Resultados Oficiales</h2>
            {partidos.filter(p => p.status === 'FINISHED').length > 0 ? (
              partidos.filter(p => p.status === 'FINISHED').map(p => (
                <div key={p.id} className="bg-gray-900/90 backdrop-blur p-4 rounded-lg border border-gray-800 flex justify-between items-center shadow-md">
                  <div>
                    <p className="text-xs text-gray-500">{p.date}</p>
                    <p className="font-sports text-xl md:text-2xl text-white tracking-widest">{p.equipo_local} <span className="text-gray-600 mx-2 text-sm font-sans">vs</span> {p.equipo_visitante}</p>
                  </div>
                  <div className="bg-red-900/20 px-4 md:px-6 py-2 rounded-lg border border-red-500/30 text-center">
                    <p className="text-[10px] text-red-400 uppercase font-bold">Marcador Final</p>
                    <p className="text-2xl md:text-3xl font-sports text-red-500 tracking-widest">{p.goles_local} - {p.goles_visitante}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-10 border border-dashed border-gray-800 rounded-lg">No hay partidos finalizados aún.</p>
            )}
          </div>
        )}

        {/* PESTAÑA: TABLA DE POSICIONES */}
        {activeTab === 'TABLA' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 bg-gray-900/90 backdrop-blur rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
              <div className="bg-black p-4 flex justify-between border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span className="w-12 text-center">Pos</span>
                <span className="flex-1">Analista</span>
                <span className="w-20 text-center">Puntos</span>
              </div>
              {calcularPuntos().map((user, idx) => (
                <div key={user.usuario} className={`p-4 flex justify-between items-center border-b border-gray-800/50 ${user.usuario === currentUser.usuario ? 'bg-red-900/10' : 'hover:bg-gray-800'}`}>
                  <span className={`w-12 text-center font-sports text-2xl ${idx === 0 ? 'text-red-500' : 'text-gray-500'}`}>{idx + 1}°</span>
                  <span className="flex-1 font-bold text-white uppercase tracking-wider text-sm">
                    {user.nombre} {user.apellido}
                    {user.usuario === currentUser.usuario && <span className="ml-2 text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">TÚ</span>}
                  </span>
                  <span className="w-20 text-center font-sports text-3xl text-red-500">{user.puntos}</span>
                </div>
              ))}
            </div>

            <div className="w-full lg:w-72 bg-gray-900/90 backdrop-blur p-6 rounded-xl border border-gray-800 h-fit">
              <h3 className="text-red-500 font-sports text-2xl tracking-widest border-b border-gray-800 pb-2 mb-4">Reglamento</h3>
              <ul className="space-y-4 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-sports text-2xl leading-none">+3</span>
                  <p><strong>Resultado Exacto:</strong> Acertar la cantidad de goles de ambos equipos.</p>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-sports text-2xl leading-none">+1</span>
                  <p><strong>Acierto de Ganador:</strong> Acertar qué equipo gana o si quedan en empate, sin atinar a los goles.</p>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-sports text-2xl leading-none">0</span>
                  <p><strong>Fallo Total:</strong> No acertar el ganador ni la cantidad de goles.</p>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}