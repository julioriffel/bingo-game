import React, { useState, useEffect } from 'react';
import { Sparkles, Rocket, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';

interface NewGameRedirectModalProps {
  isOpen: boolean;
  newRoomCode: string;
  roomName?: string;
  hostName?: string;
  pin?: string;
  onJoin: (newRoomCode: string, pin?: string) => void;
  onDismiss: () => void;
  countdownSeconds?: number;
}

export const NewGameRedirectModal: React.FC<NewGameRedirectModalProps> = ({
  isOpen,
  newRoomCode,
  roomName,
  hostName,
  pin,
  onJoin,
  onDismiss,
  countdownSeconds = 10,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(countdownSeconds);
      return;
    }

    setSecondsLeft(countdownSeconds);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onJoin(newRoomCode, pin);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, newRoomCode, pin, countdownSeconds, onJoin]);

  if (!isOpen) return null;

  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / countdownSeconds) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-game-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in">
        {/* Animated Badge Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-victory-pulse">
              <Rocket className="w-8 h-8" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center border-2 border-slate-900">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Title and Message */}
        <div className="text-center space-y-1.5">
          <h3
            id="new-game-title"
            className="font-display font-black text-xl sm:text-2xl text-slate-100 tracking-wide flex items-center justify-center gap-2"
          >
            Nova Partida Iniciada! 🎉
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            {hostName ? (
              <>
                O Anfitrião <strong className="text-amber-300">{hostName}</strong> abriu uma nova partida!
              </>
            ) : (
              'Uma nova partida de Bingo acabou de ser iniciada!'
            )}
          </p>
        </div>

        {/* Room Info Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Nova Sala:</span>
            <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30 text-sm">
              {newRoomCode}
            </span>
          </div>
          {roomName && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Nome:</span>
              <span className="font-bold text-slate-200 truncate max-w-[200px]">{roomName}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium pt-1 border-t border-slate-800/80">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Novas cartelas serão geradas para você automaticamente.</span>
          </div>
        </div>

        {/* Countdown Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold">
            <span>Redirecionamento automático:</span>
            <span className="text-amber-300 font-mono font-black">{secondsLeft}s</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => onJoin(newRoomCode, pin)}
            className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display font-black text-sm tracking-wider transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>ENTRAR NA NOVA PARTIDA</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full min-h-[40px] px-4 py-2 rounded-2xl text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Voltar ao Lobby Principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
