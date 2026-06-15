"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 1. CONFIGURACIÓN DE SUPABASE ---
// Reemplaza los textos entre comillas con tus claves reales
const supabaseUrl = 'https://spdhfslvbslsuuzckmqr.supabase.co';
const supabaseKey = 'sb_publishable_DH68PA1DWbc66PALwVDyXA_dHLQPrL1';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. BASE DE DATOS DE PARTIDOS (72 Juegos) ---
const PARTIDOS = [
  { id: 1, teamA: "México", teamB: "Sudáfrica", date: "11 Jun | 15:00", status: "FINISHED", scoreA: 2, scoreB: 0 },
  { id: 2, teamA: "Corea del Sur", teamB: "República Checa", date: "11 Jun | 22:00", status: "FINISHED", scoreA: 1, scoreB: 1 },
  { id: 3, teamA: "Canadá", teamB: "Bosnia y Herzegovina", date: "12 Jun | 15:00", status: "FINISHED", scoreA: 3, scoreB: 1 },
  { id: 4, teamA: "Estados Unidos", teamB: "Paraguay", date: "12 Jun | 21:00", status: "FINISHED", scoreA: 1, scoreB: 1 },
  { id: 5, teamA: "Catar", teamB: "Suiza", date: "13 Jun | 15:00", status: "FINISHED", scoreA: 0, scoreB: 2 },
  { id: 6, teamA: "Brasil", teamB: "Marruecos", date: "13 Jun | 18:00", status: "FINISHED", scoreA: 2, scoreB: 1 },
  { id: 7, teamA: "Haití", teamB: "Escocia", date: "13 Jun | 21:00", status: "FINISHED", scoreA: 0, scoreB: 1 },
  { id: 8, teamA: "Australia", teamB: "Turquía", date: "13 Jun | 00:00", status: "FINISHED", scoreA: 0, scoreB: 2 },
  { id: 9, teamA: "Alemania", teamB: "Curazao", date: "14 Jun | 13:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 10, teamA: "Países Bajos", teamB: "Japón", date: "14 Jun | 16:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 11, teamA: "Costa de Marfil", teamB: "Ecuador", date: "14 Jun | 19:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 12, teamA: "Suecia", teamB: "Túnez", date: "14 Jun | 22:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 13, teamA: "España", teamB: "Cabo Verde", date: "15 Jun | 12:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 14, teamA: "Bélgica", teamB: "Egipto", date: "15 Jun | 15:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 15, teamA: "Arabia Saudí", teamB: "Uruguay", date: "15 Jun | 18:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 16, teamA: "RI de Irán", teamB: "Nueva Zelanda", date: "15 Jun | 21:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 17, teamA: "Francia", teamB: "Senegal", date: "16 Jun | 15:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 18, teamA: "Irak", teamB: "Noruega", date: "16 Jun | 18:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 19, teamA: "Argentina", teamB: "Argelia", date: "16 Jun | 21:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 20, teamA: "Austria", teamB: "Jordania", date: "16 Jun | 00:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 21, teamA: "Portugal", teamB: "RD de Congo", date: "17 Jun | 13:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 22, teamA: "Inglaterra", teamB: "Croacia", date: "17 Jun | 16:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 23, teamA: "Ghana", teamB: "Panamá", date: "17 Jun | 19:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 24, teamA: "Uzbekistán", teamB: "Colombia", date: "17 Jun | 22:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 25, teamA: "República Checa", teamB: "Sudáfrica", date: "18 Jun | 12:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 26, teamA: "Suiza", teamB: "Bosnia y Herzegovina", date: "18 Jun | 15:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 27, teamA: "Canadá", teamB: "Catar", date: "18 Jun | 18:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 28, teamA: "México", teamB: "Corea del Sur", date: "18 Jun | 21:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 29, teamA: "Estados Unidos", teamB: "Australia", date: "19 Jun | 15:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 30, teamA: "Escocia", teamB: "Marruecos", date: "19 Jun | 18:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 31, teamA: "Brasil", teamB: "Haití", date: "19 Jun | 21:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 32, teamA: "Turquía", teamB: "Paraguay", date: "19 Jun | 00:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 33, teamA: "Países Bajos", teamB: "Suecia", date: "20 Jun | 13:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 34, teamA: "Alemania", teamB: "Costa de Marfil", date: "20 Jun | 16:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 35, teamA: "Ecuador", teamB: "Curazao", date: "20 Jun | 22:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 36, teamA: "Túnez", teamB: "Japón", date: "20 Jun | 00:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 37, teamA: "España", teamB: "Arabia Saudí", date: "21 Jun | 12:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 38, teamA: "Bélgica", teamB: "RI de Irán", date: "21 Jun | 15:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 39, teamA: "Uruguay", teamB: "Cabo Verde", date: "21 Jun | 18:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 40, teamA: "Nueva Zelanda", teamB: "Egipto", date: "21 Jun | 21:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 41, teamA: "Argentina", teamB: "Austria", date: "22 Jun | 13:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 42, teamA: "Francia", teamB: "Irak", date: "22 Jun | 17:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 43, teamA: "Noruega", teamB: "Senegal", date: "22 Jun | 20:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 44, teamA: "Jordania", teamB: "Argelia", date: "22 Jun | 23:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 45, teamA: "Portugal", teamB: "Uzbekistán", date: "23 Jun | 13:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 46, teamA: "Inglaterra", teamB: "Ghana", date: "23 Jun | 16:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 47, teamA: "Panamá", teamB: "Croacia", date: "23 Jun | 19:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 48, teamA: "Colombia", teamB: "RD de Congo", date: "23 Jun | 22:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 49, teamA: "Suiza", teamB: "Canadá", date: "24 Jun | 15:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 50, teamA: "Bosnia y Herzegovina", teamB: "Catar", date: "24 Jun | 15:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 51, teamA: "Brasil", teamB: "Escocia", date: "24 Jun | 18:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 52, teamA: "Marruecos", teamB: "Haití", date: "24 Jun | 18:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 53, teamA: "República Checa", teamB: "México", date: "24 Jun | 21:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 54, teamA: "Sudáfrica", teamB: "Corea del Sur", date: "24 Jun | 21:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 55, teamA: "Curazao", teamB: "Costa de Marfil", date: "25 Jun | 16:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 56, teamA: "Ecuador", teamB: "Alemania", date: "25 Jun | 16:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 57, teamA: "Japón", teamB: "Suecia", date: "25 Jun | 19:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 58, teamA: "Túnez", teamB: "Países Bajos", date: "25 Jun | 19:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 59, teamA: "Turquía", teamB: "Estados Unidos", date: "25 Jun | 22:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 60, teamA: "Paraguay", teamB: "Australia", date: "25 Jun | 22:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 61, teamA: "Noruega", teamB: "Francia", date: "26 Jun | 15:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 62, teamA: "Senegal", teamB: "Irak", date: "26 Jun | 15:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 63, teamA: "Cabo Verde", teamB: "Arabia Saudí", date: "26 Jun | 20:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 64, teamA: "Uruguay", teamB: "España", date: "26 Jun | 20:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 65, teamA: "Egipto", teamB: "RI de Irán", date: "26 Jun | 23:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 66, teamA: "Nueva Zelanda", teamB: "Bélgica", date: "26 Jun | 23:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 67, teamA: "Panamá", teamB: "Inglaterra", date: "27 Jun | 17:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 68, teamA: "Croacia", teamB: "Ghana", date: "27 Jun | 17:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 69, teamA: "Colombia", teamB: "Portugal", date: "27 Jun | 19:30", status: "PENDING", scoreA: null, scoreB: null },
  { id: 70, teamA: "RD de Congo", teamB: "Uzbekistán", date: "27 Jun | 19:30", status: "PENDING", scoreA: null, scoreB: null },
  { id: 71, teamA: "Argelia", teamB: "Austria", date: "27 Jun | 22:00", status: "PENDING", scoreA: null, scoreB: null },
  { id: 72, teamA: "Jordania", teamB: "Argentina", date: "27 Jun | 22:00", status: "PENDING", scoreA: null, scoreB: null },
];

export default function QuinielaApp() {
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'DASHBOARD'>('LOGIN');
  const [activeTab, setActiveTab] = useState<'VOTAR' | 'MIS_VOTOS' | 'TABLA'>('VOTAR');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Datos de Base de Datos
  const [dbStatus, setDbStatus] = useState('Conectando a Supabase...');
  const [users, setUsers] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);

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
        const { data: usuariosData, error: errUsuarios } = await supabase.from('usuarios').select('*');
        if (errUsuarios) {
          setDbStatus(`🔴 Falla leyendo 'usuarios': ${errUsuarios.message}`);
          return;
        }
        setUsers(usuariosData || []);

        const { data: votosData, error: errVotos } = await supabase.from('votos').select('*');
        if (errVotos) {
          setDbStatus(`🔴 Falla leyendo 'votos': ${errVotos.message}`);
          return;
        }
        setVotes(votosData || []);

        setDbStatus('🟢 Conectado a la Base de Datos');
      } catch (error: any) {
        setDbStatus(`🔴 Error crítico de Red: ${error.message}`);
      }
    };

    fetchSupabaseData();
  }, []);

  // --- LÓGICA DE REGISTRO E INICIO DE SESIÓN ---
  const handleRegister = async () => {
    if (!form.nombre || !form.apellido || !form.usuario || form.pin.length !== 4) {
      alert('Llena todos los campos. El PIN debe ser de 4 dígitos.'); return;
    }
    
    try {
      const { data, error } = await supabase.from('usuarios').insert([form]).select();
      
      if (error) {
        // AQUÍ ESTÁ LA MAGIA: Supabase nos dirá exactamente qué columna está mal
        alert(`Fallo en Supabase: ${error.message} (Código: ${error.code})`);
        return;
      }
      
      setUsers([...users, form]);
      alert('Registro exitoso. Ahora inicia sesión.');
      setView('LOGIN');
    } catch (error: any) {
      alert(`Error de red o ejecución: ${error.message}`);
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

      setVotes([...votes, newVote]);
      alert('¡Predicción guardada en la nube!');
      setGolesA(''); setGolesB(''); setSelectedMatchId('');
    } catch (error) {
      alert('Error al guardar el voto. Verifica la tabla "votos".');
      console.log(error);
    }
  };

  // --- CÁLCULO DE PUNTOS ---
  const calcularPuntos = () => {
    const leaderboard = users.map(user => {
      let puntosTotales = 0;
      const userVotes = votes.filter(v => v.usuario === user.usuario);

      userVotes.forEach(voto => {
        const partido = PARTIDOS.find(p => p.id === voto.partido_id);
        if (partido && partido.status === 'FINISHED' && partido.scoreA !== null && partido.scoreB !== null) {
          const predA = voto.goles_local;
          const predB = voto.goles_visitante;
          const realA = partido.scoreA;
          const realB = partido.scoreB;

          const acertóGanador = Math.sign(predA - predB) === Math.sign(realA - realB);
          const acertóGoles = predA === realA && predB === realB;

          if (acertóGoles) puntosTotales += 3;
          else if (acertóGanador) puntosTotales += 1;
        }
      });
      return { ...user, puntos: puntosTotales };
    });
    return leaderboard.sort((a, b) => b.puntos - a.puntos);
  };

  // --- PANTALLAS ---
  if (view === 'LOGIN' || view === 'REGISTER') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="absolute top-4 left-4 text-xs font-mono">{dbStatus}</div>
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl">
          <h1 className="text-3xl font-extrabold text-amber-500 mb-6 text-center uppercase tracking-widest">Quiniela 2026</h1>
          
          {view === 'LOGIN' ? (
            <div className="space-y-4">
              <input type="text" placeholder="Usuario" className="w-full p-3 rounded bg-slate-900 border border-slate-700 outline-none focus:border-amber-500" onChange={e => setLoginForm({...loginForm, usuario: e.target.value})} />
              <input type="password" placeholder="PIN de 4 dígitos" maxLength={4} className="w-full p-3 rounded bg-slate-900 border border-slate-700 outline-none focus:border-amber-500 text-center tracking-[0.5em] font-bold" onChange={e => setLoginForm({...loginForm, pin: e.target.value})} />
              <button onClick={handleLogin} className="w-full bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold py-3 rounded uppercase tracking-wider">Ingresar</button>
              <p className="text-center text-slate-400 text-sm mt-4">¿No tienes cuenta? <span className="text-amber-500 cursor-pointer font-bold" onClick={() => setView('REGISTER')}>Regístrate</span></p>
            </div>
          ) : (
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" className="w-full p-3 rounded bg-slate-900 border border-slate-700 outline-none focus:border-amber-500" onChange={e => setForm({...form, nombre: e.target.value})} />
              <input type="text" placeholder="Apellido" className="w-full p-3 rounded bg-slate-900 border border-slate-700 outline-none focus:border-amber-500" onChange={e => setForm({...form, apellido: e.target.value})} />
              <input type="text" placeholder="Usuario" className="w-full p-3 rounded bg-slate-900 border border-slate-700 outline-none focus:border-amber-500" onChange={e => setForm({...form, usuario: e.target.value})} />
              <input type="password" placeholder="Crear PIN (4 dígitos)" maxLength={4} className="w-full p-3 rounded bg-slate-900 border border-slate-700 outline-none focus:border-amber-500 text-center tracking-[0.5em] font-bold" onChange={e => setForm({...form, pin: e.target.value})} />
              <button onClick={handleRegister} className="w-full bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold py-3 rounded uppercase tracking-wider">Registrarme</button>
              <p className="text-center text-slate-400 text-sm mt-4">¿Ya tienes cuenta? <span className="text-amber-500 cursor-pointer font-bold" onClick={() => setView('LOGIN')}>Inicia Sesión</span></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <header className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <h1 className="text-xl font-bold text-amber-500 uppercase tracking-widest">Quiniela Oficial</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">Jugador: <strong className="text-white">{currentUser?.nombre}</strong></span>
          <button onClick={() => { setCurrentUser(null); setView('LOGIN'); }} className="bg-red-500/20 text-red-500 px-3 py-1 rounded text-xs font-bold border border-red-500/50">SALIR</button>
        </div>
      </header>

      <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto">
        {[
          { id: 'VOTAR', label: 'Votar por partido' },
          { id: 'MIS_VOTOS', label: 'Mis Votaciones' },
          { id: 'TABLA', label: 'Tabla de Posiciones' }
        ].map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[150px] py-4 text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-900/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {/* PESTAÑA: VOTAR */}
        {activeTab === 'VOTAR' && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl max-w-xl mx-auto">
            <h2 className="text-lg font-bold text-amber-400 mb-6 uppercase border-b border-slate-700 pb-2">Seleccionar Partido</h2>
            <select 
              className="w-full p-4 mb-6 rounded-lg bg-slate-900 border border-slate-600 outline-none text-sm font-semibold text-white"
              value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}
            >
              <option value="">-- Elige un partido pendiente --</option>
              {PARTIDOS.filter(p => p.status === 'PENDING').map(p => (
                <option key={p.id} value={p.id}>{p.date} | {p.teamA} vs {p.teamB}</option>
              ))}
            </select>

            {selectedMatchId && (
              <div className="grid grid-cols-2 gap-6 bg-slate-900 p-6 rounded-lg border border-slate-700">
                <div className="text-center">
                  <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold truncate">Goles Local</label>
                  <p className="font-bold text-lg mb-2 text-white">{PARTIDOS.find(p => p.id === Number(selectedMatchId))?.teamA}</p>
                  <input type="number" min="0" value={golesA} onChange={e => setGolesA(e.target.value)} className="w-20 text-center p-3 text-2xl font-bold rounded bg-slate-800 border border-slate-600 outline-none text-white" />
                </div>
                <div className="text-center border-l border-slate-800">
                  <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold truncate">Goles Visitante</label>
                  <p className="font-bold text-lg mb-2 text-white">{PARTIDOS.find(p => p.id === Number(selectedMatchId))?.teamB}</p>
                  <input type="number" min="0" value={golesB} onChange={e => setGolesB(e.target.value)} className="w-20 text-center p-3 text-2xl font-bold rounded bg-slate-800 border border-slate-600 outline-none text-white" />
                </div>
              </div>
            )}
            <button onClick={handleVote} className="w-full mt-6 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold py-4 rounded-lg uppercase tracking-widest shadow-lg">Confirmar Predicción</button>
          </div>
        )}

        {/* PESTAÑA: MIS VOTACIONES */}
        {activeTab === 'MIS_VOTOS' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-amber-400 mb-4 uppercase border-b border-slate-700 pb-2">Tu Historial de Predicciones</h2>
            {votes.filter(v => v.usuario === currentUser.usuario).length > 0 ? (
              votes.filter(v => v.usuario === currentUser.usuario).map((voto, idx) => {
                const partido = PARTIDOS.find(p => p.id === voto.partido_id);
                return (
                  <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center shadow-md">
                    <div>
                      <p className="text-xs text-slate-400">{partido?.date}</p>
                      <p className="font-bold text-sm md:text-lg">{partido?.teamA} <span className="text-amber-500 mx-2 text-sm">vs</span> {partido?.teamB}</p>
                    </div>
                    <div className="bg-slate-900 px-4 md:px-6 py-2 rounded-lg border border-slate-600 text-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Tu Pronóstico</p>
                      <p className="text-xl md:text-2xl font-extrabold text-white tracking-widest">{voto.goles_local} - {voto.goles_visitante}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-slate-500 text-center py-10 border border-dashed border-slate-700 rounded-lg">Aún no has registrado ninguna predicción.</p>
            )}
          </div>
        )}

        {/* PESTAÑA: TABLA DE POSICIONES */}
        {activeTab === 'TABLA' && (
          <div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
              <div className="bg-slate-900 p-4 flex justify-between border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className="w-12 text-center">Pos</span>
                <span className="flex-1">Analista</span>
                <span className="w-20 text-center">Puntos</span>
              </div>
              {calcularPuntos().map((user, idx) => (
                <div key={user.usuario} className={`p-4 flex justify-between items-center border-b border-slate-700/50 ${user.usuario === currentUser.usuario ? 'bg-amber-900/20' : 'hover:bg-slate-700/30'}`}>
                  <span className={`w-12 text-center font-bold text-lg ${idx === 0 ? 'text-amber-400' : 'text-slate-500'}`}>{idx + 1}°</span>
                  <span className="flex-1 font-bold">
                    {user.nombre} {user.apellido}
                    {user.usuario === currentUser.usuario && <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">TÚ</span>}
                  </span>
                  <span className="w-20 text-center font-extrabold text-2xl text-amber-400">{user.puntos}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs text-slate-400">
              <strong className="text-amber-500">Reglamento:</strong> <br/>
              • 3 Puntos: Acertar marcador exacto.<br/>
              • 1 Punto: Acertar ganador o empate (sin atinar los goles exactos).<br/>
              • 0 Puntos: Fallar el pronóstico.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}