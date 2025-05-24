# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.1.8 application using the App Router architecture. The project appears to be version 2 of a Food & Beverage ("FnB") application, currently in its initial template state.

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

### Project Structure
```
src/
└── app/              # App Router directory
    ├── layout.tsx    # Root layout with Geist fonts
    ├── page.tsx      # Home page component
    └── globals.css   # Global styles with Tailwind directives
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

## Current State
This is a fresh Next.js template with no business logic implemented. When building features:
1. Maintain the App Router structure
2. Leverage Server Components where possible
3. Use the established Tailwind CSS setup
4. Follow TypeScript strict mode requirements
5. Prefer Shadcn/ui components for UI consistency

## Important Development Practices
- DO NOT WORK ON MAIN BRANCH! ALWAYS CREATE A NEW BRANCH and PULL REQUEST

## Commit Guidelines
- When doing commit, do not add any AI credit

## Mobile App Design
- This is a mobile app (PWA) - ensure design should be like a native mobile app

## Component Guidelines
- Always use UI components from Shadcn rather than custom CSS or basic HTML tags

## Test API Endpoints (Development Only)
- **Set User Role**: `POST /api/test-set-role?email=user@example.com&role=Manager`
  - Available roles: Manager, Employee
- **Get User Role**: `GET /api/test-get-role?email=user@example.com`
  - Returns current role and custom claims for a user