import 'dotenv/config';
import { getDb } from './index';
import { users } from './schema';
import { hashPassword } from '../auth/password';

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    const db = getDb();
    
    // Create test manager
    const managerPassword = await hashPassword('password123');
    const [manager] = await db.insert(users).values({
      email: 'manager@test.com',
      passwordHash: managerPassword,
      nama: 'Test Manager',
      displayName: 'Test Manager',
      role: 'Manager',
      status: 'active',
      registrationStatus: 'registered',
    }).returning();

    console.log('✅ Created manager:', manager.email);

    // Create test employee
    const employeePassword = await hashPassword('password123');
    const [employee] = await db.insert(users).values({
      email: 'employee@test.com',
      passwordHash: employeePassword,
      nama: 'Test Employee',
      displayName: 'Test Employee',
      role: 'Employee',
      status: 'active',
      registrationStatus: 'registered',
    }).returning();

    console.log('✅ Created employee:', employee.email);
    
    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seed().then(() => {
  process.exit(0);
});