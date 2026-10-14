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
    <header className="w-full bg-slate-900/80 backdrop-blur border-b border-slate-800 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onBackToLobby && (
          <button
            type="button"
            onClick={onBackToLobby}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer shrink-0"
            title="Sair para o Lobby"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Dices className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-sm sm:text-lg tracking-wider text-amber-400 leading-tight truncate">
              {title}
            </h1>
            {roomCode && (
              <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-slate-400 bg-slate-800/80 px-1.5 sm:px-2 py-0.5 rounded inline-block">
                SALA: {roomCode}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Help & Rules Button */}
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0"
            title="Ver Regras Oficiais e Manuais"
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
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 text-xs font-bold transition-all animate-pulse shadow-lg shadow-rose-500/20 cursor-pointer shrink-0"
            title="Manager inativo! Clique para assumir"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Manager Inativo</span>
            <span className="bg-rose-500 text-slate-950 px-1 rounded text-[10px] font-black">ASSUMIR</span>
          </button>
        )}

        {/* Users list button */}
        {onOpenUsers && (
          <button
            type="button"
            onClick={onOpenUsers}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
            title="Ver lista de usuários (Manager e Jogadores)"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">
              {userCount !== undefined ? `${userCount} Jogador${userCount === 1 ? '' : 'es'}` : 'Usuários'}
            </span>
            {userCount !== undefined && (
              <span className="sm:hidden font-mono text-indigo-300 text-xs">{userCount}</span>
            )}
          </button>
        )}

        {/* TV Mode Button for Host */}
        {isHost && onOpenHostView && (
          <button
            type="button"
            onClick={onOpenHostView}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 shrink-0"
            title="Abrir Modo Telão para TV"
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
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95 shadow-sm shrink-0 ${
              soundEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
            }`}
            title={soundEnabled ? "Silenciar jogo (efeitos sonoros e locutor)" : "Ativar som do jogo e locutor"}
            aria-label={soundEnabled ? "Silenciar jogo" : "Ativar som"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
            )}
          </button>
        )}

        {/* Connection status indicator */}
        <div
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${
            isConnected
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
              : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
          }`}
          title={isConnected ? 'Conectado ao servidor' : 'Desconectado'}
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Wifi className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <WifiOff className="w-3.5 h-3.5" />
            </>
          )}
        </div>
      </div>
    </header>
  );
};
