import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Trophy,
  Crown,
  Zap,
  Clock,
  Gamepad2,
  CheckCircle2,
  AlertTriangle,
  Tv,
  Flame,
  ShieldCheck,
  Volume2,
  Gift,
  Sparkles,
  Keyboard,
  Target,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'rules' | 'player' | 'manager';
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'rules',
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'player' | 'manager'>(defaultTab);

  // Handle ESC key to dismiss modal
  React.useEffect(() => {
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
      aria-labelledby="help-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden animate-scale-in max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="help-modal-title" className="font-display font-black text-lg sm:text-xl text-slate-100 flex items-center gap-2">
                Central de Ajuda & Manuais
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Bingo 75
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Regras oficiais, manual do jogador e guia do operador (Manager)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Fechar Central de Ajuda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 bg-slate-950/40 border-b border-slate-800 flex gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rules'}
            onClick={() => setActiveTab('rules')}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'border-amber-400 text-amber-300 bg-amber-500/5 font-display'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Regras Oficiais
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'player'}
            onClick={() => setActiveTab('player')}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'player'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-500/5 font-display'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-indigo-400" />
            Manual do Jogador
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'manager'}
            onClick={() => setActiveTab('manager')}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'manager'
                ? 'border-sky-400 text-sky-300 bg-sky-500/5 font-display'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4 text-sky-400" />
            Manual do Manager
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
          {/* ================= TAB 1: REGRAS OFICIAIS ================= */}
          {activeTab === 'rules' && (
            <div className="space-y-5 animate-fade-in">
              {/* Intro Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-300 text-sm sm:text-base">
                    Padrão Internacional de Bingo Americano (75 Bolas)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    O Bingo Royale 75 utiliza cartelas 5x5 com 24 números aleatórios e 1 casa central livre (FREE), distribuídos rigorosamente por colunas:
                  </p>
                  <div className="grid grid-cols-5 gap-1.5 mt-2.5 text-center font-mono font-bold text-xs">
                    <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      B: 1 a 15
                    </div>
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      I: 16 a 30
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      N: 31 a 45
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      G: 46 a 60
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      O: 61 a 75
                    </div>
                  </div>
                </div>
              </div>

              {/* Critérios de Vitória */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-100 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  Critérios de Vitória (Configuráveis pela Sala)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-amber-300 text-xs">Modo Multi-Etapas & Prêmios</span>
                    <p className="text-[11px] text-slate-400">
                      <strong>Prêmios Preliminares:</strong> Vencem na modalidade Linha (horizontal, vertical ou diagonal).<br />
                      <strong>Último Prêmio:</strong> Comuta estritamente para <strong>Cartela Completa (Blackout)</strong>. Uma linha nunca vence o último prêmio!
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-indigo-300 text-xs">Cartela Completa (Blackout)</span>
                    <p className="text-[11px] text-slate-400">
                      Todos os 24 números da cartela (+ casa FREE) devem ser sorteados. Exigido para o grande prêmio final da rodada!
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-emerald-300 text-xs">Linha Única</span>
                    <p className="text-[11px] text-slate-400">
                      Partida rápida: encerra logo na primeira linha válida completada em qualquer direção.
                    </p>
                  </div>
                </div>
              </div>

              {/* Regra de Ouro do Clique no Bingo */}
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Regra de Ouro: O Clique Antes do Próximo Sorteio
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  Para o bingo ser validado, o jogador <strong>deve clicar no botão BINGO antes que a próxima pedra seja sorteada</strong>.
                  Se uma nova bola sair do globo antes do jogador cantar o bingo da bola anterior, a reivindicação perde a validade para aquela pedra e só poderá ser cantada caso o jogador complete uma nova linha na pedra atual.
                </p>
              </div>

              {/* Janela de Contestação & Desempate */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-100 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Janela de Contestação Variável & Desempate da Pedra Mais Alta
                </h4>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300">
                      <strong>1. Janela de Contestação Variável (10s, 30s ou 60s):</strong> Configurada pelo Manager na criação da sala. Quando o 1º jogador canta bingo válido, o sorteio é pausado e a contagem regressiva é aberta e narrada em voz alta. Outros jogadores que fecharam bingo <strong>na mesma pedra</strong> têm até o fim do tempo para cantar.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300">
                      <strong>2. Apenas UM vencedor por prêmio:</strong> Não há divisão nem duplicação de prêmios. Caso apenas 1 jogador tenha cantado, ele recebe o prêmio ao zerar o cronômetro.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300">
                      <strong>3. Disputa da Pedra Mais Alta (Showdown):</strong> Caso 2 ou mais jogadores cantem na mesma pedra, abre-se uma arena interativa de desempate. Cada jogador empatado escolhe uma pedra misteriosa (geradas sem números repetidos). <strong>Quem tirar a pedra de maior valor ganha o prêmio!</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Anti-Duplicação e Log */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Sem Prêmios Duplicados na Mesma Linha
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Após uma linha ser premiada, ela é riscada visualmente na cartela com efeito de neon e não pode ser premiada uma segunda vez na mesma rodada.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    Auditoria Completa (Log Oficial)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Cada pedra sorteada, horário exato, vencedores, desempates e números da cartela premiada ficam gravados e podem ser copiados para auditoria.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: MANUAL DO JOGADOR ================= */}
          {activeTab === 'player' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3">
                <Gamepad2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-indigo-300 text-sm">Como Jogar no Celular ou Computador</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Interface moderna projetada primeiro para telas móveis (mobile-first), com alternância rápida entre cartelas, sons e assistente de marcação.
                  </p>
                </div>
              </div>

              {/* Passo a Passo */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-100 uppercase tracking-wider text-xs">
                  Passo a Passo da Partida
                </h4>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <strong className="text-slate-200 text-xs">Entrar em uma Sala</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No Radar de Salas, escolha uma sala pública e clique em <em>Entrar na Partida</em>. Se a sala for privada, digite o PIN de 4 dígitos. Escolha a quantidade de cartelas desejada (de 1 a 4).
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <strong className="text-slate-200 text-xs">Acompanhar o Sorteio & Marcar Cartelas</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        A última pedra chamada é destacada no topo. Use os botões inferiores (C1, C2...) para alternar entre as suas cartelas. Toque nos números para carimbar com o marcador âmbar.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </div>
                    <div>
                      <strong className="text-slate-200 text-xs">Modo Assistente (Olho)</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ative o ícone do Assistente no topo para que as pedras já sorteadas pisquem suavemente na sua cartela, garantindo que você nunca deixe passar nenhum número chamado.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                      4
                    </div>
                    <div>
                      <strong className="text-slate-200 text-xs">Cantar BINGO!</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Assim que completar os números da linha ou cartela cheia, toque imediatamente no botão vibrante <strong>BINGO!</strong> antes do próximo número sair. O servidor fará a validação instantânea.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                      5
                    </div>
                    <div>
                      <strong className="text-slate-200 text-xs">Showdown no Empate</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Se outro jogador cantar na mesma pedra, a tela de desempate se abrirá. Escolha uma das pedras misteriosas na tela. O jogador com a maior pedra leva o troféu e o prêmio da rodada!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assumir Gerenciamento */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  E se o Manager da sala sumir ou travar?
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Caso o organizador da sala fique inativo ou desconectado por mais de <strong>2 minutos (120 segundos)</strong>, uma notificação de emergência aparecerá na tela de todos os jogadores.
                  Qualquer participante pode clicar em <strong>⚡ Assumir Gerenciamento</strong> no menu de usuários e passar a operar o sorteio para que ninguém fique sem jogar!
                </p>
              </div>
            </div>
          )}

          {/* ================= TAB 3: MANUAL DO MANAGER ================= */}
          {activeTab === 'manager' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/30 flex items-start gap-3">
                <Crown className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sky-300 text-sm">Guia Completo do Manager (Mesa / Operador)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    O Manager é o responsável por criar, projetar no telão e conduzir o sorteio. Ele possui ferramentas exclusivas de controle e narração por voz.
                  </p>
                </div>
              </div>

              {/* Papel do Manager */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Importante: O Manager Não Concorre Como Jogador
                </span>
                <p className="text-xs text-slate-400">
                  O usuário que cria ou gerencia a sala não é contado no total de jogadores e não recebe cartelas de jogo. Isso garante total imparcialidade na condução e na entrega de prêmios.
                </p>
              </div>

              {/* Criando a Partida */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-100 uppercase tracking-wider text-xs">
                  Criando e Configurando a Partida
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-xs text-slate-200">Prêmios & Cartela Completa:</strong>
                    <p className="text-[11px] text-slate-400">
                      Adicione prêmios personalizados. Os prêmios preliminares são disputados na modalidade <strong>Linha</strong>, e o último prêmio avança estritamente para <strong>Cartela Completa</strong>.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-xs text-slate-200">Velocidade & Ritmo:</strong>
                    <p className="text-[11px] text-slate-400">
                      Escolha entre <strong>Automático</strong> (5s padrão, 15s ou 30s por pedra) ou <strong>Manual</strong> para quem prefere ditar o ritmo no microfone ou globo físico.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-xs text-slate-200">Janela de Contestação:</strong>
                    <p className="text-[11px] text-slate-400">
                      Defina o tempo da janela (10s padrão, 30s ou 60s) para que outros jogadores possam cantar na mesma pedra antes de definir o vencedor ou abrir desempate.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-xs text-slate-200">Privacidade:</strong>
                    <p className="text-[11px] text-slate-400">
                      Salas Públicas aparecem no Radar. Salas Privadas exigem o PIN de 4 dígitos gerado na abertura da mesa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modo Telão & Atalhos */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-100 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Tv className="w-4 h-4 text-indigo-400" />
                  Operação do Telão (Projetor / Smart TV)
                </h4>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono text-xs font-bold shrink-0">
                      <Keyboard className="w-4 h-4 inline mr-1" /> [BARRA DE ESPAÇO]
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong>Atalho Principal:</strong> Inicia a partida, sorteia a próxima pedra (no manual) ou alterna Pausar/Continuar (no automático).
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-sky-400 font-mono text-xs font-bold shrink-0">
                      <Volume2 className="w-4 h-4 inline mr-1" /> Locução de Voz (TTS)
                    </div>
                    <p className="text-xs text-slate-300">
                      O sistema sintetiza e narra cada pedra sorteada em áudio (ex: <em>"B 12", "I 24", "Atenção: Bingo confirmado!"</em>). Pode ser ligado ou silenciado a qualquer momento.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs font-bold shrink-0">
                      <Gift className="w-4 h-4 inline mr-1" /> Gestão Dinâmica de Prêmios
                    </div>
                    <p className="text-xs text-slate-300">
                      Mesmo com o jogo em andamento, você pode adicionar novos prêmios ou excluir prêmios pendentes pela vitrine lateral do Telão.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prevenção de Inatividade */}
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Manutenção de Atividade na Mesa
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Para evitar partidas abandonadas, o sistema detecta se o Manager não realiza nenhuma ação nem movimento por <strong>2 minutos</strong>. Mantenha a aba aberta e ativa para continuar no comando exclusivo da mesa.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono font-bold text-amber-400">BINGO ROYALE 75</span>
            <span>•</span>
            <span>Regulamento Oficial</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs transition-all cursor-pointer border border-slate-700/80"
          >
            Entendido, Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
