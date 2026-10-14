import React, { useState } from 'react';
import type { PublicRoom } from '../../types/bingo';
import { Radio, Users, Trophy, Play, KeyRound, Sparkles, Plus, BookOpen, RefreshCw } from 'lucide-react';

interface RoomRadarProps {
  rooms: PublicRoom[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreate: () => void;
  onJoinRoom: (roomCode: string, pin?: string) => void;
  onOpenHelp?: () => void;
}

export const RoomRadar: React.FC<RoomRadarProps> = ({
  rooms,
  isLoading,
  onRefresh,
  onOpenCreate,
  onJoinRoom,
  onOpenHelp,
}) => {
  const [pinCode, setPinCode] = useState('');

  const handleJoinByPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.trim()) {
      onJoinRoom(pinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Hero Banner & Actions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-indigo-950 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> BINGO 75 BOLAS EM TEMPO REAL
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-black text-slate-100 tracking-tight leading-tight">
              Crie sua partida ou entre no Radar ao vivo
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              Jogue pelo smartphone com cartelas interativas ou projete o Modo Telão com globo 3D e locução na TV para toda a família.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            {onOpenHelp && (
              <button
                type="button"
                onClick={onOpenHelp}
                className="min-h-[48px] px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <BookOpen className="w-4 h-4 text-amber-400" /> REGRAS & COMO JOGAR
              </button>
            )}
            <button
              type="button"
              onClick={onOpenCreate}
              className="min-h-[48px] px-6 py-3 rounded-2xl font-display font-black text-xs sm:text-sm tracking-wide bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 hover:from-amber-400 hover:to-amber-300 active:scale-95 transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
            >
              <Plus className="w-5 h-5 stroke-[3]" /> CRIAR SALA
            </button>
          </div>
        </div>
      </div>

      {/* Quick PIN Entry */}
      <section
        aria-label="Entrada rápida por código de sala"
        className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Possui um Código de Sala?</h3>
            <p className="text-xs text-slate-400">Digite o código de 6 letras para conectar-se diretamente.</p>
          </div>
        </div>

        <form onSubmit={handleJoinByPin} className="flex gap-2.5 w-full sm:w-auto">
          <label htmlFor="radar-pin-input" className="sr-only">
            Código da sala
          </label>
          <input
            id="radar-pin-input"
            type="text"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.toUpperCase())}
            placeholder="EX: BNG782"
            maxLength={6}
            className="min-h-[44px] w-full sm:w-40 bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2 text-center font-mono font-black text-sm tracking-widest text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 uppercase"
          />
          <button
            type="submit"
            disabled={!pinCode.trim()}
            className="min-h-[44px] px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95 shrink-0"
          >
            Entrar
          </button>
        </form>
      </section>

      {/* Radar Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <h3 className="font-display font-black text-xs sm:text-sm uppercase tracking-wider text-slate-200">
            Radar de Salas Públicas ({rooms.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="min-h-[44px] px-3 py-1.5 text-xs text-slate-400 hover:text-amber-400 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer rounded-xl hover:bg-slate-800/60"
          aria-label="Atualizar radar de salas"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar Radar
        </button>
      </div>

      {/* Rooms List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-slate-900/40 rounded-3xl border border-slate-800/80 animate-pulse">
          Escaneando salas ativas no radar...
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-3.5 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500 border border-slate-700/60">
            <Radio className="w-7 h-7" />
          </div>
          <h4 className="font-display font-bold text-slate-200 text-lg">Nenhuma sala pública no radar no momento</h4>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Seja o primeiro a abrir uma mesa e convidar seus amigos e familiares para jogar!
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="min-h-[44px] mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/25 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Criar Primeira Sala
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.code}
              className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all group hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {room.code}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                      room.status === 'playing'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                    }`}
                  >
                    {room.status === 'playing' ? 'Em Jogo' : 'Aguardando'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-100 text-base line-clamp-1 group-hover:text-amber-300 transition-colors">
                  {room.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Host: <span className="text-slate-300 font-medium">{room.host_name}</span></p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    {room.player_count} jogador{room.player_count === 1 ? '' : 'es'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    {room.win_condition === 'multi_stage'
                      ? 'Multi-Etapas'
                      : room.win_condition === 'line'
                      ? 'Linha'
                      : 'Cheia'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onJoinRoom(room.code)}
                  aria-label={`Entrar na sala ${room.name}, código ${room.code}`}
                  className="min-h-[44px] w-full py-2.5 rounded-2xl font-display font-black text-xs sm:text-sm tracking-wide bg-slate-800/90 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-amber-400 group-hover:text-slate-950 text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-slate-700/80 group-hover:border-amber-300 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Entrar na Sala
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
