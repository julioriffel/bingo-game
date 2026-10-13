import React from 'react';
import { Sparkles } from 'lucide-react';

interface DrawingGlobeProps {
  lastBall: number | null;
  letter: string;
  isDrawing?: boolean;
}

export const DrawingGlobe: React.FC<DrawingGlobeProps> = ({
  lastBall,
  letter,
  isDrawing = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-indigo-500/10 pointer-events-none" />

      {/* Globe Cage Ring */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-amber-500/40 p-3 shadow-inner flex items-center justify-center bg-slate-950/80">
        <div className="absolute inset-1 rounded-full border border-dashed border-amber-400/30 animate-spin-slow pointer-events-none" />

        {/* The Ball */}
        {lastBall ? (
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 text-slate-950 flex flex-col items-center justify-center font-black shadow-2xl shadow-amber-500/50 transform transition-transform hover:scale-105 animate-scale-in">
            <span className="text-xl sm:text-2xl font-black tracking-widest text-slate-900/80 uppercase">
              {letter}
            </span>
            <span className="text-5xl sm:text-6xl font-black leading-none drop-shadow">
              {lastBall}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <Sparkles className="w-10 h-10 text-amber-400/50 animate-pulse mb-2" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isDrawing ? 'Sorteando...' : 'Globo Pronto'}
            </span>
          </div>
        )}
      </div>

      {lastBall && (
        <div className="mt-4 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-sm tracking-widest">
            {letter} - {lastBall}
          </span>
        </div>
      )}
    </div>
  );
};
