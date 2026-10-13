import React from 'react';
import type { BingoCard as BingoCardType } from '../../types/bingo';
import { Star, Check } from 'lucide-react';

interface BingoCardProps {
  card: BingoCardType;
  drawnBalls: number[];
  assistMode?: boolean;
  onToggleCell: (cardId: string, number: number) => void;
  cardIndex?: number;
}

const COLUMN_COLORS = [
  { letter: 'B', text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { letter: 'I', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  { letter: 'N', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { letter: 'G', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { letter: 'O', text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
];

export const BingoCard: React.FC<BingoCardProps> = ({
  card,
  drawnBalls,
  assistMode = true,
  onToggleCell,
  cardIndex,
}) => {
  const drawnSet = new Set(drawnBalls);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-xl max-w-sm sm:max-w-md mx-auto w-full flex flex-col gap-2">
      {cardIndex !== undefined && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-bold">
          <span>CARTELA #{cardIndex + 1}</span>
          <span className="font-mono text-[10px] text-slate-500">{card.id.split('_').pop()}</span>
        </div>
      )}

      {/* Column Headers B-I-N-G-O */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center">
        {COLUMN_COLORS.map((col) => (
          <div
            key={col.letter}
            className={`py-1.5 sm:py-2 rounded-xl font-black text-sm sm:text-base tracking-wider ${col.text} ${col.bg} border ${col.border}`}
          >
            {col.letter}
          </div>
        ))}
      </div>

      {/* 5x5 Card Matrix */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {card.grid.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const isDrawn = drawnSet.has(cell.number);
            const isAssisted = assistMode && isDrawn && !cell.marked && !cell.is_free;

            if (cell.is_free) {
              return (
                <div
                  key={`free-${rIdx}-${cIdx}`}
                  className="aspect-square rounded-xl bg-gradient-to-tr from-amber-500/30 to-amber-400/20 border-2 border-amber-500/50 flex flex-col items-center justify-center text-amber-300 font-black shadow-inner"
                >
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400 animate-spin-slow" />
                  <span className="text-[10px] font-black tracking-widest mt-0.5">FREE</span>
                </div>
              );
            }

            return (
              <button
                type="button"
                key={`cell-${cell.number}-${rIdx}-${cIdx}`}
                onClick={() => onToggleCell(card.id, cell.number)}
                className={`aspect-square rounded-xl flex items-center justify-center font-black text-base sm:text-lg transition-all relative select-none cursor-pointer ${
                  cell.marked
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-[0.98]'
                    : isAssisted
                    ? 'bg-slate-800 text-amber-300 border-2 border-amber-400/90 animate-pulse'
                    : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-100 border border-slate-700/60'
                }`}
              >
                {cell.number}
                {cell.marked && (
                  <span className="absolute top-1 right-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
