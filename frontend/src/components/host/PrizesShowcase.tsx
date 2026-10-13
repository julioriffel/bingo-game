import React, { useState } from 'react';
import type { Prize } from '../../types/bingo';
import { Gift, Crown, Plus, Trash2, Trophy, Sparkles } from 'lucide-react';

interface PrizesShowcaseProps {
  prizes: Prize[];
  isHost?: boolean;
  onAddPrize?: (title: string, description: string) => void;
  onRemovePrize?: (prizeId: string) => void;
}

export const PrizesShowcase: React.FC<PrizesShowcaseProps> = ({
  prizes = [],
  isHost = false,
  onAddPrize,
  onRemovePrize,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !onAddPrize) return;
    onAddPrize(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setShowAddForm(false);
  };

  // Find next unawarded prize index
  const nextPrizeIndex = prizes.findIndex((p) => !p.winner_name);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Prêmios da Rodada
              {prizes.length > 0 && (
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  {prizes.filter((p) => p.winner_name).length}/{prizes.length} Entregues
                </span>
              )}
            </h3>
          </div>
        </div>

        {isHost && onAddPrize && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Prêmio</span>
          </button>
        )}
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2.5 animate-scale-in">
          <div className="flex gap-2">
            <input
              type="text"
              required
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nome do prêmio (ex: Fritadeira Air Fryer)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Descrição (opcional)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-4 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              Salvar Prêmio
            </button>
          </div>
        </form>
      )}

      {/* Prizes Cards Grid */}
      {prizes.length === 0 ? (
        <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <Gift className="w-8 h-8 text-slate-600 mx-auto mb-1" />
          <p className="text-xs text-slate-400 font-medium">Nenhum prêmio cadastrado nesta rodada.</p>
          <p className="text-[11px] text-slate-600">O Host pode cadastrar prêmios a qualquer momento pelo botão acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {prizes.map((prize, idx) => {
            const hasWon = Boolean(prize.winner_name);
            const isNext = idx === nextPrizeIndex && !hasWon;

            return (
              <div
                key={prize.id || `prize-${idx}`}
                className={`relative rounded-2xl p-4 transition-all overflow-hidden flex flex-col justify-between gap-3 ${
                  hasWon
                    ? 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 border-2 border-emerald-500/70 shadow-lg shadow-emerald-950/50'
                    : isNext
                    ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-2 border-amber-500/70 shadow-lg shadow-amber-950/50 ring-1 ring-amber-400/50'
                    : 'bg-slate-950/80 border border-slate-800'
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-black font-mono text-xs px-2.5 py-0.5 rounded-lg border ${
                        hasWon
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isNext
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {prize.order ? `${prize.order}º PRÊMIO` : `#${idx + 1}`}
                    </span>
                    {isNext && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400">
                        <Sparkles className="w-3 h-3" /> EM DISPUTA AGORA
                      </span>
                    )}
                  </div>

                  {isHost && onRemovePrize && !hasWon && (
                    <button
                      type="button"
                      onClick={() => onRemovePrize(prize.id)}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Excluir este prêmio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="font-black text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
                    {hasWon ? (
                      <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="line-clamp-1">{prize.title}</span>
                  </h4>
                  {prize.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{prize.description}</p>
                  )}
                </div>

                {/* Winner Status Banner */}
                <div className="pt-2 border-t border-slate-800/80">
                  {hasWon ? (
                    <div className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="text-xs">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block leading-tight">
                          Ganhador:
                        </span>
                        <span className="font-black text-slate-100 text-sm tracking-wide">
                          {prize.winner_name}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Status:</span>
                      <span className="font-bold text-amber-400/90">Aguardando Vencedor</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
