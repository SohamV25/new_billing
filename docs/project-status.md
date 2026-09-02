# Project Status

## Current Phase

**UI/UX Redesign — Complete.** Phases 1–4 of the comprehensive production-quality redesign have been implemented and verified:

- **Phase 1:** Bug fixes (quotation GST, products auth guard, nav active state), dead import cleanup, shared helpers extraction, topbar simplification
- **Phase 2:** KpiCard unification, status badge CSS variables, entity combobox design tokens, missing CSS variables added
- **Phase 3:** Mobile-first touch targets (buttons h-9, inputs h-9, selects h-9), bottom nav optimized to 5 items
- **Phase 4:** Dedicated `/profile` page with profile header, account settings, and security section

All existing functionality preserved. `lint`, `typecheck`, and `next build` pass (0 errors). Server running on `http://localhost:3000`.

**Billing Workflow Polish** — The end-to-end billing workflow has been polished with 7 improvements: (1) Product barcode support (schema migration, search, form field), (2) GST rate fix — removed hardcoded 18% override on customer change (rate now always comes from product catalog), (3) Product combobox now shows stock levels with badges (out-of-stock/low-stock indicators), (4) SKU and barcode displayed in product combobox sublabels, (5) Invoice form now includes Order Number, Order Date, DC Number, and DC Date fields (server + client), (6) Quantity vs stock inline warnings in invoice form (exceeds stock / fractional quantity), (7) EntityCombobox refactored from `features/quotations/` to shared `components/entity-combobox.tsx` with enhanced `badge` prop for stock status display.

**Billing Workflow & UI Stabilization** — Production-quality stabilization pass covering 4 priorities: (1) **Invoice GST** — three separate editable CGST/SGST/IGST rate fields per line item with auto-calculation based on state comparison (intra-state: CGST 9% + SGST 9%; inter-state: IGST 18%); server validation updated to accept three rates; `computeTotals` uses client-provided rates directly; invoice summary shows tax breakdown with Total Tax row; per-item GST section with bordered container and line total display. (2) **Invoice UI** — professional billing layout with improved form dialog (wider `sm:max-w-4xl`, bordered GST section, line total display), detail page action bar stacks on mobile (`flex-col sm:flex-row`), payments table responsive (Method/Reference/Status/Recorded-by hidden on smaller breakpoints). (3) **Dashboard Responsiveness** — KPI cards use `grid-cols-1` base with responsive breakpoints, value text scales `text-headline-md sm:text-headline-lg`, icon shrinks with `shrink-0`, sub text truncates; charts grid uses explicit `grid-cols-1` base; activity feeds grid uses explicit `grid-cols-1` base; `low-stock-panel` progress bar uses `w-20 flex-1 sm:w-32`; `top-list` removes fixed `minWidth: 320px`; `top-list` rewritten with typed accessor functions to fix union-type indexing errors. (4) **General UI Polish** — fixed 4 pre-existing TypeScript errors in dashboard files (`dashboard-view.tsx` subTone type, `low-stock-panel.tsx` StockStatusBadge props, `top-list.tsx` union indexing, `dashboard.ts` missing import + async-in-transaction + implicit any); removed unused `isIntraState` from invoice service; removed unused `DashboardDataInternal` from dashboard service; removed unused state variables from users view; settings users/audit-log tables responsive with hidden columns; settings tabs scrollable with `scrollbar-hide`.

**Invoice Printing & Final Print Layout** — The invoice print document has been rewritten to match the approved reference HTML (`design_references/bill_preview/print.html`) exactly: bordered A4 frame, centered "TAX INVOICE" header, centered company header with name/address/phone/email/GST, credentials grid (buyer details 1.2fr | bill details 0.8fr with 2×3 metadata grid), 12-column product table with CGST/SGST/IGST % and Amt sub-columns, 8-row fixed layout, end-bill summary grid (amount in words, bank details, assurance/signature, amount summary with conditional CGST/SGST/IGST/extra rows), and footer (place of supply + authorized signature). All dynamic fields populated from invoice data. "Aurangabad" replaced with "Chhatrapati Sambhajinagar" in bank details and place of supply. Print CSS updated with comprehensive `@media print` rules for A4 sizing, bordered table cells, repeating table headers, page-break avoidance, and hidden UI controls. `lint`, `typecheck`, and `next build` all pass.

Sprint 5 — Reports & Business Insights is **complete**: a `/reports` module with 10 server-aggregated reports (sales, payments, tax, customers, products, inventory, outstanding, top-products, top-customers, revenue-trends), per-report filters, summary cards, pagination, CSV export, and a print/PDF page — admin-only via the existing `reports:view` permission (no RBAC/seed change). Quotations, the invoice engine (CRUD, payments, status lifecycle, inventory updates, professional invoice document), and the Payment Management module remain complete from Sprint 4.

Quotation CRUD, GST-aware line items, status lifecycle, duplication, conversion to invoices, a printable detail page, and the full invoice engine (CRUD, server-computed totals, DRAFT→PENDING→PARTIALLY_PAID/PAID→CANCELLED lifecycle, payment recording with system-computed balances, OVERDUE computed on read, and automatic stock-out/restoration via StockMovement) are implemented on top of the Sprints 0–3 foundation, reusing the established API conventions (`requireApiPermission`, service layer, `fromError`, feature hooks).

## Current State

- **Architecture:** Single Next.js 16 application (App Router, Turbopack) at the repo root. Server-side work happens through Next.js Route Handlers; the browser never talks to a separate API server.
- **Database:** PostgreSQL via Prisma ORM 7 (driver adapter `@prisma/adapter-pg`). Schema defines the full data model for all planned modules. Migrations `0_init`, `add_category_audit_actions`, `20260802094000_add_product_delete_audit`, `20260802095000_add_customer_delete_audit`, `20260802101627_add_quotation_status_and_audit`, `20260802131951_add_invoice_update_delete_audit`, `20260802133400_add_invoice_due_date_and_lifecycle_audit`, `20260802134636_add_invoice_terms`, `20260802140451_add_payment_crud_audit`, `20260803110000_add_invoice_item_discount`, `20260803161746_add_invoice_item_discount`, and `20260803172220_add_product_barcode` are **applied** to the local PostgreSQL instance (`localhost:5432/billing`), and the seed has run (ADMIN + STAFF roles, 7 permissions, admin user, one sample category "Beverages").
- **Authentication (Sprint 1):**
  - Login page at `/login` (`src/app/(auth)/login/page.tsx`) with React Hook Form + Zod validation and Better Auth `signIn.email`. Already-authenticated visitors are redirected to `/`.
  - Logout through the account menu in the top bar (`src/components/layout/user-menu.tsx`), which also shows the current user's name, email, and role.
  - Protected routes: the `(app)` layout (`src/app/(app)/layout.tsx`) requires a session via `requireUser()` and redirects to `/login`; all app routes are server-rendered on demand (`force-dynamic`).
  - Session handling: `getCurrentUser()` in `src/lib/auth/current-user.ts` resolves the session, role, and permissions from Prisma on the server and passes them into the app shell.
  - RBAC: role/permission constants in `src/config/rbac.ts`, DB-driven role + permission resolution, `can`/`requirePermission` guard helpers, and permission-filtered sidebar/bottom nav (Settings is admin-only). Roles and permissions are seeded by `prisma/seed.ts` (`npm run db:seed`).
- **UI foundation:** Design tokens in `globals.css` (dark-only, Inter + Geist). **Fixed a Sprint 0 gap:** the typography scale (`text-headline-*`, `text-body-*`, `text-label-md`, `text-mono-sm`) from `design_references/technical_precision/DESIGN.md` was referenced but never defined in the theme; it is now wired in.
- **Tooling:** ESLint, Prettier, strict TypeScript, path alias `@/*`. `lint`, `typecheck`, `format:check`, and `next build` all pass.
- **Products, categories & inventory (Sprint 2):**
  - `/products` page with Products and Categories tabs (`src/features/products/`), populated from Route Handlers via TanStack Query.
  - API conventions: route handlers are thin controllers delegating to `src/lib/services/*`; shared Zod schemas live in `src/lib/validations/*`; responses are consistent `{ data }` / `{ error: { code, message, details? } }`; business failures map through `DomainError` + `fromError` (Prisma P2002 → 409, P2025 → 404).
  - All write/read endpoints are gated by the existing `products:view` permission via `requireApiPermission` (no new RBAC permission).
  - Product creation opens the `Inventory` row and an opening `StockMovement` in one transaction; stock adjustments (`IN`/`OUT`/`ADJUSTMENT`) run in a transaction, can never drive stock negative, always record a movement, and optionally update the low-stock threshold.
  - Deleting a category cascade-soft-deletes its active products so historical invoices/quotations keep their references.
  - Audit logging: `src/lib/audit.ts` `logAudit` records `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_DELETED` (added during live verification), `INVENTORY_ADJUSTMENT`, and (since the audit-gap pass) `CATEGORY_CREATED`, `CATEGORY_UPDATED`, `CATEGORY_DELETED` (best-effort, never fails the primary operation).
  - Client layer: `apiFetch` + `ApiError` in `src/lib/client/api.ts`, typed feature API in `src/features/products/api.ts`, TanStack Query hooks in `src/features/products/hooks.ts`.
  - Live verification: the categories API was exercised end-to-end against PostgreSQL (`npm run build` + `next start`): unauthenticated requests 401, create 201, invalid input 422, duplicate name 409, search, pagination, single get, PATCH update, DELETE soft-delete (subsequent GET 404), and all three category audit actions written to `AuditLog`.
  - Live verification (products & inventory): the products API was exercised end-to-end against PostgreSQL the same way: unauthenticated 401, create 201 with the `Inventory` row + opening `StockMovement` created in one transaction, duplicate `(category, name)` 409, invalid input 422, invalid JSON 400, search (name/SKU/HSN), category filter, pagination, single GET, PATCH update, PATCH to a non-existent category 404, stock `IN`/`OUT`/`ADJUSTMENT` with movements recorded and user attribution, negative-stock rejection 422 (`NEGATIVE_STOCK`), DELETE soft-delete (row kept, subsequent GET 404, excluded from lists), and all product/inventory audit actions written to `AuditLog`. This surfaced one gap — product deletion was not audited — which was fixed by adding `PRODUCT_DELETED` to the `AuditAction` enum (migration `20260802094000_add_product_delete_audit`) and wiring `logAudit` into the product DELETE route handler, mirroring the category convention. QA test data was soft-deleted via the app's own APIs, leaving only the seeded sample data.

- **Customers (Sprint 3):**
  - `/customers` page (`src/app/(app)/customers/page.tsx`) with debounced search, city/state Select filters, paginated table (name, phone, city, state, GSTIN, invoice/quote counts), row dropdown (View/Edit/Delete), and empty/error/loading states.
  - `/customers/[id]` detail page with profile card, invoice/quote stat cards, an activity placeholder reserved for the billing sprint, and edit/delete actions.
  - API routes `GET/POST /api/customers` and `GET/PATCH/DELETE /api/customers/[id]`, all gated by the existing `customers:view` permission; POST/PATCH/DELETE write `CUSTOMER_CREATED`/`CUSTOMER_UPDATED`/`CUSTOMER_DELETED` audit entries (best-effort `logAudit`).
  - Service layer `src/lib/services/customers.ts` (soft delete via `deletedAt` preserves invoice/quote references), shared Zod schemas in `src/lib/validations/customer.ts`, and feature client layer `src/features/customers/{types,api,hooks}.ts`.
  - Live verification against PostgreSQL (running dev server): unauthenticated 401, create 201, invalid input 422, search/city filter/pagination, single GET, PATCH 200, DELETE soft-delete (subsequent GET 404, excluded from lists), unknown id 404, and `CUSTOMER_CREATED`/`CUSTOMER_UPDATED`/`CUSTOMER_DELETED` audit rows confirmed. QA test data was removed afterward.
- **Quotations (Sprint 4, part 1):**
  - `/quotations` page (`src/app/(app)/quotations/page.tsx`) with debounced search, status Select filter (Draft/Sent/Accepted/Rejected/Expired/Converted), paginated table (quotation no, customer, date, valid-until, status badge, total), and a row dropdown (Duplicate / Edit / Convert to invoice / Delete).
  - `/quotations/[id]` detail page (server component loads `CompanySettings`): bill-to/from cards, line-items table, totals + notes, and Print / Duplicate / Convert / Edit / Delete actions with confirmation dialogs. Print is supported via `@media print` CSS (`[data-print-area]`, A4 monochrome) with the app chrome hidden.
  - Status lifecycle: DRAFT/SENT/ACCEPTED/REJECTED are user-settable; EXPIRED is computed on read when `validUntil` passes; CONVERTED is set only by conversion. Converted quotations can no longer be edited/deleted (409).
  - GST: per-item rate is split into CGST + SGST (rate/2) for intra-state customers or charged as IGST for inter-state customers, comparing the customer's `state` with the company settings' `state`. Totals are always system-computed.
  - Convert to invoice creates a DRAFT invoice copying customer/items/totals and marks the source CONVERTED; it never modifies inventory (stock is deducted when the invoice is finalized, not on conversion).
  - API routes `GET/POST /api/quotations`, `GET/PATCH/DELETE /api/quotations/[id]`, `POST /api/quotations/[id]/duplicate`, `POST /api/quotations/[id]/convert`, all gated by the existing `quotations:view` permission; write ops audit `QUOTATION_CREATED`/`QUOTATION_UPDATED`/`QUOTATION_DELETED`/`QUOTATION_CONVERTED` (best-effort `logAudit`).
  - Service layer `src/lib/services/quotations.ts`, shared Zod schemas in `src/lib/validations/quotation.ts`, and feature client layer `src/features/quotations/{types,api,hooks}.ts`. Document numbers sequence from `CompanySettings` (`nextQuotationNo`/`nextInvoiceNo`).
  - Verification: `lint`, `typecheck`, `format:check`, and `next build` pass; migration `20260802101627_add_quotation_status_and_audit` is applied (`prisma migrate status` → up to date). Live browser E2E of the quotations flow is still pending.
- **Invoices (Sprint 4, parts 2, 3 & 4):**
  - `/invoices` page (`src/app/(app)/invoices/page.tsx`) with debounced search, status Select filter (all statuses incl. OVERDUE), paginated table (invoice no, customer, date, due date, status badge, total, paid), and a row dropdown whose actions follow the lifecycle: Finalize (DRAFT only), Record payment (PENDING/PARTIALLY_PAID/OVERDUE), Edit/Delete (DRAFT only), Cancel (unpaid PENDING/OVERDUE). Invoice numbers link to the detail page.
  - `/invoices/[id]` detail page (server component loads `CompanySettings` incl. `logoUrl`): the main content is the shared `InvoicePrintDocument` (white A4-style "paper"), with a `print:hidden` toolbar (Print, Share/Export menu, Duplicate, Record payment / Finalize / Edit / Cancel / Delete) and `print:hidden` Payments + Activity sections below.
  - Professional invoice document (`src/features/invoices/invoice-print-document.tsx`, server-compatible, light-mode regardless of app theme): company header with optional logo, "TAX INVOICE" title, bill-to + details grid (invoice/due date plus optional O.No/O.Date/D.C.No/D.C.Date), full line-items table (GST% and GST amount + line total), amount-in-words, notes, terms & conditions, totals block (subtotal, CGST/SGST/IGST, discount or extra charges, paid/balance rows, bold total), signature lines, and a footer strip. Single shared component renders identically on the detail page, the preview page, and print → guaranteed parity.
  - **Print / PDF (print-to-PDF, no new dependencies):** printing from the detail page uses `window.print()`; "Download PDF"/"Preview" open the dedicated server page `/invoices/[id]/print` (`?autoprint=1` auto-triggers the browser print dialog, where the user picks "Save as PDF"). Same component + server DTO as the screen.
  - **Duplicate:** `POST /api/invoices/[id]/duplicate` copies customer, dates, order/dc references, totals, extra charges, notes, terms, and line items under a fresh number as a DRAFT (`INVOICE_CREATED` audit); detail-page Share menu + dropdown item navigate to the copy.
  - **Discount / extra charges & terms:** optional `extraCharges` (negative = discount, with `extraReason` label), `terms`, and server-computed `amountInWords` (Indian system: crore/lakh/thousand, paise-aware, `src/lib/number-to-words.ts`). Stored on `Invoice` via migration `20260802134636_add_invoice_terms`. The form has an "Extra charges / discount" section + Terms textarea with a live (non-authoritative) summary; the server always recomputes totals.
  - **Per-item discount:** Each line item supports a `discount` field that reduces the taxable amount before GST computation. The form shows the discounted amount per line (`qty × unitPrice - discount`) and the total discount in the summary. Migration `20260803110000_add_invoice_item_discount` adds the column; `20260803161746_add_invoice_item_discount` makes it NOT NULL.
  - **Activity timeline:** `GET /api/invoices/[id]/timeline` + `InvoiceTimeline` component builds a timeline from existing `AuditLog` rows (created/updated/deleted/issued/payment received/cancelled, with user + payment amount where available).
  - **Share foundation:** Share / Export dropdown (Copy link, Preview, Download PDF) on the detail page.
  - Status lifecycle: DRAFT (editable, deletable) → **Finalize** → PENDING (issued; stock deducted) → payments → PARTIALLY_PAID/PAID; OVERDUE is computed on read when `dueDate` passes with balance outstanding; **Cancel** is allowed only for unpaid PENDING/OVERDUE invoices (stock restored, `cancelledAt` stamped). Edit/delete of non-DRAFT invoices returns 409. VOID remains reserved.
  - Payments: `GET/POST /api/invoices/[id]/payments` — recording a payment against a PENDING/PARTIALLY_PAID/PAID invoice auto-transitions the status (PARTIALLY_PAID/PAID); overpayment is rejected (`PAYMENT_EXCEEDS_BALANCE`, 422). Money is never stored — balances are computed from COMPLETED payments. The history lists method/status/reference/note/paid-at/acting user.
  - Inventory updates: finalizing an invoice deducts stock for product-linked line items via atomic conditional updates (overselling impossible; `INSUFFICIENT_STOCK` 422 with per-product shortage details; fractional product quantities rejected `FRACTIONAL_STOCK`); cancelling an unpaid invoice restores the stock. Every change records a `StockMovement` (`OUT`/`IN`, reference = invoice no) and `INVOICE_FINALIZED`/`INVOICE_CANCELLED`/`INVOICE_PAYMENT_RECEIVED` audit entries (best-effort).
  - GST: per-item single `gstRate` sent by client; server auto-splits into CGST + SGST (rate/2 each) for intra-state customers (same state as `CompanySettings.state`) or IGST (full rate) for inter-state customers via `isIntraState()` in `src/lib/services/invoices.ts`. Client-side preview mirrors the split using the same state comparison. Totals always system-computed. Invoice numbering from `CompanySettings` (`nextInvoiceNo`, `INV-0001` format) via the shared `document-numbers` module.
  - Per-item discount: `InvoiceItem.discount` (Decimal(12,2)) reduces taxable amount before GST computation. Added via migration `20260803110000_add_invoice_item_discount` and `20260803161746_add_invoice_item_discount` (NOT NULL). Form summary displays discount total; line item amount shows `qty × unitPrice - discount`.
  - API routes `GET/POST /api/invoices`, `GET/PATCH/DELETE /api/invoices/[id]`, `POST /api/invoices/[id]/finalize`, `POST /api/invoices/[id]/cancel`, `GET/POST /api/invoices/[id]/payments`, `POST /api/invoices/[id]/duplicate`, `GET /api/invoices/[id]/timeline`, all gated by the existing `invoices:view` permission; write ops audit best-effort `logAudit`.
  - Service layer `src/lib/services/invoices.ts`, shared Zod schemas in `src/lib/validations/invoice.ts` (no client-set status; optional due date defaulting to invoice date; optional terms ≤ 4000, extraReason ≤ 200, extraCharges ±999_999_999.99; single `gstRate` per item 0–100; per-item discount) and `src/lib/validations/payment.ts`, and feature client layer `src/features/invoices/{types,api,hooks}.ts` plus `InvoiceFormDialog`, `PaymentFormDialog`, `InvoicePrintDocument`, `InvoicePrintPreview`, and `InvoiceTimeline`.
  - Migrations `20260802131951_add_invoice_update_delete_audit` (INVOICE_UPDATED/INVOICE_DELETED), `20260802133400_add_invoice_due_date_and_lifecycle_audit` (Invoice.dueDate, status default DRAFT, INVOICE_FINALIZED/INVOICE_PAYMENT_RECEIVED), `20260802134636_add_invoice_terms` (Invoice.terms), `20260803110000_add_invoice_item_discount` (InvoiceItem.discount), and `20260803161746_add_invoice_item_discount` (InvoiceItem.discount NOT NULL) — applied.
  - Verification: `lint`, `typecheck`, `format:check`, and `next build` all pass (new routes `/invoices/[id]/print`, `/api/invoices/[id]/duplicate`, `/api/invoices/[id]/timeline` compile). Live browser E2E of the invoice flow is still pending.
  - **Invoice GST workflow (complete):** The invoice creation form sends a single `gstRate` per item. The server fetches `CompanySettings.state` and `Customer.state`, determines intra/inter-state via `isIntraState()`, and auto-splits the rate into CGST+SGST (rate/2 each) or IGST (full rate). Client-side preview mirrors this split for immediate feedback. Per-item discount is applied before GST computation. The form summary shows Subtotal, Discount, CGST, SGST, IGST (conditional), Extra charges (conditional), and Total Amount.

## Documentation

Every session must read before making changes:

- AGENTS.md — agent rules and technology requirements
- IMPLEMENTATION_PLAN.md — sprint roadmap
- README.md — project overview and setup
- docs/project-status.md — this file
- docs/architecture.md, docs/tech-stack.md, docs/database.md
- docs/business-rules.md, docs/ui-guidelines.md, docs/coding-standards.md

## Design Reference

The `design_references/` folder contains HTML mockups and screenshots (dark slate theme, top app bar + bottom nav, Inter + Geist, accent `#8AB4F8`) and `technical_precision/DESIGN.md` (token spec). These are visual inspiration only. Never copy HTML directly — recreate the design using the project stack. There is no dedicated login mockup; the login screen follows the Technical Precision language used by the awaiting-activation screen (atmospheric background, centered card, brand mark, footer security note).

## Inventory Module Deliverables

- Dedicated `/inventory` page (`src/app/(app)/inventory/page.tsx`) with two tabs:
  - **Stock levels** — summary stat cards (total / in-stock / low / out-of-stock), search (name/SKU/HSN), category filter, stock-status filter, current-stock table with low-stock & out-of-stock badges and per-row "Adjust stock", pagination, and loading/empty/error states.
  - **Movement history** — paginated stock-movement audit trail (newest first) with product-name search, type filter, signed quantity + type badges, reason, and acting user; soft-deleted products remain visible so historical movements keep context.
- API routes (both guarded by the existing `products:view` permission):
  - `GET /api/inventory` — search, category, stock-status (`all`/`in`/`low`/`out`) filters, pagination, and `summary` counts. Search/category run in SQL; status is evaluated in JS because Prisma can't compare `quantity` against `lowStockAt` in a `WHERE` clause.
  - `GET /api/inventory/movements` — movement-type filter, product-name search, pagination, user attribution.
  - Stock adjustments reuse the existing `POST /api/products/[id]/stock` (non-negative invariant, movement recording, `INVENTORY_ADJUSTMENT` audit).
- Extracted the stock-status indicator into a shared `StockStatusBadge` (`src/components/stock-status.tsx`) used by both Products and Inventory views; refactored `ProductStockDialog` to accept a generic `StockTarget` so the same adjustment dialog serves both modules.
- Added `formatDateTime` to `src/lib/format.ts` for history timestamps; products mutations now invalidate inventory query keys.
- Added "Inventory" to the sidebar navigation under `products:view` (no new RBAC permission, no schema migration).
- Live-verified against PostgreSQL: unauthenticated → 401; list + summary; status filter reflects a real adjustment; invalid status/type → 422; negative stock still → 422 `NEGATIVE_STOCK`.

## Sprint 4 Deliverables

- `/quotations` page — quotation list with debounced search, status filter, pagination, row actions (Duplicate/Edit/Convert/Delete), and loading/empty/error states.
- `/quotations/[id]` detail page — bill-to/from cards, line-items table with GST breakdown, totals summary + notes, and Print / Duplicate / Convert / Edit / Delete actions with confirmation dialogs; print-friendly A4 output via `@media print` styles.
- Quotation CRUD, duplicate, and convert-to-invoice with `{ data }` / `{ error }` responses, Zod validation (422 with issue details), `quotations:view` permission guards, and `QUOTATION_CREATED`/`QUOTATION_UPDATED`/`QUOTATION_DELETED`/`QUOTATION_CONVERTED` audit logging.
- GST handling: CGST+SGST (intra-state) or IGST (inter-state), system-computed totals, EXPIRED computed on read, CONVERTED locked against further edits.
- Backend: `src/lib/services/quotations.ts`, `src/lib/validations/quotation.ts`, `GET/POST /api/quotations`, `GET/PATCH/DELETE /api/quotations/[id]`, `POST /api/quotations/[id]/duplicate`, `POST /api/quotations/[id]/convert`.
- Client: `src/features/quotations/{types,api,hooks}.ts`, `QuotationFormDialog`, `QuotationStatusBadge`, `EntityCombobox`, list view, detail page.
- Migration `20260802101627_add_quotation_status_and_audit` adds the `QuotationStatus` enum and quotation audit actions (applied).
- **Invoices (part 2):**
  - `/invoices` page — invoice list with debounced search, status filter (7 statuses), pagination, row actions (Edit/Delete), and loading/empty/error states.
  - `/invoices/[id]` detail page — bill-to/from cards, line-items table with GST breakdown, totals summary + notes, and Edit / Delete actions (DRAFT/PENDING only).
  - Invoice CRUD with `{ data }` / `{ error }` responses, Zod validation (422 with issue details), `invoices:view` permission guards, and `INVOICE_CREATED`/`INVOICE_UPDATED`/`INVOICE_DELETED` audit logging.
  - GST identical to quotations (CGST+SGST intra-state / IGST inter-state), server-computed totals, DRAFT/PENDING user-settable, locked statuses (PARTIALLY_PAID/PAID/OVERDUE/CANCELLED/VOID) reject edit/delete with 409.
  - Backend: `src/lib/services/invoices.ts`, `src/lib/validations/invoice.ts`, `GET/POST /api/invoices`, `GET/PATCH/DELETE /api/invoices/[id]`.
  - Client: `src/features/invoices/{types,api,hooks}.ts`, `InvoiceFormDialog`, `InvoiceStatusBadge`, list view, detail page.
  - Shared numbering module `src/lib/services/document-numbers.ts` (extracted from quotations); migration `20260802131951_add_invoice_update_delete_audit` (applied).
  - **Invoices (part 3 — payments, lifecycle, inventory updates):**
    - Payments: `GET/POST /api/invoices/[id]/payments`, `PaymentFormDialog` (amount/method/reference/note/paid date), balances computed from COMPLETED payments (money never stored), overpayment rejected with `PAYMENT_EXCEEDS_BALANCE`, status auto-transitions PARTIALLY_PAID/PAID.
    - Status lifecycle: `POST /api/invoices/[id]/finalize` (DRAFT → PENDING, stock-out) and `POST /api/invoices/[id]/cancel` (unpaid PENDING/OVERDUE → CANCELLED, stock restored, `cancelledAt`); OVERDUE computed on read when `dueDate` passes; VOID reserved. Edit/delete locked for non-DRAFT (409).
    - Inventory updates: atomic conditional stock deduction on finalize (`INSUFFICIENT_STOCK` 422 with per-product details, `FRACTIONAL_STOCK` 422), restoration on cancel; StockMovement rows with reference = invoice no.
    - Audit actions `INVOICE_FINALIZED`/`INVOICE_PAYMENT_RECEIVED` + existing `INVOICE_CANCELLED`; migration `20260802133400_add_invoice_due_date_and_lifecycle_audit` (Invoice.dueDate, status default DRAFT) applied.
    - Client: `src/features/invoices/{types,api,hooks}.ts` extended (finalize/cancel/listPayments/addPayment + `useInvoicePayments`), `payment-form-dialog.tsx`, list/detail lifecycle actions with confirm dialogs, due-date + Paid column.
  - **Invoices (part 4 — invoice experience):**
    - Professional invoice document `InvoicePrintDocument` (server-compatible, shared by detail/preview/print for parity) — company header + logo, TAX INVOICE title, bill-to + details grid, full line-items table, amount-in-words, notes, terms & conditions, totals with discount/extra-charges + paid/balance, signatures, footer strip.
    - Print/PDF: `window.print()` from the detail page; dedicated server page `/invoices/[id]/print` (`?autoprint=1` auto-opens the browser print dialog — user picks "Save as PDF"). No new dependencies.
    - Duplicate: `POST /api/invoices/[id]/duplicate` (DRAFT copy with fresh number + `INVOICE_CREATED` audit); `useDuplicateInvoice` hook.
    - Discount / extra charges: optional `extraCharges` (negative = discount, `extraReason` label) wired into `computeTotals`, DTO, form (live preview), and document; server always recomputes/stores.
    - Terms & amount-in-words: new `Invoice.terms` column (migration `20260802134636_add_invoice_terms`); server-computed `amountInWords` via `src/lib/number-to-words.ts` (Indian system, paise-aware).
    - Activity timeline: `GET /api/invoices/[id]/timeline` + `InvoiceTimeline` component from existing `AuditLog` rows.
    - Share foundation: Share / Export dropdown (Copy link, Preview, Download PDF) on the detail page.
    - Extras: invoice-number links in the list view; `.invoice-doc` print CSS (repeated table header, row break avoidance).
- Remaining for Sprint 4: none — Sprint 4 is complete. (Live browser E2E of the quotations/invoices/payments/print flows is still pending.)

## Reports & Business Insights Module Deliverables

- **Backend:**
  - Validations `src/lib/validations/report.ts` — `REPORT_TYPES` (10) + `REPORT_GRANULARITIES` (`auto`/`day`/`week`/`month`); per-type schemas via `z.discriminatedUnion("type")`; `dateInput`/`queryNumber`/`booleanInput` preprocess helpers; `from ≤ to` refine; `reportQueryFromParams(searchParams)` shared by the list, export, and print routes.
  - Service `src/lib/services/reports.ts` — `runReport(query, { page, pageSize })` returning `{ items, summary, pagination, meta }`. 10 reports: sales (invoiced/collected/outstanding, OVERDUE derived at read), payments (per-method + per-status totals), tax (per-invoice taxable/CGST/SGST/IGST + `meta.rateBreakdown` computed in JS), customers (billed/collected/outstanding + quote counts), products (sold qty/revenue + stock valuation), inventory (status filter in JS, movements IN/OUT), outstanding (`overdueOnly`, `daysOverdue`), top-products & top-customers (rank, `percentageOfTotal`, `topN`), revenue-trends (day/week/month buckets, invoiced + collected series). Reuses `getPaidByInvoice`; money never stored.
  - `src/lib/services/payments.ts` gained `getPaidByInvoice(invoiceIds)` (groupBy COMPLETED payments); `invoices.ts` imports it.
  - Columns/DTO module `src/lib/reports/columns.ts` — row DTOs, status/method labels, `REPORT_TITLES`/`REPORT_DESCRIPTIONS`, `ReportColumn<T>` metadata, and shared `REPORT_COLUMNS` map.
  - CSV `src/lib/csv.ts` — `toCsv` (RFC-4180) + `downloadCsv` (UTF-8 BOM).
  - API routes (guarded by the existing `reports:view` permission, admin-only): `GET /api/reports` (rows + summary + pagination, page clamp 1–200) and `GET /api/reports/export` (pageSize 10 000 → `{ rows, summary, meta }`).
- **Frontend:**
  - Feature layer `src/features/reports/{types,api,hooks}.ts` — server-shaped DTOs, `buildReportQuery`, `reportsApi.list`/`exportRows`, `useReport`.
  - UI `src/features/reports/` — `report-config.tsx` (REPORT_ORDER, per-type REPORT_FILTERS, option lists), `report-filters.tsx` (date from/to, `EntityCombobox` for customers/categories, status/method/topN/granularity selects, overdueOnly, reset), `report-summary.tsx` (cards), `report-table.tsx` (responsive, hide-below-breakpoint columns, totals, `TablePagination`), `reports-view.tsx` (type tabs, PageHeader with Export CSV + Print, GST-by-rate panel, loading/empty/error states).
  - `/reports` page and `/reports/print` page (`force-dynamic`, admin-only): server-compatible `report-print-document.tsx` (shared `[data-print-area]` document — company header, summary cards, repeated-head table with totals row, footer) + client `report-print-preview.tsx` (`?autoprint=1` auto-opens the browser print dialog; user picks "Save as PDF"). Export downloads `{type}-report.csv` from server rows.
  - Added Reports to the mobile `bottomNav` (already in the sidebar); `.report-doc` print CSS added beside `.invoice-doc`.
- **Verification:** `lint` (0 errors), `typecheck`, and `next build` all pass; live E2E against PostgreSQL (admin sign-in): all 10 report types + export return 200, `/reports` and `/reports/print` render. The dev DB currently has no invoices/payments/customers, so empty responses are correct; aggregation over real data (totals, rate breakdown, trends bucketing) is pending data.
- **Documented limitation:** no purchase/purchase-report module — there is no vendor/PO model; can be added when purchasing is implemented.

## Payment Management Module Deliverables- **Backend:**

- Migration `20260802140451_add_payment_crud_audit` — adds `PAYMENT_UPDATED`/`PAYMENT_DELETED`/`PAYMENT_REFUNDED` to the `AuditAction` enum (applied).
- Shared service `src/lib/services/payments.ts` — helpers `computePaidAmount`, `computeInvoicePaymentStatus`, `recomputeInvoicePaymentStatus`; `listAllPayments` / `listCustomerPayments` (search by invoice no / customer name / reference, method/status filters, pagination); `updatePayment` / `deletePayment` / `refundPayment`, all running inside `prisma.$transaction` and revalidating the balance + recomputing the invoice status. Money is never stored — balances are always computed from COMPLETED payments.
- Validations `src/lib/validations/payment.ts` — `paymentUpdateSchema` (partial), `paymentListQuerySchema`, `PAYMENT_STATUSES`.
- Invoice service refactor — `addPayment` reuses the shared helpers; the local `PaymentDetail`/`toPaymentDetail` moved to `payments.ts`.
- API routes (guarded by the existing `invoices:view` permission): `GET /api/payments` (global list), `GET /api/customers/[id]/payments` (customer history), `PATCH`/`DELETE /api/invoices/[id]/payments/[paymentId]`, `POST /api/invoices/[id]/payments/[paymentId]/refund`. Mutations audit `PAYMENT_UPDATED`/`PAYMENT_DELETED`/`PAYMENT_REFUNDED` with metadata `{ paymentId, invoiceId, amount, method }`.
- Mutation rules: invoice must be issued (PENDING/PARTIALLY_PAID/PAID) and payment must be COMPLETED (else 409); edit amount must be > 0 and ≤ `totalAmount − (other COMPLETED payments)` (else 422 `PAYMENT_EXCEEDS_BALANCE` with `{ outstanding }`); refund flips the status to REFUNDED (kept on the row, excluded from balance); delete removes the row; all changes recompute the invoice's PARTIALLY_PAID/PAID status.
- **Frontend:**
  - Payment feature `src/features/payments/` — `{types,api,hooks}.ts`, `PaymentStatusBadge`, `PaymentsView` (debounced search + method/status filters + paginated table of invoice no / customer / amount / method / status / reference / paid date / user), `PaymentsPage`, and `CustomerPaymentsSection` on the customer detail page.
  - `/payments` page + "Payments" entries in the main and bottom navigation (under `invoices:view`, no new RBAC permission).
  - Invoice payment CRUD UI — `payment-form-dialog.tsx` edit mode, `PaymentsSection` on the invoice detail page with status column and per-row Edit / Refund / Delete actions + confirmation dialogs; hooks invalidate `["invoices"]`/`["invoice"]`/`["invoice-payments"]`/`["payments"]`/`["customer-payments"]`/`["customers"]`.
- **Verification:** `lint` (0 errors), `typecheck`, `format:check`, and `next build` all pass; live E2E against PostgreSQL (dev server restarted after the migration): 401 unauthenticated; create → partial/full payments transition the invoice to PARTIALLY_PAID/PAID; overpay → 422 `PAYMENT_EXCEEDS_BALANCE` `{ outstanding }`; edit revalidates against `total − other COMPLETED`; refund excluded from balance; delete reverses; guards (DRAFT invoice, non-COMPLETED payment) → 409; filters/search/pagination + pageSize clamp verified; all 5 audit actions confirmed. QA data removed afterward.

## Sprint 3 Deliverables

- `/customers` page — customer list with debounced search, city/state filters, pagination, row actions (View/Edit/Delete), and loading/empty/error states.
- `/customers/[id]` detail page — profile card, invoice/quote stat cards, activity placeholder, edit/delete actions.
- Customer CRUD (create/edit/soft-delete) with `{ data }` / `{ error }` responses, Zod validation (422 with issue details), `customers:view` permission guards, and `CUSTOMER_CREATED`/`CUSTOMER_UPDATED`/`CUSTOMER_DELETED` audit logging.
- Backend: `src/lib/services/customers.ts`, `src/lib/validations/customer.ts`, `GET/POST /api/customers`, `GET/PATCH/DELETE /api/customers/[id]`.
- Client: `src/features/customers/{types,api,hooks}.ts`, `CustomerFormDialog` (React Hook Form + `zodResolver`), list view, detail page, activity placeholder.
- Migration `20260802095000_add_customer_delete_audit` adds `CUSTOMER_DELETED` to the `AuditAction` enum (applied).
- Live-verified against PostgreSQL: unauthenticated → 401; create → 201; invalid input → 422; search/filter/pagination; single GET; PATCH → 200; DELETE soft-delete → 404 on subsequent GET; `CUSTOMER_CREATED`/`CUSTOMER_UPDATED`/`CUSTOMER_DELETED` audit rows all confirmed (requires a dev-server restart after adding the new enum value).

## Sprint 2 Deliverables

- `/products` page (Products tab + Categories tab) with search, category filter, pagination, empty/error/loading states, and row actions.
- Category CRUD (create/edit/delete) with cascade soft-delete of the category's products; duplicate names rejected with a 409; create/update/delete actions written to the audit log.
- Product CRUD (create/edit/delete) with duplicate `(category, name)` rejection, opening stock + low-stock threshold at creation, and soft delete.
- Inventory: stock in / stock out / set-quantity adjustments with an always-validated non-negative invariant, low-stock badges in the list, and a stock-movement audit trail.
- Backend foundation: `src/lib/errors.ts`, `src/lib/api.ts`, `src/lib/format.ts`, `src/lib/audit.ts`, Zod schemas, and service layer.
- Client foundation: `apiFetch`/`ApiError`, feature API + TanStack Query hooks, and reusable `SearchInput`, `ConfirmDialog`, `TableSkeleton`, `TablePagination`, `ErrorState`, `useDebouncedValue`.
- Renumbered roadmap: this sprint is Sprint 2; User Management moved to Sprint 5.
- Audit-gap pass (category module): added `CATEGORY_CREATED`/`CATEGORY_UPDATED`/`CATEGORY_DELETED` to the `AuditAction` enum (migration `add_category_audit_actions`) and wired `logAudit` into the category route handlers so category mutations are tracked like products. Categories API live-verified against PostgreSQL.
- Audit-gap pass (product module, during live verification): added `PRODUCT_DELETED` to the `AuditAction` enum (migration `20260802094000_add_product_delete_audit`) and wired `logAudit` into the product DELETE route handler so product deletions are tracked like category deletions. Products & inventory APIs live-verified against PostgreSQL.

## Sprint 1 Deliverables

- Login page (`/login`) with email/password sign-in, Zod validation, inline error feedback, loading state, and safe redirect handling.
- Logout via the top-bar account menu; also added the current user's name, email, and role badge to the sidebar footer.
- Protected routes: `(app)` layout guards every app page and redirects unauthenticated requests to `/login`.
- Current authenticated user: server-resolved `getCurrentUser()` feeding the app shell, top bar, and sidebar.
- RBAC: role/permission definitions (`src/config/rbac.ts`), permission-filtered navigation, and `can`/`requirePermission` server helpers ready for route handlers and server components.
- Seed script (`prisma/seed.ts`) creating the ADMIN/STAFF roles, permissions, role-permission links, and an admin user (idempotent).
- Wired missing typography tokens into `globals.css`.

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
- Sprint 1: authentication (login, logout, RBAC, protected routes, current user).
- Sprint 2: products, categories & inventory (CRUD + stock movements + low-stock tracking + audit logging).
- Inventory Management module: `/inventory` page (stock levels + movement history) and dedicated inventory API routes, reusing the Sprint 2 conventions.
- Sprint 3: customers (CRUD + search/filters/pagination + detail page with history placeholder + audit logging).
- Sprint 4 (part 1): quotations (CRUD + GST-aware line items + status lifecycle + duplicate/convert to invoice + printable detail page + audit logging).
- Sprint 4 (part 2): invoices (CRUD + GST-aware line items + draft/pending lifecycle + server-computed totals + detail page + audit logging).
- Sprint 4 (part 3): payments + invoice status lifecycle (finalize/cancel, PARTIALLY_PAID/PAID, OVERDUE on read) + inventory updates (auto stock-out on finalize, restoration on cancel).
- Sprint 4 (part 4): invoice experience — professional invoice document, print/PDF (print-to-PDF), preview, duplicate, discount/extra-charges, terms, amount-in-words, activity timeline, share foundation.
- Sprint 4 (part 5): payment management module — payment CRUD (create/edit/delete) + refunds, global `/payments` page, customer payment history, shared payments service (`src/lib/services/payments.ts`), invoice payment CRUD UI, and `PAYMENT_UPDATED`/`PAYMENT_DELETED`/`PAYMENT_REFUNDED` audit actions.
- Sprint 5: reports & business insights — `/reports` module with 10 server-aggregated reports, per-report filters, summary cards, pagination, CSV export, print/PDF page, shared `REPORT_COLUMNS`, `getPaidByInvoice`, and `reports:view`-guarded `GET /api/reports` + `GET /api/reports/export`.
- Sprint 6: settings & company configuration — `/settings` page with company profile CRUD, invoice settings (prefixes, currency, GST rate, terms), account management (name, image, password change), user preferences (theme, timezone, date format), role/permission management (CRUD for roles, assign roles to users, set permissions), user management (list, create, assign roles), audit log (filterable, paginated), and backup export/import. All API routes follow the established pattern (`requireApiPermission` → `safeParse` → service → `ok`/`fail`/`fromError` → `logAudit`). The Settings navigation item is admin-only in the sidebar.
- **Billing Workflow Polish:** Product barcode support (schema + migration `20260803172220_add_product_barcode`, validation, service search, form field); GST rate fix (removed hardcoded 18% override — rate now always from product catalog); EntityCombobox refactored to shared `components/entity-combobox.tsx` with `badge` prop for stock status (out-of-stock/low-stock indicators); SKU + barcode shown in product combobox sublabels; Invoice form now includes Order Number, Order Date, DC Number, DC Date (validation schema + service + form UI); Quantity vs stock inline warnings in invoice form.
- **Billing Workflow & UI Stabilization:** Invoice GST — three separate editable CGST/SGST/IGST rate fields with auto-calculation; server validation + service updated for three-rate model; invoice summary shows tax breakdown with Total Tax row. Invoice UI — professional layout with wider form dialog, responsive detail page action bar, responsive payments table. Dashboard Responsiveness — KPI cards, charts, activity feeds all use responsive grid; progress bars and top-list responsive; fixed 4 pre-existing TypeScript errors (dashboard-view subTone, low-stock-panel StockStatusBadge props, top-list union indexing, dashboard.ts missing import + async-in-transaction + implicit any). General UI Polish — settings users/audit-log tables responsive; settings tabs scrollable; unused code cleaned up.
- **Invoice Printing & Final Print Layout:** `InvoicePrintDocument` rewritten to match the approved reference HTML (`design_references/bill_preview/print.html`) exactly — bordered A4 frame, centered "TAX INVOICE" header, centered company header with name/address/phone/email/GST, credentials grid (buyer details 1.2fr | bill details 0.8fr with 2×3 metadata grid), 12-column product table with CGST/SGST/IGST % and Amt sub-columns, 8-row fixed layout, end-bill summary grid (amount in words, bank details, assurance/signature, amount summary with conditional CGST/SGST/IGST/extra rows), and footer (place of supply + authorized signature). All dynamic fields populated from `InvoiceDetail` and `InvoiceCompanyInfo`. "Aurangabad" replaced with "Chhatrapati Sambhajinagar" in bank details and place of supply. Print CSS updated with comprehensive `@media print` rules for A4 sizing, bordered table cells, repeating table headers, page-break avoidance, and hidden UI controls. `lint`, `typecheck`, and `next build` all pass.
- **UI/UX Redesign (Phases 1–4):** Comprehensive production-quality redesign preserving all existing functionality:
  - **Phase 1 — Bug Fixes & Shared Helpers:** Fixed quotation GST to correctly detect intra-state (CGST+SGST) vs inter-state (IGST) matching invoice behavior; added auth guard to `/products` page; cleaned 10 dead imports in `settings-view.tsx`; extracted `initials()`, `trimNumber()`, `fmt()` to shared `src/lib/helpers.ts`; fixed nav active state to use `startsWith` for nested route matching; removed non-functional search bar and notification bell from topbar.
  - **Phase 2 — Component Unification:** Unified summary cards using shared `KpiCard` (extended with `warning` tone) across inventory and dashboard; fixed entity combobox badge colors to use design tokens (`tertiary`, `error`, `success`) instead of raw Tailwind colors; added missing CSS variables (`--success`, `--success-container`, `--warning`, `--warning-container`, `--tertiary-container`) with corresponding `@theme inline` tokens.
  - **Phase 3 — Mobile-First Touch Targets:** Increased button default size from `h-8` to `h-9` (icon buttons `size-9`); increased input height from `h-8` to `h-9`; increased Select trigger height from `h-8`/`h-7` to `h-9`/`h-8`; bottom nav reduced from 6 to 5 items (removed Payments).
  - **Phase 4 — Profile Page:** Created dedicated `/profile` page with modern profile header (avatar, user info, role badge, company badge), account settings (name, image), and security section (change password); added Profile link to user dropdown menu.

## Pending

- Reports data verification: the dev database has no invoices/payments/customers yet, so report totals/rate-breakdown/trend bucketing should be sanity-checked against real data once the billing flows have been exercised.
- Live browser E2E of the quotations and invoices flows, including the print/PDF, duplicate, discount/terms, timeline, payment CRUD/refund, and reports UI (static checks + build verified so far).
- User Management (roles/permissions administration UI) — next sprint.

## Known Issues / Notes

- The local PostgreSQL instance (`localhost:5432/billing`) is running and migrated; `npm run db:migrate` and `npm run db:seed` have both been executed. The admin user's credentials default to `admin@stitchbilling.local` / `Admin@12345` and can be overridden with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
- A long-running `npm run dev` server keeps the Prisma client in memory. After schema/migration changes (e.g. new `AuditAction` enum values), restart the dev server so audit logging for the new actions works.
- The customer module normalizes empty optional fields to `null` so edit can clear them. The product module has the same latent limitation (SKU/HSN/unit cannot be cleared once set — empty input becomes `undefined` and PATCH skips it); a follow-up should apply the same null-clearing fix to products.
- **MongoDB Atlas credentials are still present in git history** (commits before the migration). They belong to a decommissioned database; if the account is still active, rotate the credentials. Optionally purge history with `git filter-repo` (requires approval — destructive).
- **npm is the package manager** (documented in `docs/tech-stack.md`). The planned pnpm could not be installed globally without sudo on this machine, so npm is used. If pnpm is later preferred, install it and re-run `npm install` (or delete `node_modules` + `package-lock.json`) to migrate.
- npm 11's script-allowlist policy requires `.npmrc` (`allow-scripts=true`) and `allowScripts` entries in `package.json` for `prisma`, `sharp`, etc. postinstall scripts.
- `radix-ui` umbrella package is used by the shadcn/ui "radix" style.
- Opening-stock movements created as part of product creation are logged without a `userId` (the creation route logs the product create with a user, but does not pass the user into the opening stock movement). This is a minor data-quality gap; stock movements from the adjust-stock dialog do record the acting user.
- Zod 4 and `@hookform/resolvers` 5 are used (current major versions).
- Old MERN business logic (GST calculations, amount-in-words, A4 invoice template, customer seed data) was not ported — it is recoverable from git history and will be rebuilt properly (Prisma `Decimal`, Zod-validated, tested) in the billing sprints.

## Next Recommended Task

Sprint 6 (Settings & Company Configuration) is complete. Next recommended: User Management (roles/permissions administration UI).

## Notes for Future AI Sessions

- Preserve working code; improve existing implementations before rewriting.
- Avoid unnecessary refactoring.
- Follow AGENTS.md and read the project documentation before modifying code.
- Implement one feature at a time; stop after each feature for review.
- Do not assume requirements; never modify unrelated files.
- Update this file at the end of every completed sprint.
- Authentication guards live in `src/lib/auth/current-user.ts`; new protected server code should reuse `getCurrentUser`, `requireUser`, `requirePermission`, and (for route handlers) `requireApiPermission` rather than reading Better Auth sessions directly.
- Session data is resolved server-side and passed into the app shell; don't re-fetch the session in client components unless reactivity to session changes is required.
- API pattern for new modules: thin route handler → `safeParse` with a shared Zod schema → service function → `ok`/`fromError`; responses follow `{ data }` / `{ error: { code, message, details? } }`. Client calls use `apiFetch` from `src/lib/client/api.ts`.
- Prisma 7 generates model/type names (`ProductUpdateInput`, `CategoryUpdateInput`, etc.) at the top level of `@/generated/prisma/client`; avoid exporting validation-derived types with the same names (`*Payload` is the convention used here).
