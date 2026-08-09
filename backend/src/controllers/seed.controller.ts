import { Request, Response, NextFunction } from 'express';
import User from '../models/User.model';
import Vehicle from '../models/Vehicle.model';
import Driver from '../models/Driver.model';
import Rental from '../models/Rental.model';
import Ride from '../models/Ride.model';
import DriverHire from '../models/DriverHire.model';
import Trip from '../models/Trip.model';
import Expense from '../models/Expense.model';

export const SEED_VEHICLES = [
  {
    category: 'hatchback',
    fuelType: 'petrol',
    transmission: 'manual',
    seats: 5,
    pricePerDay: 1200,
    images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80'],
    location: { lat: 28.6315, lng: 77.2167 },
    rating: 4.8,
    deliveryAvailable: true,
  },
  {
    category: 'sedan',
    fuelType: 'cng',
    transmission: 'manual',
    seats: 5,
    pricePerDay: 1500,
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80'],
    location: { lat: 28.643, lng: 77.2194 },
    rating: 4.7,
    deliveryAvailable: true,
  },
  {
    category: 'sedan',
    fuelType: 'petrol',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 2200,
    images: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80'],
    location: { lat: 28.5562, lng: 77.1 },
    rating: 4.9,
    deliveryAvailable: true,
  },
  {
    category: 'suv',
    fuelType: 'diesel',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 2800,
    images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'],
    location: { lat: 28.495, lng: 77.0895 },
    rating: 4.9,
    deliveryAvailable: true,
  },
  {
    category: 'suv',
    fuelType: 'diesel',
    transmission: 'manual',
    seats: 4,
    pricePerDay: 3500,
    images: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80'],
    location: { lat: 28.5284, lng: 77.2185 },
    rating: 4.95,
    deliveryAvailable: false,
  },
  {
    category: 'suv',
    fuelType: 'diesel',
    transmission: 'automatic',
    seats: 7,
    pricePerDay: 5500,
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'],
    location: { lat: 28.6315, lng: 77.2167 },
    rating: 4.9,
    deliveryAvailable: true,
  },
  {
    category: 'ev',
    fuelType: 'electric',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 2400,
    images: ['https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80'],
    location: { lat: 28.643, lng: 77.2194 },
    rating: 4.85,
    deliveryAvailable: true,
  },
  {
    category: 'ev',
    fuelType: 'electric',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 3000,
    images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80'],
    location: { lat: 28.5562, lng: 77.1 },
    rating: 4.9,
    deliveryAvailable: true,
  },
  {
    category: 'luxury',
    fuelType: 'petrol',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 8500,
    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80'],
    location: { lat: 28.495, lng: 77.0895 },
    rating: 4.98,
    deliveryAvailable: true,
  },
  {
    category: 'luxury',
    fuelType: 'petrol',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 9200,
    images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80'],
    location: { lat: 28.5284, lng: 77.2185 },
    rating: 4.96,
    deliveryAvailable: true,
  },
  {
    category: 'luxury',
    fuelType: 'diesel',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 10500,
    images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80'],
    location: { lat: 28.6315, lng: 77.2167 },
    rating: 4.99,
    deliveryAvailable: true,
  },
  {
    category: 'bike',
    fuelType: 'petrol',
    transmission: 'manual',
    seats: 2,
    pricePerDay: 800,
    images: ['https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80'],
    location: { lat: 28.643, lng: 77.2194 },
    rating: 4.8,
    deliveryAvailable: false,
  },
  {
    category: 'bike',
    fuelType: 'petrol',
    transmission: 'manual',
    seats: 2,
    pricePerDay: 1100,
    images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80'],
    location: { lat: 28.5562, lng: 77.1 },
    rating: 4.85,
    deliveryAvailable: false,
  },
  {
    category: 'bike',
    fuelType: 'electric',
    transmission: 'automatic',
    seats: 2,
    pricePerDay: 650,
    images: ['https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=800&q=80'],
    location: { lat: 28.495, lng: 77.0895 },
    rating: 4.75,
    deliveryAvailable: true,
  },
  {
    category: 'suv',
    fuelType: 'diesel',
    transmission: 'automatic',
    seats: 7,
    pricePerDay: 3200,
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80'],
    location: { lat: 28.5284, lng: 77.2185 },
    rating: 4.88,
    deliveryAvailable: true,
  },
];

export const SEED_DRIVERS = [
  { licenseNumber: 'DL-04-2021-99812', experience: 9, rating: 4.9, hourlyRate: 180, verificationStatus: 'verified', walletBalance: 12480 },
  { licenseNumber: 'DL-02-2019-44120', experience: 7, rating: 4.8, hourlyRate: 160, verificationStatus: 'verified', walletBalance: 9800 },
  { licenseNumber: 'DL-01-2017-11234', experience: 12, rating: 4.95, hourlyRate: 220, verificationStatus: 'verified', walletBalance: 18500 },
  { licenseNumber: 'DL-05-2023-88712', experience: 5, rating: 4.7, hourlyRate: 150, verificationStatus: 'verified', walletBalance: 6400 },
  { licenseNumber: 'DL-03-2018-33419', experience: 10, rating: 4.85, hourlyRate: 200, verificationStatus: 'verified', walletBalance: 14200 },
  { licenseNumber: 'DL-07-2020-55891', experience: 8, rating: 4.9, hourlyRate: 190, verificationStatus: 'verified', walletBalance: 11100 },
  { licenseNumber: 'DL-08-2021-77123', experience: 6, rating: 4.8, hourlyRate: 170, verificationStatus: 'verified', walletBalance: 8700 },
  { licenseNumber: 'DL-09-2014-99001', experience: 15, rating: 4.98, hourlyRate: 250, verificationStatus: 'verified', walletBalance: 24500 },
  { licenseNumber: 'DL-10-2024-11223', experience: 4, rating: 4.6, hourlyRate: 140, verificationStatus: 'pending', walletBalance: 3200 },
  { licenseNumber: 'DL-11-2016-44556', experience: 11, rating: 4.9, hourlyRate: 210, verificationStatus: 'verified', walletBalance: 16800 },
];

export const seedDatabase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Find or create admin/primary user
    let user = await User.findOne({ email: 'user@vito.com' });
    if (!user) {
      user = await User.findOne();
    }
    if (!user) {
      user = await User.create({
        name: 'VITO Master User',
        email: 'user@vito.com',
        phone: '+919876543210',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'admin',
      });
    }

    // Wipe and seed Vehicles
    await Vehicle.deleteMany({});
    const vehiclesWithOwner = SEED_VEHICLES.map((v) => ({
      ...v,
      ownerId: user!._id,
    }));
    const createdVehicles = await Vehicle.insertMany(vehiclesWithOwner);

    // Wipe and seed Drivers
    await Driver.deleteMany({});
    const driversWithUser = [];
    for (let i = 0; i < SEED_DRIVERS.length; i++) {
      const dData = SEED_DRIVERS[i];
      let driverUser = await User.findOne({ email: `driver${i + 1}@vito.com` });
      if (!driverUser) {
        driverUser = await User.create({
          name: `Driver Partner ${i + 1}`,
          email: `driver${i + 1}@vito.com`,
          phone: `+91987654320${i}`,
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
          role: 'driver',
        });
      }
      driversWithUser.push({ ...dData, userId: driverUser._id });
    }
    const createdDrivers = await Driver.insertMany(driversWithUser);

    // Wipe and seed Sample Trips & Expenses
    await Trip.deleteMany({});
    await Expense.deleteMany({});

    const trip1 = await Trip.create({
      userId: user._id,
      aiPlanData: {
        title: 'Goa Coastal Highway Drive',
        destination: 'Goa, India',
        dates: '12 - 16 Oct 2026',
      },
      participants: [
        { userId: user._id, name: user.name, email: user.email },
        { userId: user._id, name: 'Rahul Sharma' },
        { userId: user._id, name: 'Priya Patel' },
        { userId: user._id, name: 'Alex Mercer' },
      ],
    });

    const exp1 = await Expense.create({
      tripId: trip1._id,
      title: 'Seafood Shack Dinner',
      category: 'food',
      amount: 2400,
      paidBy: user._id,
      paidByName: 'Rahul Sharma',
      splitType: 'equal',
      splits: [
        { participantName: user.name, amount: 600 },
        { participantName: 'Rahul Sharma', amount: 600 },
        { participantName: 'Priya Patel', amount: 600 },
        { participantName: 'Alex Mercer', amount: 600 },
      ],
    });

    const exp2 = await Expense.create({
      tripId: trip1._id,
      title: 'Highway Fuel Refill',
      category: 'fuel',
      amount: 1600,
      paidBy: user._id,
      paidByName: 'Alex Mercer',
      splitType: 'equal',
      splits: [
        { participantName: user.name, amount: 400 },
        { participantName: 'Rahul Sharma', amount: 400 },
        { participantName: 'Priya Patel', amount: 400 },
        { participantName: 'Alex Mercer', amount: 400 },
      ],
    });

    trip1.linkedExpenses = [exp1._id, exp2._id];
    await trip1.save();

    const trip2 = await Trip.create({
      userId: user._id,
      aiPlanData: {
        title: 'Manali Snow & Tunnel Trek',
        destination: 'Manali, Himachal Pradesh',
        dates: '20 - 24 Nov 2026',
      },
      participants: [
        { userId: user._id, name: user.name },
        { userId: user._id, name: 'Sunita M' },
        { userId: user._id, name: 'Gurpreet S' },
      ],
    });

    const trip3 = await Trip.create({
      userId: user._id,
      aiPlanData: {
        title: 'Kerala Backwaters Houseboat Trip',
        destination: 'Alleppey, Kerala',
        dates: '05 - 09 Dec 2026',
      },
      participants: [
        { userId: user._id, name: user.name },
        { userId: user._id, name: 'Ananya D' },
        { userId: user._id, name: 'Deepak V' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Database seeded successfully with 15 vehicles, 10 drivers, and 3 sample trips!',
      counts: {
        vehicles: createdVehicles.length,
        drivers: createdDrivers.length,
        trips: 3,
      },
    });
  } catch (error) {
    next(error);
  }
};
