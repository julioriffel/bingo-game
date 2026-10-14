import { useEffect, useRef, useState, useCallback } from 'react';
import type { WSMessage } from '../types/bingo';

interface UseWebSocketOptions {
  roomCode: string | null;
  onMessage?: (message: WSMessage) => void;
  onRoomNotFound?: () => void;
  autoConnect?: boolean;
}

export function useWebSocket({ roomCode, onMessage, onRoomNotFound, autoConnect = true }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const onMessageRef = useRef(onMessage);
  const onRoomNotFoundRef = useRef(onRoomNotFound);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onRoomNotFoundRef.current = onRoomNotFound;
  }, [onRoomNotFound]);

  const connect = useCallback(() => {
    if (!roomCode) return;

    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${roomCode.toUpperCase()}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0; // Reset backoff counter on successful connection
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        if (onMessageRef.current) {
          onMessageRef.current(data);
        }
      } catch (err) {
        // Drop malformed frame safely
      }
    };

    ws.onerror = () => {
      setError('Erro de conexão com a sala');
    };

    ws.onclose = (event: CloseEvent) => {
      setIsConnected(false);
      socketRef.current = null;

      if (event.code === 4004) {
        // Room no longer exists on server
        if (onRoomNotFoundRef.current) {
          onRoomNotFoundRef.current();
        }
        return;
      }

      // Reconnect with exponential backoff and jitter (prevents thundering herd)
      if (roomCode) {
        reconnectAttemptsRef.current += 1;
        const baseDelay = 1000 * Math.pow(1.5, Math.min(reconnectAttemptsRef.current, 6));
        const jitter = Math.random() * 500;
        const delay = Math.min(baseDelay + jitter, 15000);

        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, delay);
      }
    };
  }, [roomCode]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((type: string, payload: any = {}): boolean => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
        return true;
      } catch (err) {
        return false;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    if (autoConnect && roomCode) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, roomCode, connect, disconnect]);

  return { isConnected, error, sendMessage, connect, disconnect };
}
