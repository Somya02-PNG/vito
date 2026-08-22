import { Request, Response } from 'express';
import { VitoAgentService } from '../services/vitoAgent.service';
import RentalPartner from '../models/RentalPartner.model';
import Vehicle from '../models/Vehicle.model';
import VehicleDocument from '../models/VehicleDocument.model';
import RentalBooking from '../models/RentalBooking.model';

export const handleAskAgent = async (req: Request, res: Response) => {
  try {
    const { message, history, context, maxSteps } = req.body;

    if (!message && (!history || history.length === 0) && (!req.body.messages || req.body.messages.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'A message or history conversation is required.',
      });
    }

    const authUser = (req as any).user;
    const enrichedContext = {
      ...(context || {}),
      userId: authUser?._id?.toString() || authUser?.id || context?.userId || 'guest',
      role: authUser?.role || context?.role || 'customer',
      userName: authUser?.name || context?.userName || 'User',
      city: context?.city || 'Delhi NCR',
      timestamp: new Date().toISOString(),
    };

    const agentResult = await VitoAgentService.askAgent({
      message: message || '',
      history: history || [],
      context: enrichedContext,
      maxSteps: maxSteps ? Math.min(Number(maxSteps), 20) : 10,
    });

    return res.json({
      success: true,
      data: agentResult,
      reply: agentResult.reply,
      toolCalls: agentResult.toolCalls || [],
      provider: agentResult.provider,
    });
  } catch (error: any) {
    console.error('❌ [AI Controller - handleAskAgent] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI agent request',
      error: error.message,
    });
  }
};

export const handleStreamChat = async (req: Request, res: Response) => {
  try {
    const { message, history, context, maxSteps } = req.body;
    const format = req.query.format === 'text' ? 'text' : 'sse';

    const authUser = (req as any).user;
    const enrichedContext = {
      ...(context || {}),
      userId: authUser?._id?.toString() || authUser?.id || context?.userId || 'guest',
      role: authUser?.role || context?.role || 'customer',
      userName: authUser?.name || context?.userName || 'User',
      timestamp: new Date().toISOString(),
    };

    const upstreamResponse = await VitoAgentService.streamChat(
      {
        message: message || '',
        history: history || [],
        context: enrichedContext,
        maxSteps: maxSteps ? Math.min(Number(maxSteps), 20) : 10,
      },
      format
    );

    if (format === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
    } else {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }

    if (!upstreamResponse.body) {
      return res.status(502).end('Stream body unavailable');
    }

    // Pipe upstream ReadableStream to Express Response
    const reader = upstreamResponse.body.getReader();
    const decoder = new TextDecoder();

    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
        res.end();
      } catch (streamErr) {
        console.error('Stream read error:', streamErr);
        res.end();
      }
    };

    await pump();
  } catch (error: any) {
    console.error('❌ [AI Controller - handleStreamChat] Error:', error);
    // Fallback single-turn response if streaming proxy fails
    try {
      const fallbackResult = await VitoAgentService.askAgent(req.body);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end(fallbackResult.reply);
    } catch {
      return res.status(500).json({
        success: false,
        message: 'Failed to stream chat response',
        error: error.message,
      });
    }
  }
};

export const handlePartnerAIAssistant = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const { message, history } = req.body;

    let partnerContext: Record<string, any> = {
      role: 'partner',
      userName: authUser?.name || 'Rental Partner',
    };

    if (authUser?._id) {
      const partner = await RentalPartner.findOne({ userId: authUser._id });
      if (partner) {
        const vehicles = await Vehicle.find({ partnerId: partner._id, isArchived: { $ne: true } });
        const expiredDocs = await VehicleDocument.find({
          partnerId: partner._id,
          $or: [
            { verificationStatus: 'EXPIRED' },
            { expiresAt: { $lt: new Date() } },
          ],
        });
        const activeBookings = await RentalBooking.countDocuments({
          partnerId: partner._id,
          status: { $in: ['CONFIRMED', 'ACTIVE', 'HANDOVER_PENDING', 'RETURN_PENDING'] },
        });

        partnerContext = {
          ...partnerContext,
          partnerId: partner.partnerId,
          businessName: partner.businessName,
          verificationStatus: partner.verificationStatus,
          totalVehicles: vehicles.length,
          availableVehicles: vehicles.filter((v) => v.status === 'VERIFIED' && v.availabilityStatus === 'AVAILABLE').length,
          underReviewVehicles: vehicles.filter((v) => v.status === 'UNDER_REVIEW' || v.status === 'DOCUMENTS_PENDING').length,
          expiredDocumentsCount: expiredDocs.length,
          activeBookingsCount: activeBookings,
          walletBalance: partner.walletBalance,
        };
      }
    }

    const agentResult = await VitoAgentService.askAgent({
      message: message || '',
      history: history || [],
      context: partnerContext,
      maxSteps: 10,
    });

    return res.json({
      success: true,
      data: {
        response: agentResult.reply,
        toolCalls: agentResult.toolCalls || [],
        partnerContextSummary: {
          totalVehicles: partnerContext.totalVehicles,
          availableVehicles: partnerContext.availableVehicles,
          expiredDocuments: partnerContext.expiredDocumentsCount,
        },
      },
      message: agentResult.reply,
    });
  } catch (error: any) {
    console.error('❌ [AI Controller - handlePartnerAIAssistant] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process partner AI inquiry',
      error: error.message,
    });
  }
};
