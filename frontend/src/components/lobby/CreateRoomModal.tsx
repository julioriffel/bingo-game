import React, { useState } from 'react';
import { X, Trophy, Layers, Clock, Globe, Lock, Gift, Plus, Trash2 } from 'lucide-react';

interface PrizeItem {
  title: string;
  description: string;
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
    prizes: PrizeItem[];
  }) => Promise<void>;
  isLoading?: boolean;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}) => {
  const [hostName, setHostName] = useState(localStorage.getItem('bingo_player_name') || '');
  const [roomName, setRoomName] = useState('');
  const [winCondition, setWinCondition] = useState<'line' | 'blackout' | 'multi_stage'>('multi_stage');
  const [maxCards, setMaxCards] = useState<number>(2);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [drawMode, setDrawMode] = useState<'auto' | 'manual'>('auto');
  const [drawInterval, setDrawInterval] = useState<number>(5);

  // Dynamic prizes list
  const [prizes, setPrizes] = useState<PrizeItem[]>([
    { title: '1º Prêmio: Linha', description: 'Para quem completar a 1ª linha' },
    { title: '2º Prêmio: Cartela Cheia', description: 'Grande prêmio da rodada' },
  ]);

  if (!isOpen) return null;

  const handleAddPrize = () => {
    const nextOrder = prizes.length + 1;
    setPrizes([...prizes, { title: `${nextOrder}º Prêmio`, description: '' }]);
  };

  const handleRemovePrize = (index: number) => {
    setPrizes(prizes.filter((_, idx) => idx !== index));
  };

  const handlePrizeChange = (index: number, field: 'title' | 'description', value: string) => {
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
      setPrizes([{ title: 'Grande Prêmio (Cartela Cheia)', description: '' }]);
    } else if (type === 'multistage') {
      setPrizes([
        { title: '1º Prêmio: Linha', description: 'Primeira quina/linha completada' },
        { title: '2º Prêmio: Cartela Cheia', description: 'Bingo completo (Blackout)' },
      ]);
    } else if (type === 'podium') {
      setPrizes([
        { title: '1º Lugar (Ouro)', description: 'Primeiro vencedor' },
        { title: '2º Lugar (Prata)', description: 'Segundo vencedor' },
        { title: '3º Lugar (Bronze)', description: 'Terceiro vencedor' },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) return;
    localStorage.setItem('bingo_player_name', hostName.trim());

    // Filter out prizes with empty titles
    const validPrizes = prizes
      .map((p) => ({ title: p.title.trim(), description: p.description.trim() }))
      .filter((p) => p.title.length > 0);

    await onCreate({
      host_name: hostName.trim(),
      name: roomName.trim() || `Bingo do ${hostName}`,
      win_condition: winCondition,
      max_cards_per_player: maxCards,
      is_public: isPublic,
      draw_interval: drawInterval,
      draw_mode: drawMode,
      prizes: validPrizes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              +
            </div>
            <h2 className="text-lg font-bold text-slate-100">Criar Nova Partida</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Host Name & Room Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Seu Nome / Apelido *
              </label>
              <input
                type="text"
                required
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Ex: Julio Mestre"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nome da Sala (Opcional)
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ex: Bingo da Família"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* DYNAMIC PRIZES SECTION */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Gift className="w-4 h-4 text-amber-400" /> Prêmios da Rodada ({prizes.length})
              </label>
              <button
                type="button"
                onClick={handleAddPrize}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Prêmio
              </button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-500 shrink-0">Modelos:</span>
              <button
                type="button"
                onClick={() => applyPrizePreset('multistage')}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0"
              >
                Linha + Cheia
              </button>
              <button
                type="button"
                onClick={() => applyPrizePreset('podium')}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0"
              >
                1º, 2º e 3º Lugar
              </button>
              <button
                type="button"
                onClick={() => applyPrizePreset('single')}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0"
              >
                Prêmio Único
              </button>
              <button
                type="button"
                onClick={() => applyPrizePreset('none')}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 shrink-0"
              >
                Limpar
              </button>
            </div>

            {/* Prizes inputs list */}
            {prizes.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-1 text-center">
                Nenhum prêmio configurado (jogo amistoso/recreativo).
              </p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {prizes.map((p, idx) => (
                  <div
                    key={`prz-${idx}`}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        value={p.title}
                        onChange={(e) => handlePrizeChange(idx, 'title', e.target.value)}
                        placeholder="Nome do prêmio (ex: Cesta de Chocolate)"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePrize(idx)}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remover prêmio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={p.description}
                      onChange={(e) => handlePrizeChange(idx, 'description', e.target.value)}
                      placeholder="Descrição opcional (ex: Doado pela Família Silva)"
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Win Condition Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
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
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    winCondition === opt.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-xs">{opt.label}</span>
                  <span className="text-[10px] opacity-75 mt-0.5 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cards per Player */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Cartelas por Jogador
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setMaxCards(num)}
                  className={`flex-1 py-2 rounded-xl border font-bold text-xs transition-all ${
                    maxCards === num
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  {num} {num === 1 ? 'Cartela' : 'Cartelas'}
                </button>
              ))}
            </div>
          </div>

          {/* Sorteio & Ritmo */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-sky-400" /> Modo de Sorteio
              </label>
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setDrawMode('auto')}
                  className={`px-3 py-1 rounded-md font-bold transition-colors ${
                    drawMode === 'auto' ? 'bg-sky-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Automático
                </button>
                <button
                  type="button"
                  onClick={() => setDrawMode('manual')}
                  className={`px-3 py-1 rounded-md font-bold transition-colors ${
                    drawMode === 'manual' ? 'bg-sky-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>

            {drawMode === 'auto' && (
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Velocidade por pedra:</span>
                  <span className="font-bold text-sky-400">{drawInterval}s</span>
                </div>
                <div className="flex gap-2">
                  {[3, 5, 7, 10].map((sec) => (
                    <button
                      type="button"
                      key={sec}
                      onClick={() => setDrawInterval(sec)}
                      className={`flex-1 py-1 rounded-lg border text-xs font-bold transition-all ${
                        drawInterval === sec
                          ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Visibilidade da Sala */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              {isPublic ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
              {isPublic ? 'Sala Pública (Listada no Radar)' : 'Sala Privada (Apenas com PIN)'}
            </span>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                isPublic ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !hostName.trim()}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'CRIANDO SALA...' : 'CRIAR E ABRIR MESA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
