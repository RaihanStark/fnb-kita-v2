# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FnB Kita v2 is a Food & Beverage Management System built with Next.js 15, TypeScript, PostgreSQL, and custom JWT authentication. The project recently migrated from Firebase to PostgreSQL.

## Essential Commands

### Development

```bash
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database Operations

```bash
npm run db:generate      # Generate Drizzle migrations from schema changes
npm run db:push          # Push schema changes directly to database (dev only)
npm run db:migrate       # Run pending migrations
npm run db:studio        # Open Drizzle Studio GUI at https://local.drizzle.studio
npm run db:seed          # Seed database with initial data
```

### Testing

```bash
npm run test:e2e         # Run all Playwright E2E tests
npm run test:e2e:ui      # Run tests with interactive UI
npm run test:e2e:headed  # Run tests in visible browser
npx playwright test tests/auth.spec.ts  # Run specific test file
```

## Architecture

### Core Stack

- **Frontend**: Next.js 15 App Router with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with PostgreSQL (Neon DB), Drizzle ORM
- **Auth**: Custom JWT implementation with access/refresh tokens in httpOnly cookies
- **State**: Zustand for client-side auth state management
- **Validation**: Zod schemas shared between frontend and backend

### Key Directories

- `src/app/api/` - API routes handling authentication and business logic
- `src/lib/db/` - Database schema (schema.ts) and connection setup
- `src/lib/auth/` - JWT utilities and authentication middleware
- `src/components/auth/` - Authentication UI components and guards
- `src/stores/` - Zustand stores (authStore.ts for auth state)
- `drizzle/` - Database migrations
- `tests/` - Playwright E2E tests

### Authentication Flow

1. Login creates JWT access token (15min) and refresh token (7days)
2. Tokens stored in httpOnly cookies
3. Middleware validates tokens on protected routes
4. Auto-refresh when access token expires
5. Two roles: MANAGER (full access) and EMPLOYEE (limited access)

### Database Schema

- **users**: id, username, password_hash, role, created_at, updated_at
- **sessions**: id, user_id, refresh_token, expires_at, created_at

### API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Clear auth cookies
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Testing Approach

- E2E tests cover authentication flows, role-based access, and core features
- Test with predefined users: manager1/employee1 (passwords: Test123!)
- Tests run on multiple browsers and mobile viewports

## Development Guidelines

### Adding New Features

1. Database changes go in `src/lib/db/schema.ts`, then run `npm run db:generate`
2. API routes follow pattern: validate input → check auth → execute → return JSON
3. Use existing UI components from `src/components/ui/`
4. Add Zod schemas for all API inputs/outputs
5. Update E2E tests for new features

### Authentication & Security

- Always use `verifyAuth()` middleware for protected API routes
- Check user roles with `req.user.role` after auth verification
- Never expose sensitive data in API responses
- Use Zod schemas for input validation

### Common Patterns

- API error handling: Return `{ success: false, error: string }`
- Loading states: Use `isLoading` from API hooks
- Form validation: React Hook Form + Zod schemas
- Mobile UI: Check `useIsMobile()` hook for responsive behavior

### Environment Variables

Required in `.env.local`:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
