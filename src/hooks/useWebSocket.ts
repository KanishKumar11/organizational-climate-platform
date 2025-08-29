import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { MicroclimateUpdate, LiveInsight } from '@/lib/websocket';

interface UseWebSocketOptions {
  microclimateId?: string;
  autoConnect?: boolean;
}

interface WebSocketState {
  connected: boolean;
  error: string | null;
  lastUpdate: MicroclimateUpdate | null;
  lastInsight: LiveInsight | null;
  participationData: {
    response_count: number;
    participation_rate: number;
    target_participant_count: number;
  } | null;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { data: session } = useSession();
  const { microclimateId, autoConnect = true } = options;

  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    error: null,
    lastUpdate: null,
    lastInsight: null,
    participationData: null,
  });

  const connect = () => {
    if (!session?.user || socketRef.current?.connected) {
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || '', {
      auth: {
        token: {
          userId: session.user.id,
          companyId: session.user.companyId,
          role: session.user.role,
        },
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, connected: true, error: null }));

      // Auto-join microclimate room if provided
      if (microclimateId) {
        socket.emit('join_microclimate', microclimateId);
      }
    });

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, connected: false }));
    });

    socket.on('connect_error', (error) => {
      setState((prev) => ({ ...prev, error: error.message, connected: false }));
    });

    socket.on('microclimate_update', (update: MicroclimateUpdate) => {
      setState((prev) => ({ ...prev, lastUpdate: update }));
    });

    socket.on(
      'live_insight',
      (data: { microclimateId: string; insight: LiveInsight }) => {
        setState((prev) => ({ ...prev, lastInsight: data.insight }));
      }
    );

    socket.on(
      'participation_update',
      (data: {
        microclimateId: string;
        response_count: number;
        participation_rate: number;
        target_participant_count: number;
      }) => {
        setState((prev) => ({
          ...prev,
          participationData: {
            response_count: data.response_count,
            participation_rate: data.participation_rate,
            target_participant_count: data.target_participant_count,
          },
        }));
      }
    );

    socket.on('response_received', () => {
      // Trigger a refresh or update when a new response is received
      setState((prev) => ({ ...prev })); // Force re-render
    });

    socketRef.current = socket;
  };

  const disconnect = () => {
    if (socketRef.current) {
      if (microclimateId) {
        socketRef.current.emit('leave_microclimate', microclimateId);
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setState((prev) => ({ ...prev, connected: false }));
    }
  };

  const joinMicroclimate = (id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_microclimate', id);
    }
  };

  const leaveMicroclimate = (id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_microclimate', id);
    }
  };

  const emitNewResponse = (microclimateId: string, response: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('new_response', { microclimateId, response });
    }
  };

  useEffect(() => {
    if (autoConnect && session?.user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session, autoConnect]);

  useEffect(() => {
    // Handle microclimate ID changes
    if (socketRef.current?.connected && microclimateId) {
      joinMicroclimate(microclimateId);
    }

    return () => {
      if (socketRef.current?.connected && microclimateId) {
        leaveMicroclimate(microclimateId);
      }
    };
  }, [microclimateId]);

  return {
    ...state,
    connect,
    disconnect,
    joinMicroclimate,
    leaveMicroclimate,
    emitNewResponse,
    socket: socketRef.current,
  };
};
