import React from 'react';
import { Sparkles, Lock } from 'lucide-react';

interface DrawingGlobeProps {
  lastBall: number | null;
  letter: string;
  isDrawing?: boolean;
  isContestActive?: boolean;
}

export const DrawingGlobe: React.FC<DrawingGlobeProps> = ({
  lastBall,
  letter,
  isDrawing = false,
  isContestActive = false,
}) => {
  return (
    <div
      role="region"
      aria-label="Globo de sorteio oficial"
      className="flex flex-col items-center justify-center p-6 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-indigo-500/10 pointer-events-none" />

      {/* Globe Cage Ring */}
      <div className={`relative w-52 h-52 sm:w-60 sm:h-60 rounded-full border-4 ${isContestActive ? 'border-amber-400 ring-4 ring-amber-500/30' : 'border-amber-500/50 ring-4 ring-amber-500/10'} p-3 shadow-2xl flex items-center justify-center bg-slate-950/90 transition-all`}>
        <div className="absolute inset-2 rounded-full border-2 border-dashed border-amber-400/30 animate-spin-slow pointer-events-none" />
        <div className="absolute inset-6 rounded-full border border-amber-400/20 pointer-events-none" />

        {/* The Ball */}
        {lastBall ? (
          <div
            role="status"
            aria-live="assertive"
            aria-label={`Pedra sorteada: ${letter} ${lastBall}`}
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 text-slate-950 flex flex-col items-center justify-center font-black shadow-2xl shadow-amber-500/60 transform transition-transform hover:scale-105 animate-scale-in relative border-4 border-amber-200/90 select-none"
          >
            {/* 3D Ball highlight */}
            <div className="absolute top-2 left-4 w-12 h-6 rounded-full bg-white/40 blur-[2px] -rotate-45 pointer-events-none" />

            <span className="font-display text-xl sm:text-2xl font-black tracking-widest text-slate-950/90 uppercase drop-shadow-xs">
              {letter}
            </span>
            <span className="font-display text-6xl sm:text-7xl font-black leading-none drop-shadow-md text-slate-950">
              {lastBall}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <Sparkles className="w-10 h-10 text-amber-400/60 animate-pulse mb-2" />
            <span className="font-display text-xs font-bold text-slate-400 uppercase tracking-widest">
              {isContestActive ? 'Sorteio Bloqueado' : isDrawing ? 'Sorteando...' : 'Globo Pronto'}
            </span>
          </div>
        )}
      </div>

      {isContestActive ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          {lastBall && (
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-display font-black text-sm tracking-widest">
              {letter} - {lastBall}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/70 text-amber-300 font-display font-black text-xs uppercase tracking-wider animate-pulse shadow-md">
            <Lock className="w-3.5 h-3.5" /> Sorteio Bloqueado (Validação de Prêmio)
          </span>
        </div>
      ) : lastBall ? (
        <div className="mt-5 text-center">
          <span className="inline-block px-5 py-2 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-display font-black text-base tracking-widest shadow-md">
            {letter} - {lastBall}
          </span>
        </div>
      ) : null}
    </div>
  );
};
