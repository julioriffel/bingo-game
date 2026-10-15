import React, { useState, useEffect } from 'react';
import { X, Trophy, Layers, Clock, Globe, Lock, Gift, Plus, Trash2, Timer } from 'lucide-react';

interface PrizeItem {
  title: string;
  description: string;
  target_type?: 'line' | 'blackout';
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: {
    host_name: string;
    name: string;
    win_condition: 'line' | 'blackout' | 'multi_stage';
    max_cards_per_player: number;
    is_public: boolean;
    draw_interval: number;
    draw_mode: 'auto' | 'manual';
    contest_window_seconds?: number;
    prizes: PrizeItem[];
    previous_room_code?: string;
  }) => Promise<void>;
  initialConfig?: {
    name?: string;
    win_condition?: 'line' | 'blackout' | 'multi_stage';
    max_cards_per_player?: number;
    is_public?: boolean;
    draw_interval?: number;
    draw_mode?: 'auto' | 'manual';
    contest_window_seconds?: number;
    prizes?: PrizeItem[];
    previous_room_code?: string;
  } | null;
  isLoading?: boolean;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  initialConfig,
  isLoading = false,
}) => {
  const [hostName, setHostName] = useState(() => {
    try {
      return localStorage.getItem('bingo_player_name') || '';
    } catch (err) {
      return '';
    }
  });
  const [roomName, setRoomName] = useState('');
  const [winCondition, setWinCondition] = useState<'line' | 'blackout' | 'multi_stage'>('multi_stage');
  const [maxCards, setMaxCards] = useState<number>(2);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [drawMode, setDrawMode] = useState<'auto' | 'manual'>('auto');
  const [drawInterval, setDrawInterval] = useState<number>(5);
  const [contestWindow, setContestWindow] = useState<number>(10);

  // Dynamic prizes list
  const [prizes, setPrizes] = useState<PrizeItem[]>([
    { title: '1º Prêmio: Linha', description: 'Para quem completar a 1ª linha', target_type: 'line' },
    { title: '2º Prêmio: Cartela Completa', description: 'Grande prêmio da rodada (Blackout)', target_type: 'blackout' },
  ]);

  // Sync initialConfig if provided
  useEffect(() => {
    if (isOpen && initialConfig) {
      if (initialConfig.name) setRoomName(initialConfig.name);
      if (initialConfig.win_condition) setWinCondition(initialConfig.win_condition);
      if (initialConfig.max_cards_per_player) setMaxCards(initialConfig.max_cards_per_player);
      if (initialConfig.is_public !== undefined) setIsPublic(initialConfig.is_public);
      if (initialConfig.draw_interval) setDrawInterval(initialConfig.draw_interval);
      if (initialConfig.draw_mode) setDrawMode(initialConfig.draw_mode);
      if (initialConfig.contest_window_seconds) setContestWindow(initialConfig.contest_window_seconds);
      if (initialConfig.prizes && initialConfig.prizes.length > 0) {
        setPrizes(initialConfig.prizes);
      }
    }
  }, [isOpen, initialConfig]);

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

  const handleAddPrize = () => {
    const nextOrder = prizes.length + 1;
    setPrizes([...prizes, { title: `${nextOrder}º Prêmio`, description: '', target_type: 'line' }]);
  };

  const handleRemovePrize = (index: number) => {
    setPrizes(prizes.filter((_, idx) => idx !== index));
  };

  const handlePrizeChange = (
    index: number,
    field: 'title' | 'description' | 'target_type',
    value: string
  ) => {
    setPrizes(
      prizes.map((p, idx) => {
        if (idx === index) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const applyPrizePreset = (type: 'none' | 'single' | 'multistage' | 'podium') => {
    if (type === 'none') {
      setPrizes([]);
    } else if (type === 'single') {
      setPrizes([{ title: 'Grande Prêmio (Cartela Completa)', description: 'Para quem preencher toda a cartela', target_type: 'blackout' }]);
    } else if (type === 'multistage') {
      setPrizes([
        { title: '1º Prêmio: Linha', description: 'Primeira quina/linha completada', target_type: 'line' },
        { title: '2º Prêmio: Cartela Completa', description: 'Bingo completo (Blackout)', target_type: 'blackout' },
      ]);
    } else if (type === 'podium') {
      setPrizes([
        { title: '1º Lugar (Linha)', description: 'Primeiro vencedor de linha', target_type: 'line' },
        { title: '2º Lugar (Linha)', description: 'Segundo vencedor de linha', target_type: 'line' },
        { title: '3º Lugar (Cartela Completa)', description: 'Grande campeão da cartela cheia', target_type: 'blackout' },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) return;
    try {
      localStorage.setItem('bingo_player_name', hostName.trim());
    } catch (err) {
      // Storage access blocked or unavailable
    }

    // Filter out prizes with empty titles
    const validPrizes = prizes
      .map((p, idx) => ({
        title: p.title.trim(),
        description: p.description.trim(),
        target_type: p.target_type || (idx === prizes.length - 1 ? 'blackout' : 'line'),
      }))
      .filter((p) => p.title.length > 0);

    await onCreate({
      host_name: hostName.trim(),
      name: roomName.trim() || `Bingo do ${hostName}`,
      win_condition: winCondition,
      max_cards_per_player: maxCards,
      is_public: isPublic,
      draw_interval: drawInterval,
      draw_mode: drawMode,
      contest_window_seconds: contestWindow,
      prizes: validPrizes,
      previous_room_code: initialConfig?.previous_room_code,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-room-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              +
            </div>
            <h2 id="create-room-title" className="text-lg sm:text-xl font-display font-black text-slate-100">
              Criar Nova Partida
            </h2>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Host Name & Room Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-host-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Seu Nome / Apelido *
              </label>
              <input
                id="create-host-name"
                type="text"
                required
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Ex: Julio Mestre"
                className="min-h-[44px] w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="create-room-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome da Sala (Opcional)
              </label>
              <input
                id="create-room-name"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ex: Bingo da Família"
                className="min-h-[44px] w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
              />
            </div>
          </div>

          {/* DYNAMIC PRIZES SECTION */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider font-display">
                <Gift className="w-4 h-4 text-amber-400" /> Prêmios da Rodada ({prizes.length})
              </label>
              <button
                type="button"
                onClick={handleAddPrize}
                className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Prêmio
              </button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 shrink-0 font-medium">Modelos:</span>
              <button
                type="button"
                onClick={() => applyPrizePreset('multistage')}
                className="min-h-[32px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shrink-0 active:scale-95"
              >
                Linha + Cheia
              </button>
              <button
                type="button"
                onClick={() => applyPrizePreset('podium')}
                className="min-h-[32px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shrink-0 active:scale-95"
              >
                1º, 2º e 3º Lugar
              </button>
              <button
                type="button"
                onClick={() => applyPrizePreset('single')}
                className="min-h-[32px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shrink-0 active:scale-95"
              >
                Prêmio Único
              </button>
              <button
                type="button"
                onClick={() => applyPrizePreset('none')}
                className="min-h-[32px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-700/80 shrink-0 active:scale-95"
              >
                Limpar
              </button>
            </div>

            {/* Prizes inputs list */}
            {prizes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">
                Nenhum prêmio configurado (jogo recreativo sem premiação física).
              </p>
            ) : (
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {prizes.map((p, idx) => (
                  <div
                    key={`prz-${idx}`}
                    className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-black font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handlePrizeChange(
                              idx,
                              'target_type',
                              p.target_type === 'blackout' ? 'line' : 'blackout'
                            )
                          }
                          title="Clique para alternar entre Linha e Cartela Cheia"
                          aria-label={`Alternar modalidade do prêmio ${idx + 1}: atualmente ${
                            p.target_type === 'blackout' ? 'Cartela Cheia' : 'Linha'
                          }`}
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                            p.target_type === 'blackout'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                          }`}
                        >
                          {p.target_type === 'blackout' ? '🏆 Cartela Cheia' : 'Linha'}
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={p.title}
                        onChange={(e) => handlePrizeChange(idx, 'title', e.target.value)}
                        placeholder="Nome do prêmio (ex: Cesta de Chocolate)"
                        aria-label={`Nome do prêmio número ${idx + 1}`}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePrize(idx)}
                        className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center cursor-pointer"
                        title="Remover prêmio"
                        aria-label={`Remover prêmio ${idx + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={p.description}
                      onChange={(e) => handlePrizeChange(idx, 'description', e.target.value)}
                      placeholder="Descrição opcional (ex: Doado pela Família Silva)"
                      aria-label={`Descrição do prêmio número ${idx + 1}`}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Win Condition Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-display">
              <Trophy className="w-4 h-4 text-amber-400" /> Critério de Vitória
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'multi_stage', label: 'Multi-Etapas', desc: '1º Linha, depois Cheia' },
                { id: 'blackout', label: 'Cartela Cheia', desc: 'Bate tudo (Blackout)' },
                { id: 'line', label: 'Linha Única', desc: 'Partida Rápida' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setWinCondition(opt.id as any)}
                  className={`min-h-[56px] p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer active:scale-95 ${
                    winCondition === opt.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 shadow-sm'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs">{opt.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cards per Player */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-display">
              <Layers className="w-4 h-4 text-indigo-400" /> Cartelas por Jogador
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setMaxCards(num)}
                  className={`min-h-[44px] flex-1 py-2 rounded-2xl border font-bold text-xs transition-all cursor-pointer active:scale-95 ${
                    maxCards === num
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  {num} {num === 1 ? 'Cartela' : 'Cartelas'}
                </button>
              ))}
            </div>
          </div>

          {/* Sorteio & Ritmo */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-display">
                <Clock className="w-4 h-4 text-sky-400" /> Modo de Sorteio
              </label>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setDrawMode('auto')}
                  className={`min-h-[36px] px-3.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    drawMode === 'auto' ? 'bg-sky-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Automático
                </button>
                <button
                  type="button"
                  onClick={() => setDrawMode('manual')}
                  className={`min-h-[36px] px-3.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    drawMode === 'manual' ? 'bg-sky-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>

            {drawMode === 'auto' && (
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                  <span>Intervalo entre pedras:</span>
                  <span className="font-bold text-sky-400 font-mono">{drawInterval}s</span>
                </div>
                <div className="flex gap-2">
                  {[5, 15, 30].map((sec) => (
                    <button
                      type="button"
                      key={sec}
                      onClick={() => setDrawInterval(sec)}
                      className={`min-h-[40px] flex-1 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        drawInterval === sec
                          ? 'border-sky-500 bg-sky-500/20 text-sky-300 shadow-xs'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {sec}s {sec === 5 ? '★' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Janela de Contestação / Desempate */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-display">
                <Timer className="w-4 h-4 text-amber-400" /> Janela de Contestação (Bingo Simultâneo)
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">{contestWindow}s</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Tempo de espera após o 1º bingo para outros jogadores cantarem na mesma pedra e disputarem na pedra mais alta.
            </p>
            <div className="flex gap-2 pt-1">
              {[10, 30, 60].map((sec) => (
                <button
                  type="button"
                  key={sec}
                  onClick={() => setContestWindow(sec)}
                  className={`min-h-[40px] flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    contestWindow === sec
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-xs'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {sec}s {sec === 10 ? '★' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Visibilidade da Sala */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              {isPublic ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
              {isPublic ? 'Sala Pública (Listada no Radar)' : 'Sala Privada (Apenas com PIN)'}
            </span>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              aria-label={isPublic ? "Tornar sala privada" : "Tornar sala pública"}
              className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                isPublic ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="bg-white w-6 h-6 rounded-full shadow-md" />
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !hostName.trim()}
              className="min-h-[50px] w-full py-3.5 px-4 rounded-2xl font-display font-black text-sm tracking-wide bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 hover:from-amber-400 hover:to-amber-300 active:scale-95 transition-all shadow-xl shadow-amber-500/25 disabled:opacity-50 cursor-pointer border border-amber-300"
            >
              {isLoading ? 'CRIANDO SALA...' : 'CRIAR E ABRIR MESA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
