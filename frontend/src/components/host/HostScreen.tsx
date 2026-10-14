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
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Tv className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                MODO TELÃO (TV / PROJETOR)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  gameState.status === 'playing'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : gameState.status === 'paused'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {gameState.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-amber-400">
                {gameState.code}
              </h2>
              {roomPin && (
                <span className="text-sm font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
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
            <div className="text-base sm:text-lg font-black text-amber-300">
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
            <div className="text-base sm:text-lg font-black text-amber-300">
              {gameState.host_name || 'Mesa'}
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          {/* Jogadores Conectados */}
          <button
            type="button"
            onClick={onOpenUsers}
            className="text-right p-1.5 -m-1.5 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer group"
            title="Ver lista de usuários conectados"
          >
            <div className="text-xs text-slate-400 flex items-center gap-1.5 justify-end group-hover:text-indigo-400">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Jogadores:</span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-100">
              {activePlayers.length} Conectado{activePlayers.length === 1 ? '' : 's'}
            </div>
          </button>

          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          <button
            onClick={() => setIsLogOpen(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-md"
            title="Abrir Log Oficial da Partida"
          >
            <ScrollText className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Log da Partida</span>
            {gameState.game_log?.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full font-mono">
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
          <div className="flex gap-2">
            <button
              onClick={onToggleVoice}
              className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                voiceEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span>Voz do Cantador</span>
            </button>

            {onBackToPlayerView && (
              <button
                onClick={onBackToPlayerView}
                className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
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
              onClick={() => setIsLogOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer shrink-0"
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" /> Controles da Mesa
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {gameState.status === 'lobby' ? (
              <button
                onClick={onStartGame}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" /> INICIAR PARTIDA
              </button>
            ) : (
              <>
                <button
                  onClick={onTogglePause}
                  className={`px-5 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer ${
                    gameState.status === 'paused'
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20'
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
                  onClick={onDrawNext}
                  disabled={gameState.status === 'finished'}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" /> SORTEAR PRÓXIMA
                </button>
              </>
            )}

            {/* Speed Buttons */}
            {gameState.draw_mode === 'auto' && (
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Velocidade:</span>
                {[5, 15, 30].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSetSpeed(s)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      gameState.draw_interval === s
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
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
