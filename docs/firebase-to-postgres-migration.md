# Firebase to PostgreSQL Migration Plan

## Overview
Complete migration from Firebase (Auth + Firestore + Storage) to PostgreSQL (Neon DB) with Drizzle ORM, custom JWT authentication, and file storage solution.

## Current System Analysis
- **Authentication**: Firebase Auth with custom claims for roles
- **Database**: Firestore with collections: users, reimbursements, invitations
- **File Storage**: Firebase Storage for receipt uploads
- **Real-time**: Direct Firestore listeners
- **State Management**: Zustand stores with Firebase integration

## Migration Strategy

### Phase 1: Database Setup & Schema Design
1. **Install Dependencies**
   ```bash
   # Core dependencies
   npm install drizzle-orm @neondatabase/serverless
   npm install -D drizzle-kit @types/pg
   
   # Authentication
   npm install jsonwebtoken bcryptjs
   npm install -D @types/jsonwebtoken @types/bcryptjs
   
   # Utilities
   npm install zod dotenv
   ```

2. **Database Schema Design**
   ```sql
   -- Users table (replacing Firebase Auth + Firestore users)
   users:
     - id (uuid, primary key)
     - email (unique, not null)
     - password_hash (not null)
     - display_name
     - nama (full name from profile)
     - kontak (phone)
     - posisi (position)
     - departemen
     - role (Manager/Employee)
     - status (active/inactive/suspended)
     - tanggal_masuk (employment date)
     - registration_status (invited/registered)
     - salary_amount (decimal)
     - salary_frequency (daily/weekly/monthly)
     - limit_reimbursement (jsonb) -- {makan: {limit: 500000, digunakan: 100000}, transport: {...}}
     - created_at
     - updated_at

   -- Sessions table (for JWT refresh tokens)
   sessions:
     - id (uuid)
     - user_id (foreign key)
     - refresh_token (unique)
     - expires_at
     - created_at

   -- Invitations table
   invitations:
     - id (uuid)
     - token (unique)
     - email
     - nama
     - role
     - invited_by_id (foreign key to users)
     - expires_at
     - used_at
     - created_at

   -- Reimbursements table
   reimbursements:
     - id (uuid)
     - employee_id (foreign key)
     - employee_name
     - amount (decimal)
     - expense_type (personal/business)
     - category
     - description
     - receipt_url
     - status (pending/approved/denied/paid)
     - submitted_date
     - manager_id (foreign key, nullable)
     - manager_comments
     - manager_action_date
     - created_at
     - updated_at
   ```

### Phase 2: Authentication System
1. **JWT-based Authentication**
   - Access tokens (15 min expiry)
   - Refresh tokens (7 days expiry)
   - Secure httpOnly cookies
   - Role-based middleware

2. **Auth Endpoints**
   - POST /api/auth/login
   - POST /api/auth/logout
   - POST /api/auth/refresh
   - POST /api/auth/change-password
   - GET /api/auth/me

### Phase 3: Module Migration
1. **User Management**
   - CRUD operations with Drizzle
   - Invitation system with UUID tokens
   - Role management (Manager/Employee)
   - Salary calculations across frequencies
   - Reimbursement limit tracking

2. **Reimbursements**
   - Personal vs Business expense logic
   - Real-time limit validation
   - File upload to local storage (later: S3/Cloudinary)
   - Status workflow with manager actions
   - Usage tracking and reversal logic

### Phase 4: Frontend Updates
1. **Authentication Context**
   - Replace Firebase auth with custom auth
   - Token management
   - Auto-refresh logic

2. **API Client**
   - Axios/Fetch wrapper with auth headers
   - Error handling
   - Token refresh interceptor

3. **State Management**
   - Update Zustand stores
   - Remove Firebase listeners
   - Add polling/refetch logic

## Technical Implementation Details

### Drizzle Schema Example
```typescript
// schema/users.ts
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  // ... other fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Authentication Flow
1. Login: Email/Password → JWT tokens
2. Protected routes: Verify access token
3. Token refresh: Use refresh token
4. Logout: Clear tokens & session

### Data Migration Strategy
1. Export existing Firebase data
2. Transform data format
3. Bulk insert into PostgreSQL
4. Verify data integrity

## Benefits of Migration
- **Cost**: Predictable pricing with Neon
- **Performance**: SQL queries, indexes, joins
- **Flexibility**: Full SQL capabilities
- **Control**: Own your auth system
- **Scalability**: PostgreSQL proven at scale
- **Developer Experience**: Type-safe with Drizzle

## Rollback Plan
- Keep Firebase config (commented)
- Database backups before migration
- Feature flags for gradual rollout
- Parallel run for testing

## Timeline Estimate
- Setup & Schema: 2-3 hours
- Auth System: 3-4 hours
- Module Migration: 4-6 hours
- Frontend Updates: 3-4 hours
- Testing & Fixes: 2-3 hours
- **Total: 14-20 hours**