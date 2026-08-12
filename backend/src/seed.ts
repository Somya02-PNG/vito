import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db';
import User from './models/User.model';
import Vehicle from './models/Vehicle.model';
import Driver from './models/Driver.model';
import Trip from './models/Trip.model';
import Expense from './models/Expense.model';
import { SEED_VEHICLES, SEED_DRIVERS } from './controllers/seed.controller';

dotenv.config();

const ADMIN_DEV_PASSWORD =
  process.env.VITO_ADMIN_DEV_PASSWORD ||
  process.env.ADMIN_SEED_PASSWORD ||
  'vito@2026';

// Read ADMIN_TEAM_EMAILS from environment variable or default to 3 team leads
const envEmails = process.env.ADMIN_TEAM_EMAILS
  ? process.env.ADMIN_TEAM_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  : [];

const ADMIN_EMAILS = envEmails.length > 0
  ? envEmails
  : ['somyatiwari203@gmail.com', 'harshmishra200529@gmail.com', 'amritawasthi0416@gmail.com'];

const NAME_MAP: Record<string, { name: string; phone: string }> = {
  'somyatiwari203@gmail.com': { name: 'Somya Tiwari', phone: '+919876500001' },
  'harshmishra200529@gmail.com': { name: 'Harsh Mishra', phone: '+919876500002' },
  'amritawasthi0416@gmail.com': { name: 'Amrit Awasthi', phone: '+919876500003' },
};

const runSeed = async () => {
  try {
    await connectDB();

    // ─── 1. Seed / Sync Authorized Admin Team Lead Accounts ───────────────────
    let primaryAdminUser: any = null;

    for (const email of ADMIN_EMAILS) {
      const info = NAME_MAP[email] || {
        name: email.split('@')[0].toUpperCase(),
        phone: '+919876599999',
      };

      let user = await User.findOne({ email });
      const adminHash = await bcrypt.hash(ADMIN_DEV_PASSWORD, 12);

      if (!user) {
        user = await User.create({
          name: info.name,
          email,
          phone: info.phone,
          passwordHash: adminHash,
          role: 'admin',
          status: 'active',
          partnerType: null,
        });
        console.log(`✅ Admin account created: ${email}`);
      } else {
        user.role = 'admin';
        user.status = 'active';
        user.passwordHash = adminHash;
        await user.save();
        console.log(`ℹ️  Admin account verified & synced: ${email}`);
      }

      if (!primaryAdminUser) {
        primaryAdminUser = user;
      }
    }

    // ─── 2. Disable / Downgrade Old Development admin@vito.com Account ────────
    const oldDevAdmin = await User.findOne({ email: 'admin@vito.com' });
    if (oldDevAdmin && oldDevAdmin.role === 'admin') {
      oldDevAdmin.role = 'customer';
      await oldDevAdmin.save();
      console.log(`🔒 Old development account admin@vito.com downgraded to customer role.`);
    }

    // ─── 3. Seed Test Customer ────────────────────────────────────────────────
    let customerUser = await User.findOne({ email: 'customer@vito.com' });
    const customerHash = await bcrypt.hash('Customer@2026', 12);
    if (!customerUser) {
      customerUser = await User.create({
        name: 'Test Customer',
        email: 'customer@vito.com',
        phone: '+919876543210',
        passwordHash: customerHash,
        role: 'customer',
        status: 'active',
        partnerType: null,
      });
      console.log(`✅ Test customer created: customer@vito.com`);
    } else {
      customerUser.passwordHash = customerHash;
      customerUser.role = 'customer';
      customerUser.status = 'active';
      await customerUser.save();
    }

    // ─── 3b. Seed Test Rental Partner ─────────────────────────────────────────
    let rentalPartnerUser = await User.findOne({ email: 'rentalpartner@vito.com' });
    const partnerHash = await bcrypt.hash('Partner@2026', 12);
    if (!rentalPartnerUser) {
      rentalPartnerUser = await User.create({
        name: 'VITO Fleet Rentals',
        email: 'rentalpartner@vito.com',
        phone: '+919876599887',
        passwordHash: partnerHash,
        role: 'partner',
        partnerType: 'rental_partner',
        status: 'active',
      });
      console.log(`✅ Test rental partner created: rentalpartner@vito.com`);
    } else {
      rentalPartnerUser.passwordHash = partnerHash;
      rentalPartnerUser.role = 'partner';
      rentalPartnerUser.partnerType = 'rental_partner';
      rentalPartnerUser.status = 'active';
      await rentalPartnerUser.save();
    }

    // ─── 4. Seed Vehicles & Drivers ───────────────────────────────────────────
    await Vehicle.deleteMany({});
    const vehicles = SEED_VEHICLES.map((v) => ({ ...v, ownerId: primaryAdminUser!._id }));
    const createdV = await Vehicle.insertMany(vehicles);

    await Driver.deleteMany({});
    const drivers = [];
    for (let i = 0; i < SEED_DRIVERS.length; i++) {
      const dData = SEED_DRIVERS[i];
      let driverUser = await User.findOne({ email: `driver${i + 1}@vito.com` });
      const driverHash = await bcrypt.hash('Driver@2026', 12);
      if (!driverUser) {
        driverUser = await User.create({
          name: `Driver Partner ${i + 1}`,
          email: `driver${i + 1}@vito.com`,
          phone: `+9198765432${i.toString().padStart(2, '0')}`,
          passwordHash: driverHash,
          role: 'partner',
          partnerType: 'driver',
          status: 'active',
        });
      } else {
        driverUser.passwordHash = driverHash;
        driverUser.role = 'partner';
        driverUser.partnerType = 'driver';
        driverUser.status = 'active';
        await driverUser.save();
      }
      drivers.push({ ...dData, userId: driverUser._id });
    }
    const createdD = await Driver.insertMany(drivers);

    console.log(`✅ Seeded ${createdV.length} vehicles and ${createdD.length} drivers successfully!`);
    console.log(`\n─── Seed Status ─────────────────────────────────`);
    console.log(`Authorized Admin Accounts Configured: ${ADMIN_EMAILS.length}`);
    console.log(`Emails: ${ADMIN_EMAILS.join(', ')}`);
    console.log(`Database sync completed safely.`);
    console.log(`────────────────────────────────────────────────\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed Error:', err);
    process.exit(1);
  }
};

runSeed();
