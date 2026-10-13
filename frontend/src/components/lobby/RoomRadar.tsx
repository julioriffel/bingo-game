import React, { useState } from 'react';
import type { PublicRoom } from '../../types/bingo';
import { Radio, Users, Trophy, Play, KeyRound, Sparkles, Plus, BookOpen } from 'lucide-react';

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
      {/* Top Banner & Action */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-indigo-950 border border-amber-500/20 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> BINGO 75 BOLAS EM TEMPO REAL
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Crie uma partida ou entre no Radar ao vivo
            </h2>
            <p className="text-sm text-slate-400 max-w-lg">
              Jogue pelo celular ou projete o Modo Telão com globo 3D e locução na TV para seus amigos e família.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {onOpenHelp && (
              <button
                type="button"
                onClick={onOpenHelp}
                className="px-5 py-3.5 rounded-xl font-bold text-sm bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <BookOpen className="w-4 h-4 text-amber-400" /> REGRAS & COMO JOGAR
              </button>
            )}
            <button
              onClick={onOpenCreate}
              className="px-6 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3]" /> CRIAR SALA
            </button>
          </div>
        </div>
      </div>

      {/* Quick PIN Entry */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Possui um Código de Sala?</h3>
            <p className="text-xs text-slate-400">Digite o código de 6 caracteres ou o PIN para entrar direto.</p>
          </div>
        </div>

        <form onSubmit={handleJoinByPin} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.toUpperCase())}
            placeholder="EX: BNG782"
            maxLength={6}
            className="w-full sm:w-36 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center font-mono font-bold text-sm tracking-widest text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!pinCode.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            Entrar
          </button>
        </form>
      </div>

      {/* Radar Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300">
            Radar de Salas Públicas ({rooms.length})
          </h3>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" /> Atualizar Radar
        </button>
      </div>

      {/* Rooms List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Escaneando salas ativas no radar...</div>
      ) : rooms.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <Radio className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="font-bold text-slate-300 text-base">Nenhuma sala pública no radar no momento</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Seja o primeiro a abrir uma mesa e convidar seus amigos para jogar!
          </p>
          <button
            onClick={onOpenCreate}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" /> Criar Primeira Sala
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.code}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all group hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {room.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      room.status === 'playing'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {room.status === 'playing' ? 'Em Jogo' : 'Aguardando'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-100 text-base line-clamp-1">{room.name}</h4>
                <p className="text-xs text-slate-400">Host: {room.host_name}</p>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400">
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
                  onClick={() => onJoinRoom(room.code)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
