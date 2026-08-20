import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getMyVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  setDefaultVehicle,
  uploadVehicleDocument,
} from '../controllers/customerVehicle.controller';

const router = Router();

router.use(protect);

router.get('/vehicles', getMyVehicles);
router.post('/vehicles', createVehicle);
router.put('/vehicles/:id', updateVehicle);
router.delete('/vehicles/:id', deleteVehicle);
router.put('/vehicles/:id/default', setDefaultVehicle);
router.post('/vehicles/:id/documents', uploadVehicleDocument);

export default router;
