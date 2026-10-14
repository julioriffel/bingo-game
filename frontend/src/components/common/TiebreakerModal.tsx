import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { BingoContest } from '../../types/bingo';
import { Sparkles, Trophy, Clock, Swords, Crown, HelpCircle } from 'lucide-react';

interface TiebreakerModalProps {
  contest: BingoContest | null | undefined;
  currentPlayerId: string;
  isHost?: boolean;
  onPickStone?: (stoneIndex?: number) => void;
}

export const TiebreakerModal: React.FC<TiebreakerModalProps> = ({
  contest,
  currentPlayerId,
  isHost = false,
  onPickStone,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Timer loop for countdown window or tiebreaker timeout
  useEffect(() => {
    if (!contest) return;

    const updateTimer = () => {
      const now = Date.now() / 1000;
      if (contest.status === 'window') {
        const remaining = Math.max(0, contest.window_end_time - now);
        setTimeLeft(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [contest]);

  // Confetti when resolved
  useEffect(() => {
    if (contest?.status === 'resolved') {
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [contest?.status]);

  if (!contest) return null;

  const isCandidate = contest.candidates.some((c) => c.player_id === currentPlayerId);
  const currentCandidate = contest.candidates.find((c) => c.player_id === currentPlayerId);
  const hasPickedStone = Boolean(currentCandidate?.chosen_stone);

  // ==========================================
  // VIEW 1: 10-SECOND COUNTDOWN CONTEST WINDOW
  // ==========================================
  if (contest.status === 'window') {
    const progressPercent = Math.max(
      0,
      Math.min(100, (timeLeft / (contest.duration_seconds || 10)) * 100)
    );

    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Janela de validação de Bingo"
        className="fixed inset-x-0 top-16 z-50 p-3 sm:p-4 flex justify-center pointer-events-none animate-slide-down"
      >
        <div className="bg-slate-900/95 border-2 border-amber-500/70 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-amber-500/25 backdrop-blur-md max-w-lg w-full pointer-events-auto space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black animate-pulse shadow-md">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Janela de Validação do Bingo
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/40">
                    Pedra {contest.ball}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-display font-black text-slate-100">
                  {contest.candidates.length > 1
                    ? `${contest.candidates.length} Jogadores Cantaram BINGO!`
                    : `${contest.candidates[0]?.player_name} Cantou BINGO!`}
                </h4>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="flex flex-col items-center justify-center bg-slate-950 px-3.5 py-1.5 rounded-2xl border border-amber-500/40 shrink-0 shadow-inner">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 leading-none">
                {timeLeft.toFixed(1)}s
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5 font-display">Restante</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={Math.round(progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tempo restante da janela de contestação"
            className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5"
          >
            <div
              className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 h-full rounded-full transition-all duration-100 shadow-sm shadow-amber-500/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Prize and Rules Explanations */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-slate-300 font-medium truncate">
              {contest.target_prize_title
                ? `Disputando: 🎁 ${contest.target_prize_title}`
                : 'Validando vitória da rodada'}
            </span>
            <span className="text-[11px] text-amber-300 font-bold shrink-0">
              {isCandidate
                ? '✅ Seu Bingo está registrado!'
                : '⚡ Cante BINGO agora para disputar!'}
            </span>
          </div>

          {/* Candidate avatars list */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {contest.candidates.map((c, idx) => (
              <span
                key={c.player_id}
                className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 shadow-xs"
              >
                <span className="text-[10px] font-mono text-amber-400">#{idx + 1}</span>
                <span>{c.player_name}</span>
                <span className="text-[10px] text-slate-400">({c.pattern_name || 'Linha'})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: TIEBREAKER STONE ARENA (DISPUTA DA PEDRA MAIOR)
  // ==========================================
  const winningCandidate = contest.candidates.reduce<typeof contest.candidates[0] | null>(
    (max, c) => (!max || (c.chosen_stone || 0) > (max.chosen_stone || 0) ? c : max),
    null
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Arena de desempate oficial pela pedra mais alta"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl w-full max-w-xl shadow-2xl p-5 sm:p-6 flex flex-col gap-5 animate-scale-in">
        {/* Arena Header */}
        <div className="text-center space-y-1.5 border-b border-slate-800 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider font-display">
            <Swords className="w-4 h-4" /> Desempate Oficial
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-100 tracking-tight flex items-center justify-center gap-2">
            Disputa da Pedra Mais Alta!
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mx-auto">
            Mais de um jogador cantou BINGO na pedra <strong className="text-amber-400 font-mono">{contest.ball}</strong>.
            Quem tirar o <strong className="text-amber-300">maior número</strong> leva o prêmio!
          </p>
          {contest.target_prize_title && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Prêmio em Disputa: {contest.target_prize_title}
              </span>
            </div>
          )}
        </div>

        {/* Tied Players Comparison Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {contest.candidates.map((c) => {
            const isWinner = contest.status === 'resolved' && contest.winner_player_id === c.player_id;
            const isMe = c.player_id === currentPlayerId;

            return (
              <div
                key={c.player_id}
                className={`p-4 rounded-3xl border flex flex-col items-center justify-between text-center gap-3 transition-all relative ${
                  isWinner
                    ? 'bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 border-amber-500 shadow-xl shadow-amber-500/25 ring-2 ring-amber-400'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                {isWinner && (
                  <div className="absolute -top-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-display font-black text-[10px] flex items-center gap-1 shadow-md border border-amber-300">
                    <Crown className="w-3 h-3" /> VENCEDOR
                  </div>
                )}

                <div className="space-y-0.5">
                  <div className="text-xs font-black text-slate-200 flex items-center justify-center gap-1">
                    <span>{c.player_name}</span>
                    {isMe && <span className="text-[10px] text-amber-400 font-bold">(Você)</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {c.pattern_name || 'Linha'}
                  </div>
                </div>

                {/* Stone Reveal Box */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center border transition-all">
                  {c.chosen_stone ? (
                    <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black flex flex-col items-center justify-center shadow-lg shadow-amber-500/30 animate-scale-in border border-amber-200">
                      <span className="font-display text-[10px] uppercase tracking-widest font-bold text-slate-900/80">PEDRA</span>
                      <span className="font-display text-3xl sm:text-4xl leading-none mt-1">
                        {c.chosen_stone}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-slate-900 border-dashed border-2 border-slate-700 flex flex-col items-center justify-center text-slate-400 space-y-1">
                      <HelpCircle className="w-6 h-6 animate-pulse text-amber-400/60" />
                      <span className="text-[9px] font-bold font-display">Escolhendo...</span>
                    </div>
                  )}
                </div>

                {/* Status caption */}
                <span className="text-[11px] font-bold text-slate-300">
                  {c.chosen_stone
                    ? `Tirou pedra ${c.chosen_stone}`
                    : 'Aguardando escolha'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Panel for Candidate who hasn't chosen yet */}
        {isCandidate && !hasPickedStone && contest.status === 'tiebreaker' && (
          <div className="bg-slate-950 p-4 rounded-3xl border border-amber-500/50 space-y-3 animate-fade-in text-center shadow-xl">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300 font-display">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Sua vez! Escolha uma das pedras misteriosas da sorte:</span>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-1 max-w-sm mx-auto">
              {[1, 2, 3, 4, 5].map((idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => onPickStone && onPickStone(idx)}
                  className="min-h-[52px] min-w-[52px] aspect-square rounded-2xl bg-gradient-to-b from-amber-500/20 to-slate-900 border border-amber-500/40 hover:border-amber-400 hover:from-amber-500/30 active:scale-95 transition-all flex flex-col items-center justify-center text-amber-400 font-black cursor-pointer shadow-md group focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label={`Escolher pedra da sorte número ${idx}`}
                >
                  <span className="font-display text-xl group-hover:scale-110 transition-transform">?</span>
                  <span className="text-[9px] font-mono text-slate-400 group-hover:text-amber-300">
                    #{idx}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Clique em uma das pedras para revelá-la e disputar a vitória!
            </p>
          </div>
        )}

        {/* Spectator or Picked Message */}
        {isCandidate && hasPickedStone && contest.status === 'tiebreaker' && (
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center text-xs text-slate-300 font-medium">
            ⏳ Você já escolheu sua pedra! Aguardando a escolha do seu adversário...
          </div>
        )}

        {(!isCandidate || isHost) && contest.status === 'tiebreaker' && (
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center text-xs text-slate-300 font-medium flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>Aguardando os jogadores empatados escolherem suas pedras...</span>
          </div>
        )}

        {/* Resolution Banner */}
        {contest.status === 'resolved' && winningCandidate && (
          <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 p-4.5 rounded-3xl border border-amber-500/70 text-center space-y-1.5 animate-scale-in shadow-xl">
            <div className="text-base sm:text-xl font-display font-black text-amber-300 flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400 drop-shadow" />
              <span>{winningCandidate.player_name} venceu com a pedra {winningCandidate.chosen_stone}!</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-medium">
              O prêmio foi concedido com sucesso ao campeão do desempate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
