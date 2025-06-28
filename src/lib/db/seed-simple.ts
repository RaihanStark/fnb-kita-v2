import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { hashPassword } from '../auth/password';

async function seed() {
  console.log('🌱 Starting seed...');
  
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  try {
    // Create test manager
    const managerPassword = await hashPassword('password123');
    const [manager] = await db.insert(schema.users).values({
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
    const [employee] = await db.insert(schema.users).values({
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
    process.exit(0);
  } catch (error: any) {
    if (error.message?.includes('duplicate key')) {
      console.log('ℹ️  Users already exist, skipping seed');
      process.exit(0);
    }
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();