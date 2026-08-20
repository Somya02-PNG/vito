import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { autoSeedRentals } from './services/rentalSeeder.service';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import vehicleRoutes from './routes/vehicle.routes';
import rentalRoutes from './routes/rental.routes';
import rideRoutes from './routes/ride.routes';
import driverHireRoutes from './routes/driverHire.routes';
import safetyRoutes from './routes/safety.routes';
import expenseRoutes from './routes/expense.routes';
import driverDashboardRoutes from './routes/driverDashboard.routes';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payment.routes';
import seedRoutes from './routes/seed.routes';
import partnerRoutes from './routes/partner.routes';
import rentalBookingRoutes from './routes/rentalBooking.routes';
import customerVehicleRoutes from './routes/customerVehicle.routes';
import customerDashboardRoutes from './routes/customerDashboard.routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';
import { securityHeadersMiddleware, noSqlSanitizerMiddleware } from './middleware/security.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ─── Security Middlewares ───────────────────────────────────────────────────
// # HINGLISH: Sabse pehle security headers aur body sanitization lagaya gaya hai
app.use(securityHeadersMiddleware);

app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

// # HINGLISH: 10kb body size limit taaki payload flooding / memory exhaustion DDoS attack na ho
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// # HINGLISH: NoSQL Operator Injection sanitization wall
app.use(noSqlSanitizerMiddleware);

// Connect Database (with automatic embedded In-Memory Mongo fallback)
connectDB().then((connected) => {
  if (connected) {
    autoSeedRentals().catch((err) => console.error('Auto seed error:', err));
  }
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', vehicleRoutes);
app.use('/api', rentalRoutes);
app.use('/api', rideRoutes);
app.use('/api/driver-hire', driverHireRoutes);
app.use('/api', driverHireRoutes);
app.use('/api', safetyRoutes);
app.use('/api', expenseRoutes);
app.use('/api', driverDashboardRoutes);
app.use('/api', adminRoutes);
app.use('/api', paymentRoutes);
app.use('/api', seedRoutes);
app.use('/api', partnerRoutes);
app.use('/api/rental', rentalBookingRoutes);
app.use('/api/customer', customerVehicleRoutes);
app.use('/api', customerVehicleRoutes);
app.use('/api', customerDashboardRoutes);

// Root Endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🚀 Welcome to VITO AI Mobility Backend Engine API',
    healthCheck: '/api/health',
    status: 'online',
    security: 'hardened',
  });
});

// Error Handling (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`⚡ [VITO Backend Server] Running on http://localhost:${PORT}`);
  console.log(`🔍 [Health Check Endpoint] http://localhost:${PORT}/api/health`);
});

export default app;
