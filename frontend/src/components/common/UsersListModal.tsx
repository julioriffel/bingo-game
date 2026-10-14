import React, { useState, useEffect } from 'react';
import { X, Crown, Users, User, ShieldAlert, Zap, Clock, Wifi, WifiOff } from 'lucide-react';
import type { Player } from '../../types/bingo';

interface UsersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  hostName: string;
  hostId?: string;
  currentUserId: string;
  isCurrentUserHost: boolean;
  users: Player[];
  managerLastActiveAt?: number;
  managerInactive?: boolean;
  onClaimManager: () => void;
}

export const UsersListModal: React.FC<UsersListModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  hostName,
  hostId,
  currentUserId,
  isCurrentUserHost,
  users,
  managerLastActiveAt,
  managerInactive,
  onClaimManager,
}) => {
  const [now, setNow] = useState(Date.now() / 1000);
  const [isClaiming, setIsClaiming] = useState(false);

  // Live seconds ticker to keep countdown accurate every second
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setNow(Date.now() / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

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

  // Find manager user from list or fallback
  const managerUser = users.find((u) => u.is_host || u.id === hostId);
  const bingoPlayers = users.filter((u) => !u.is_host && u.id !== hostId);

  // Calculate inactivity
  const lastActive = managerUser?.last_active_at || managerLastActiveAt || now;
  const elapsedSeconds = Math.max(0, Math.floor(now - lastActive));
  const isManagerDisconnected = managerUser ? !managerUser.connected : false;
  const isInactive = managerInactive || elapsedSeconds >= 120 || (isManagerDisconnected && elapsedSeconds >= 120);
  const remainingSeconds = Math.max(0, 120 - elapsedSeconds);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m}m ${s < 10 ? '0' : ''}${s}s`;
    return `${s}s`;
  };

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await onClaimManager();
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="users-list-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-scale-in max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 id="users-list-title" className="font-display font-black text-lg sm:text-xl text-slate-100 flex items-center gap-2">
                Usuários Conectados
                <span className="text-xs font-mono font-bold bg-slate-800 text-amber-300 px-2 py-0.5 rounded-lg border border-slate-700">
                  {roomCode}
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {bingoPlayers.length} jogador{bingoPlayers.length === 1 ? '' : 'es'} + 1 Manager
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Fechar lista de usuários"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* SECTION 1: MANAGER / MESA */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-display">
                <Crown className="w-4 h-4 text-amber-400" /> Gerência da Mesa (Manager)
              </label>
              <span className="text-[11px] text-slate-400 italic">Coordena o sorteio</span>
            </div>

            <div className="p-4.5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-900 border border-amber-500/40 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-100 text-sm sm:text-base truncate flex items-center gap-1.5">
                      <span>{managerUser?.name || hostName}</span>
                      {managerUser?.id === currentUserId && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                          (Você)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      {managerUser?.connected !== false ? (
                        <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
                          <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-300 font-medium">
                          <WifiOff className="w-3.5 h-3.5 text-rose-400" /> Desconectado
                        </span>
                      )}
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {elapsedSeconds < 20 ? 'Ativo agora' : `Inativo há ${formatTime(elapsedSeconds)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isInactive ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-500/20 text-rose-200 text-xs font-bold border border-rose-500/50 animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Inativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                      Ativo
                    </span>
                  )}
                </div>
              </div>

              {/* Inactivity warning & Takeover action */}
              {!isCurrentUserHost && (
                <div className="pt-2.5 border-t border-slate-800">
                  {isInactive ? (
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-100 text-xs flex items-start gap-2.5">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="leading-snug">
                          <strong className="text-rose-200">Manager inativo por mais de 2 minutos!</strong>
                          <p className="text-[11px] text-rose-300/80 mt-0.5">
                            Você pode assumir o gerenciamento agora para dar continuidade à partida.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClaim}
                        disabled={isClaiming}
                        className="min-h-[48px] w-full py-2.5 px-4 rounded-2xl font-display font-black text-xs sm:text-sm tracking-wide bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer disabled:opacity-50 active:scale-95 border border-amber-300"
                      >
                        <Zap className="w-4 h-4 fill-slate-950" />
                        {isClaiming ? 'Assumindo gerenciamento...' : '⚡ Assumir Gerenciamento da Sala'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Assumir gerenciamento disponível em:
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        {formatTime(remainingSeconds)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: BINGO PLAYERS */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 font-display">
                <User className="w-4 h-4 text-indigo-400" /> Jogadores de Bingo ({bingoPlayers.length})
              </label>
              <span className="text-[11px] text-slate-400 italic">Disputam as cartelas</span>
            </div>

            {bingoPlayers.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-950/70 border border-slate-800 text-center space-y-1.5">
                <Users className="w-8 h-8 text-slate-500 mx-auto mb-1" />
                <p className="text-xs text-slate-200 font-bold">Nenhum jogador conectado ainda</p>
                <p className="text-[11px] text-slate-400">
                  Compartilhe o código da sala <strong>{roomCode}</strong> para que os participantes ingressem.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {bingoPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {player.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-100 text-xs sm:text-sm truncate flex items-center gap-1.5">
                          <span>{player.name}</span>
                          {player.id === currentUserId && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                              (Você)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{player.card_count || 1} {(player.card_count || 1) === 1 ? 'cartela' : 'cartelas'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {player.connected ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
                          Ausente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3.5 sm:px-6 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="leading-relaxed">
            Caso o Manager permaneça inativo por mais de 2 minutos, a opção de assumir a gestão é liberada automaticamente para qualquer participante.
          </span>
        </div>
      </div>
    </div>
  );
};
