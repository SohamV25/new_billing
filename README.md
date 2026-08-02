# Billing Dashboard

A modern Billing Dashboard built for managing products, customers, invoices, inventory, quotations, reports, and business analytics.

The project is being developed incrementally using AI-assisted development with OpenCode.

## Overview

This is a production-quality billing application following a modular, feature-based architecture.

Frontend and backend are a single Next.js application. The API is served through Next.js Route Handlers, and the database is accessed exclusively through Prisma.

## Tech Stack

- Next.js (App Router) — full-stack framework
- TypeScript — strict mode
- PostgreSQL — database
- Prisma ORM — type-safe database access
- Better Auth — authentication
- Tailwind CSS — styling
- shadcn/ui — component library
- TanStack Query — server state management
- React Hook Form — forms
- Zod — validation

## Project Structure

```
├── src/
│   ├── app/              # Next.js routes (App Router)
│   │   ├── (app)/        # Authenticated app shell + module pages
│   │   └── api/auth/     # Better Auth route handler
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # App shell (Sidebar, TopBar, BottomNav)
│   │   └── ...           # Shared reusable components
│   ├── config/           # Static configuration (e.g. navigation)
│   └── lib/              # Shared libraries (prisma, auth, utils)
├── prisma/               # Prisma schema + migrations
├── docs/                 # Documentation
├── design_references/    # HTML design references (visual only)
└── .env.example          # Environment variable template
```

## Design

The HTML files inside `design_references/` are visual references only.

They must never be copied directly.

The design language is recreated using our stack. Design tokens are sourced from `design_references/technical_precision/DESIGN.md` and defined in `src/app/globals.css`.

## Getting Started

Requirements:

- Node.js 20.9+ (npm 10+)
- PostgreSQL 14+

Setup:

```bash
# 1. Install dependencies (regenerates the Prisma client automatically)
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env — set DATABASE_URL and BETTER_AUTH_SECRET (openssl rand -base64 32)

# 3. Create the database and apply migrations
createdb billing
npm run db:migrate

# 4. Start the development server
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command                | Description                           |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Start the development server          |
| `npm run build`        | Production build                      |
| `npm run start`        | Start the production server           |
| `npm run lint`         | ESLint                                |
| `npm run typecheck`    | TypeScript type checking              |
| `npm run format`       | Format with Prettier                  |
| `npm run format:check` | Check formatting with Prettier        |
| `npm run db:generate`  | Regenerate the Prisma client          |
| `npm run db:migrate`   | Create/apply a Prisma migration (dev) |
| `npm run db:deploy`    | Apply migrations (production)         |
| `npm run db:push`      | Push schema without a migration       |
| `npm run db:studio`    | Open Prisma Studio                    |

## Development Workflow

Planning → Sprint → Review → Testing → Documentation → Commit

## Current Status

Sprint 0 — project initialization and architecture setup. Complete.

See `docs/project-status.md` for details and `IMPLEMENTATION_PLAN.md` for the roadmap.
