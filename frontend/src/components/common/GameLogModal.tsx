import React, { useState, useEffect } from 'react';
import type { GameLogEntry } from '../../types/bingo';
import { X, Trophy, Copy, Check, Clock, ArrowDownUp, Gift, Award, Swords } from 'lucide-react';

interface GameLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameLog: GameLogEntry[];
  roomCode: string;
}

function formatTime(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const GameLogModal: React.FC<GameLogModalProps> = ({
  isOpen,
  onClose,
  gameLog,
  roomCode,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'winners' | 'balls'>('all');
  const [sortDesc, setSortDesc] = useState(true);
  const [copied, setCopied] = useState(false);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter entries
  const filtered = gameLog.filter((entry) => {
    if (filterType === 'winners') return entry.event_type === 'bingo_awarded';
    if (filterType === 'balls') return entry.event_type === 'ball_drawn';
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    return sortDesc ? b.order - a.order : a.order - b.order;
  });

  const totalBalls = gameLog.filter((e) => e.event_type === 'ball_drawn').length;
  const totalWinners = gameLog.filter((e) => e.event_type === 'bingo_awarded').length;

  // Copy full textual log to clipboard
  const handleCopyLog = () => {
    const textLines = [
      `=========================================`,
      `📋 BINGO ROYALE 75 — LOG DE AUDITORIA`,
      `Sala: ${roomCode}`,
      `Total de Pedras Sorteadas: ${totalBalls}/75`,
      `Vitórias Registradas: ${totalWinners}`,
      `=========================================`,
      '',
    ];

    const chronological = [...gameLog].sort((a, b) => a.order - b.order);
    for (const entry of chronological) {
      const timeStr = formatTime(entry.timestamp);
      if (entry.event_type === 'ball_drawn') {
        textLines.push(`[${timeStr}] #${entry.order} Pedra Sorteada: ${entry.letter}-${entry.ball}`);
      } else if (entry.event_type === 'bingo_tiebreaker') {
        textLines.push(`[${timeStr}] ⚔️ ${entry.details || `Desempate na pedra ${entry.ball}`}`);
      } else if (entry.event_type === 'bingo_awarded') {
        const nums = (entry.winning_numbers || []).join(' - ');
        const prize = entry.prize_title ? ` | Prêmio: ${entry.prize_title}` : '';
        const tb = entry.details ? ` (${entry.details})` : '';
        textLines.push(
          `[${timeStr}] 🏆 BINGO! Jogador: ${entry.player_name} | ${entry.pattern_name || entry.win_type} na pedra ${entry.on_ball} | Linha: [ ${nums} ]${prize}${tb}`
        );
      }
    }

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-log-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 id="game-log-title" className="font-display font-black text-lg sm:text-xl text-slate-100 flex items-center gap-2">
                Log Oficial da Partida
                <span className="text-xs font-mono font-bold bg-slate-800 text-amber-300 px-2 py-0.5 rounded-lg border border-slate-700">
                  {roomCode}
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Auditoria de cada pedra sorteada e números das linhas premiadas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Fechar janela de log"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 p-3 sm:px-5 bg-slate-950/60 border-b border-slate-800/80 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-display">Sorteadas</div>
            <div className="text-base sm:text-lg font-black font-mono text-indigo-300">
              {totalBalls}<span className="text-xs text-slate-400">/75</span>
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-display">Premiações</div>
            <div className="text-base sm:text-lg font-black font-mono text-amber-300">
              {totalWinners}
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-display">Total Eventos</div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-200">
              {gameLog.length}
            </div>
          </div>
        </div>

        {/* Filter and Actions Toolbar */}
        <div className="p-3 sm:px-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs bg-slate-900/60">
          {/* Filters */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'all'}
              onClick={() => setFilterType('all')}
              className={`min-h-[36px] px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Todos ({gameLog.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'winners'}
              onClick={() => setFilterType('winners')}
              className={`min-h-[36px] px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'winners'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Vitórias ({totalWinners})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'balls'}
              onClick={() => setFilterType('balls')}
              className={`min-h-[36px] px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                filterType === 'balls'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Pedras ({totalBalls})
            </button>
          </div>

          {/* Sort & Copy */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortDesc(!sortDesc)}
              className="min-h-[36px] px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-slate-700/80"
              title="Inverter ordem temporal"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>{sortDesc ? 'Recentes' : 'Primeiros'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLog}
              className="min-h-[36px] px-3.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-slate-700/80"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Log'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Events List */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-2.5 flex-1 max-h-[55vh]">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto stroke-1 text-slate-500" />
              <p className="text-sm font-medium text-slate-300">Nenhum evento registrado até o momento.</p>
              <p className="text-xs text-slate-400">
                Os números sorteados e vitórias aparecerão aqui automaticamente em tempo real.
              </p>
            </div>
          ) : (
            sorted.map((entry) => {
              if (entry.event_type === 'bingo_tiebreaker') {
                return (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-1 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-xl bg-indigo-600 text-white font-black text-xs">
                          <Swords className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-bold text-xs text-indigo-300">
                          {entry.details || `Desempate da maior pedra na chamada ${entry.ball}`}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              }

              if (entry.event_type === 'bingo_awarded') {
                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/50 shadow-lg shadow-amber-500/10 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-xs">
                          <Trophy className="w-4 h-4 fill-current" />
                        </span>
                        <span className="font-display font-black text-sm text-amber-300">
                          {entry.player_name} bateu {entry.pattern_name || entry.win_type}!
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>

                    {/* Tiebreaker note if applicable */}
                    {entry.details && (
                      <div className="text-[11px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-500/30 inline-block">
                        ⚡ {entry.details}
                      </div>
                    )}

                    {/* Details: Winning numbers */}
                    {entry.winning_numbers && entry.winning_numbers.length > 0 && (
                      <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">
                          <span>Números da Linha Premiada:</span>
                          {entry.on_ball && (
                            <span className="text-amber-400 font-mono">Pedra de fechamento: {entry.on_ball}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {entry.winning_numbers.map((num, i) => (
                            <span
                              key={`win-num-${i}-${num}`}
                              className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono ${
                                num === 'FREE'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : num === entry.on_ball
                                  ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400/60 font-black'
                                  : 'bg-slate-800 text-slate-200 border border-slate-700'
                              }`}
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prize info */}
                    {entry.prize_title && (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                        <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Prêmio Conquistado: {entry.prize_title}</span>
                      </div>
                    )}
                  </div>
                );
              }

              // Normal ball drawn
              return (
                <div
                  key={entry.id}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-400 font-bold w-6">#{entry.order}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black font-mono text-xs flex items-center justify-center">
                        {entry.letter}-{entry.ball}
                      </span>
                      <span className="text-slate-300 font-medium">
                        Pedra <strong className="text-slate-100 font-mono font-bold">{entry.ball}</strong> sorteada
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/95 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer active:scale-95"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
