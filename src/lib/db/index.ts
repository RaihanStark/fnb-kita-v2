import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Lazy load database connection
let dbInstance: ReturnType<typeof drizzle> | null = null;

// Function to get database instance
export function getDb() {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    
    const sql = neon(connectionString);
    dbInstance = drizzle(sql, { schema });
  }
  
  return dbInstance;
}

// Export db getter (for backward compatibility)
export const db = getDb();

// Export all schema for easy access
export * from './schema';