import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/common/Header';
import { RoomRadar } from './components/lobby/RoomRadar';
import { CreateRoomModal } from './components/lobby/CreateRoomModal';
import { JoinRoomModal } from './components/lobby/JoinRoomModal';
import { PlayerView } from './components/player/PlayerView';
import { HostScreen } from './components/host/HostScreen';
import { TiebreakerModal } from './components/common/TiebreakerModal';
import { UsersListModal } from './components/common/UsersListModal';
import { HelpModal } from './components/common/HelpModal';
import { useWebSocket } from './hooks/useWebSocket';
import { useAudio } from './hooks/useAudio';
import { useSpeech } from './hooks/useSpeech';
import type { BingoCard, GameState, Player, PublicRoom, WSMessage } from './types/bingo';

const SESSION_STORAGE_KEY = 'bingo_active_session';

interface SavedSession {
  roomCode: string;
  roomPin?: string;
  playerId: string;
  playerName: string;
  playerToken: string;
  isHost: boolean;
  cards: BingoCard[];
  currentView: 'game' | 'host';
  savedAt: number;
}

const loadSavedSession = (): SavedSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: SavedSession = JSON.parse(raw);
    // Ignore sessions older than 12 hours
    if (!session.roomCode || !session.playerId || (Date.now() - session.savedAt > 12 * 60 * 60 * 1000)) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

const saveActiveSession = (session: SavedSession) => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {}
};

const clearActiveSession = () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {}
};

export function App() {
  const initialSession = useRef(loadSavedSession()).current;

  // Navigation / View State
  const [currentView, setCurrentView] = useState<'lobby' | 'game' | 'host'>(
    initialSession ? initialSession.currentView : 'lobby'
  );

  // Session & Room State
  const [roomCode, setRoomCode] = useState<string | null>(
    initialSession ? initialSession.roomCode : null
  );
  const [roomPin, setRoomPin] = useState<string>(
    initialSession ? (initialSession.roomPin || '') : ''
  );
  const [playerId, setPlayerId] = useState<string>(
    initialSession ? initialSession.playerId : ''
  );
  const [playerName, setPlayerName] = useState<string>(
    initialSession ? initialSession.playerName : ''
  );
  const [playerToken, setPlayerToken] = useState<string>(
    initialSession ? initialSession.playerToken : ''
  );
  const [isHost, setIsHost] = useState<boolean>(
    initialSession ? Boolean(initialSession.isHost) : false
  );
  const [cards, setCards] = useState<BingoCard[]>(
    initialSession ? (initialSession.cards || []) : []
  );
  const [players, setPlayers] = useState<Player[]>([]);
  const [users, setUsers] = useState<Player[]>([]);
  const [isUsersOpen, setIsUsersOpen] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState>({
    code: initialSession ? initialSession.roomCode : '',
    status: 'lobby',
    stage: 'waiting',
    drawn_balls: [],
    last_drawn_ball: null,
    draw_interval: 5.0,
    draw_mode: 'auto',
    winners: [],
    prizes: [],
    game_log: [],
    active_contest: null,
  });

  // UI & Modals State
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [isLoadingRadar, setIsLoadingRadar] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [joinModalCode, setJoinModalCode] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  // Sound & Speech preferences with localStorage persistence (Android & Web)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('bingo_sound_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('bingo_voice_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bingo_sound_enabled', JSON.stringify(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('bingo_voice_enabled', JSON.stringify(voiceEnabled));
    } catch {}
  }, [voiceEnabled]);

  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [helpDefaultTab, setHelpDefaultTab] = useState<'rules' | 'player' | 'manager'>('rules');

  const handleOpenHelp = (tab: 'rules' | 'player' | 'manager' = 'rules') => {
    setHelpDefaultTab(tab);
    setIsHelpOpen(true);
  };

  // User activity tracker
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const recordActivity = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener('mousemove', recordActivity);
    window.addEventListener('keydown', recordActivity);
    window.addEventListener('click', recordActivity);
    window.addEventListener('touchstart', recordActivity);
    return () => {
      window.removeEventListener('mousemove', recordActivity);
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('click', recordActivity);
      window.removeEventListener('touchstart', recordActivity);
    };
  }, []);

  // Audio & Speech hooks with strict enabled sync
  const { playStamp, playBallDrop, playVictory, playError, setSoundEnabled: setAudioContextEnabled } = useAudio(soundEnabled);
  const { speakBall, speakText, toggleSpeech, cancelSpeech } = useSpeech(soundEnabled && voiceEnabled);

  // Master Sound Toggle: mutes/unmutes both procedural audio effects AND locutor voice
  const handleToggleSound = useCallback(() => {
    const isCurrentlyActive = soundEnabled || voiceEnabled;
    const nextState = !isCurrentlyActive;

    setSoundEnabled(nextState);
    setVoiceEnabled(nextState);
    setAudioContextEnabled(nextState);
    toggleSpeech(nextState);
    if (!nextState) {
      cancelSpeech();
    }
  }, [soundEnabled, voiceEnabled, setAudioContextEnabled, toggleSpeech, cancelSpeech]);

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
          if (payload) {
            if (payload.players) setPlayers(payload.players);
            if (payload.users) setUsers(payload.users);
            setGameState((prev) => ({
              ...prev,
              host_id: payload.host_id || prev.host_id,
              host_name: payload.host_name || prev.host_name,
              manager_last_active_at: payload.manager_last_active_at ?? prev.manager_last_active_at,
              manager_inactive: payload.manager_inactive ?? prev.manager_inactive,
              player_count: payload.player_count ?? prev.player_count,
            }));
          }
          break;

        case 'room_state':
          if (payload) {
            if (payload.users) setUsers(payload.users);
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
              host_id: payload.host_id || prev.host_id,
              host_name: payload.host_name || prev.host_name,
              manager_last_active_at: payload.manager_last_active_at ?? prev.manager_last_active_at,
              manager_inactive: payload.manager_inactive ?? prev.manager_inactive,
              player_count: payload.player_count ?? prev.player_count,
            }));
          }
          break;

        case 'manager_changed':
          if (payload) {
            const newHostId = payload.host_id;
            const newHostName = payload.host_name;
            setGameState((prev) => ({
              ...prev,
              host_id: newHostId,
              host_name: newHostName,
              manager_last_active_at: payload.manager_last_active_at,
              manager_inactive: false,
              game_log: payload.log_entry ? [...prev.game_log, payload.log_entry] : prev.game_log,
            }));
            if (newHostId === playerId) {
              setIsHost(true);
              setCurrentView('host');
              setStatusBanner('Você assumiu a gerência da sala!');
              if (soundEnabled && voiceEnabled) speakText('Você assumiu a gerência da sala!');
            } else {
              if (isHost) {
                setIsHost(false);
              }
              setStatusBanner(`${newHostName} assumiu a gerência da sala.`);
            }
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
          if (soundEnabled && voiceEnabled) speakText('A partida começou! Boa sorte a todos!');
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
            if (soundEnabled && voiceEnabled) speakBall(ball, letter);
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

        case 'bingo_countdown_started':
          if (payload) {
            setGameState((prev) => ({
              ...prev,
              active_contest: {
                id: payload.contest_id,
                ball: payload.ball,
                target_prize_id: payload.target_prize?.id,
                target_prize_title: payload.target_prize?.title,
                status: 'window',
                duration_seconds: payload.duration_seconds,
                window_start_time: Date.now() / 1000,
                window_end_time: payload.ends_at,
                candidates: payload.candidates || [payload.first_candidate],
              },
            }));
            setStatusBanner(payload.message || 'Bingo cantado! Janela de validação aberta.');
            if (soundEnabled && voiceEnabled) speakText('Atenção! Bingo cantado! Janela de dez segundos aberta!');
          }
          break;

        case 'bingo_candidate_joined':
          if (payload) {
            setGameState((prev) => {
              if (!prev.active_contest) return prev;
              return {
                ...prev,
                active_contest: {
                  ...prev.active_contest,
                  candidates: payload.candidates,
                },
              };
            });
            setStatusBanner(payload.message || 'Mais um jogador entrou na disputa do Bingo!');
            if (soundEnabled && voiceEnabled && payload.new_candidate) {
              speakText(`${payload.new_candidate.player_name} também cantou bingo!`);
            }
          }
          break;

        case 'bingo_tiebreaker_started':
          if (payload) {
            setGameState((prev) => {
              const current = prev.active_contest || {
                id: payload.contest_id,
                ball: payload.ball,
                target_prize_title: payload.prize_title,
                duration_seconds: 15,
                window_start_time: Date.now() / 1000,
                window_end_time: Date.now() / 1000 + 15,
                candidates: [],
              };
              return {
                ...prev,
                active_contest: {
                  ...current,
                  status: 'tiebreaker',
                  candidates: payload.candidates,
                },
              };
            });
            setStatusBanner(payload.message || '⚔️ Empate no Bingo! Disputa da pedra mais alta iniciada!');
            if (soundEnabled && voiceEnabled) speakText('Atenção! Empate no Bingo! Disputa da pedra mais alta!');
          }
          break;

        case 'tiebreaker_stone_revealed':
          if (payload) {
            setGameState((prev) => {
              if (!prev.active_contest) return prev;
              return {
                ...prev,
                active_contest: {
                  ...prev.active_contest,
                  candidates: payload.candidates || prev.active_contest.candidates.map((c) =>
                    c.player_id === payload.player_id ? { ...c, chosen_stone: payload.chosen_stone } : c
                  ),
                },
              };
            });
          }
          break;

        case 'tiebreaker_resolved':
          if (payload) {
            setGameState((prev) => {
              const updatedContest = prev.active_contest ? {
                ...prev.active_contest,
                status: 'resolved' as const,
                winner_player_id: payload.winner_player_id,
                candidates: payload.candidates,
              } : null;
              return {
                ...prev,
                active_contest: updatedContest,
                game_log: payload.game_log || prev.game_log,
              };
            });
            setStatusBanner(payload.message || `🏆 ${payload.winner_player_name} venceu a disputa!`);
            if (soundEnabled && voiceEnabled) speakText(`Vitória de ${payload.winner_player_name} com a pedra maior!`);
          }
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
              active_contest: null,
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

            if (soundEnabled && voiceEnabled) {
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

  const handleRoomNotFound = useCallback(() => {
    clearActiveSession();
    setRoomCode(null);
    setRoomPin('');
    setCards([]);
    setCurrentView('lobby');
    setStatusBanner('A sala anterior não está mais disponível.');
  }, []);

  // WebSocket hook
  const { isConnected, sendMessage, disconnect } = useWebSocket({
    roomCode,
    onMessage: handleWSMessage,
    onRoomNotFound: handleRoomNotFound,
    autoConnect: Boolean(roomCode),
  });

  // Automatically persist active session whenever session parameters change
  useEffect(() => {
    if (roomCode && playerId && playerToken && currentView !== 'lobby') {
      saveActiveSession({
        roomCode,
        roomPin,
        playerId,
        playerName,
        playerToken,
        isHost,
        cards,
        currentView,
        savedAt: Date.now(),
      });
    }
  }, [roomCode, roomPin, playerId, playerName, playerToken, isHost, cards, currentView]);

  // Prevent accidental reload, tab close, or navigation when inside an active game
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (roomCode && currentView !== 'lobby') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomCode, currentView]);

  // On mount, verify and synchronize restored session with the backend
  useEffect(() => {
    if (!initialSession) return;

    const verifySession = async () => {
      try {
        const res = await fetch(`/api/rooms/${initialSession.roomCode}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player_name: initialSession.playerName,
            card_count: initialSession.cards?.length || 1,
            token: initialSession.playerToken,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.cards && data.cards.length > 0) {
            setCards(data.cards);
          }
          setIsHost(Boolean(data.is_host));
          if (data.prizes) {
            setGameState((prev) => ({ ...prev, prizes: data.prizes }));
          }
          setStatusBanner('Sessão restaurada! Você continua na partida.');
        } else if (res.status === 404) {
          clearActiveSession();
          setRoomCode(null);
          setCards([]);
          setCurrentView('lobby');
          setStatusBanner('A sala anterior não está mais disponível.');
        }
      } catch (err) {
        console.warn('Network issue while verifying restored session:', err);
      }
    };

    verifySession();
  }, []);

  // Handshake after connection opens
  useEffect(() => {
    if (isConnected && roomCode && playerId && playerToken) {
      sendMessage('join', {
        player_id: playerId,
        token: playerToken,
      });
    }
  }, [isConnected, roomCode, playerId, playerToken, sendMessage]);

  // Periodic manager heartbeat (only if active within last 2 minutes)
  useEffect(() => {
    if (!isHost || !isConnected || !roomCode || !playerId) return;
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current < 120_000) {
        sendMessage('manager_heartbeat', { host_id: playerId });
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isHost, isConnected, roomCode, playerId, sendMessage]);

  // Claim management handler
  const handleClaimManager = async () => {
    if (!roomCode || !playerId) return;
    try {
      const res = await fetch(`/api/rooms/${roomCode}/claim-manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Não foi possível assumir o gerenciamento');
      }
      setIsHost(true);
      setCurrentView('host');
      setIsUsersOpen(false);
      setStatusBanner('Você assumiu a gerência da sala!');
      if (soundEnabled && voiceEnabled) speakText('Você assumiu a gerência da sala!');
      if (soundEnabled) playVictory();
    } catch (err: any) {
      alert(err.message || 'Erro ao assumir gerência');
    }
  };

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

      // Manager coordinates the game and does NOT join as a playing player with cards
      setCards([]);

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

  // Picking stone in tiebreaker
  const handlePickStone = (stoneIndex?: number) => {
    sendMessage('pick_tiebreaker_stone', {
      player_id: playerId,
      stone_index: stoneIndex,
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
    if (roomCode && currentView !== 'lobby') {
      const confirmed = window.confirm('Deseja realmente sair da sala e voltar ao Lobby?');
      if (!confirmed) return;
    }

    clearActiveSession();
    disconnect();
    setRoomCode(null);
    setRoomPin('');
    setCards([]);
    setCurrentView('lobby');
    setGameState((prev) => ({
      ...prev,
      code: '',
      status: 'lobby',
      stage: 'waiting',
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
        onToggleSound={handleToggleSound}
        onBackToLobby={currentView !== 'lobby' ? handleBackToLobby : undefined}
        onOpenHostView={isHost && currentView === 'game' ? () => setCurrentView('host') : undefined}
        isHost={isHost}
        userCount={gameState.player_count ?? players.filter((p) => !p.is_host).length}
        onOpenUsers={roomCode ? () => setIsUsersOpen(true) : undefined}
        managerInactive={gameState.manager_inactive || (gameState.manager_last_active_at ? (Date.now() / 1000 - gameState.manager_last_active_at >= 120) : false)}
        onOpenHelp={() => handleOpenHelp('rules')}
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
            onOpenHelp={() => handleOpenHelp('rules')}
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
            userCount={gameState.player_count ?? players.filter((p) => !p.is_host).length}
            onOpenUsers={() => setIsUsersOpen(true)}
            managerInactive={gameState.manager_inactive || (gameState.manager_last_active_at ? (Date.now() / 1000 - gameState.manager_last_active_at >= 120) : false)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
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
              toggleSpeech(soundEnabled && nextVal);
              if (!nextVal) {
                cancelSpeech();
              }
            }}
            onBackToPlayerView={cards.length > 0 ? () => setCurrentView('game') : undefined}
            onAddPrize={handleAddPrize}
            onRemovePrize={handleRemovePrize}
            onOpenUsers={() => setIsUsersOpen(true)}
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

      {/* TIEBREAKER & COUNTDOWN CONTEST MODAL */}
      <TiebreakerModal
        contest={gameState.active_contest}
        currentPlayerId={playerId}
        isHost={isHost}
        onPickStone={handlePickStone}
      />

      {/* USERS LIST MODAL (MANAGER & PLAYERS) */}
      <UsersListModal
        isOpen={isUsersOpen}
        onClose={() => setIsUsersOpen(false)}
        roomCode={roomCode || ''}
        hostName={gameState.host_name || playerName}
        hostId={gameState.host_id}
        currentUserId={playerId}
        isCurrentUserHost={isHost}
        users={users.length > 0 ? users : players}
        managerLastActiveAt={gameState.manager_last_active_at}
        managerInactive={gameState.manager_inactive}
        onClaimManager={handleClaimManager}
      />

      {/* HELP & RULES MODAL */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        defaultTab={helpDefaultTab}
      />
    </div>
  );
}
