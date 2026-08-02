# Project Status

## Current Phase

Sprint 0 — project initialization and architecture setup. **Complete.**

The MERN application (React + Vite + Express + MongoDB) has been fully replaced by the documented target stack: Next.js + TypeScript + Tailwind + shadcn/ui + Prisma + PostgreSQL + Better Auth + TanStack Query + React Hook Form + Zod.

## Current State

- Architecture: Single Next.js 16 application (App Router, Turbopack) at the repo root. Server-side work happens through Next.js Route Handlers; the browser never talks to a separate API server.
- Database: PostgreSQL via Prisma ORM 7 (driver adapter `@prisma/adapter-pg`). Schema defines the full data model for all planned modules (users, roles/permissions, customers, categories, products, inventory + stock movements, quotations, invoices, payments, company settings, audit logs). Initial migration `0_init` is generated and ready to apply.
- Authentication: Better Auth 1.6 wired with the Prisma adapter. API route at `app/api/auth/[...all]` and browser client at `lib/auth-client.ts`. Email/password enabled; login UI and RBAC are Sprint 1 work.
- UI foundation: Design tokens from `design_references/technical_precision/DESIGN.md` are encoded in `globals.css` (dark-only, Inter + Geist). App shell (Sidebar, TopBar, BottomNav) matches the design references. shadcn/ui components installed (button, input, card, table, dialog, form, badge, dropdown, select, pagination, empty-state, etc.).
- State: TanStack Query provider configured; React Hook Form + Zod + shadcn `form` available for forms.
- Tooling: ESLint (eslint-config-next), Prettier (with tailwind plugin), strict TypeScript, path alias `@/*`.
- Navigation: `config/navigation.ts` drives the sidebar/bottom nav. Pages for planned modules currently render a shared "coming soon" placeholder; only `/` and `/api/auth/*` are real.

## Documentation

Every session must read before making changes:

- AGENTS.md — agent rules and technology requirements
- IMPLEMENTATION_PLAN.md — sprint roadmap
- README.md — project overview and setup
- docs/project-status.md — this file
- docs/architecture.md, docs/tech-stack.md, docs/database.md
- docs/business-rules.md, docs/ui-guidelines.md, docs/coding-standards.md

## Design Reference

The `design_references/` folder contains HTML mockups and screenshots (dark slate theme, top app bar + bottom nav, Inter + Geist, accent `#8AB4F8`) and `technical_precision/DESIGN.md` (token spec). These are visual inspiration only. Never copy HTML directly — recreate the design using the project stack. The tokens are already mapped into `src/app/globals.css`.

## Sprint 0 Deliverables

- Replaced the Antigravity-generated MERN app with the documented Next.js stack (approved scope).
- Removed committed secrets and dependencies: `server/.env` (real MongoDB credentials) and 1520 `server/node_modules/` files were untracked and the `server/`/`client/` trees deleted. The old app remains recoverable in git history (commits `b5633c2`…`b5d5ee1`).
- Scaffolded Next.js 16 + TypeScript (strict) + Tailwind 4 at the repo root.
- Configured Prisma 7: schema for all core entities, `prisma.config.ts`, generated client, initial migration.
- Wired Better Auth (Prisma adapter, route handler, client).
- Installed and configured shadcn/ui components and the design system.
- Added ESLint + Prettier, npm scripts, `.env.example`, path aliases.
- Built the app shell foundation and shared components (EmptyState, PageHeader).

## Completed

- Sprint 0 setup: project, dependencies, Prisma, authentication wiring, linting, formatting, environment variables, folder structure.

## Pending

- Apply the initial migration once a PostgreSQL instance is available (`npm run db:migrate`).
- Sprint 1: authentication (login, logout, RBAC, protected routes, current user).
- Sprint 2+: users/roles/permissions, products/categories/inventory, customers, quotations, billing, payments, reports, settings, testing, deployment.

## Known Issues / Notes

- **No local PostgreSQL instance is running** and no `docker` CLI was found. Migrations were generated but not applied. Provision Postgres, set `DATABASE_URL`, then run `npm run db:migrate`.
- **MongoDB Atlas credentials are still present in git history** (commits before the migration). They belong to a decommissioned database; if the account is still active, rotate the credentials. Optionally purge history with `git filter-repo` (requires approval — destructive).
- **npm is the package manager** (documented in `docs/tech-stack.md`). The planned pnpm could not be installed globally without sudo on this machine, so npm is used. If pnpm is later preferred, install it and re-run `npm install` (or delete `node_modules` + `package-lock.json`) to migrate.
- npm 11's script-allowlist policy requires `.npmrc` (`allow-scripts=true`) and `allowScripts` entries in `package.json` for `prisma`, `sharp`, etc. postinstall scripts.
- Better Auth is wired but not exercised (no DB). Login UI is intentionally out of scope for Sprint 0 (Sprint 1).
- `radix-ui` umbrella package is used by the shadcn/ui "radix" style.
- Zod 4 and `@hookform/resolvers` 5 are used (current major versions).
- Old MERN business logic (GST calculations, amount-in-words, A4 invoice template, customer seed data) was not ported — it is recoverable from git history and will be rebuilt properly (Prisma `Decimal`, Zod-validated, tested) in the billing sprints.

## Next Recommended Task

Sprint 1 (Authentication): login page, logout, protected routes, and current-user wiring using the Better Auth setup already in place. Requires a PostgreSQL database first.

## Notes for Future AI Sessions

- Preserve working code; improve existing implementations before rewriting.
- Avoid unnecessary refactoring.
- Follow AGENTS.md and read the project documentation before modifying code.
- Implement one feature at a time; stop after each feature for review.
- Do not assume requirements; never modify unrelated files.
- Update this file at the end of every completed sprint.
