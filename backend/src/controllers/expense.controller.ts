import { Request, Response, NextFunction } from 'express';
import Trip from '../models/Trip.model';
import Expense from '../models/Expense.model';
import { AppError } from '../middleware/error.middleware';

// ─── Helper: Greedy Debt Settlement Algorithm ────────────────────────────────
export const calculateTripSettlement = (
  participants: string[],
  expenses: any[]
) => {
  const balanceMap: Record<string, number> = {};

  // Initialize all participants with 0
  participants.forEach((p) => {
    balanceMap[p] = 0;
  });

  let totalTripSpent = 0;

  // Compute Net Balance per participant
  expenses.forEach((exp) => {
    totalTripSpent += exp.amount || 0;

    // The person who paid gets a positive credit
    const payer = exp.paidByName;
    if (balanceMap[payer] === undefined) balanceMap[payer] = 0;
    balanceMap[payer] += exp.amount || 0;

    // Each participant in splits gets a negative debit
    if (exp.splits && Array.isArray(exp.splits)) {
      exp.splits.forEach((s: { participantName: string; amount: number }) => {
        if (balanceMap[s.participantName] === undefined) balanceMap[s.participantName] = 0;
        balanceMap[s.participantName] -= s.amount || 0;
      });
    }
  });

  // Separate into Creditors (+) and Debtors (-)
  const creditors: { name: string; amount: number }[] = [];
  const debtors: { name: string; amount: number }[] = [];

  Object.entries(balanceMap).forEach(([name, bal]) => {
    const rounded = Math.round(bal);
    if (rounded > 1) {
      creditors.push({ name, amount: rounded });
    } else if (rounded < -1) {
      debtors.push({ name, amount: rounded });
    }
  });

  // Sort creditors descending, debtors ascending (largest debt first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => a.amount - b.amount);

  const settlements: { from: string; to: string; amount: number }[] = [];

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const cred = creditors[i];
    const debt = debtors[j];

    const debtAbs = Math.abs(debt.amount);
    const settle = Math.min(cred.amount, debtAbs);

    if (settle > 0) {
      settlements.push({
        from: debt.name,
        to: cred.name,
        amount: settle,
      });

      cred.amount -= settle;
      debt.amount += settle;
    }

    if (cred.amount <= 1) i++;
    if (debt.amount >= -1) j++;
  }

  const netBalancesList = Object.entries(balanceMap).map(([name, bal]) => ({
    name,
    netBalance: Math.round(bal),
  }));

  return {
    totalTripSpent: Math.round(totalTripSpent),
    netBalances: netBalancesList,
    settlements,
  };
};

// ─── Get User Trips (Auto-creates demo trip if none exist) ───────────────────
export const getTrips = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;

    let trips = await Trip.find({ userId }).sort({ createdAt: -1 }).lean();

    // Auto-create a default sample trip if the user has no trips yet
    if (trips.length === 0) {
      const demoTrip = await Trip.create({
        userId,
        aiPlanData: {
          title: 'Goa Coastal Highway Drive',
          destination: 'Goa, India',
          dates: '12 - 16 Oct 2026',
        },
        participants: [
          { userId, name: req.user?.name || 'You', email: req.user?.email },
          { userId, name: 'Rahul Sharma' },
          { userId, name: 'Priya Patel' },
          { userId, name: 'Alex Mercer' },
        ],
      });
      trips = [demoTrip.toObject() as any];
    }

    res.status(200).json({
      success: true,
      data: { trips },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Create New Trip ────────────────────────────────────────────────────────
export const createTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;
    const { title, destination, participantNames } = req.body;

    if (!title || !destination) {
      return next(new AppError('Trip title and destination are required.', 400));
    }

    const names: string[] = Array.isArray(participantNames) && participantNames.length > 0
      ? participantNames
      : [req.user?.name || 'You', 'Rahul', 'Priya'];

    const participants = names.map((name) => ({
      userId,
      name,
    }));

    const trip = await Trip.create({
      userId,
      aiPlanData: {
        title,
        destination,
        dates: 'Upcoming Trip',
      },
      participants,
    });

    res.status(201).json({
      success: true,
      data: { trip },
      message: 'Trip created successfully!',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Trip Expenses & Settlement Summary ─────────────────────────────────
export const getTripExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId).lean();
    if (!trip) {
      return next(new AppError('Trip not found.', 404));
    }

    const expenses = await Expense.find({ tripId }).sort({ createdAt: -1 }).lean();
    const participantNames = trip.participants.map((p) => p.name);

    const settlementData = calculateTripSettlement(participantNames, expenses);

    res.status(200).json({
      success: true,
      data: {
        trip,
        expenses,
        ...settlementData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Log New Expense for Trip ───────────────────────────────────────────────
export const logExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;
    const { tripId } = req.params;
    const { title, category, amount, paidByName, splitType, customSplits } = req.body;

    if (!title || !category || !amount || !paidByName) {
      return next(new AppError('title, category, amount, and paidByName are required.', 400));
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return next(new AppError('Trip not found.', 404));
    }

    const participantNames = trip.participants.map((p) => p.name);
    let splits: { participantName: string; amount: number; percentage?: number }[] = [];

    // Calculate splits based on splitType
    if (splitType === 'equal' || !splitType) {
      const perPerson = Math.round((Number(amount) / participantNames.length) * 100) / 100;
      splits = participantNames.map((p) => ({
        participantName: p,
        amount: perPerson,
      }));
    } else if (splitType === 'custom' && customSplits && Array.isArray(customSplits)) {
      splits = customSplits;
    } else {
      const perPerson = Math.round((Number(amount) / participantNames.length) * 100) / 100;
      splits = participantNames.map((p) => ({
        participantName: p,
        amount: perPerson,
      }));
    }

    const expense = await Expense.create({
      tripId,
      title,
      category,
      amount: Number(amount),
      paidBy: userId,
      paidByName,
      splitType: splitType || 'equal',
      splits,
    });

    // Link expense to trip
    trip.linkedExpenses.push(expense._id);
    await trip.save();

    res.status(201).json({
      success: true,
      data: { expense },
      message: 'Expense logged successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Expense ─────────────────────────────────────────────────────────
export const deleteExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return next(new AppError('Expense not found.', 404));
    }

    // Unlink from Trip
    await Trip.findByIdAndUpdate(expense.tripId, {
      $pull: { linkedExpenses: expense._id },
    });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
