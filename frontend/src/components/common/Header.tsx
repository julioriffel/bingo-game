import React from 'react';
import { Dices, Wifi, WifiOff, Volume2, VolumeX, Tv, ArrowLeft, Users, ShieldAlert, BookOpen } from 'lucide-react';

interface HeaderProps {
  title?: string;
  roomCode?: string;
  isConnected?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onBackToLobby?: () => void;
  onOpenHostView?: () => void;
  isHost?: boolean;
  userCount?: number;
  onOpenUsers?: () => void;
  managerInactive?: boolean;
  onOpenHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = "BINGO ROYALE",
  roomCode,
  isConnected = true,
  soundEnabled = true,
  onToggleSound,
  onBackToLobby,
  onOpenHostView,
  isHost = false,
  userCount,
  onOpenUsers,
  managerInactive = false,
  onOpenHelp,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-40 transition-colors shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onBackToLobby && (
          <button
            type="button"
            onClick={onBackToLobby}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0 border border-slate-700/60"
            title="Voltar ao Lobby"
            aria-label="Voltar ao Lobby principal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25 shrink-0 transform hover:rotate-6 transition-transform">
            <Dices className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-black text-sm sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 leading-tight truncate drop-shadow-sm">
              {title}
            </h1>
            {roomCode && (
              <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-slate-300 bg-slate-800/90 border border-slate-700/50 px-2 py-0.5 rounded-md inline-block shadow-xs">
                SALA: {roomCode}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Help & Rules Button */}
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
            title="Ver Regras Oficiais e Manuais"
            aria-label="Abrir manual de regras oficiais"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Regras</span>
          </button>
        )}

        {/* Manager Inactive Alert Pill (Visible to players if manager is inactive for 2+ min) */}
        {!isHost && managerInactive && onOpenUsers && (
          <button
            type="button"
            onClick={onOpenUsers}
            className="min-h-[44px] px-2.5 sm:px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/60 text-xs font-bold transition-all animate-pulse shadow-lg shadow-rose-500/25 cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
            title="Manager inativo! Clique para assumir"
            aria-label="Gerente inativo. Clique para assumir o controle da sala"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Manager Inativo</span>
            <span className="bg-rose-500 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide">ASSUMIR</span>
          </button>
        )}

        {/* Users list button */}
        {onOpenUsers && (
          <button
            type="button"
            onClick={onOpenUsers}
            className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
            title="Ver lista de usuários (Manager e Jogadores)"
            aria-label={`Ver usuários conectados. ${userCount !== undefined ? `${userCount} jogadores conectados` : ''}`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">
              {userCount !== undefined ? `${userCount} Jogador${userCount === 1 ? '' : 'es'}` : 'Usuários'}
            </span>
            {userCount !== undefined && (
              <span className="sm:hidden font-mono text-indigo-300 text-xs font-bold">{userCount}</span>
            )}
          </button>
        )}

        {/* TV Mode Button for Host */}
        {isHost && onOpenHostView && (
          <button
            type="button"
            onClick={onOpenHostView}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Abrir Modo Telão para TV"
            aria-label="Abrir modo telão para TV ou projetor"
          >
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">Modo Telão</span>
          </button>
        )}

        {/* Sound toggle (Master Mute / Unmute) */}
        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95 shadow-sm shrink-0 ${
              soundEnabled
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
            }`}
            title={soundEnabled ? "Silenciar jogo (efeitos sonoros e locutor)" : "Ativar som do jogo e locutor"}
            aria-label={soundEnabled ? "Silenciar efeitos sonoros e locutor" : "Ativar som e locução"}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-amber-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-rose-400" />
            )}
          </button>
        )}

        {/* Connection status indicator */}
        <div
          role="status"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-colors ${
            isConnected
              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
              : 'bg-rose-950/70 text-rose-300 border-rose-700/60'
          }`}
          title={isConnected ? 'Conectado ao servidor' : 'Desconectado'}
          aria-label={isConnected ? "Conectado ao servidor" : "Desconectado do servidor"}
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Wifi className="w-3.5 h-3.5" />
              <span className="sr-only">Conectado</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <WifiOff className="w-3.5 h-3.5" />
              <span className="sr-only">Desconectado</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
