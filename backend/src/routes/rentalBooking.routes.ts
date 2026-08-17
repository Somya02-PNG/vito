import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  searchVehicles,
  getVehicleDetail,
  calculatePrice,
  demoVerification,
  createBooking,
  processPayment,
  getBookingStatus,
  getMyRentals,
  cancelBooking,
  extendRental,
  confirmExtension,
  settleFinalBill,
  submitFinalPayment,
  submitRating,
  getRentalHubs,
  uploadCustomerDocument,
  getMyDocuments,
  getVehicleDocuments,
  submitPreHandoverInspection,
  customerAcknowledgeHandover,
  getHandoverReport,
  submitReturnInspection,
  reviewDamage,
  getRentalBookingDetails,
  getAdminComplianceCenter,
  updateDocumentStatus,
  getPendingDamages,
  getAIStatusCheck,
} from '../controllers/rentalBooking.controller';

const router = Router();

// ─── Public/Protected Search & Vehicle Browsing ───────────────────────────────
router.get('/hubs', protect, getRentalHubs);
router.get('/vehicles/search', protect, searchVehicles);
router.get('/vehicles/:vehicleId', protect, getVehicleDetail);
router.get('/vehicles/:vehicleId/documents', protect, getVehicleDocuments);
router.post('/pricing/calculate', protect, calculatePrice);

// ─── Verification & Documents ─────────────────────────────────────────────────
router.post('/verify/demo', protect, demoVerification);
router.post('/documents/upload', protect, uploadCustomerDocument);
router.get('/documents/my', protect, getMyDocuments);

// ─── Booking Lifecycle ────────────────────────────────────────────────────────
router.post('/bookings', protect, createBooking);
router.post('/bookings/:bookingMongoId/payment', protect, processPayment);
router.get('/bookings/:bookingMongoId/status', protect, getBookingStatus);
router.get('/bookings/:bookingMongoId/details', protect, getRentalBookingDetails);
router.get('/bookings/my', protect, getMyRentals);
router.post('/bookings/:bookingMongoId/cancel', protect, cancelBooking);

// ─── Pre-Handover & Digital Acknowledgement ──────────────────────────────────
router.post('/bookings/:bookingMongoId/handover-inspection', protect, submitPreHandoverInspection);
router.post('/bookings/:bookingMongoId/customer-acknowledge', protect, customerAcknowledgeHandover);
router.get('/bookings/:bookingMongoId/handover-report', protect, getHandoverReport);

// ─── Active Rental ────────────────────────────────────────────────────────────
router.post('/bookings/:bookingMongoId/extend', protect, extendRental);
router.post('/bookings/:bookingMongoId/extend/confirm', protect, confirmExtension);

// ─── Return, Post-Inspection & Damage Review ──────────────────────────────────
router.post('/bookings/:bookingMongoId/return-inspection', protect, submitReturnInspection);
router.post('/damages/:damageId/review', protect, reviewDamage);
router.get('/admin/damages/pending', protect, getPendingDamages);

// ─── Settlement & Rating ──────────────────────────────────────────────────────
router.get('/bookings/:bookingMongoId/final-bill', protect, settleFinalBill);
router.post('/bookings/:bookingMongoId/final-payment', protect, submitFinalPayment);
router.post('/bookings/:bookingMongoId/rating', protect, submitRating);

// ─── Admin Compliance Center ──────────────────────────────────────────────────
router.get('/admin/compliance', protect, getAdminComplianceCenter);
router.post('/admin/documents/status', protect, updateDocumentStatus);

// ─── AI Assistant Safe Status Check ───────────────────────────────────────────
router.post('/ai/status-check', protect, getAIStatusCheck);

export default router;
