# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.1.8 application using the App Router architecture for a Food & Beverage ("FnB") internal management system. The application provides comprehensive employee management, user administration, and reimbursement tracking capabilities.

## Essential Commands

### Development
- `npm run dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint checks

### Testing
No test framework is currently configured. When adding tests, update this section with the test commands.

## Architecture

### Tech Stack
- **Next.js 15.1.8** with App Router
- **React 19.0.0**
- **TypeScript** with strict mode
- **Tailwind CSS 3.4.1** for styling
- **Turbopack** for fast development builds
- **Shadcn/ui** for reusable, accessible UI components
- **Firebase** for authentication and database
- **Zustand** for state management
- **Material Design 3** design system

### Project Structure
```
src/
├── app/                    # App Router directory
│   ├── layout.tsx         # Root layout with Geist fonts
│   ├── page.tsx           # Home page component
│   ├── globals.css        # Global styles with Tailwind directives
│   ├── dashboard/         # Dashboard pages
│   │   ├── page.tsx      # Main dashboard
│   │   └── users/        # User management
│   ├── auth/             # Authentication pages
│   ├── reimbursements/   # Reimbursement module
│   ├── settings/         # Settings pages
│   └── api/              # API routes
│       ├── auth/         # Authentication endpoints
│       ├── users/        # User management endpoints
│       └── reimbursements/ # Reimbursement endpoints
├── components/           # Reusable components
│   ├── ui/              # Shadcn/ui components
│   ├── auth/            # Authentication components
│   ├── layout/          # Layout components
│   ├── user-management/ # User management components
│   └── reimbursement/   # Reimbursement components
├── stores/              # Zustand state management
│   ├── auth-store.ts    # Authentication state
│   ├── user-management-store.ts # User management state
│   └── reimbursement-store.ts   # Reimbursement state
└── lib/                 # Utility libraries
    └── firebase/        # Firebase configuration
```

### Key Configurations
- **TypeScript path alias**: `@/*` maps to `./src/*`
- **Tailwind content paths**: Configured to scan all files in `src/`
- **CSS Variables**: Dark mode support via CSS custom properties in globals.css

## Development Guidelines

### File Naming
- Use `.tsx` for React components
- Follow Next.js App Router conventions (page.tsx, layout.tsx, etc.)

### Styling
- Use Tailwind CSS utility classes
- CSS variables defined in globals.css for theming
- Dark mode supported via `dark:` prefix
- Utilize Shadcn/ui components for consistent and accessible UI

### Next.js Specific
- Components in `app/` directory are Server Components by default
- Use `"use client"` directive for Client Components
- Metadata can be defined in layout.tsx or page.tsx

## Implemented Features

### 🔐 Authentication System
- **Firebase Authentication** integration
- **Role-based access control** (Manager, Employee)
- **Protected routes** with automatic redirection
- **Login/logout functionality**
- **Password change capabilities**
- **Session persistence**
- **Employee invitation system** with secure token-based registration

### 👥 User Management System (Manager Only)
- **User listing** with search and role filtering
- **Role management** (assign Manager/Employee roles)
- **Comprehensive user details** with editing capabilities
- **Employee invitation system** with manager-defined profiles
- **User information tracking**:
  - Basic info: Name, contact, position, email
  - Employment status: Active, inactive, suspended
  - Role assignment and management
  - Registration status: Invited vs Registered

### 💰 Advanced Salary Management
- **Flexible payment frequencies**: Daily, Weekly, Monthly
- **Dynamic salary calculations** across all frequencies
- **Real-time updates** when changing payment frequency
- **Smart labeling** (e.g., "Gaji per Hari" for daily)
- **Indonesian Rupiah formatting**
- **Automatic breakdown display**:
  - Daily rate calculation
  - Weekly rate calculation  
  - Monthly rate calculation

### 🧾 Integrated Reimbursement System
- **Dual Expense Types**: Personal (limited) vs Business (unlimited)
- **Smart Category Selection**:
  - Personal: Dropdown from user's limit categories
  - Business: Freeform text input for custom categories
- **Real-time Limit Tracking**:
  - Live usage display (e.g., "Rp 100,000 / Rp 500,000")
  - Pre-submission validation to prevent limit violations
  - Automatic usage updates when personal expenses are submitted
- **Intelligent Limit Management**:
  - Usage tracking only for personal expenses
  - Automatic reversal when personal expenses are denied
  - Monthly reset functionality preserved
- **User Integration**: 
  - Categories sourced from user management settings
  - Seamless connection between user limits and expense tracking

### 🎨 Design System
- **Material Design 3** implementation
- **Mobile-first responsive design** (PWA-ready)
- **Orange gradient theme** with consistent branding
- **Custom scrollbar styling**
- **Accessibility-focused components**
- **Native mobile app experience**

### 📱 Layout & Navigation
- **Bottom navigation** for mobile experience
- **Material Design 3 app bar** with flexible actions
- **Protected route wrapper**
- **Role-based feature visibility**
- **Responsive breakpoints** for all screen sizes

### 🗂️ State Management
- **Zustand stores** for all application state
- **Authentication state management**
- **User management state**
- **Reimbursement tracking state**
- **Persistent session handling**

### 🔧 API Infrastructure
- **RESTful API endpoints**
- **Firebase Admin SDK integration**
- **Role-based API protection**
- **Data migration helpers** for backward compatibility
- **Comprehensive error handling**

## Employee Invitation System

### 🎯 Manager-Defined Employee Invitations
- **Manager controls full employee profile** during invitation
- **Pre-defined user information**:
  - Full name (set by manager, not changeable by employee)
  - Email address
  - Role assignment (Manager/Employee)
- **Secure invitation workflow**:
  - UUID-based invitation tokens
  - 7-day expiration period
  - One-time use tokens
- **Simplified employee registration**:
  - Employee only sets password (no name input required)
  - Pre-populated profile information from invitation
  - Automatic account creation with manager-defined details

### 🔄 Invitation Management Features
- **Invitation status tracking**: Pending, Accepted, Expired
- **Registration status monitoring**: Invited vs Registered
- **Invitation link generation** for easy sharing
- **Automatic cleanup** of expired invitations
- **Manager visibility** into invitation status

### 📝 Registration Flow
1. **Manager sends invitation**: Defines employee's full name, email, and role
2. **Employee receives invitation link**: Secure token-based URL
3. **Employee registration page**: Shows pre-defined information (read-only)
4. **Password setup**: Employee only needs to set password
5. **Account creation**: Automatic Firebase user creation with manager-defined profile
6. **Role assignment**: Automatic custom claims based on manager's selection

## Integrated Reimbursement & User Management

### 🔗 System Integration Overview
The reimbursement system is fully integrated with user management, providing intelligent expense tracking that respects individual user limits while maintaining flexibility for business needs.

### 🎯 Dual Expense Type System

#### **Personal Expenses**
- **Limit Enforcement**: Tied to user's `limitReimbursement` settings
- **Category Restrictions**: Only categories defined in user profile are available
- **Usage Tracking**: Automatically updates user's monthly usage counters
- **Validation**: Pre-submission checks prevent limit violations
- **Smart Feedback**: Real-time display of current usage vs. limits

#### **Business Expenses**
- **No Limits**: Unrestricted amounts for legitimate business needs
- **Freeform Categories**: Custom text input for any business category
- **Flexible Processing**: No usage tracking or limit validation
- **Professional Categories**: e.g., "Client Meeting", "Office Supplies", "Business Travel"

### 🔄 Intelligent Limit Management

#### **Real-time Usage Tracking**
```typescript
// Example limit display in form
Current usage: Rp 100,000 / Rp 500,000 (Internet category)
Remaining: Rp 400,000
```

#### **Automatic Updates**
- **Submission**: Immediately increments usage for personal expenses
- **Approval**: No additional changes (usage already counted)
- **Denial**: Automatically reverts usage back to previous amount
- **Monthly Reset**: Existing reset logic continues to work seamlessly

#### **Error Prevention**
- **Pre-validation**: Form prevents submission if limits would be exceeded
- **Clear Messages**: Detailed error explanations with current usage context
- **Smart Suggestions**: Guidance on available budget per category

### 📊 Data Flow Integration

#### **Form Interaction**
1. User selects **expense type** (Personal/Business)
2. **Personal**: Dropdown populated from user's limit categories
3. **Business**: Text input for custom category
4. **Real-time feedback**: Usage display for personal categories
5. **Submission validation**: Limit checks before API call

#### **API Processing**
1. **Personal expenses**: Validate against user limits → Update usage → Create reimbursement
2. **Business expenses**: Skip limit checks → Create reimbursement directly
3. **Status updates**: Adjust usage counters when personal expenses are denied

#### **User Profile Synchronization**
- **Bidirectional sync**: Changes to user limits reflect in reimbursement forms
- **Consistent data**: Single source of truth for category definitions
- **Monthly resets**: Automated usage reset maintains data integrity

### 🛡️ Enhanced Validation & Security

#### **Comprehensive Checks**
- **Category validation**: Personal expenses must use defined categories
- **Limit enforcement**: Cannot exceed monthly allowances
- **User profile verification**: Ensures user limits are properly configured
- **Data consistency**: Validates user profile exists before processing

#### **Error Handling**
- **Graceful degradation**: Handles missing user profiles
- **Detailed feedback**: Specific error messages for different failure scenarios
- **Recovery mechanisms**: Automatic usage reversal for denied personal expenses

### 🎨 Enhanced User Experience

#### **Dynamic UI Adaptation**
- **Context-aware forms**: UI changes based on expense type selection
- **Visual indicators**: Clear differentiation between personal and business expenses
- **Progress visualization**: Usage bars and percentage displays
- **Smart defaults**: Remembers user preferences and common categories

#### **Intelligent Feedback**
- **Real-time validation**: Immediate feedback on limit availability
- **Usage predictions**: Shows impact of current submission on monthly budget
- **Category guidance**: Helps users understand their available expense categories

## Current Implementation Status
This is a fully functional internal management system with:
1. Complete authentication and user management with invitation system
2. Advanced salary management with multiple payment frequencies
3. **Integrated reimbursement system with user limit enforcement**
4. Material Design 3 UI with mobile-first approach
5. Role-based access control throughout the application
6. Secure employee invitation and onboarding workflow

## Important Development Practices
- DO NOT WORK ON MAIN BRANCH! ALWAYS CREATE A NEW BRANCH and PULL REQUEST

## Commit Guidelines
- When doing commit, do not add any AI credit
- After each task completed, always commit

## Mobile App Design
- This is a mobile app (PWA) - ensure design should be like a native mobile app

## Component Guidelines
- Always use UI components from Shadcn rather than custom CSS or basic HTML tags
- Don't manually create a Shadcn UI component, just use `npx shadcn@latest add button` for example

## State Management
- Always use Zustand for state management, never React Context
- Store files should be placed in `/src/stores/`

## API Endpoints

### Authentication Endpoints
- **Login**: `POST /api/auth/login`
- **Logout**: `POST /api/auth/logout`
- **Change Password**: `POST /api/auth/change-password`

### User Management Endpoints (Manager Only)
- **List Users**: `GET /api/users?page=1&limit=10&search=&role=`
- **Get User Details**: `GET /api/users/[userId]`
- **Update User Details**: `PUT /api/users/[userId]`
- **Change User Role**: `POST /api/users/[userId]/role`
- **Invite Employee**: `POST /api/users/invite`
- **Verify Invitation**: `GET /api/invite/[token]/verify`
- **Accept Invitation**: `POST /api/invite/[token]/accept`

### Reimbursement Endpoints
- **List Reimbursements**: `GET /api/reimbursements`
- **Get Reimbursement**: `GET /api/reimbursements/[id]`
- **Create Reimbursement**: `POST /api/reimbursements` (with expense type and limit validation)
- **Update Reimbursement Status**: `PATCH /api/reimbursements/[id]` (with automatic usage adjustments)
- **Upload Receipt**: `POST /api/reimbursements/[id]/receipt`

### Test API Endpoints (Development Only)
- **Set User Role**: `POST /api/test-set-role?email=user@example.com&role=Manager`
  - Available roles: Manager, Employee
- **Get User Role**: `GET /api/test-get-role?email=user@example.com`
  - Returns current role and custom claims for a user

## Development Best Practices
- Always do manual testing after changes to make sure it's working