import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-slate-100 flex items-center gap-2">
                Log Oficial da Partida
                <span className="text-xs font-mono font-bold bg-slate-800 text-amber-400 px-2 py-0.5 rounded-lg border border-slate-700">
                  {roomCode}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Auditoria de cada pedra sorteada e números das linhas premiadas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 p-3 sm:px-5 bg-slate-950/40 border-b border-slate-800/80 text-center">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Sorteadas</div>
            <div className="text-base sm:text-lg font-black font-mono text-indigo-400">
              {totalBalls}<span className="text-xs text-slate-500">/75</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Premiações</div>
            <div className="text-base sm:text-lg font-black font-mono text-amber-400">
              {totalWinners}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Eventos</div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-200">
              {gameLog.length}
            </div>
          </div>
        </div>

        {/* Filter and Actions Toolbar */}
        <div className="p-3 sm:px-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-900/50">
          {/* Filters */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({gameLog.length})
            </button>
            <button
              onClick={() => setFilterType('winners')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filterType === 'winners'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3 h-3" />
              Vitórias ({totalWinners})
            </button>
            <button
              onClick={() => setFilterType('balls')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'balls'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pedras ({totalBalls})
            </button>
          </div>

          {/* Sort & Copy */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="p-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Inverter ordem"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>{sortDesc ? 'Mais recentes' : 'Primeiros'}</span>
            </button>

            <button
              onClick={handleCopyLog}
              className="p-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Log'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Events List */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-2.5 flex-1 max-h-[55vh]">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Clock className="w-8 h-8 mx-auto stroke-1" />
              <p className="text-sm font-medium">Nenhum evento registrado até o momento.</p>
              <p className="text-xs text-slate-600">
                Os números sorteados e vitórias aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            sorted.map((entry) => {
              if (entry.event_type === 'bingo_tiebreaker') {
                return (
                  <div
                    key={entry.id}
                    className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-indigo-600 text-white font-black text-xs">
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
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/40 shadow-lg shadow-amber-500/5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs">
                          <Trophy className="w-3.5 h-3.5 fill-current" />
                        </span>
                        <span className="font-black text-sm text-amber-300">
                          {entry.player_name} bateu {entry.pattern_name || entry.win_type}!
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>

                    {/* Tiebreaker note if applicable */}
                    {entry.details && (
                      <div className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 inline-block">
                        ⚡ {entry.details}
                      </div>
                    )}

                    {/* Details: Winning numbers */}
                    {entry.winning_numbers && entry.winning_numbers.length > 0 && (
                      <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>Números da Linha Premiada:</span>
                          {entry.on_ball && (
                            <span className="text-amber-400">Pedra de fechamento: {entry.on_ball}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {entry.winning_numbers.map((num, i) => (
                            <span
                              key={`win-num-${i}-${num}`}
                              className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono ${
                                num === 'FREE'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : num === entry.on_ball
                                  ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400/50'
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
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        <Gift className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
                  className="px-3 py-2 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500 w-6">#{entry.order}</span>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black font-mono text-xs flex items-center justify-center">
                        {entry.letter}-{entry.ball}
                      </span>
                      <span className="text-slate-300 font-medium">
                        Pedra <strong className="text-slate-100">{entry.ball}</strong> sorteada
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
