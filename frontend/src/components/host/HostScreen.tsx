import React, { useState, useEffect } from 'react';
import type { GameState, Player } from '../../types/bingo';
import { DrawingGlobe } from './DrawingGlobe';
import { MasterBoard } from './MasterBoard';
import { PrizesShowcase } from './PrizesShowcase';
import { GameLogModal } from '../common/GameLogModal';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Users,
  Trophy,
  Sliders,
  Tv,
  ScrollText,
  Crown,
  Keyboard,
} from 'lucide-react';

interface HostScreenProps {
  gameState: GameState;
  players: Player[];
  roomPin?: string;
  isHost: boolean;
  onStartGame: () => void;
  onTogglePause: () => void;
  onDrawNext: () => void;
  onSetSpeed: (interval: number) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onBackToPlayerView?: () => void;
  onAddPrize?: (title: string, description: string) => void;
  onRemovePrize?: (prizeId: string) => void;
  onOpenUsers?: () => void;
}

function getLetterForBall(ball: number | null): string {
  if (!ball) return '';
  if (ball <= 15) return 'B';
  if (ball <= 30) return 'I';
  if (ball <= 45) return 'N';
  if (ball <= 60) return 'G';
  return 'O';
}

export const HostScreen: React.FC<HostScreenProps> = ({
  gameState,
  players,
  roomPin,
  isHost,
  onStartGame,
  onTogglePause,
  onDrawNext,
  onSetSpeed,
  voiceEnabled,
  onToggleVoice,
  onBackToPlayerView,
  onAddPrize,
  onRemovePrize,
  onOpenUsers,
}) => {
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Spacebar shortcut to draw next or toggle pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isHost) {
        // Prevent default spacebar scroll when interacting with controls
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        if (gameState.status === 'lobby') {
          onStartGame();
        } else if (gameState.draw_mode === 'manual' && gameState.status === 'playing') {
          onDrawNext();
        } else {
          onTogglePause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isHost, onStartGame, onDrawNext, onTogglePause]);

  const letter = getLetterForBall(gameState.last_drawn_ball);
  // Manager is NOT counted in active bingo players
  const activePlayers = players.filter((p) => !p.is_host && p.connected);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top TV Banner */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-inner">
            <Tv className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xs font-black uppercase tracking-wider text-slate-300">
                MODO TELÃO (TV / PROJETOR)
              </span>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                  gameState.status === 'playing'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                    : gameState.status === 'paused'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {gameState.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <h2 className="text-3xl sm:text-5xl font-display font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">
                {gameState.code}
              </h2>
              {roomPin && (
                <span className="text-sm font-mono font-bold text-slate-300 bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl shadow-xs">
                  PIN: {roomPin}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stage Objective & Players online & Log button */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-end">
          <div className="text-right">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 justify-end">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Etapa Atual:</span>
            </div>
            <div className="text-base sm:text-xl font-display font-black text-amber-300">
              {gameState.stage === 'line'
                ? 'LINHA'
                : gameState.stage === 'blackout'
                ? 'CARTELA CHEIA'
                : 'AGUARDANDO INÍCIO'}
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          {/* Manager / Mesa */}
          <div className="text-right">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 justify-end">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Manager:</span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-300 font-display">
              {gameState.host_name || 'Mesa'}
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          {/* Jogadores Conectados */}
          <button
            type="button"
            onClick={onOpenUsers}
            className="text-right p-2 -m-2 rounded-2xl hover:bg-slate-800/80 active:scale-95 transition-all cursor-pointer group"
            title="Ver lista de usuários conectados"
            aria-label={`Ver lista de usuários conectados: ${activePlayers.length} jogadores`}
          >
            <div className="text-xs text-slate-400 flex items-center gap-1.5 justify-end group-hover:text-indigo-300">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Jogadores:</span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-100 group-hover:text-indigo-200">
              {activePlayers.length} Conectado{activePlayers.length === 1 ? '' : 's'}
            </div>
          </button>

          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          <button
            type="button"
            onClick={() => setIsLogOpen(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
            title="Abrir Log Oficial da Partida"
            aria-label={`Abrir log oficial com ${gameState.game_log?.length || 0} eventos`}
          >
            <ScrollText className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Log da Partida</span>
            {gameState.game_log?.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full font-mono">
                {gameState.game_log.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Globe on Left + Master Board & Prizes on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 flex flex-col gap-4">
          <DrawingGlobe
            lastBall={gameState.last_drawn_ball}
            letter={letter}
            isDrawing={gameState.status === 'playing'}
          />

          {/* Voice & Switch Button */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onToggleVoice}
              className={`min-h-[44px] flex-1 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                voiceEnabled
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              aria-label={voiceEnabled ? "Desativar voz do cantador" : "Ativar voz do cantador"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span>Voz do Cantador</span>
            </button>

            {onBackToPlayerView && (
              <button
                type="button"
                onClick={onBackToPlayerView}
                className="min-h-[44px] py-2.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700/60"
              >
                Minha Cartela
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <MasterBoard
            drawnBalls={gameState.drawn_balls}
            lastBall={gameState.last_drawn_ball}
          />

          {/* LIVE AUDIT TICKER */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <ScrollText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Último Registro de Auditoria
                </div>
                {gameState.game_log && gameState.game_log.length > 0 ? (
                  <div className="text-xs font-medium text-slate-200 truncate">
                    {(() => {
                      const latest = gameState.game_log[gameState.game_log.length - 1];
                      if (latest.event_type === 'bingo_awarded') {
                        return (
                          <span className="text-amber-300 font-bold">
                            🏆 {latest.player_name} bateu {latest.pattern_name || latest.win_type}! Linha: [ {latest.winning_numbers?.join(' - ')} ]
                          </span>
                        );
                      }
                      return (
                        <span>
                          Pedra #{latest.order}: <strong className="text-amber-400 font-mono">{latest.letter}-{latest.ball}</strong> sorteada
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">
                    Aguardando primeiros sorteios...
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogOpen(true)}
              className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <ScrollText className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Log Completo ({gameState.game_log?.length || 0})</span>
            </button>
          </div>

          {/* PRIZES SHOWCASE */}
          <PrizesShowcase
            prizes={gameState.prizes || []}
            isHost={isHost}
            onAddPrize={onAddPrize}
            onRemovePrize={onRemovePrize}
          />
        </div>
      </div>

      {/* Host Controls Panel */}
      {isHost && (
        <section
          aria-label="Controles da mesa do anfitrião"
          className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="font-display text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" /> Controles da Mesa
            </span>
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Atalho:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-amber-300 font-bold">
                ESPAÇO
              </kbd>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {gameState.status === 'lobby' ? (
              <button
                type="button"
                onClick={onStartGame}
                className="min-h-[44px] px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-display font-black text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" /> INICIAR PARTIDA
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onTogglePause}
                  className={`min-h-[44px] px-5 py-2.5 rounded-2xl font-display font-black text-sm tracking-wide transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                    gameState.status === 'paused'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 hover:from-emerald-400 hover:to-emerald-300 shadow-lg shadow-emerald-500/25'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 shadow-lg shadow-amber-500/25'
                  }`}
                >
                  {gameState.status === 'paused' ? (
                    <>
                      <Play className="w-4 h-4 fill-current" /> RETOMAR
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 fill-current" /> PAUSAR
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onDrawNext}
                  disabled={gameState.status === 'finished'}
                  className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-display font-black text-sm tracking-wide transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" /> SORTEAR PRÓXIMA
                </button>
              </>
            )}

            {/* Speed Buttons */}
            {gameState.draw_mode === 'auto' && (
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 px-2 uppercase font-display">Intervalo:</span>
                {[5, 15, 30].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => onSetSpeed(s)}
                    className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      gameState.draw_interval === s
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

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
