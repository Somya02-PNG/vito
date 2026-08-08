import dotenv from 'dotenv';
import { connectDB } from './config/db';
import User from './models/User.model';
import Vehicle from './models/Vehicle.model';
import Driver from './models/Driver.model';
import Trip from './models/Trip.model';
import Expense from './models/Expense.model';
import { SEED_VEHICLES, SEED_DRIVERS } from './controllers/seed.controller';

dotenv.config();

const runSeed = async () => {
  try {
    await connectDB();

    let user = await User.findOne({ email: 'user@vito.com' });
    if (!user) user = await User.findOne();

    if (!user) {
      user = await User.create({
        name: 'VITO Master User',
        email: 'user@vito.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'admin',
      });
    }

    await Vehicle.deleteMany({});
    const vehicles = SEED_VEHICLES.map((v) => ({ ...v, ownerId: user!._id }));
    const createdV = await Vehicle.insertMany(vehicles);

    await Driver.deleteMany({});
    const drivers = SEED_DRIVERS.map((d) => ({ ...d, userId: user!._id }));
    const createdD = await Driver.insertMany(drivers);

    console.log(`✅ Seeded ${createdV.length} vehicles and ${createdD.length} drivers successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed Error:', err);
    process.exit(1);
  }
};

runSeed();
