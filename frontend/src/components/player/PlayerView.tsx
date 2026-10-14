import React, { useState } from 'react';
import type { BingoCard as BingoCardType, GameState } from '../../types/bingo';
import { BingoCard } from './BingoCard';
import { GameLogModal } from '../common/GameLogModal';
import { Sparkles, Eye, Trophy, Bell, Gift, Crown, ScrollText, Users, ShieldAlert, Volume2, VolumeX } from 'lucide-react';

interface PlayerViewProps {
  cards: BingoCardType[];
  gameState: GameState;
  playerName: string;
  onToggleCell: (cardId: string, number: number) => void;
  onCallBingo: (cardId: string) => void;
  lastMessage?: string | null;
  onOpenUsers?: () => void;
  userCount?: number;
  managerInactive?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  cards,
  gameState,
  playerName,
  onToggleCell,
  onCallBingo,
  lastMessage,
  onOpenUsers,
  userCount,
  managerInactive,
  soundEnabled = true,
  onToggleSound,
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [assistMode, setAssistMode] = useState(true);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const activeCard = cards[activeCardIndex] || cards[0];
  const lastBalls = [...gameState.drawn_balls].reverse().slice(0, 5);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col min-h-[calc(100vh-65px)] justify-between p-3 sm:p-4 gap-4">
      {/* Top Section: Last Drawn Ball & Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Main Last Ball Badge */}
          {gameState.last_drawn_ball ? (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex flex-col items-center justify-center font-black shadow-lg shadow-amber-500/20 animate-scale-in">
              <span className="text-[10px] uppercase tracking-widest leading-none font-bold">ÚLTIMA</span>
              <span className="text-xl leading-none mt-0.5">{gameState.last_drawn_ball}</span>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-slate-500 flex flex-col items-center justify-center text-xs font-bold">
              <span>AGUARDE</span>
            </div>
          )}

          {/* History strip */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Últimas Chamadas ({gameState.drawn_balls.length}/75)
            </div>
            <div className="flex items-center gap-1.5">
              {lastBalls.length > 0 ? (
                lastBalls.map((b, idx) => (
                  <span
                    key={`last-${b}-${idx}`}
                    className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                      idx === 0
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {b}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">Sorteio não iniciado</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Log & Assistant */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsLogOpen(true)}
            className="p-2 sm:p-2.5 rounded-xl border bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300 hover:text-amber-300 transition-colors flex flex-col items-center justify-center cursor-pointer"
            title="Log oficial de sorteios e ganhadores"
          >
            <ScrollText className="w-4 h-4 text-amber-400" />
            <span className="text-[9px] font-bold mt-0.5">Log ({gameState.game_log?.length || 0})</span>
          </button>

          <button
            onClick={() => setAssistMode(!assistMode)}
            className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center transition-colors cursor-pointer ${
              assistMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
            title="Destacar pedras sorteadas na cartela"
          >
            <Eye className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-0.5">Assistente</span>
          </button>

          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95 shadow-sm ${
                soundEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
              }`}
              title={soundEnabled ? "Silenciar sons e locutor" : "Ativar som e locutor"}
              aria-label={soundEnabled ? "Silenciar jogo" : "Ativar som"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-rose-400" />
              )}
              <span className="text-[9px] font-bold mt-0.5">
                {soundEnabled ? 'Som' : 'Mudo'}
              </span>
            </button>
          )}

          {onOpenUsers && (
            <button
              onClick={onOpenUsers}
              className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center transition-colors cursor-pointer ${
                managerInactive
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300 hover:text-indigo-300'
              }`}
              title="Ver usuários (Manager e Jogadores)"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-[9px] font-bold mt-0.5">
                {managerInactive ? 'Assumir' : `Usuários (${userCount ?? 0})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Manager Inactive Alert Banner (Floating prompt for players) */}
      {managerInactive && onOpenUsers && (
        <div
          onClick={onOpenUsers}
          className="bg-gradient-to-r from-rose-950/90 to-amber-950/90 border border-rose-500/60 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs shadow-xl shadow-rose-950/50 cursor-pointer animate-pulse"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-rose-200">Manager Inativo há mais de 2 minutos!</div>
              <div className="text-[11px] text-rose-300/80">Toque aqui para assumir o gerenciamento da sala.</div>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-rose-500 text-slate-950 font-black text-xs shrink-0 shadow">
            ASSUMIR
          </span>
        </div>
      )}

      {/* In-Game Notifications Banner */}
      {lastMessage && (
        <div className="bg-indigo-950/70 border border-indigo-800/80 rounded-xl px-3 py-2 flex items-center gap-2 text-indigo-300 text-xs font-medium animate-fade-in">
          <Bell className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{lastMessage}</span>
        </div>
      )}

      {/* Prizes at Stake Strip */}
      {gameState.prizes && gameState.prizes.length > 0 && (
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-2.5 shadow-md space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-black text-amber-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
              <Gift className="w-3.5 h-3.5" /> Prêmios em Jogo
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {gameState.prizes.filter((p) => p.winner_name).length}/{gameState.prizes.length} Entregues
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 text-xs">
            {gameState.prizes.map((p, idx) => (
              <div
                key={p.id || idx}
                className={`py-1.5 px-2.5 rounded-xl border whitespace-nowrap shrink-0 flex items-center gap-1.5 text-xs ${
                  p.winner_name
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950/70 border-slate-800 text-slate-200'
                }`}
              >
                <span className="font-black font-mono text-[10px] text-amber-400">#{p.order || idx + 1}</span>
                <span className="font-bold">{p.title}</span>
                {p.winner_name ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" /> {p.winner_name}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400/80 font-semibold">(Em disputa)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage Badge & Multi-Card Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Objetivo:</span>
            <span className="font-bold text-amber-300">
              {gameState.stage === 'line'
                ? 'Fazer Linha (Horizontal, Vertical ou Diagonal)'
                : gameState.stage === 'blackout'
                ? 'Completar Cartela Cheia!'
                : 'Aguardando Início'}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-bold">{playerName}</span>
        </div>

        {/* Tabs for Multiple Cards */}
        {cards.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {cards.map((c, idx) => {
              const hasWon = c.winning_patterns && c.winning_patterns.length > 0;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCardIndex(idx)}
                  className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeCardIndex === idx
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>Cartela {idx + 1}</span>
                  {hasWon && <Trophy className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Bingo Card */}
      {activeCard && (
        <BingoCard
          card={activeCard}
          drawnBalls={gameState.drawn_balls}
          assistMode={assistMode}
          onToggleCell={onToggleCell}
          cardIndex={activeCardIndex}
          winningPatterns={activeCard.winning_patterns}
        />
      )}

      {/* Timing and Duplicate Hint */}
      <div className="space-y-1">
        {activeCard?.winning_patterns && activeCard.winning_patterns.length > 0 && (
          <div className="text-center text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl py-1 px-3 animate-fade-in">
            🏆 Esta cartela já teve linha premiada! Novas linhas ou cartela cheia continuam válidas.
          </div>
        )}
        <div className="text-center text-[10px] text-slate-400 font-semibold px-2">
          ⚡ Regra Oficial: Cante BINGO antes do próximo número ser sorteado para validar sua vitória!
        </div>
      </div>

      {/* Bottom Sticky Action: BINGO Button */}
      <div className="pt-1 sticky bottom-3 z-30">
        <button
          onClick={() => activeCard && onCallBingo(activeCard.id)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xl tracking-wider shadow-2xl shadow-amber-500/40 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer glow-bingo"
        >
          <Sparkles className="w-6 h-6 stroke-[2.5]" />
          BINGO!
        </button>
      </div>

      {/* Game Log Modal */}
      <GameLogModal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        gameLog={gameState.game_log || []}
        roomCode={gameState.code}
      />
    </div>
  );
};
