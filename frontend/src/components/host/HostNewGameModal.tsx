import React, { useEffect } from 'react';
import { Sparkles, Sliders, X, Trophy, ArrowRight } from 'lucide-react';

interface HostNewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickStart: () => void;
  onCustomStart: () => void;
  isLoading?: boolean;
}

export const HostNewGameModal: React.FC<HostNewGameModalProps> = ({
  isOpen,
  onClose,
  onQuickStart,
  onCustomStart,
  isLoading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="host-new-game-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 animate-scale-in">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shadow-inner">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 id="host-new-game-title" className="font-display font-black text-lg sm:text-xl text-slate-100">
              Iniciar Nova Partida
            </h3>
            <p className="text-xs text-slate-400">
              Todos os prêmios foram entregues. Escolha como deseja iniciar a próxima rodada:
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Quick Start Option */}
          <button
            type="button"
            disabled={isLoading}
            onClick={onQuickStart}
            className="w-full text-left p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border-2 border-emerald-500/50 hover:border-emerald-400 transition-all cursor-pointer active:scale-[0.98] group shadow-lg shadow-emerald-950/30 flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-black text-sm text-slate-100 flex items-center gap-1.5">
                  Iniciar Imediatamente
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 uppercase">
                    Mais Rápido
                  </span>
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cria uma nova sala mantendo as mesmas regras e os mesmos prêmios (ganhadores resetados). Redireciona todos os jogadores automaticamente!
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Custom Config Option */}
          <button
            type="button"
            disabled={isLoading}
            onClick={onCustomStart}
            className="w-full text-left p-4 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer active:scale-[0.98] group shadow-md flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-black text-sm text-slate-200">
                  Personalizar Prêmios e Regras
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ajuste nomes, adicione ou remova prêmios e configure novos intervalos antes de abrir a nova sala para os jogadores.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 active:scale-95 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
