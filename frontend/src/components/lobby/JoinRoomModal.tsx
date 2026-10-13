import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Entrar na Sala</h2>
            <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              {roomCode}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Seu Nome / Apelido *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ex: Joãozinho"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Cards count */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Quantas Cartelas?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: Math.min(maxCards, 4) }, (_, i) => i + 1).map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setCardCount(num)}
                  className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                    cardCount === num
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  {num} {num === 1 ? 'Cartela' : 'Cartelas'}
                </button>
              ))}
            </div>
          </div>

          {/* PIN if needed */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              PIN da Sala (Se privada)
            </label>
            <input
              type="text"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="4 dígitos"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-center font-mono font-bold tracking-widest text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !playerName.trim()}
            className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            {isLoading ? 'ENTRANDO...' : 'ENTRAR NO JOGO'}
          </button>
        </form>
      </div>
    </div>
  );
};
