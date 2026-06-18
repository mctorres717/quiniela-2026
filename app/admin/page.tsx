"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE SUPABASE CONTROLES ---
const supabase = createClient(
  'https://spdhfslvbslsuuzckmqr.supabase.co',
  'sb_publishable_DH68PA1DWbc66PALwVDyXA_dHLQPrL1'
);

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

export default function ActualizadorResultados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState('');
  const [partidos, setPartidos] = useState<any[]>([]);
  
  // Estados para cargar resultados
  const [golesLocal, setGolesLocal] = useState<Record<number, string>>({});
  const [golesVisitante, setGolesVisitante] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchPartidosPendientes();
  }, []);

  const fetchPartidosPendientes = async () => {
    const { data, error } = await supabase
      .from('partidos')
      .select('*');

    if (data) {
      // 1. FILTRAR: Solo dejamos partidos que NO están finalizados (PENDING)
      const pendientes = data.filter((p: any) => p.status !== 'FINISHED');

      // 2. ORDENAR CRONOLÓGICAMENTE: Por número de día y luego por hora
      const ordenados = pendientes.sort((a: any, b: any) => {
        const diaA = parseInt(a.date.split(' ')[0]) || 0;
        const diaB = parseInt(b.date.split(' ')[0]) || 0;
        if (diaA !== diaB) return diaA - diaB;

        const horaA = a.date.split('|')[1]?.trim() || "00:00";
        const horaB = b.date.split('|')[1]?.trim() || "00:00";
        return horaA.localeCompare(horaB);
      });

      setPartidos(ordenados);
    }
  };

  const handleLoginAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === 'master2026') {
      setIsAdmin(true);
    } else {
      alert('PIN administrativo incorrecto.');
    }
  };

  const handleActualizarMarcador = async (partidoId: number) => {
    const gLocal = golesLocal[partidoId];
    const gVisitante = golesVisitante[partidoId];

    if (gLocal === undefined || gLocal === '' || gVisitante === undefined || gVisitante === '') {
      return alert('Debes rellenar los marcadores de ambos equipos.');
    }

    // Guardar en Supabase y cambiar el status a FINISHED
    const { error } = await supabase
      .from('partidos')
      .update({
        goles_local: Number(gLocal),
        goles_visitante: Number(gVisitante),
        status: 'FINISHED'
      })
      .eq('id', partidoId);

    if (error) {
      alert(`Error al actualizar: ${error.message}`);
    } else {
      alert('¡Partido actualizado con éxito! El juego saldrá del panel.');
      // Limpiar los inputs del estado
      setGolesLocal(prev => { const n = {...prev}; delete n[partidoId]; return n; });
      setGolesVisitante(prev => { const n = {...prev}; delete n[partidoId]; return n; });
      // Refrescar para que desaparezca
      fetchPartidosPendientes();
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLoginAdmin} className="bg-gray-950 border border-gray-800 p-8 rounded-2xl w-full max-w-sm text-center shadow-2xl">
          <h1 className="text-2xl font-bold text-red-500 uppercase tracking-wider mb-4">Actualizador de Goles</h1>
          <p className="text-xs text-gray-500 mb-6">Ingresa las credenciales de Comisario FIFA</p>
          <input type="password" placeholder="PIN de Seguridad" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-center text-white text-xl tracking-widest mb-6 focus:border-red-600 outline-none" value={pin} onChange={e => setPin(e.target.value)} />
          <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-colors">Verificar Autorización</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 bg-gray-950 border border-gray-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-bold text-red-500 uppercase tracking-wide">Mesa Técnica de Control</h1>
          <p className="text-[11px] text-gray-500 uppercase tracking-widest font-mono">Partidos por procesar: {partidos.length}</p>
        </div>
        <button onClick={() => setIsAdmin(false)} className="text-xs bg-gray-900 border border-gray-800 hover:bg-gray-800 px-4 py-2 rounded-lg font-bold tracking-wider text-gray-400">CERRAR</button>
      </header>

      <main className="max-w-4xl mx-auto space-y-4">
        {partidos.length === 0 ? (
          <div className="text-center py-20 bg-gray-950 border border-gray-800 rounded-2xl">
            <span className="text-4xl">🏆</span>
            <p className="text-gray-400 font-bold mt-4 uppercase tracking-widest text-sm">Todos los partidos del Mundial han sido cargados con éxito.</p>
          </div>
        ) : (
          partidos.map((match) => (
            <div key={match.id} className="bg-gray-950 border border-gray-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              
              <div className="w-full md:w-1/3 text-center md:text-left">
                <span className="text-[10px] font-mono text-gray-500 bg-black px-2.5 py-1 rounded border border-gray-900">{match.date}</span>
                <div className="text-lg font-bold mt-3 tracking-wide">{FLAGS[match.equipo_local]} {match.equipo_local}</div>
              </div>

              <div className="flex items-center justify-center gap-4 bg-black p-4 rounded-xl border border-gray-900 min-w-[240px]">
                <input 
                  type="number" 
                  min="0" 
                  placeholder="0" 
                  value={golesLocal[match.id] || ''} 
                  onChange={e => setGolesLocal({...golesLocal, [match.id]: e.target.value})} 
                  className="w-14 text-center text-2xl font-bold bg-gray-900 border border-gray-700 p-2 rounded-lg text-white focus:border-red-500 outline-none" 
                />
                <span className="text-gray-600 font-bold text-xs font-mono uppercase tracking-widest">Goles</span>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="0" 
                  value={golesVisitante[match.id] || ''} 
                  onChange={e => setGolesVisitante({...golesVisitante, [match.id]: e.target.value})} 
                  className="w-14 text-center text-2xl font-bold bg-gray-900 border border-gray-700 p-2 rounded-lg text-white focus:border-red-500 outline-none" 
                />
              </div>

              <div className="w-full md:w-1/3 flex flex-col md:items-end text-center md:text-right">
                <div className="text-lg font-bold tracking-wide mb-3">{match.equipo_visitante} {FLAGS[match.equipo_visitante]}</div>
                <button 
                  onClick={() => handleActualizarMarcador(match.id)} 
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-xl text-xs uppercase tracking-widest transition-colors w-full md:w-auto shadow-lg"
                >
                  Cargar Resultado
                </button>
              </div>

            </div>
          ))
        )}
      </main>
    </div>
  );
}