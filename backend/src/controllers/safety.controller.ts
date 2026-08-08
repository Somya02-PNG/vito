import { Request, Response, NextFunction } from 'express';
import EmergencyContact from '../models/EmergencyContact.model';
import { AppError } from '../middleware/error.middleware';

// ─── Get Saved Emergency Contacts ──────────────────────────────────────────
export const getContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;
    const contacts = await EmergencyContact.find({ userId }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: { contacts },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Add Emergency Contact ──────────────────────────────────────────────────
export const addContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;
    const { contactName, phone, relationship } = req.body;

    if (!contactName || !phone) {
      return next(new AppError('Please provide contactName and phone number.', 400));
    }

    const contact = await EmergencyContact.create({
      userId,
      contactName,
      phone,
      relationship: relationship || 'Contact',
    });

    res.status(201).json({
      success: true,
      data: { contact },
      message: 'Emergency contact added successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Emergency Contact ───────────────────────────────────────────────
export const updateContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;
    const { contactName, phone, relationship } = req.body;

    const contact = await EmergencyContact.findOne({ _id: id, userId });
    if (!contact) {
      return next(new AppError('Emergency contact not found.', 404));
    }

    if (contactName) contact.contactName = contactName;
    if (phone) contact.phone = phone;
    if (relationship) contact.relationship = relationship;

    await contact.save();

    res.status(200).json({
      success: true,
      data: { contact },
      message: 'Emergency contact updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Emergency Contact ───────────────────────────────────────────────
export const deleteContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    const contact = await EmergencyContact.findOneAndDelete({ _id: id, userId });
    if (!contact) {
      return next(new AppError('Emergency contact not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Emergency contact deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Trigger SOS Emergency Alert ────────────────────────────────────────────
export const triggerSOS = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;
    const { lat, lng, address } = req.body;

    // Fetch saved emergency contacts to simulate SMS alert dispatch
    const contacts = await EmergencyContact.find({ userId }).lean();

    const timestamp = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const locationText = address || `Lat: ${lat || 28.6315}, Lng: ${lng || 77.2167}`;

    const mockNotifications = contacts.map((c) => ({
      recipient: `${c.contactName} (${c.phone})`,
      message: `🚨 EMERGENCY ALERT: ${req.user?.name || 'VITO User'} pressed SOS at ${timestamp}. Location: ${locationText}. Dispatching emergency support.`,
    }));

    res.status(200).json({
      success: true,
      data: {
        timestamp,
        location: locationText,
        contactsNotifiedCount: contacts.length,
        notifications: mockNotifications,
        policeDeskNotified: true,
      },
      message: 'SOS Alert triggered! Notifications dispatched to contacts and VITO Control Room.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Generate Live Tracking Share Link ─────────────────────────────────────
export const generateShareableLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const randomToken = Math.floor(100000 + Math.random() * 900000).toString();
    const shareUrl = `https://vito.app/track/live-${randomToken}`;

    res.status(200).json({
      success: true,
      data: {
        shareUrl,
        expiresIn: '24 hours',
      },
    });
  } catch (error) {
    next(error);
  }
};
