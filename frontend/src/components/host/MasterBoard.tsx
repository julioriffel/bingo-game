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
    <section
      role="region"
      aria-label="Mesa geral de pedras de 1 a 75"
      className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4"
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs sm:text-sm font-black text-slate-300 uppercase tracking-wider font-display">
          Mesa Geral de Pedras (Master Board)
        </h3>
        <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 px-3 py-1 rounded-xl border border-amber-500/30 shadow-xs">
          {drawnBalls.length} / 75 Sorteadas
        </span>
      </div>

      <div className="space-y-2.5" role="table" aria-label="Tabela das 75 pedras do bingo">
        {ROWS.map((row) => (
          <div key={row.letter} className="flex items-center gap-2 sm:gap-2.5" role="row">
            {/* Letter Badge */}
            <div
              role="rowheader"
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl border flex items-center justify-center font-display font-black text-lg sm:text-xl shrink-0 shadow-sm ${row.color}`}
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
                    role="cell"
                    aria-label={`Pedra ${row.letter} ${num}${isLatest ? ', última sorteada' : isDrawn ? ', já sorteada' : ', não sorteada'}`}
                    className={`aspect-square rounded-xl flex items-center justify-center font-mono font-bold text-xs sm:text-sm transition-all select-none ${
                      isLatest
                        ? 'bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 font-black ring-4 ring-amber-300 scale-110 z-10 shadow-lg shadow-amber-400/50 animate-pulse border border-amber-100'
                        : isDrawn
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-black shadow-xs'
                        : 'bg-slate-950/80 text-slate-500 border border-slate-800/90'
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
    </section>
  );
};
