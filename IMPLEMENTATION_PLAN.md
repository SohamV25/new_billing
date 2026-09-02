# Implementation Plan

## Sprint 0

- Configure project
- Configure dependencies
- Setup Prisma
- Setup authentication
- Setup linting
- Setup formatting
- Setup environment variables
- Setup folder structure

> Status: ✅ Complete (see `docs/project-status.md`).

## Sprint 1

Authentication

- Login
- Logout
- RBAC
- Protected Routes
- Current User

> Status: ✅ Complete (see `docs/project-status.md` and `docs/project-log.md`).

## Sprint 2

Products, Categories & Inventory

- Category CRUD
- Product CRUD
- Inventory (stock movements, low-stock tracking)
- Dedicated Inventory module: `/inventory` page (stock levels + movement-history audit trail) and `GET /api/inventory`, `GET /api/inventory/movements`

> Status: ✅ Complete (see `docs/project-status.md` and `docs/project-log.md`).

## Sprint 3

Customers

- Customer CRUD
- Search
- Customer History

> Status: ✅ Complete (see `docs/project-status.md` and `docs/project-log.md`).

## Sprint 4

Billing

- Quotations — ✅ Complete (see `docs/project-status.md` and `docs/project-log.md`)
- Invoices — ✅ Complete (see `docs/project-status.md` and `docs/project-log.md`)
- Invoice Items — ✅ Complete (part of the invoice engine)
- GST (quotation side done; invoice side done — CGST/SGST intra-state, IGST inter-state, server-computed)
- Payments & status transitions (PARTIALLY_PAID/PAID/OVERDUE/CANCELLED; VOID reserved) — ✅ Complete
- Payment Management (full + partial payments; payment CRUD — create/edit/delete — and refunds; global `/payments` page; customer payment history; shared payments service; balance & status always recomputed from COMPLETED payments; `PAYMENT_UPDATED`/`PAYMENT_DELETED`/`PAYMENT_REFUNDED` audit actions) — ✅ Complete
- Inventory Updates (auto stock-out on billed items, restoration on cancel) — ✅ Complete
- Invoice UX (print/PDF, preview, duplicate, discount/extra-charges, terms, amount-in-words, timeline, share) — ✅ Complete

> Status: ✅ Sprint 4 complete.

## Sprint 5

Users

- User Management
- Roles
- Permissions
- Profile

> Status: ⏳ Pending. Note: Sprint 6 (Reports) was delivered ahead of this sprint; see `docs/project-status.md`.

## Sprint 6

Reports & Dashboard

- Sales Reports — ✅ Complete (delivered as Sprint 5; see `docs/project-status.md` and `docs/project-log.md`)
- Analytics — ✅ Complete for the report module (10 server-aggregated reports: sales, payments, tax, customers, products, inventory, outstanding, top-products, top-customers, revenue-trends; per-report filters, summary cards, pagination, CSV export, print/PDF)
- Charts — Pending (revenue-trends is currently tabular; a chart component can wrap the same endpoint)
- KPIs — ✅ Complete via the per-report summary cards (dashboard-level KPIs remain part of the Dashboard module)

> Status: ✅ Reports complete; Dashboard module pending.

## Sprint 7

Settings & Deployment

- Company Settings
- Backup
- Testing
- Deployment

Every sprint must end with testing, documentation updates, and code review before starting the next sprint.
