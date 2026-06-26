"use client";

import React, { useState, useEffect, useRef } from 'react';
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

const FLAGS: Record<string, string> = {
  "México": "🇲🇽", "Sudáfrica": "🇿🇦", "Corea del Sur": "🇰🇷", "República Checa": "🇨🇿",
  "Canadá": "🇨🇦", "Bosnia y Herzegovina": "🇧🇦", "Catar": "🇶🇦", "Suiza": "🇨🇭",
  "Brasil": "🇧🇷", "Marruecos": "🇲🇦", "Haití": "🇭🇹", "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Estados Unidos": "🇺🇸", "Paraguay": "🇵🇾", "Australia": "🇦🇺", "Turquía": "🇹🇷",
  "Alemania": "🇩🇪", "Curazao": "🇨🇼", "Costa de Marfil": "🇨🇮", "Ecuador": "🇪🇨",
  "Países Bajos": "🇳🇱", "Japón": "🇯🇵", "Suecia": "🇸🇪", "Túnez": "🇹🇳",
  "Bélgica": "🇧🇪", "Egipto": "🇪🇬", "RI de Irán": "🇮🇷", "Nueva Zelanda": "🇳🇿",
  "España": "🇪🇸", "Cabo Verde": "🇨🇻", "Arabia Saudí": "🇸🇦", "Uruguay": "🇺🇾",
  "Francia": "🇫🇷", "Senegal": "🇸🇳", "Irak": "🇮🇶", "Noruega": "🇳🇴",
  "Argentina": "🇦🇷", "Argelia": "🇩🇿", "Austria": "🇦🇹", "Jordania": "🇯🇴",
  "Portugal": "🇵🇹", "RD de Congo": "🇨🇩", "Uzbekistán": "🇺🇿", "Colombia": "🇨🇴",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croacia": "🇭🇷", "Ghana": "🇬🇭", "Panamá": "🇵🇦"
};

export default function QuinielaApp() {
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'DASHBOARD'>('LOGIN');
  const [activeTab, setActiveTab] = useState<'PRINCIPAL' | 'CALENDARIO' | 'RESULTADOS' | 'POSICIONES_MUNDIAL' | 'VOTAR' | 'MIS_VOTOS' | 'RANKING_QUINIELA'>('PRINCIPAL');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [users, setUsers] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [fechasMundial, setFechasMundial] = useState<string[]>([]);
  const [fechaHoyStr, setFechaHoyStr] = useState('');
  const [grupoActivo, setGrupoActivo] = useState('HOY');

  const [form, setForm] = useState({ nombre: '', apellido: '', usuario: '', pin: '' });
  const [loginForm, setLoginForm] = useState({ usuario: '', pin: '' });
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [golesA, setGolesA] = useState('');
  const [golesB, setGolesB] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // LÓGICA DE AUTO-LOGOUT Y BORRADO DE SESIÓN
  const handleLogout = () => {
    setCurrentUser(null);
    setView('LOGIN');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentView');
    }
  };

  // INYECTOR AUTOMÁTICO DE PWA Y RECUPERADOR DE SESIÓN
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser');
      const savedView = localStorage.getItem('currentView');
      if (savedUser && savedView === 'DASHBOARD') {
        setCurrentUser(JSON.parse(savedUser));
        setView('DASHBOARD');
      }

      if (!document.querySelector('link[rel="manifest"]')) {
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = '/manifest.json';
        document.head.appendChild(link);
      }

      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').then((reg) => {
            console.log('PWA Service Worker en marcha en:', reg.scope);
          });
        });
      }
    }
  }, []);

  // VIGILANTE DE INACTIVIDAD DE 5 MINUTOS
  useEffect(() => {
    if (!currentUser) return;

    let inactivityTimeout: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        alert('Tu sesión ha expirado por inactividad de 5 minutos.');
        handleLogout();
      }, 5 * 60 * 1000);
    };

    const userEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    userEvents.forEach(event => window.addEventListener(event, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimeout);
      userEvents.forEach(event => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [currentUser]);

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

  const handleKeyDownLogin = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleLogin(); };
  const handleKeyDownRegister = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleRegister(); };

  const handleRegister = async () => {
    if (!form.nombre || !form.apellido || !form.usuario || form.pin.length !== 4) return alert('Llena todos los campos');
    const { error } = await supabase.from('usuarios').insert([form]);
    if (error) alert(`Error: ${error.message}`);
    else { alert('Registro exitoso.'); setView('LOGIN'); }
  };

  const handleLogin = () => {
    const user = users.find(u => u.usuario === loginForm.usuario && u.pin === loginForm.pin);
    if (user) {
      setCurrentUser(user);
      setView('DASHBOARD');
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('currentView', 'DASHBOARD');
      }
    }
    else alert('Usuario o PIN incorrecto.');
  };

  // --- MOTOR DE VOTOS TOTALMENTE CORREGIDO Y BLINDADO ---
  const handleVote = async () => {
    if (!selectedMatchId || golesA === '' || golesB === '') return alert('Completa los campos');
    
    const partidoIdNum = Number(selectedMatchId);
    const timestampActual = new Date().toISOString();

    const newVote = { 
      usuario: currentUser.usuario, 
      partido_id: partidoIdNum, 
      goles_local: Number(golesA), 
      goles_visitante: Number(golesB) 
    };

    const { data, error } = await supabase.from('votos').insert([newVote]).select();
    
    if (error) alert(`Error: ${error.message}`);
    else { 
      alert('¡Predicción guardada!'); 
      
      // RESPALDO ARQUITECTÓNICO: Guardamos la estampa de tiempo localmente indexada por usuario y partido
      if (typeof window !== 'undefined') {
        localStorage.setItem(`vote_time_${currentUser.usuario}_${partidoIdNum}`, timestampActual);
      }

      setGolesA(''); 
      setGolesB(''); 
      setSelectedMatchId(''); 
      
      const votoConfirmado = data && data.length > 0 ? data[0] : { ...newVote, created_at: timestampActual };
      setVotes([...votes, votoConfirmado]); 
    }
  };

  const calcularTablaMundial = () => {
    const stats: Record<string, any> = {};
    partidos.forEach(p => {
      const gId = getGrupoPorId(p.id);
      if (!stats[p.equipo_local]) stats[p.equipo_local] = { equipo: p.equipo_local, PJ: 0, PG: 0, PE: 0, PP: 0, GF: 0, GC: 0, PTS: 0, grupo: gId };
      if (!stats[p.equipo_visitante]) stats[p.equipo_visitante] = { equipo: p.equipo_visitante, PJ: 0, PG: 0, PE: 0, PP: 0, GF: 0, GC: 0, PTS: 0, grupo: gId };

      if (p.status === 'FINISHED' && p.goles_local !== null && p.goles_visitante !== null) {
        stats[p.equipo_local].PJ += 1; stats[p.equipo_visitante].PJ += 1;
        stats[p.equipo_local].GF += p.goles_local; stats[p.equipo_local].GC += p.goles_visitante;
        stats[p.equipo_visitante].GF += p.goles_visitante; stats[p.equipo_visitante].GC += p.goles_local;

        if (p.goles_local > p.goles_visitante) {
          stats[p.equipo_local].PG += 1; stats[p.equipo_local].PTS += 3; stats[p.equipo_visitante].PP += 1;
        } else if (p.goles_local < p.goles_visitante) {
          stats[p.equipo_visitante].PG += 1; stats[p.equipo_visitante].PTS += 3; stats[p.equipo_local].PP += 1;
        } else {
          stats[p.equipo_local].PE += 1; stats[p.equipo_local].PTS += 1;
          stats[p.equipo_visitante].PE += 1; stats[p.equipo_visitante].PTS += 1;
        }
      }
    });

    return Object.values(stats).map(s => ({ ...s, DG: s.GF - s.GC })).sort((a, b) => {
      if (b.PTS !== a.PTS) return b.PTS - a.PTS;
      if (b.DG !== a.DG) return b.DG - a.DG;
      return b.GF - a.GF;
    });
  };

  const calcularRankingQuiniela = () => {
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

  if (view === 'LOGIN' || view === 'REGISTER') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'); .font-sports { font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; }`}</style>
        <div className="fixed inset-0 opacity-10 pointer-events-none z-0" style={{ backgroundImage: "url('/image_c70199.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}></div>
        <div className="bg-gray-900/90 backdrop-blur p-8 rounded-xl w-full max-w-md border border-gray-800 z-10 shadow-2xl">
          <h1 className="text-4xl font-sports text-red-500 mb-6 text-center">Quiniela Mundial 2026</h1>
          {view === 'LOGIN' ? (
            <div className="space-y-4">
              <input type="text" placeholder="Usuario" className="w-full p-3 rounded bg-black border border-gray-700 text-white outline-none focus:border-red-500" onKeyDown={handleKeyDownLogin} onChange={e => setLoginForm({...loginForm, usuario: e.target.value})} />
              <input type="password" placeholder="PIN" className="w-full p-3 rounded bg-black border border-gray-700 text-center tracking-widest text-white outline-none focus:border-red-500" onKeyDown={handleKeyDownLogin} onChange={e => setLoginForm({...loginForm, pin: e.target.value})} />
              <button onClick={handleLogin} className="w-full bg-red-600 font-bold py-3 rounded uppercase tracking-wider hover:bg-red-500 transition">Ingresar</button>
              <p className="text-center text-gray-400 mt-4 text-sm">¿No tienes cuenta? <span className="text-red-500 cursor-pointer font-bold" onClick={() => setView('REGISTER')}>Regístrate</span></p>
            </div>
          ) : (
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" className="w-full p-3 rounded bg-black border border-gray-700 text-white outline-none focus:border-red-500" onKeyDown={handleKeyDownRegister} onChange={e => setForm({...form, nombre: e.target.value})} />
              <input type="text" placeholder="Apellido" className="w-full p-3 rounded bg-black border border-gray-700 text-white outline-none focus:border-red-500" onKeyDown={handleKeyDownRegister} onChange={e => setForm({...form, apellido: e.target.value})} />
              <input type="text" placeholder="Usuario" className="w-full p-3 rounded bg-black border border-gray-700 text-white outline-none focus:border-red-500" onKeyDown={handleKeyDownRegister} onChange={e => setForm({...form, usuario: e.target.value})} />
              <input type="password" placeholder="PIN (4 dígitos)" className="w-full p-3 rounded bg-black border border-gray-700 text-center tracking-widest text-white outline-none focus:border-red-500" onKeyDown={handleKeyDownRegister} onChange={e => setForm({...form, pin: e.target.value})} />
              <button onClick={handleRegister} className="w-full bg-red-600 text-white font-bold py-3 rounded uppercase tracking-wider hover:bg-red-500 transition">Registrarme</button>
              <p className="text-center text-gray-400 mt-4 text-sm">¿Ya tienes cuenta? <span className="text-red-500 cursor-pointer font-bold" onClick={() => setView('LOGIN')}>Inicia Sesión</span></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const partidosFiltrados = grupoActivo === 'HOY' 
    ? partidos.filter(match => match.date.includes(fechaHoyStr))
    : partidos.filter(match => getGrupoPorId(match.id) === grupoActivo);

  const partidosPendientes = partidos
    .filter(p => p.status === 'PENDING' && !votes.some(v => v.partido_id === p.id && v.usuario === currentUser?.usuario))
    .sort((a, b) => {
      const dayA = parseInt(a.date.split(' ')[0]) || 0;
      const dayB = parseInt(b.date.split(' ')[0]) || 0;
      if (dayA !== dayB) return dayA - dayB;
      const timeA = a.date.split('|')[1]?.trim() || "00:00";
      const timeB = b.date.split('|')[1]?.trim() || "00:00";
      return timeA.localeCompare(timeB);
    });

  const tablaMundial = calcularTablaMundial();

  return (
    <div className="min-h-screen bg-black text-white relative">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'); .font-sports { font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; }`}</style>
      <div className="fixed inset-0 opacity-10 pointer-events-none z-0" style={{ backgroundImage: "url('/image_c70199.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}></div>

      <header className="bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-2xl font-sports text-red-500">Quiniela Mundial 2026</h1>
          <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">Analista: {currentUser?.nombre} {currentUser?.apellido}</p>
        </div>
        
        <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 flex items-center shadow-lg">
          <audio ref={audioRef} src="/cancion_oficial.mp3" />
          <button 
            onClick={() => {
              if (isPlaying) audioRef.current?.pause();
              else audioRef.current?.play();
              setIsPlaying(!isPlaying);
            }} 
            className="text-red-500 hover:text-red-400 text-xs font-bold transition-transform active:scale-95 flex items-center gap-2 uppercase tracking-widest"
          >
            {isPlaying ? '⏸ Pausar' : '▶ Play'}
          </button>
          <div className="h-4 w-px bg-gray-700 mx-3"></div>
          <button onClick={handleLogout} className="text-[10px] text-gray-400 hover:text-white font-bold uppercase tracking-widest">SALIR</button>
        </div>
      </header>

      <div className="flex overflow-x-auto bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
        {[
          { id: 'PRINCIPAL', label: 'Principal' },
          { id: 'CALENDARIO', label: 'Calendario' }, 
          { id: 'RESULTADOS', label: 'Resultados' }, 
          { id: 'POSICIONES_MUNDIAL', label: 'Tabla de Posiciones' },
          { id: 'VOTAR', label: 'Votar' }, 
          { id: 'MIS_VOTOS', label: 'Mi Vestuario' }, 
          { id: 'RANKING_QUINIELA', label: 'Ranking Quiniela' }
        ].map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-none min-w-[120px] md:flex-1 py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider transition ${activeTab === tab.id ? 'text-red-500 border-b-2 border-red-500 bg-red-900/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="p-4 md:p-6 max-w-6xl mx-auto relative z-10">
        
        {activeTab === 'PRINCIPAL' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-5xl md:text-7xl font-sports text-red-500 mb-2 tracking-widest drop-shadow-2xl">
              Quiniela Mundial de Futbol 2026
            </h1>
            <h2 className="text-xl md:text-3xl font-sports text-white mb-10 tracking-widest text-shadow-sm">
              Mundial México – Canadá – USA 2026
            </h2>
            <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800 shadow-2xl backdrop-blur-sm">
              <img src="/mascotas.png" alt="Mascotas del Mundial 2026" className="w-64 md:w-80 h-auto object-contain drop-shadow-lg" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
          </div>
        )}

        {activeTab === 'CALENDARIO' && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-48 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
              <button onClick={() => setGrupoActivo('HOY')} className={`px-4 py-2.5 flex-none md:w-full rounded text-xs font-bold tracking-wider uppercase transition-colors ${grupoActivo === 'HOY' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-900 text-gray-400 border border-gray-800'}`}>FECHAS</button>
              {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => (
                <button key={g} onClick={() => setGrupoActivo(g)} className={`px-4 py-2.5 flex-none md:w-full rounded text-xs font-bold tracking-wider uppercase transition-colors ${grupoActivo === g ? 'bg-red-600 text-white shadow-md' : 'bg-gray-900 text-gray-400 border border-gray-800'}`}>GRUPO {g}</button>
              ))}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-4 bg-gray-900 p-3 rounded-lg border border-gray-800">
                {grupoActivo === 'HOY' ? (
                  <select value={fechaHoyStr} onChange={(e) => setFechaHoyStr(e.target.value)} className="bg-black text-red-500 font-bold border border-gray-700 rounded p-2 text-sm outline-none w-full md:w-auto focus:border-red-500">
                    {fechasMundial.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                ) : (
                  <h2 className="text-red-500 font-bold uppercase tracking-widest text-sm">Partidos Grupo {grupoActivo}</h2>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partidosFiltrados.map((match) => {
                  const yaVotado = votes.some(v => v.partido_id === match.id && v.usuario === currentUser?.usuario);
                  return (
                    <div key={match.id} className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 flex justify-between items-center shadow-lg transition-transform hover:scale-[1.02] relative">
                      <div className="w-[35%] text-center"><span className="font-sports text-lg tracking-wider block truncate">{FLAGS[match.equipo_local] || '🌎'} {match.equipo_local}</span></div>
                      <div className="w-[30%] flex flex-col items-center">
                        <span className="text-[9px] text-gray-500 mb-1 font-mono">{match.date.split(' | ')[1]}</span>
                        <span className={`px-3 py-1 rounded text-lg font-sports tracking-widest ${match.status === 'FINISHED' ? 'bg-red-600 text-white shadow-md border border-red-500' : 'bg-black text-gray-500 border border-gray-800'}`}>
                          {match.status === 'FINISHED' ? `${match.goles_local} - ${match.goles_visitante}` : 'VS'}
                        </span>
                        {match.status === 'PENDING' && !yaVotado && (
                          <button 
                            onClick={() => { setSelectedMatchId(match.id.toString()); setActiveTab('VOTAR'); }}
                            className="mt-2 bg-red-900/40 hover:bg-red-600 text-red-300 hover:text-white border border-red-800/50 text-[9px] uppercase font-bold py-1 px-3 rounded-full transition-all"
                          >
                            Hacer Predicción
                          </button>
                        )}
                      </div>
                      <div className="w-[35%] text-center"><span className="font-sports text-lg tracking-wider block truncate">{match.equipo_visitante} {FLAGS[match.equipo_visitante] || '🌎'}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'RESULTADOS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partidos
                .filter(p => p.status === 'FINISHED')
                .sort((a, b) => {
                  const dayA = parseInt(a.date.split(' ')[0]) || 0;
                  const dayB = parseInt(b.date.split(' ')[0]) || 0;
                  if (dayA !== dayB) return dayA - dayB;
                  const timeA = a.date.split('|')[1]?.trim() || "00:00";
                  const timeB = b.date.split('|')[1]?.trim() || "00:00";
                  return timeA.localeCompare(timeB);
                })
                .map(p => (
                <div key={p.id} className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 flex justify-between items-center shadow-lg">
                  <div><p className="text-xs text-gray-500 font-mono">{p.date}</p><p className="font-sports text-xl tracking-wider">{FLAGS[p.equipo_local]} {p.equipo_local} <span className="text-gray-600 font-sans text-xs normal-case mx-1">vs</span> {p.equipo_visitante} {FLAGS[p.equipo_visitante]}</p></div>
                  <div className="bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/20 text-center min-w-[90px]">
                    <p className="text-[9px] text-red-400 uppercase font-bold tracking-wide">Oficial</p>
                    <p className="text-2xl font-sports text-red-500 tracking-widest">{p.goles_local} - {p.goles_visitante}</p>
                  </div>
                </div>
              ))}
              {partidos.filter(p => p.status === 'FINISHED').length === 0 && <p className="text-gray-500 text-center py-10 w-full col-span-2 text-sm font-medium">Esperando el pitazo inicial de la FIFA...</p>}
            </div>
        )}

        {activeTab === 'POSICIONES_MUNDIAL' && (
          <div className="space-y-8">
            <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 flex justify-between items-center text-xs text-gray-400 uppercase font-bold tracking-widest">
              <span>FIFA World Cup Standings 2026</span>
              <span>Pts = Puntos | GF = Goles a Favor | DG = Diferencia</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {['A','B','C','D','E','F','G','H','I','J','K','L'].map(grupo => {
                const equiposGrupo = tablaMundial.filter(e => e.grupo === grupo);
                if (equiposGrupo.length === 0) return null;
                return (
                  <div key={grupo} className="bg-gray-900/90 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
                    <div className="bg-red-900/20 p-3 border-b border-red-900/50">
                      <h3 className="font-sports text-xl text-red-500 tracking-widest">GRUPO {grupo}</h3>
                    </div>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-black text-gray-500 font-bold uppercase">
                        <tr>
                          <th className="p-3 w-8 text-center">#</th>
                          <th className="p-3">Selección</th>
                          <th className="p-3 text-center">PJ</th>
                          <th className="p-3 text-center">PG</th>
                          <th className="p-3 text-center">PE</th>
                          <th className="p-3 text-center">PP</th>
                          <th className="p-3 text-center">GF</th>
                          <th className="p-3 text-center">GC</th>
                          <th className="p-3 text-center font-mono">DG</th>
                          <th className="p-3 text-center font-extrabold text-white bg-gray-800/50">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {equiposGrupo.map((eq, idx) => (
                          <tr key={eq.equipo} className="hover:bg-gray-800/30 transition-colors">
                            <td className={`p-3 text-center font-bold ${idx < 2 ? 'text-green-500' : 'text-gray-500'}`}>{idx + 1}</td>
                            <td className="p-3 font-bold text-white tracking-wide truncate max-w-[100px]">{FLAGS[eq.equipo] || '🌎'} {eq.equipo}</td>
                            <td className="p-3 text-center text-gray-400">{eq.PJ}</td>
                            <td className="p-3 text-center text-gray-400">{eq.PG}</td>
                            <td className="p-3 text-center text-gray-400">{eq.PE}</td>
                            <td className="p-3 text-center text-gray-400">{eq.PP}</td>
                            <td className="p-3 text-center text-gray-400">{eq.GF}</td>
                            <td className="p-3 text-center text-gray-400">{eq.GC}</td>
                            <td className="p-3 text-center font-mono">{eq.DG > 0 ? `+${eq.DG}` : eq.DG}</td>
                            <td className="p-3 text-center font-sports text-xl text-amber-500 bg-gray-800/30">{eq.PTS}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'VOTAR' && (
           <div className="bg-gray-900/90 p-6 rounded-xl border border-gray-800 max-w-xl mx-auto shadow-2xl">
             <h2 className="text-xl font-sports text-red-500 mb-4 uppercase border-b border-gray-800 pb-2">Hacer Predicción</h2>
             <select className="w-full p-4 mb-6 rounded-lg bg-black text-white font-semibold border border-gray-800 outline-none text-sm focus:border-red-500" value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}>
               <option value="">-- Selecciona un juego programado --</option>
               {partidosPendientes.map(p => <option key={p.id} value={p.id}>{p.date} | {p.equipo_local} vs {p.equipo_visitante}</option>)}
             </select>
             {selectedMatchId && (
               <div className="flex justify-between items-center mb-6 bg-black p-6 rounded-xl border border-gray-800">
                 <div className="text-center w-1/3">
                   <p className="font-sports text-lg mb-2 text-gray-300 truncate">{partidos.find(p => p.id === Number(selectedMatchId))?.equipo_local}</p>
                   <input type="number" min="0" value={golesA} onChange={e => setGolesA(e.target.value)} className="w-16 text-center text-3xl font-sports bg-gray-900 border border-gray-700 p-2 rounded text-white outline-none focus:border-red-500" />
                 </div>
                 <span className="font-sports text-xl text-red-500">VS</span>
                 <div className="text-center w-1/3">
                   <p className="font-sports text-lg mb-2 text-gray-300 truncate">{partidos.find(p => p.id === Number(selectedMatchId))?.equipo_visitante}</p>
                   <input type="number" min="0" value={golesB} onChange={e => setGolesB(e.target.value)} className="w-16 text-center text-3xl font-sports bg-gray-900 border border-gray-700 p-2 rounded text-white outline-none focus:border-red-500" />
                 </div>
               </div>
             )}
             <button onClick={handleVote} disabled={!selectedMatchId} className={`w-full font-bold py-4 rounded-lg uppercase tracking-widest text-xs transition ${selectedMatchId ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>Confirmar Predicción</button>
             {partidosPendientes.length === 0 && <p className="text-center text-green-500 mt-4 font-bold tracking-widest text-sm uppercase">⚽ ¡Vestuario completo! Has votado en todo. ⚽</p>}
           </div>
        )}

        {/* PESTAÑA MI VESTUARIO - RESPALDADA CON LOCALSTORAGE COMPATIBLE */}
        {activeTab === 'MIS_VOTOS' && (
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
             {votes.filter(v => v.usuario === currentUser.usuario).map((voto, idx) => {
               const p = partidos.find(pa => pa.id === voto.partido_id);
               
               let puntosGanados = 0;
               let estiloCard = "border-gray-800 bg-gray-900/90";
               let colorTextoPuntos = "text-gray-500";
               
               if (p?.status === 'FINISHED' && p?.goles_local !== null) {
                 const acertoMarcador = (voto.goles_local === p.goles_local && voto.goles_visitante === p.goles_visitante);
                 const acertoGanador = (voto.goles_local > voto.goles_visitante && p.goles_local > p.goles_visitante) || 
                                       (voto.goles_local < voto.goles_visitante && p.goles_local < p.goles_visitante) || 
                                       (voto.goles_local === voto.goles_visitante && p.goles_local === p.goles_visitante);
                 if (acertoMarcador) { 
                   puntosGanados = 3; estiloCard = "border-green-600/50 bg-green-950/10 shadow-green-900/10"; colorTextoPuntos = "text-green-500"; 
                 } else if (acertoGanador) { 
                   puntosGanados = 1; estiloCard = "border-yellow-600/50 bg-yellow-950/10 shadow-yellow-900/10"; colorTextoPuntos = "text-yellow-500"; 
                 } else { 
                   estiloCard = "border-red-900/50 bg-red-950/5 shadow-red-900/5"; colorTextoPuntos = "text-red-500"; 
                 }
               }

               // DOBLE REVISIÓN: Lee desde Supabase o desde el almacenamiento local persistido en handleVote
               const fechaVotoRaw = voto.created_at || (typeof window !== 'undefined' ? localStorage.getItem(`vote_time_${voto.usuario}_${voto.partido_id}`) : null);

               const fechaVotoFormat = fechaVotoRaw 
                ? new Date(fechaVotoRaw).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) 
                : 'Fecha no registrada';

               return (
                 <div key={idx} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-center shadow-lg transition-all gap-4 ${estiloCard}`}>
                   <div className="w-full md:w-auto">
                     <p className="text-[10px] text-gray-400 font-mono mb-0.5">🗓️ Partido: {p?.date}</p>
                     <p className="text-[10px] text-blue-400 font-mono mb-2">⏱️ Votado el: {fechaVotoFormat}</p>
                     <p className="font-sports text-xl text-white tracking-wider">{FLAGS[p?.equipo_local]} {p?.equipo_local} <span className="text-gray-600 text-xs font-sans normal-case mx-1">vs</span> {p?.equipo_visitante} {FLAGS[p?.equipo_visitante]}</p>
                     {p?.status === 'FINISHED' && (
                       <span className={`text-[10px] font-bold uppercase tracking-widest block mt-2 ${colorTextoPuntos}`}>
                         {puntosGanados > 0 ? `+${puntosGanados} Puntos Obtenidos` : '0 Puntos (Fallo)'}
                       </span>
                     )}
                   </div>
                   
                   <div className="flex gap-2 w-full md:w-auto justify-end">
                     <div className="bg-black px-4 py-2 rounded-lg border border-gray-800 text-center min-w-[80px]">
                       <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">Tu Voto</p>
                       <p className="text-2xl font-sports text-red-500 tracking-widest">{voto.goles_local}-{voto.goles_visitante}</p>
                     </div>
                     
                     {p?.status === 'FINISHED' && (
                       <div className="bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/20 text-center min-w-[80px]">
                         <p className="text-[9px] text-red-400 uppercase font-bold tracking-wide">Oficial</p>
                         <p className="text-2xl font-sports text-red-500 tracking-widest">{p.goles_local}-{p.goles_visitante}</p>
                       </div>
                     )}
                   </div>
                 </div>
               )
             })}
           </div>
        )}

        {activeTab === 'RANKING_QUINIELA' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 bg-gray-900/90 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
              <div className="bg-black p-4 flex justify-between border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span className="w-12 text-center">Rango</span>
                <span className="flex-1 pl-2">Analista</span>
                <span className="w-20 text-center">Score</span>
              </div>
              {calcularRankingQuiniela().map((user, idx) => (
                <div key={user.usuario} className={`p-4 flex justify-between items-center border-b border-gray-800/40 ${user.usuario === currentUser.usuario ? 'bg-red-900/10' : 'hover:bg-gray-800/50'}`}>
                  <span className={`w-12 text-center font-sports text-2xl ${idx === 0 ? 'text-red-500' : 'text-gray-500'}`}>{idx + 1}°</span>
                  <span className="flex-1 font-bold text-sm uppercase tracking-wider pl-2">
                    {user.nombre} {user.apellido}
                    {user.usuario === currentUser.usuario && <span className="ml-2 text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 font-sans normal-case font-bold">Tú</span>}
                  </span>
                  <span className="w-20 text-center font-sports text-3xl text-red-500 tracking-wider">{user.puntos}</span>
                </div>
              ))}
            </div>

            <div className="w-full lg:w-72 bg-gray-900/90 p-6 rounded-xl border border-gray-800 h-fit shadow-2xl">
              <h3 className="text-red-500 font-sports text-2xl tracking-widest border-b border-gray-800 pb-2 mb-4">Reglas de Quiniela</h3>
              <ul className="space-y-4 text-xs text-gray-400 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="text-green-500 font-sports text-2xl leading-none">+3</span>
                  <p><strong>Marcador Exacto:</strong> Atinar milimétricamente a la cantidad de goles de ambos equipos.</p>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-yellow-500 font-sports text-2xl leading-none">+1</span>
                  <p><strong>Acierto de Ganador:</strong> Acertar cuál equipo triunfa o si hay empate, pero errando los goles exactos.</p>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-sports text-2xl leading-none">0</span>
                  <p><strong>Fallo Absoluto:</strong> No acertar ni la tendencia del ganador ni los goles anotados.</p>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}