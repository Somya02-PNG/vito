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
        phone: '+919876543210',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'admin',
      });
    }

    await Vehicle.deleteMany({});
    const vehicles = SEED_VEHICLES.map((v) => ({ ...v, ownerId: user!._id }));
    const createdV = await Vehicle.insertMany(vehicles);

    await Driver.deleteMany({});
    const drivers = [];
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
      drivers.push({ ...dData, userId: driverUser._id });
    }
    const createdD = await Driver.insertMany(drivers);

    console.log(`✅ Seeded ${createdV.length} vehicles and ${createdD.length} drivers successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed Error:', err);
    process.exit(1);
  }
};

runSeed();
