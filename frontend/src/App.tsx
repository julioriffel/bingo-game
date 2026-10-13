import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/common/Header';
import { RoomRadar } from './components/lobby/RoomRadar';
import { CreateRoomModal } from './components/lobby/CreateRoomModal';
import { JoinRoomModal } from './components/lobby/JoinRoomModal';
import { PlayerView } from './components/player/PlayerView';
import { HostScreen } from './components/host/HostScreen';
import { useWebSocket } from './hooks/useWebSocket';
import { useAudio } from './hooks/useAudio';
import { useSpeech } from './hooks/useSpeech';
import type { BingoCard, GameState, Player, PublicRoom, WSMessage } from './types/bingo';

export function App() {
  // Navigation / View State
  const [currentView, setCurrentView] = useState<'lobby' | 'game' | 'host'>('lobby');

  // Session & Room State
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomPin, setRoomPin] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [playerToken, setPlayerToken] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [cards, setCards] = useState<BingoCard[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    code: '',
    status: 'lobby',
    stage: 'waiting',
    drawn_balls: [],
    last_drawn_ball: null,
    draw_interval: 5.0,
    draw_mode: 'auto',
    winners: [],
    prizes: [],
    game_log: [],
  });

  // UI & Modals State
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [isLoadingRadar, setIsLoadingRadar] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [joinModalCode, setJoinModalCode] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Hooks
  const { playStamp, playBallDrop, playVictory, playError } = useAudio();
  const { speakBall, speakText, toggleSpeech } = useSpeech();

  // Load public rooms for Radar
  const fetchRooms = useCallback(async () => {
    setIsLoadingRadar(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms || []);
      }
    } catch (err) {
      console.warn('Failed to fetch rooms:', err);
    } finally {
      setIsLoadingRadar(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 6000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // Handle incoming WebSocket messages
  const handleWSMessage = useCallback(
    (msg: WSMessage) => {
      const { type, payload } = msg;

      switch (type) {
        case 'player_list_update':
          if (payload?.players) {
            setPlayers(payload.players);
          }
          break;

        case 'room_state':
          if (payload) {
            setGameState((prev) => ({
              ...prev,
              code: payload.code || prev.code,
              status: payload.status || prev.status,
              stage: payload.stage || prev.stage,
              drawn_balls: payload.drawn_balls || prev.drawn_balls,
              last_drawn_ball: payload.last_drawn_ball ?? prev.last_drawn_ball,
              draw_interval: payload.draw_interval || prev.draw_interval,
              draw_mode: payload.draw_mode || prev.draw_mode,
              winners: payload.winners || prev.winners,
              prizes: payload.prizes || prev.prizes || [],
              game_log: payload.game_log || prev.game_log || [],
            }));
          }
          break;

        case 'prizes_updated':
          if (payload?.prizes) {
            setGameState((prev) => ({
              ...prev,
              prizes: payload.prizes,
            }));
          }
          break;

        case 'game_started':
          setGameState((prev) => ({
            ...prev,
            status: 'playing',
            stage: payload?.stage || 'line',
            prizes: payload?.prizes || prev.prizes || [],
            game_log: payload?.game_log || [],
          }));
          setStatusBanner('A partida começou! Boa sorte!');
          if (voiceEnabled) speakText('A partida começou! Boa sorte a todos!');
          break;

        case 'ball_drawn':
          if (payload) {
            const ball = payload.ball;
            const letter = payload.letter;
            setGameState((prev) => ({
              ...prev,
              drawn_balls: payload.history || [...prev.drawn_balls, ball],
              last_drawn_ball: ball,
              game_log: payload.log_entry ? [...prev.game_log, payload.log_entry] : prev.game_log,
            }));
            if (soundEnabled) playBallDrop();
            if (voiceEnabled) speakBall(ball, letter);
          }
          break;

        case 'game_paused':
          setGameState((prev) => ({ ...prev, status: 'paused' }));
          if (payload?.reason) {
            setStatusBanner(payload.reason);
          }
          break;

        case 'game_resumed':
          setGameState((prev) => ({
            ...prev,
            status: 'playing',
            stage: payload?.stage || prev.stage,
          }));
          setStatusBanner('Sorteio retomado!');
          break;

        case 'bingo_valid':
          if (payload) {
            const winner = payload.winner;
            const awardedPrize = payload.awarded_prize;
            const cardId = payload.card_id || winner?.card_id;

            if (payload.pattern_id || winner?.pattern_id) {
              const newPattern = {
                pattern_id: payload.pattern_id || winner?.pattern_id,
                pattern_type: payload.pattern_type || winner?.pattern_type || 'row',
                pattern_name: winner?.win_type || 'Linha',
                line_index: payload.line_index ?? winner?.line_index,
                winning_cells: payload.winning_cells || winner?.winning_cells || [],
              };

              setCards((prev) =>
                prev.map((c) => {
                  if (c.id === cardId) {
                    const existing = c.winning_patterns || [];
                    const exists = existing.some((p) => p.pattern_id === newPattern.pattern_id);
                    return {
                      ...c,
                      winning_patterns: exists ? existing : [...existing, newPattern],
                    };
                  }
                  return c;
                })
              );
            }

            if (soundEnabled) playVictory();
            confetti({
              particleCount: 200,
              spread: 100,
              origin: { y: 0.55 },
            });

            setGameState((prev) => ({
              ...prev,
              prizes: payload.prizes || prev.prizes,
              game_log: payload.game_log
                ? payload.game_log
                : payload.log_entry
                ? [...prev.game_log, payload.log_entry]
                : prev.game_log,
            }));

            const prizeMention = awardedPrize ? ` e levou: 🎁 ${awardedPrize.title}!` : '!';
            const defaultMsg = `🎉 BINGO confirmado para ${winner?.player_name}${prizeMention}`;
            const message = payload.message || defaultMsg;
            setStatusBanner(message);

            if (voiceEnabled) {
              const voiceAnnouncement = awardedPrize
                ? `Atenção! BINGO confirmado! Parabéns ${winner?.player_name}, que ganhou ${awardedPrize.title}!`
                : `Atenção! BINGO confirmado! Parabéns ${winner?.player_name}!`;
              speakText(voiceAnnouncement);
            }
          }
          break;

        case 'bingo_invalid':
          if (soundEnabled) playError();
          setStatusBanner(payload?.reason || 'Bingo inválido!');
          break;

        case 'game_over':
          setGameState((prev) => ({ ...prev, status: 'finished' }));
          setStatusBanner('Partida encerrada!');
          break;
      }
    },
    [soundEnabled, voiceEnabled, playBallDrop, playVictory, playError, speakBall, speakText]
  );

  // WebSocket hook
  const { isConnected, sendMessage, disconnect } = useWebSocket({
    roomCode,
    onMessage: handleWSMessage,
    autoConnect: Boolean(roomCode),
  });

  // Handshake after connection opens
  useEffect(() => {
    if (isConnected && roomCode && playerId && playerToken) {
      sendMessage('join', {
        player_id: playerId,
        token: playerToken,
      });
    }
  }, [isConnected, roomCode, playerId, playerToken, sendMessage]);

  // Create room flow
  const handleCreateRoom = async (config: any) => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Falha ao criar sala');
      const data = await res.json();

      setRoomCode(data.room_code);
      setRoomPin(data.pin);
      setPlayerId(data.host_id);
      setPlayerToken(data.token);
      setPlayerName(config.host_name);
      setIsHost(true);
      setIsCreateOpen(false);

      // Join Host as player too with 1 card by default
      const joinRes = await fetch(`/api/rooms/${data.room_code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: config.host_name,
          card_count: 1,
          token: data.token,
        }),
      });
      if (joinRes.ok) {
        const joinData = await joinRes.json();
        setCards(joinData.cards || []);
      }

      setGameState((prev) => ({
        ...prev,
        code: data.room_code,
        status: 'lobby',
        draw_interval: config.draw_interval,
        draw_mode: config.draw_mode,
        prizes: (config.prizes || []).map((p: any, idx: number) => ({
          id: `prz_init_${idx}`,
          title: p.title,
          description: p.description || '',
          order: idx + 1,
        })),
        game_log: [],
      }));

      // Host enters TV / Telão mode first
      setCurrentView('host');
    } catch (err: any) {
      alert(err.message || 'Erro ao criar sala');
    }
  };

  // Join room flow
  const handleJoinRoom = async (data: { playerName: string; cardCount: number; pin?: string }) => {
    if (!joinModalCode) return;
    try {
      const res = await fetch(`/api/rooms/${joinModalCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: data.playerName,
          card_count: data.cardCount,
          pin: data.pin,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Falha ao entrar na sala');
      }
      const respData = await res.json();

      setRoomCode(respData.room_code);
      setPlayerId(respData.player_id);
      setPlayerName(respData.player_name);
      setPlayerToken(respData.token);
      setIsHost(respData.is_host);
      setCards(respData.cards);
      setGameState((prev) => ({
        ...prev,
        prizes: respData.prizes || prev.prizes || [],
      }));
      setJoinModalCode(null);
      setCurrentView('game');
    } catch (err: any) {
      alert(err.message || 'Erro ao ingressar');
    }
  };

  // Marking number on player card
  const handleToggleCell = (cardId: string, number: number) => {
    if (soundEnabled) playStamp();

    // Optimistic UI update
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card;
        return {
          ...card,
          grid: card.grid.map((row) =>
            row.map((cell) => {
              if (cell.number === number && !cell.is_free) {
                return { ...cell, marked: !cell.marked };
              }
              return cell;
            })
          ),
        };
      })
    );

    // Sync to server
    sendMessage('mark_number', {
      player_id: playerId,
      card_id: cardId,
      number,
    });
  };

  // Shouting BINGO!
  const handleCallBingo = (cardId: string) => {
    sendMessage('call_bingo', {
      player_id: playerId,
      card_id: cardId,
    });
  };

  // Host Controls
  const handleStartGame = () => {
    sendMessage('start_game', { host_id: playerId });
  };

  const handleTogglePause = () => {
    sendMessage('toggle_pause', { host_id: playerId });
  };

  const handleDrawNext = () => {
    sendMessage('draw_next', { host_id: playerId });
  };

  const handleSetSpeed = (interval: number) => {
    sendMessage('set_speed', { host_id: playerId, interval });
  };

  const handleAddPrize = (title: string, description: string) => {
    sendMessage('add_prize', {
      host_id: playerId,
      title,
      description,
    });
  };

  const handleRemovePrize = (prizeId: string) => {
    sendMessage('remove_prize', {
      host_id: playerId,
      prize_id: prizeId,
    });
  };

  const handleBackToLobby = () => {
    disconnect();
    setRoomCode(null);
    setCurrentView('lobby');
    setGameState((prev) => ({
      ...prev,
      code: '',
      status: 'lobby',
      drawn_balls: [],
      last_drawn_ball: null,
      winners: [],
      prizes: [],
      game_log: [],
    }));
    fetchRooms();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        title="BINGO ROYALE 75"
        roomCode={roomCode || undefined}
        isConnected={currentView === 'lobby' ? true : isConnected}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onBackToLobby={currentView !== 'lobby' ? handleBackToLobby : undefined}
        onOpenHostView={isHost && currentView === 'game' ? () => setCurrentView('host') : undefined}
        isHost={isHost}
      />

      <main className="flex-1 flex flex-col items-center justify-start p-3 sm:p-6">
        {/* VIEW 1: LOBBY & RADAR */}
        {currentView === 'lobby' && (
          <RoomRadar
            rooms={publicRooms}
            isLoading={isLoadingRadar}
            onRefresh={fetchRooms}
            onOpenCreate={() => setIsCreateOpen(true)}
            onJoinRoom={(code) => setJoinModalCode(code)}
          />
        )}

        {/* VIEW 2: PLAYER MOBILE-FIRST CARTELAS */}
        {currentView === 'game' && (
          <PlayerView
            cards={cards}
            gameState={gameState}
            playerName={playerName}
            onToggleCell={handleToggleCell}
            onCallBingo={handleCallBingo}
            lastMessage={statusBanner}
          />
        )}

        {/* VIEW 3: HOST TV TELÃO */}
        {currentView === 'host' && (
          <HostScreen
            gameState={gameState}
            players={players}
            roomPin={roomPin}
            isHost={isHost}
            onStartGame={handleStartGame}
            onTogglePause={handleTogglePause}
            onDrawNext={handleDrawNext}
            onSetSpeed={handleSetSpeed}
            voiceEnabled={voiceEnabled}
            onToggleVoice={() => {
              const nextVal = !voiceEnabled;
              setVoiceEnabled(nextVal);
              toggleSpeech(nextVal);
            }}
            onBackToPlayerView={cards.length > 0 ? () => setCurrentView('game') : undefined}
            onAddPrize={handleAddPrize}
            onRemovePrize={handleRemovePrize}
          />
        )}
      </main>

      {/* MODALS */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateRoom}
      />

      {joinModalCode && (
        <JoinRoomModal
          isOpen={Boolean(joinModalCode)}
          roomCode={joinModalCode}
          onClose={() => setJoinModalCode(null)}
          onJoin={handleJoinRoom}
        />
      )}
    </div>
  );
}
