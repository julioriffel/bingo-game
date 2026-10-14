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
    <section
      role="region"
      aria-label="Vitrine de prêmios da rodada"
      className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shadow-inner">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-sm sm:text-base font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Prêmios da Rodada
              {prizes.length > 0 && (
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
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
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-all cursor-pointer active:scale-95 shadow-xs"
            aria-label={showAddForm ? "Fechar formulário de adicionar prêmio" : "Adicionar novo prêmio"}
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Prêmio</span>
          </button>
        )}
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-2xl bg-slate-950 border border-amber-500/50 space-y-3 animate-scale-in shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="prize-title-input" className="sr-only">Nome do prêmio</label>
              <input
                id="prize-title-input"
                type="text"
                required
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nome do prêmio (ex: Fritadeira Air Fryer)"
                className="min-h-[44px] w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label htmlFor="prize-desc-input" className="sr-only">Descrição do prêmio</label>
              <input
                id="prize-desc-input"
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                className="min-h-[44px] w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="min-h-[36px] px-4 py-1 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="min-h-[36px] px-5 py-1 rounded-xl text-xs font-display font-black bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 active:scale-95 shadow-sm"
            >
              Salvar Prêmio
            </button>
          </div>
        </form>
      )}

      {/* Prizes Cards Grid */}
      {prizes.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <Gift className="w-8 h-8 text-slate-500 mx-auto mb-1" />
          <p className="text-xs text-slate-300 font-medium">Nenhum prêmio cadastrado nesta rodada.</p>
          <p className="text-[11px] text-slate-500">O Host pode cadastrar prêmios a qualquer momento pelo botão acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {prizes.map((prize, idx) => {
            const hasWon = Boolean(prize.winner_name);
            const isNext = idx === nextPrizeIndex && !hasWon;
            const isLastPrize = idx === prizes.length - 1;
            const isBlackout = prize.target_type === 'blackout' || isLastPrize;

            return (
              <div
                key={prize.id || `prize-${idx}`}
                className={`relative rounded-3xl p-4.5 transition-all overflow-hidden flex flex-col justify-between gap-3 shadow-lg ${
                  hasWon
                    ? 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 border-2 border-emerald-500/70 shadow-emerald-950/40'
                    : isNext
                    ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-2 border-amber-500/80 shadow-amber-950/50 ring-2 ring-amber-400/40'
                    : isBlackout
                    ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/40'
                    : 'bg-slate-950/80 border border-slate-800'
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`font-black font-mono text-xs px-2.5 py-0.5 rounded-xl border ${
                        hasWon
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isNext
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {prize.order ? `${prize.order}º PRÊMIO` : `#${idx + 1}`}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isBlackout
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {isBlackout ? '🏆 Cartela Completa' : 'Linha'}
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
                      className="min-h-[36px] min-w-[36px] p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center cursor-pointer"
                      title="Excluir este prêmio"
                      aria-label={`Excluir prêmio ${prize.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="font-display font-black text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
                    {hasWon ? (
                      <Trophy className="w-4 h-4 text-emerald-400 shrink-0 drop-shadow" />
                    ) : (
                      <Gift className="w-4 h-4 text-amber-400 shrink-0 drop-shadow" />
                    )}
                    <span className="line-clamp-1">{prize.title}</span>
                  </h4>
                  {prize.description && (
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{prize.description}</p>
                  )}
                </div>

                {/* Winner Status Banner */}
                <div className="pt-2.5 border-t border-slate-800/80">
                  {hasWon ? (
                    <div className="flex items-center gap-2 py-1.5 px-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-xs">
                      <Crown className="w-4 h-4 text-amber-400 shrink-0 drop-shadow" />
                      <div className="text-xs">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block leading-tight font-display">
                          Ganhador:
                        </span>
                        <span className="font-display font-black text-slate-100 text-sm tracking-wide">
                          {prize.winner_name}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Status:</span>
                      <span className="font-bold text-amber-300">Aguardando Vencedor</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
