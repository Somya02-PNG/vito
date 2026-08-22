import { Router } from 'express';
import { handleAskAgent, handleStreamChat, handlePartnerAIAssistant } from '../controllers/ai.controller';
import { optionalAuth, protect, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
  * POST /api/ai/agent
  * Single-turn JSON endpoint calling the VITO AI Agent
  */
router.post('/agent', optionalAuth, handleAskAgent);

/**
  * POST /api/ai/chat
  * Streaming chat endpoint (SSE or plain text with ?format=text)
  */
router.post('/chat', optionalAuth, handleStreamChat);

/**
  * POST /api/partner/ai-assistant & /api/ai/partner-assistant
  * Specialized Partner fleet status and document query AI assistant
  */
router.post('/partner-assistant', protect, authorize('partner', 'admin'), handlePartnerAIAssistant);

export default router;
