import { Router } from 'express';
import { protect, authorize, authorizePartnerType } from '../middleware/auth.middleware';
import { uploadDocument, uploadPhoto } from '../config/upload';
import {
  registerRentalPartner,
  getPartnerDashboardOverview,
  getPartnerVehicles,
  getPartnerVehicleById,
  createVehicle,
  updateVehicle,
  uploadVehicleDocument,
  uploadVehiclePhoto,
  submitVehicleForVerification,
  streamPrivateDocument,
  streamPhoto,
  setVehicleAvailability,
  archiveVehicle,
  getPartnerBookings,
  getPartnerDamages,
  reportPartnerDamage,
  getPartnerEarnings,
  partnerAIAssistant,
} from '../controllers/partnerVehicle.controller';

const router = Router();

// Public/Semi-public photo streaming endpoint
router.get('/photos/:filename', streamPhoto);

// Partner registration endpoint (authenticated user registering as rental partner)
router.post('/register', protect, registerRentalPartner);

// Private document streaming (Owner Partner or Admin only)
router.get('/documents/:docId/file', protect, streamPrivateDocument);

// ─── Partner-Restricted Operations (Requires role 'partner' & partnerType 'rental_partner') ───
router.get(
  '/dashboard-metrics',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  getPartnerDashboardOverview
);

router.get(
  '/vehicles',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  getPartnerVehicles
);

router.post(
  '/vehicles',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  createVehicle
);

router.get(
  '/vehicles/:id',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  getPartnerVehicleById
);

router.put(
  '/vehicles/:id',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  updateVehicle
);

// Real file upload endpoints with Multer native handling
router.post(
  '/vehicles/:id/upload-document',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  uploadDocument.single('document'),
  uploadVehicleDocument
);

router.post(
  '/vehicles/:id/upload-photo',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  uploadPhoto.single('photo'),
  uploadVehiclePhoto
);

router.post(
  '/vehicles/:id/submit-verification',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  submitVehicleForVerification
);

router.put(
  '/vehicles/:id/availability',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  setVehicleAvailability
);

router.delete(
  '/vehicles/:id',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  archiveVehicle
);

router.get(
  '/bookings',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  getPartnerBookings
);

router.get(
  '/damages',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  getPartnerDamages
);

router.post(
  '/damages',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  reportPartnerDamage
);

router.get(
  '/earnings',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  getPartnerEarnings
);

router.post(
  '/ai-assistant',
  protect,
  authorize('partner'),
  authorizePartnerType('rental_partner'),
  partnerAIAssistant
);

export default router;
