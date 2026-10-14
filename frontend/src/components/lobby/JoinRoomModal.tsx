import React, { useState, useEffect } from 'react';
import { X, Play, Layers } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  roomCode: string;
  maxCards?: number;
  onClose: () => void;
  onJoin: (data: { playerName: string; cardCount: number; pin?: string }) => Promise<void>;
  isLoading?: boolean;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  roomCode,
  maxCards = 4,
  onClose,
  onJoin,
  isLoading = false,
}) => {
  const [playerName, setPlayerName] = useState(localStorage.getItem('bingo_player_name') || '');
  const [cardCount, setCardCount] = useState<number>(1);
  const [pin, setPin] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    localStorage.setItem('bingo_player_name', playerName.trim());
    await onJoin({
      playerName: playerName.trim(),
      cardCount,
      pin: pin.trim() || undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-room-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div>
            <h2 id="join-room-title" className="text-lg sm:text-xl font-display font-black text-slate-100">
              Entrar na Sala
            </h2>
            <span className="font-mono text-xs font-black text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
              {roomCode}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-slate-100 transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="join-player-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Seu Nome / Apelido *
            </label>
            <input
              id="join-player-name"
              type="text"
              required
              autoFocus
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ex: Joãozinho"
              className="min-h-[44px] w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
          </div>

          {/* Cards count */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-display">
              <Layers className="w-4 h-4 text-indigo-400" /> Quantas Cartelas?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: Math.min(maxCards, 4) }, (_, i) => i + 1).map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setCardCount(num)}
                  className={`min-h-[44px] py-2 rounded-2xl border font-bold text-xs transition-all cursor-pointer active:scale-95 ${
                    cardCount === num
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  {num} {num === 1 ? 'Cartela' : 'Cartelas'}
                </button>
              ))}
            </div>
          </div>

          {/* PIN if needed */}
          <div>
            <label htmlFor="join-pin-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              PIN da Sala (Se privada)
            </label>
            <input
              id="join-pin-input"
              type="text"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="4 dígitos"
              className="min-h-[44px] w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2 text-center font-mono font-bold tracking-widest text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !playerName.trim()}
            className="min-h-[50px] w-full py-3.5 px-4 rounded-2xl font-display font-black text-sm tracking-wide bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 hover:from-amber-400 hover:to-amber-300 active:scale-95 transition-all shadow-xl shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
          >
            <Play className="w-4 h-4 fill-current" />
            {isLoading ? 'ENTRANDO...' : 'ENTRAR NO JOGO'}
          </button>
        </form>
      </div>
    </div>
  );
};
