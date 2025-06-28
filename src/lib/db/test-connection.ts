import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
console.log('Environment loaded:', Object.keys(process.env).filter(k => k.includes('DATABASE')));