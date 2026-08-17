import { Router } from 'express';
import { seedDatabase, seedRentals } from '../controllers/seed.controller';

const router = Router();

// Public seed route for instant demo population
router.post('/seed', seedDatabase);
router.get('/seed', seedDatabase);
router.post('/seed-rentals', seedRentals);
router.get('/seed-rentals', seedRentals);

export default router;
