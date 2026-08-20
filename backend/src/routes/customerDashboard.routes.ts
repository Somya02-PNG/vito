import { Router } from 'express';
import {
  getCustomerDashboard,
  searchLocation,
  resolveLocation,
  getNearbyDriversApi,
  getSavedLocations,
  createSavedLocation,
  deleteSavedLocation,
} from '../controllers/customerDashboard.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// ─── Customer Aggregated Dashboard ──────────────────────────────────────────
router.get('/customer/dashboard', protect, getCustomerDashboard);

// ─── Location & Geocoding Endpoints ─────────────────────────────────────────
router.get('/location/search', searchLocation);
router.post('/location/resolve', resolveLocation);
router.post('/location/reverse', resolveLocation);

// ─── Nearby Drivers ─────────────────────────────────────────────────────────
router.get('/drivers/nearby', getNearbyDriversApi);

// ─── Saved Locations ────────────────────────────────────────────────────────
router.get('/customer/locations', protect, getSavedLocations);
router.post('/customer/locations', protect, createSavedLocation);
router.delete('/customer/locations/:id', protect, deleteSavedLocation);

export default router;
