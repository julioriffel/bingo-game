import React, { useState } from 'react';
import confetti from 'canvas-confetti';
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

function getLetterForBall(ball: number | null): string {
  if (!ball) return '';
  if (ball <= 15) return 'B';
  if (ball <= 30) return 'I';
  if (ball <= 45) return 'N';
  if (ball <= 60) return 'G';
  return 'O';
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
  const lastBallLetter = getLetterForBall(gameState.last_drawn_ball);
  const hasWonAnyPattern = activeCard?.winning_patterns && activeCard.winning_patterns.length > 0;

  const handleBingoClick = () => {
    if (!activeCard) return;
    if ('vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 },
      });
    } catch (err) {
      // Confetti canvas animation unavailable on this viewport; proceed with Bingo call
    }
    onCallBingo(activeCard.id);
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col min-h-[calc(100vh-68px)] justify-between p-3 sm:p-4 gap-4">
      {/* Top Section: Last Drawn Ball & Strip */}
      <section
        aria-label="Status do sorteio e controles rápidos"
        className="bg-slate-900/95 border border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-xl flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Main Last Ball Badge with aria-live */}
          <div
            role="status"
            aria-live="polite"
            className="shrink-0"
          >
            {gameState.last_drawn_ball ? (
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex flex-col items-center justify-center font-black shadow-lg shadow-amber-500/30 animate-scale-in border border-amber-300"
                aria-label={`Última pedra sorteada: ${lastBallLetter} ${gameState.last_drawn_ball}`}
              >
                <span className="font-display text-[11px] uppercase tracking-widest leading-none font-bold text-slate-900/80">
                  {lastBallLetter}
                </span>
                <span className="font-display text-2xl sm:text-3xl leading-none mt-0.5">
                  {gameState.last_drawn_ball}
                </span>
              </div>
            ) : (
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 flex flex-col items-center justify-center text-[11px] font-bold text-center px-1"
                aria-label="Aguardando primeiro sorteio"
              >
                <span>AGUARDE</span>
              </div>
            )}
          </div>

          {/* History strip */}
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>Chamadas</span>
              <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                {gameState.drawn_balls.length}/75
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" aria-label="Últimas 5 pedras sorteadas">
              {lastBalls.length > 0 ? (
                lastBalls.map((b, idx) => (
                  <span
                    key={`last-${b}-${idx}`}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 transition-transform ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-sm font-mono'
                        : 'bg-slate-800 text-slate-300 font-mono border border-slate-700/60'
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

        {/* Action Buttons: Log, Assistant, Sound, Users */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsLogOpen(true)}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl border bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border-slate-700 text-slate-300 hover:text-amber-300 transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs"
            title="Log oficial de sorteios e ganhadores"
            aria-label={`Ver log oficial com ${gameState.game_log?.length || 0} eventos registrados`}
          >
            <ScrollText className="w-4 h-4 text-amber-400" />
            <span className="text-[9px] font-bold mt-0.5">Log</span>
          </button>

          <button
            type="button"
            onClick={() => setAssistMode(!assistMode)}
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs ${
              assistMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Destacar pedras sorteadas na cartela"
            aria-label={assistMode ? "Assistente de marcação ativado" : "Assistente de marcação desativado"}
          >
            <Eye className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-0.5">Ajuda</span>
          </button>

          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95 shadow-xs ${
                soundEnabled
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
              }`}
              title={soundEnabled ? "Silenciar sons e locutor" : "Ativar som e locutor"}
              aria-label={soundEnabled ? "Silenciar efeitos e locução" : "Ativar som e locução"}
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
              type="button"
              onClick={onOpenUsers}
              className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs ${
                managerInactive
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300 hover:text-indigo-300'
              }`}
              title="Ver usuários (Manager e Jogadores)"
              aria-label={`Ver lista de usuários. ${userCount ?? 0} jogadores`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-[9px] font-bold mt-0.5">
                {managerInactive ? 'Mesa' : `${userCount ?? 0}`}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Manager Inactive Alert Banner (Floating prompt for players) */}
      {managerInactive && onOpenUsers && (
        <div
          role="alert"
          onClick={onOpenUsers}
          className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/90 border border-rose-500/70 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs shadow-xl shadow-rose-950/40 cursor-pointer animate-pulse transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-rose-100 text-sm">Manager Inativo há mais de 2 minutos!</div>
              <div className="text-[11px] text-rose-300/80">Toque para assumir o gerenciamento da partida.</div>
            </div>
          </div>
          <span className="px-3.5 py-2 rounded-xl bg-rose-500 text-slate-950 font-black text-xs shrink-0 shadow-md">
            ASSUMIR
          </span>
        </div>
      )}

      {/* In-Game Notifications Banner */}
      {lastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="bg-indigo-950/80 border border-indigo-700/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 text-indigo-200 text-xs font-medium animate-slide-down shadow-md"
        >
          <Bell className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{lastMessage}</span>
        </div>
      )}

      {/* Prizes at Stake Strip */}
      {gameState.prizes && gameState.prizes.length > 0 && (
        <section
          aria-label="Prêmios em disputa na rodada"
          className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-3 shadow-md space-y-2"
        >
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-black text-amber-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-display">
              <Gift className="w-4 h-4 text-amber-400" /> Prêmios em Jogo
            </span>
            <span className="text-[11px] font-mono text-slate-300 font-bold bg-slate-800/80 px-2 py-0.5 rounded-md">
              {gameState.prizes.filter((p) => p.winner_name).length}/{gameState.prizes.length} Entregues
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {gameState.prizes.map((p, idx) => {
              const isLastPrize = idx === (gameState.prizes?.length || 0) - 1;
              const isBlackout = p.target_type === 'blackout' || isLastPrize;

              return (
                <div
                  key={p.id || idx}
                  className={`py-2 px-3 rounded-2xl border whitespace-nowrap shrink-0 flex items-center gap-2 text-xs transition-colors ${
                    p.winner_name
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200 shadow-xs'
                      : isBlackout
                      ? 'bg-gradient-to-r from-slate-900 to-slate-950 border-emerald-500/40 text-slate-100 shadow-xs'
                      : 'bg-slate-950/80 border-slate-800 text-slate-200'
                  }`}
                >
                  <span className="font-mono font-black text-[11px] text-amber-400">#{p.order || idx + 1}</span>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      isBlackout
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    }`}
                  >
                    {isBlackout ? '🏆 Cartela Cheia' : 'Linha'}
                  </span>
                  <span className="font-bold text-slate-100">{p.title}</span>
                  {p.winner_name ? (
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-black flex items-center gap-1 border border-emerald-500/40">
                      <Crown className="w-3 h-3 text-amber-400" /> {p.winner_name}
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400/90 font-bold">(Em disputa)</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Stage Badge & Multi-Card Tabs */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Objetivo:</span>
            <span className="font-bold text-amber-300">
              {gameState.stage === 'line'
                ? 'Fazer Linha (Horizontal, Vertical ou Diagonal)'
                : gameState.stage === 'blackout'
                ? 'Completar Cartela Cheia (Blackout)!'
                : 'Aguardando Início'}
            </span>
          </div>
          <span className="text-xs text-slate-300 font-bold bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
            {playerName}
          </span>
        </div>

        {/* Tabs for Multiple Cards */}
        {cards.length > 1 && (
          <div
            role="tablist"
            aria-label="Seleção de cartela"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {cards.map((c, idx) => {
              const hasWon = c.winning_patterns && c.winning_patterns.length > 0;
              const isSelected = activeCardIndex === idx;

              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`card-panel-${idx}`}
                  onClick={() => setActiveCardIndex(idx)}
                  className={`min-h-[44px] flex-1 py-2 px-3.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 border border-amber-300'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/90 border border-slate-700/60'
                  }`}
                >
                  <span className="font-display">Cartela {idx + 1}</span>
                  {hasWon && <Trophy className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0 drop-shadow" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Bingo Card */}
      {activeCard && (
        <div id={`card-panel-${activeCardIndex}`} role="tabpanel">
          <BingoCard
            card={activeCard}
            drawnBalls={gameState.drawn_balls}
            assistMode={assistMode}
            onToggleCell={onToggleCell}
            cardIndex={activeCardIndex}
            winningPatterns={activeCard.winning_patterns}
          />
        </div>
      )}

      {/* Timing and Duplicate Hint */}
      <div className="space-y-1.5">
        {hasWonAnyPattern && (
          <div className="text-center text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded-2xl py-1.5 px-3.5 animate-slide-down">
            🏆 Esta cartela já tem linha premiada! Novas linhas ou cartela cheia continuam valendo.
          </div>
        )}
        <div className="text-center text-[11px] text-slate-400 font-medium px-2">
          ⚡ Dica Oficial: Cante BINGO antes da próxima pedra ser sorteada para garantir seu prêmio!
        </div>
      </div>

      {/* Bottom Sticky Action: BINGO Button */}
      <div className="pt-2 sticky bottom-3 z-30 pb-safe">
        <button
          type="button"
          onClick={handleBingoClick}
          aria-label="Cantar Bingo agora"
          className={`w-full py-4 sm:py-4.5 rounded-2xl font-display font-black text-2xl sm:text-3xl tracking-widest text-slate-950 transition-all flex items-center justify-center gap-2.5 cursor-pointer touch-manipulation active:scale-[0.97] border-2 border-amber-300 shadow-2xl ${
            hasWonAnyPattern
              ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 animate-victory-pulse shadow-amber-400/60'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 shadow-amber-500/40 glow-bingo'
          }`}
        >
          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
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
