import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export interface MicroclimateUpdate {
  microclimate_id: string;
  response_count: number;
  participation_rate: number;
  live_results: {
    word_cloud_data: Array<{ text: string; value: number }>;
    sentiment_score: number;
    engagement_level: 'low' | 'medium' | 'high';
    response_distribution: Record<string, number>;
    top_themes: string[];
    sentiment_distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  ai_insights: Array<{
    type: 'pattern' | 'alert' | 'recommendation';
    message: string;
    confidence: number;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface LiveInsight {
  id: string;
  type: 'pattern' | 'alert' | 'recommendation';
  message: string;
  confidence: number;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

let io: SocketIOServer | null = null;

export const initializeWebSocket = (server: HTTPServer): SocketIOServer => {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify the session token
      // In a real implementation, you'd verify the JWT token here
      socket.data.userId = token.userId;
      socket.data.companyId = token.companyId;
      socket.data.role = token.role;

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.userId}`);

    // Join microclimate room
    socket.on('join_microclimate', (microclimateId: string) => {
      socket.join(`microclimate_${microclimateId}`);
      console.log(
        `User ${socket.data.userId} joined microclimate ${microclimateId}`
      );
    });

    // Leave microclimate room
    socket.on('leave_microclimate', (microclimateId: string) => {
      socket.leave(`microclimate_${microclimateId}`);
      console.log(
        `User ${socket.data.userId} left microclimate ${microclimateId}`
      );
    });

    // Handle new response submission
    socket.on(
      'new_response',
      (data: { microclimateId: string; response: any }) => {
        // Broadcast to all users in the microclimate room
        socket
          .to(`microclimate_${data.microclimateId}`)
          .emit('response_received', {
            microclimateId: data.microclimateId,
            timestamp: new Date(),
          });
      }
    );

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId}`);
    });
  });

  return io;
};

export const getWebSocketServer = (): SocketIOServer | null => {
  return io;
};

export const broadcastMicroclimateUpdate = (
  microclimateId: string,
  update: MicroclimateUpdate
): void => {
  if (!io) {
    console.warn('WebSocket server not initialized');
    return;
  }

  io.to(`microclimate_${microclimateId}`).emit('microclimate_update', update);
};

export const broadcastLiveInsight = (
  microclimateId: string,
  insight: LiveInsight
): void => {
  if (!io) {
    console.warn('WebSocket server not initialized');
    return;
  }

  io.to(`microclimate_${microclimateId}`).emit('live_insight', {
    microclimateId,
    insight,
  });
};

export const broadcastParticipationUpdate = (
  microclimateId: string,
  participationData: {
    response_count: number;
    participation_rate: number;
    target_participant_count: number;
  }
): void => {
  if (!io) {
    console.warn('WebSocket server not initialized');
    return;
  }

  io.to(`microclimate_${microclimateId}`).emit('participation_update', {
    microclimateId,
    ...participationData,
  });
};


