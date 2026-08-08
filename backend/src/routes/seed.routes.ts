import { Router } from 'express';
import { seedDatabase } from '../controllers/seed.controller';

const router = Router();

// Public seed route for instant demo population
router.post('/seed', seedDatabase);
router.get('/seed', seedDatabase);

export default router;
