/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || `http://localhost:${port}`,
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

      // Store user data in socket
      socket.data.userId = token.userId;
      socket.data.companyId = token.companyId;
      socket.data.role = token.role;

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.userId || 'anonymous'}`);

    // Join microclimate room
    socket.on('join_microclimate', (microclimateId) => {
      socket.join(`microclimate_${microclimateId}`);
      console.log(`User ${socket.data.userId} joined microclimate ${microclimateId}`);
    });

    // Leave microclimate room
    socket.on('leave_microclimate', (microclimateId) => {
      socket.leave(`microclimate_${microclimateId}`);
      console.log(`User ${socket.data.userId} left microclimate ${microclimateId}`);
    });

    // Handle new response submission
    socket.on('new_response', (data) => {
      console.log(`New response for microclimate ${data.microclimateId}:`, data);

      // Broadcast to all users in the microclimate room
      socket.to(`microclimate_${data.microclimateId}`).emit('response_received', {
        microclimateId: data.microclimateId,
        timestamp: new Date(),
      });

      // Also broadcast updated participation data if available
      if (data.participationData) {
        socket.to(`microclimate_${data.microclimateId}`).emit('participation_update', {
          microclimateId: data.microclimateId,
          ...data.participationData,
        });
      }

      // Broadcast microclimate update if available
      if (data.microclimateUpdate) {
        socket.to(`microclimate_${data.microclimateId}`).emit('microclimate_update', data.microclimateUpdate);
      }
    });

    // Handle live insight broadcasting
    socket.on('broadcast_insight', (data) => {
      console.log(`Broadcasting insight for microclimate ${data.microclimateId}:`, data.insight);

      socket.to(`microclimate_${data.microclimateId}`).emit('live_insight', {
        microclimateId: data.microclimateId,
        insight: data.insight,
      });
    });

    // Handle participation rate updates
    socket.on('update_participation', (data) => {
      console.log(`Updating participation for microclimate ${data.microclimateId}:`, data);

      socket.to(`microclimate_${data.microclimateId}`).emit('participation_update', {
        microclimateId: data.microclimateId,
        response_count: data.response_count,
        participation_rate: data.participation_rate,
        target_participant_count: data.target_participant_count,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId || 'anonymous'}`);
    });
  });

  // Make io available globally
  global.io = io;

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});