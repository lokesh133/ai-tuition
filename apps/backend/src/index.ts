import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config';
import tutorRoutes from './routes/tutor';
import parentRoutes from './routes/parent';
import healthRoutes from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { aiService } from './services/aiService';

const app = express();
const server = http.createServer(app);

// 1. Core Middlewares
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. Request Logger in Development
if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });
}

// 3. Mount Routes
app.use('/api/health', healthRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/parent', parentRoutes);

// 4. WebSocket Server for Real-Time Low-Latency Voice Streaming
const wss = new WebSocketServer({ server, path: '/ws/voice' });

wss.on('connection', (ws: WebSocket) => {
  console.log('⚡ Client connected to AI Voice WebSocket stream.');

  ws.on('message', async (data: Buffer | string) => {
    try {
      const payload = JSON.parse(data.toString());
      const { teacher_id = 'sharma_sir', question } = payload;

      // Stream response chunks
      const response = await aiService.askTeacher(teacher_id, question);
      ws.send(JSON.stringify({ type: 'teacher_reply', data: response }));
    } catch (err: any) {
      ws.send(JSON.stringify({ type: 'error', message: err.message || 'Stream processing error' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from AI Voice WebSocket.');
  });
});

// 5. Global Error Handler
app.use(errorHandler);

// 6. Start Server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`
  ======================================================
  🚀 AI Tuition Platform Backend (Classes 1st - 8th)
  📡 Server running on: http://localhost:${PORT}
  🤖 Gemini Model:      ${config.geminiModel}
  ⚡ WebSocket Stream:  ws://localhost:${PORT}/ws/voice
  🛡️ Cost Optimization: Active (Redis / Memory Cache)
  ======================================================
  `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => process.exit(0));
});

export default app;
