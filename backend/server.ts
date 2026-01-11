
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { redisService } from './services/redisService';
import { aggregatorService } from './services/aggregatorService';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// REST API for initial state & pagination
app.get('/api/tokens', async (req, res) => {
  try {
    const cursor = req.query.cursor as string || '0';
    const limit = parseInt(req.query.limit as string) || 25;
    
    const response = await aggregatorService.getPaginatedTokens(cursor, limit);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tokens from cache' });
  }
});

// WebSocket Real-time Sync
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  
  // In a real scenario, we'd subscribe to Redis Pub/Sub here
  const redisUnsubscribe = redisService.subscribeToUpdates((updates) => {
    socket.emit('token_updates', updates);
  });

  socket.on('disconnect', () => {
    redisUnsubscribe();
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[SERVER] Aggregator Backend running on port ${PORT}`);
});
