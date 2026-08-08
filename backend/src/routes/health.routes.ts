import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();
const startTime = Date.now();

router.get('/health', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const statusResponse = {
    status: 'ok',
    service: 'VITO AI Mobility Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    database: {
      state: dbStates[dbStatus] || 'unknown',
      connected: dbStatus === 1,
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
    },
  };

  res.status(200).json(statusResponse);
});

export default router;
