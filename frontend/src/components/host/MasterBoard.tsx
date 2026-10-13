import React from 'react';

interface MasterBoardProps {
  drawnBalls: number[];
  lastBall: number | null;
}

const ROWS = [
  { letter: 'B', start: 1, end: 15, color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
  { letter: 'I', start: 16, end: 30, color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
  { letter: 'N', start: 31, end: 45, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  { letter: 'G', start: 46, end: 60, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  { letter: 'O', start: 61, end: 75, color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
];

export const MasterBoard: React.FC<MasterBoardProps> = ({ drawnBalls, lastBall }) => {
  const drawnSet = new Set(drawnBalls);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-wider">
          Mesa Geral de Pedras (Master Board)
        </h3>
        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
          {drawnBalls.length} / 75 Sorteadas
        </span>
      </div>

      <div className="space-y-2">
        {ROWS.map((row) => (
          <div key={row.letter} className="flex items-center gap-2">
            {/* Letter Badge */}
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center font-black text-base sm:text-lg shrink-0 ${row.color}`}
            >
              {row.letter}
            </div>

            {/* Numbers 1-15 in row */}
            <div className="grid grid-cols-15 gap-1 sm:gap-1.5 flex-1">
              {Array.from({ length: row.end - row.start + 1 }, (_, i) => row.start + i).map((num) => {
                const isDrawn = drawnSet.has(num);
                const isLatest = lastBall === num;

                return (
                  <div
                    key={num}
                    className={`aspect-square rounded-lg flex items-center justify-center font-mono font-bold text-[10px] sm:text-xs transition-all ${
                      isLatest
                        ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 scale-110 z-10 shadow-lg shadow-amber-400/50'
                        : isDrawn
                        ? 'bg-slate-700 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-950/70 text-slate-600 border border-slate-800/80'
                    }`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
