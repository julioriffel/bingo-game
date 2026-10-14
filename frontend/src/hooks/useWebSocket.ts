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

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${roomCode.toUpperCase()}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        if (onMessageRef.current) {
          onMessageRef.current(data);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (evt) => {
      console.warn('WebSocket error:', evt);
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

      // Reconnect after 2.5 seconds if roomCode still exists
      if (roomCode) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 2500);
      }
    };
  }, [roomCode]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((type: string, payload: any = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
    } else {
      console.warn('Cannot send message, WebSocket not open');
    }
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
