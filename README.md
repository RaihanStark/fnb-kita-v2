# FnB Kita (v2)

A modern, full-stack Food & Beverage management system and Point of Sale (POS) designed for restaurants, cafes, and food stalls.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL (Drizzle ORM)**.

## Screenshots

| Dashboard Overview | POS Transactions |
| :---: | :---: |
| ![Dashboard Overview](docs/screenshots/home.png) | ![Transactions](docs/screenshots/transaksi.png) |
| **Opening Shift Procedure** | **Closing Shift & Cash Reconciliation** |
| ![Opening Procedure](docs/screenshots/opening.png) | ![Closing Procedure](docs/screenshots/closing.png) |
| **Inventory & Stock Tracking** | **Monthly Reports & Analytics** |
| ![Stock Tracking](docs/screenshots/persediaan.png) | ![Reports](docs/screenshots/laporan.png) |

## Features

- **Store Shift Procedures**:
  - **Opening Checklist**: Cash float counting, equipment checks, and operational readiness.
  - **Closing & Reconciliation**: End-of-day register balancing, cash count breakdown, waste recording, and security checklists.
- **Point of Sale (POS)**: Fast order taking, itemized carts, dynamic totals, and multi-channel payment recording.
- **Product & Menu Management**: Catalog management with pricing, category tags, and variant options.
- **Inventory & Stock Depletion**: Real-time stock tracking with automatic product synchronization and discrepancy alerts.
- **Procurement & Purchases**: Vendor purchase history, raw ingredient cost tracking, and supplier logs.
- **Reporting & Business Analytics**: Monthly and daily revenue metrics, sales volume, profit margins, and waste tracking.
- **Role-Based Access Control (RBAC)**: Custom JWT authentication with distinct `MANAGER` and `EMPLOYEE` permissions and protected layouts.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Radix UI primitives, Lucide icons
- **Database & ORM**: PostgreSQL (Neon serverless / local Postgres) + Drizzle ORM
- **Authentication**: Custom JWT (access/refresh tokens in HTTP-only cookies) + bcryptjs
- **State & Forms**: Zustand, React Hook Form, Zod validation
- **Testing**: Playwright E2E test suite

## Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/RaihanStark/fnb-kita-v2.git
cd fnb-kita-v2
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and add your database URL:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL=postgresql://user:password@localhost:5432/fnbkita
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
```

### 3. Database Migration & Seed

```bash
# Push schema migrations
npm run db:push

# Seed default manager and employee accounts
npm run db:seed
```

Default seeded credentials:
- **Manager**: `manager1` / `Test123!`
- **Employee**: `employee1` / `Test123!`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Testing

Run Playwright end-to-end tests:

```bash
npm run test:e2e
```

## License

MIT
