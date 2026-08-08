import { Router } from 'express';
import {
  getTrips,
  createTrip,
  getTripExpenses,
  logExpense,
  deleteExpense,
} from '../controllers/expense.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected routes for trip planner & expense splitter
router.get('/planner/trips', protect, getTrips);
router.post('/planner/trips', protect, createTrip);

router.get('/planner/trips/:tripId/expenses', protect, getTripExpenses);
router.post('/planner/trips/:tripId/expenses', protect, logExpense);
router.delete('/planner/expenses/:id', protect, deleteExpense);

export default router;
