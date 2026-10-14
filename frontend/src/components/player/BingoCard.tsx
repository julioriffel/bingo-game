import React from 'react';
import type { BingoCard as BingoCardType, WinningPattern } from '../../types/bingo';
import { Star, Check, Trophy } from 'lucide-react';

interface BingoCardProps {
  card: BingoCardType;
  drawnBalls: number[];
  assistMode?: boolean;
  onToggleCell: (cardId: string, number: number) => void;
  cardIndex?: number;
  winningPatterns?: WinningPattern[];
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
  winningPatterns,
}) => {
  const drawnSet = new Set(drawnBalls);
  const patterns: WinningPattern[] = winningPatterns || card.winning_patterns || [];

  // Index winning cells for quick lookup
  const winningCellKeys = new Set(
    patterns.flatMap((p) => p.winning_cells.map((c) => `${c.row}-${c.col}`))
  );

  const hasWinningPattern = patterns.length > 0;

  return (
    <section
      aria-label={`Cartela de Bingo número ${cardIndex !== undefined ? cardIndex + 1 : 1}`}
      className={`bg-slate-900/95 border rounded-3xl p-3 sm:p-5 shadow-2xl max-w-sm sm:max-w-md mx-auto w-full flex flex-col gap-2.5 transition-all duration-200 ${
        hasWinningPattern
          ? 'border-amber-500/80 shadow-amber-500/25 ring-2 ring-amber-500/40'
          : 'border-slate-800 shadow-slate-950/50'
      }`}
    >
      {/* Header Info: Card index & Winning Banner */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-300 font-bold">
        <div className="flex items-center gap-1.5">
          <span className="font-display tracking-wide text-amber-400">CARTELA</span>
          <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded-md font-mono text-xs">
            #{cardIndex !== undefined ? cardIndex + 1 : 1}
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
          ID: {card.id.split('_').pop()}
        </span>
      </div>

      {hasWinningPattern && (
        <div
          role="status"
          aria-live="polite"
          className="bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-500/60 rounded-2xl px-3.5 py-2 flex items-center justify-between text-xs animate-victory-pulse shadow-md"
        >
          <div className="flex items-center gap-2 font-black text-amber-300">
            <Trophy className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0 drop-shadow" />
            <span className="font-display tracking-wide">
              {patterns.some((p) => p.pattern_type === 'blackout')
                ? 'CARTELA CHEIA VENCEDORA!'
                : 'LINHA VENCEDORA RISCADA!'}
            </span>
          </div>
          <span className="text-[10px] font-black tracking-wider text-rose-200 bg-rose-950/90 px-2.5 py-0.5 rounded-full border border-rose-500/50 shadow-xs">
            BINGO CONFIRMADO
          </span>
        </div>
      )}

      {/* Column Headers B-I-N-G-O */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center" role="row">
        {COLUMN_COLORS.map((col) => (
          <div
            key={col.letter}
            role="columnheader"
            aria-label={`Coluna ${col.letter}`}
            className={`py-1.5 sm:py-2 rounded-xl font-display font-black text-base sm:text-lg tracking-wider ${col.text} ${col.bg} border ${col.border} shadow-inner select-none`}
          >
            {col.letter}
          </div>
        ))}
      </div>

      {/* 5x5 Card Matrix with SVG Strikethrough Overlay */}
      <div className="relative" role="grid" aria-label="Grade 5 por 5 de números da cartela">
        {/* SVG Strike Lines Overlay for Winning Patterns */}
        {hasWinningPattern && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {patterns.map((p) => {
              if (p.pattern_type === 'row') {
                const r = p.line_index ?? parseInt(p.pattern_id.replace('row_', ''), 10) ?? 0;
                const y = (r + 0.5) * 20;
                return (
                  <g key={`svg-${p.pattern_id}`}>
                    <line
                      x1="2"
                      y1={y}
                      x2="98"
                      y2={y}
                      stroke="#f43f5e"
                      strokeWidth="5"
                      strokeLinecap="round"
                      className="animate-strike-line drop-shadow-[0_0_12px_rgba(244,63,94,0.95)]"
                    />
                    <line
                      x1="2"
                      y1={y}
                      x2="98"
                      y2={y}
                      stroke="#fef08a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="animate-strike-line"
                    />
                  </g>
                );
              }

              if (p.pattern_type === 'col') {
                const c = p.line_index ?? parseInt(p.pattern_id.replace('col_', ''), 10) ?? 0;
                const x = (c + 0.5) * 20;
                return (
                  <g key={`svg-${p.pattern_id}`}>
                    <line
                      x1={x}
                      y1="2"
                      x2={x}
                      y2="98"
                      stroke="#f43f5e"
                      strokeWidth="5"
                      strokeLinecap="round"
                      className="animate-strike-line drop-shadow-[0_0_12px_rgba(244,63,94,0.95)]"
                    />
                    <line
                      x1={x}
                      y1="2"
                      x2={x}
                      y2="98"
                      stroke="#fef08a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="animate-strike-line"
                    />
                  </g>
                );
              }

              if (p.pattern_type === 'diag_main') {
                return (
                  <g key={`svg-${p.pattern_id}`}>
                    <line
                      x1="4"
                      y1="4"
                      x2="96"
                      y2="96"
                      stroke="#f43f5e"
                      strokeWidth="5"
                      strokeLinecap="round"
                      className="animate-strike-line drop-shadow-[0_0_12px_rgba(244,63,94,0.95)]"
                    />
                    <line
                      x1="4"
                      y1="4"
                      x2="96"
                      y2="96"
                      stroke="#fef08a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="animate-strike-line"
                    />
                  </g>
                );
              }

              if (p.pattern_type === 'diag_anti') {
                return (
                  <g key={`svg-${p.pattern_id}`}>
                    <line
                      x1="96"
                      y1="4"
                      x2="4"
                      y2="96"
                      stroke="#f43f5e"
                      strokeWidth="5"
                      strokeLinecap="round"
                      className="animate-strike-line drop-shadow-[0_0_12px_rgba(244,63,94,0.95)]"
                    />
                    <line
                      x1="96"
                      y1="4"
                      x2="4"
                      y2="96"
                      stroke="#fef08a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="animate-strike-line"
                    />
                  </g>
                );
              }

              if (p.pattern_type === 'blackout') {
                return (
                  <g key={`svg-${p.pattern_id}`}>
                    <rect
                      x="2"
                      y="2"
                      width="96"
                      height="96"
                      rx="12"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="4"
                      className="animate-victory-pulse drop-shadow-[0_0_16px_rgba(251,191,36,0.95)]"
                    />
                    <line
                      x1="4"
                      y1="4"
                      x2="96"
                      y2="96"
                      stroke="#f43f5e"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                    <line
                      x1="96"
                      y1="4"
                      x2="4"
                      y2="96"
                      stroke="#f43f5e"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                  </g>
                );
              }

              return null;
            })}
          </svg>
        )}

        {/* The 5x5 Cells Grid */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative z-10">
          {card.grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isDrawn = drawnSet.has(cell.number);
              const isAssisted = assistMode && isDrawn && !cell.marked && !cell.is_free;
              const isWinningCell = winningCellKeys.has(`${rIdx}-${cIdx}`);

              if (cell.is_free) {
                return (
                  <div
                    key={`free-${rIdx}-${cIdx}`}
                    role="gridcell"
                    aria-label="Espaço livre central, marcado automaticamente"
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black shadow-inner transition-all ${
                      isWinningCell
                        ? 'bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 border-2 border-rose-500 text-slate-950 ring-2 ring-rose-500/50 shadow-md shadow-rose-500/20'
                        : 'bg-gradient-to-tr from-amber-500/30 to-amber-400/20 border-2 border-amber-500/50 text-amber-300'
                    }`}
                  >
                    <Star
                      className={`w-5 h-5 sm:w-6 sm:h-6 animate-spin-slow ${
                        isWinningCell ? 'fill-slate-950 text-slate-950' : 'fill-amber-400 text-amber-400 drop-shadow'
                      }`}
                    />
                    <span className="font-display text-[10px] font-black tracking-widest mt-0.5">FREE</span>
                  </div>
                );
              }

              const cellLabel = `Número ${cell.number}${cell.marked ? ', marcado' : ''}${isDrawn ? ', já sorteado' : ', ainda não sorteado'}`;

              return (
                <button
                  type="button"
                  key={`cell-${cell.number}-${rIdx}-${cIdx}`}
                  role="gridcell"
                  aria-pressed={cell.marked}
                  aria-label={cellLabel}
                  onClick={() => onToggleCell(card.id, cell.number)}
                  className={`aspect-square rounded-2xl flex items-center justify-center font-bold text-base sm:text-lg transition-all relative select-none cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
                    isWinningCell
                      ? 'bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 text-slate-950 font-black ring-2 sm:ring-4 ring-rose-500/90 shadow-xl shadow-rose-500/30 scale-[0.98]'
                      : cell.marked
                      ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/30 border border-amber-300/60 scale-[0.98]'
                      : isAssisted
                      ? 'bg-slate-800 text-amber-300 border-2 border-amber-400 ring-2 ring-amber-400/20 animate-pulse font-black'
                      : 'bg-slate-800/90 hover:bg-slate-700/90 active:bg-slate-700 text-slate-100 border border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <span className="relative z-10 tracking-tight">{cell.number}</span>

                  {/* Individual cell strikethrough slash for winning cells */}
                  {isWinningCell && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-15 overflow-hidden">
                      <span className="w-full h-1 sm:h-1.5 bg-rose-600 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.9)] -rotate-12 transform scale-110" />
                    </span>
                  )}

                  {/* Stamp checkmark icon */}
                  {cell.marked && !isWinningCell && (
                    <span className="absolute top-1 right-1 bg-slate-950/80 rounded-full p-0.5" aria-hidden="true">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 stroke-[3]" />
                    </span>
                  )}

                  {/* Trophy icon on winning cells */}
                  {isWinningCell && (
                    <span className="absolute top-1 right-1" aria-hidden="true">
                      <Trophy className="w-3 h-3 text-rose-600 fill-rose-600 stroke-[1] drop-shadow" />
                    </span>
                  )}

                  {/* Subtle indicator dot for drawn balls if not marked */}
                  {isDrawn && !cell.marked && (
                    <span
                      className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs"
                      title="Pedra sorteada no globo"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
