# Project Log

## Bill labels, invoice ordering, editing after issue (Complete)

**Date:** 2026-09-02

**Printed bill.** Dropped the colon from the summary labels and made them bold:
Total Amount Before Tax, CGST, SGST, IGST, the extra-charge reason, Total Amount After Tax,
plus Total Invoice Amount in Words and Bank Details. Bolding is one rule —
`.outer-box .summary-item span:first-child { font-weight: bold }` in `globals.css`.

**Invoice ordering.** `listInvoices` ordered by `invoiceDate desc`. That column is a
DateTime and can carry a time component (and can be back-dated), so same-day invoices came
back in an arbitrary order — INV-0008 sat above INV-0010. Now ordered by `createdAt desc`,
which matches the sequential invoice numbers the user reads. Same change for quotations.

**Editing after creation.** Auto-finalizing meant no invoice was ever DRAFT, and
`assertDraft` allowed edits only on drafts — so nothing could be edited at all.

- New `assertEditable` replaces `assertDraft` for updates: DRAFT and PENDING are editable
  provided no COMPLETED payment exists. Cancelled/void and anything with money against it
  are refused with a message saying which.
- Editing an issued invoice re-syncs stock: `restoreInvoiceStock` for the old items before
  they are replaced, `deductInvoiceStock` for the new ones after. Both run inside the
  existing transaction, so a shortage rolls the whole edit back and stock can never
  disagree with the invoice.
- `updateInvoice` now takes `userId` so the stock movements are attributed.
- The Edit action in the list and on the detail page is enabled when the invoice is
  DRAFT/PENDING/OVERDUE and nothing has been paid.

Delete stays draft-only. With auto-finalize that means it is effectively unavailable —
Cancel is the correct action for an issued invoice, and it restores stock.

**Verification:** `typecheck` and `build` pass. In the browser: list returns
INV-0010, 0009, 0008 … newest first; edited INV-0010 from 20 to 25 units and confirmed the
total recalculated to ₹13,775 and stock moved 960 → 955 (restored 20, took 25); editing the
PAID INV-0008 returns 409 "Invoices with recorded payments cannot be edited."; the printed
bill shows the bold, colon-free labels with the "transport" extra charge at ₹500.

**Still carrying colons** (not part of this change): the invoice metadata header
(No. :, Date :, O. No. :, D.C. No. :, GST No :) and the bank sub-lines
(Bank :, Branch :, A/c No :, IFSC :).

## Billing workflow simplification and per-product dashboard (Complete)

**Date:** 2026-09-02

**Dashboard**

- Removed the invoice-status donut and the payment-status donut.
- `product-sales-chart.tsx` replaces the old monthly bars: one bar per product per
  period, with a Weekly / Monthly / Quarterly / Yearly switch. New server aggregation
  `getProductSalesByPeriod` in `src/lib/services/dashboard.ts`, plus a `granularity`
  param on the dashboard query.
- The pie now reads from the same `productSales` payload as the bars, so a product keeps
  the same colour in both charts.
- Soft-deleted products are excluded from the charts — the retired demo product
  "Espresso" was showing as a fourth series and shifting every colour.

**Billing**

- Invoices are issued automatically on create. `POST /api/invoices` calls `finalizeInvoice`
  right after `createInvoice` and writes the `INVOICE_FINALIZED` audit entry. If issuing
  fails (e.g. insufficient stock) the draft is left in place rather than discarded.
- **Same-day invoices were reading OVERDUE immediately.** The due date defaults to the
  invoice date, and overdue was `dueDate < now`. Due dates are date-only, so it is now
  `dueDate < startOfDay(now)` in `invoices.ts`, `dashboard.ts` and `reports.ts`. Without
  this, auto-finalizing made every new invoice look overdue on creation.
- "Extra charges" section on the invoice form: a free-text Reason and an amount, both
  printed on the bill. Reuses the existing `extraCharges` / `extraReason` columns, added
  after tax. No migration.
- Recording a payment now prefills the full outstanding balance and today's date. The
  reset only ran from `handleOpenChange`, which Radix never calls when the parent controls
  `open` — moved to a `useEffect` on `open`, so the defaults actually land.

**Products**

- Removed Barcode, SKU, Opening stock and Low-stock threshold from the product form.
  Creation sends `initialStock: 0` / `lowStockAt: 5`; stock is managed from Inventory.
- Removed the remaining Category traces: the dead "Category" column in the products,
  inventory and top-products reports, the `categoryId` report filter and validation, and
  the `categoryName` sub-label option in `top-list`. `backup.ts` still round-trips the
  Category table so existing backups stay valid.

**Verification:** `typecheck` and `build` pass. Exercised in Chrome at 400px: created an
invoice via the API and confirmed it returns issued (not DRAFT) with extra charges applied
(2,500 + 450 GST + 500 = 3,450); confirmed today's invoices read PENDING while an August one
still reads OVERDUE; confirmed the charts show three products with matching colours and the
period switch; confirmed the payment dialog prefills the balance and date.

**Note:** INV-0008 (₹3,450) was created by this verification against a real customer.

## Dashboard charts, single-product catalogue, simplified billing (Complete)

**Date:** 2026-09-02

**Charts — rebuilt for an instant read on sales.** The old charts forced horizontal scrolling on a
phone (`min-w-[640px]`). All three new ones draw into a fixed `viewBox` and render `w-full h-auto`,
so they scale down instead of scrolling.

- `sales-line-chart.tsx` — invoiced vs collected over time; the gap between the two lines is money
  billed but not yet banked. Totals shown above the plot.
- `monthly-sales-chart.tsx` — grouped bars per month, invoiced beside collected. The best month
  renders at full strength and the rest sit back at 55% opacity.
- `product-pie-chart.tsx` — donut of revenue share by product, with a legend carrying units sold,
  percentage and value.
- `chart-utils.ts` holds the shared axis/format/arc helpers. No charting dependency added.
- Removed `category-sales.tsx` and the `trend-chart` usages it replaced.

**Catalogue reduced to the three real products.** Seeded Procto Tub (HSN 94029090, ₹2,500),
Perianal Cushion (HSN 90189099, ₹450) and Perianal Support (HSN 90189099, ₹50), all at 18% GST —
CGST 9 + SGST 9 within Maharashtra, IGST 18 outside, which the existing service already handled.
Retired the leftover QA/demo products.

**Category removed.** Migration `20260902120000_make_product_category_optional` makes
`Product.categoryId` nullable and replaces the `(categoryId, name)` unique with `(name)`. Deleted
the category API routes, service, validations, feature views, form dialog, filters, dashboard
aggregation and report filter. The `Category` model itself is kept: dropping it would require
recreating the `AuditAction` enum and would orphan existing `CATEGORY_*` audit rows for no
user-visible gain.

**Invoice form simplified.** Removed per-item discount, notes, terms & conditions, and extra
charges/reason — from the Zod schema, defaults, submit payload, totals maths and JSX.

**Subtotal and grand total now always visible.** They were rendering correctly, but sat below
Notes, Extra charges and Terms at the bottom of a `max-h-[90vh]` scrolling dialog, so on a phone
you never reached them. The totals are now a sticky footer inside the dialog carrying Subtotal,
the GST breakdown, a prominent Grand Total, and the Cancel/Save actions in a single row.

**Verification:** `typecheck` and `build` pass. Checked in Chrome at 400px: dashboard charts scale
without horizontal scroll, the invoice form shows the sticky totals with the correct
CGST 9 / SGST 9 / IGST 0 defaults, and `/api/products` returns exactly the three products.

**Note:** "Revenue by product" reads empty until invoices are raised against the new products —
the only historical invoice referenced a demo product that has now been retired.

## UI Redesign Phases 2, 3 & 5 — Mobile-first tables and components (Complete)

**Date:** 2026-09-02

**Goal:** The app is used on phones, so every table and shared component had to work at
phone width — and the tables were poor on desktop too.

**Two root causes found (both were breaking desktop as well as mobile):**

1. **The invoice print CSS was global.** `globals.css` styled bare `table`, `th`, `td`,
   `thead th`, and `table tr td:first-child` for the A4 invoice document, with no scoping. Those
   rules hit _every_ table in the app: 1px black borders, centred text, 11px font, 4px padding.
   All print rules are now scoped under `.outer-box` (the print document root). The print output
   is unchanged — verified against a rendered invoice.
2. **`DataTable` never rendered a `<table>`.** It wrapped `<thead>`/`<tbody>` in plain `<div>`s,
   so browsers built anonymous table boxes with no shared column model and columns could not
   align. It now renders a real table.

**Changes:**

- **`DataTable` rebuilt as a responsive primitive.** `md` and up: a real `<table>` with a sticky
  header, aligned columns, and right-aligned numerics. Below `md`: each row collapses into a card
  — `variant="title"` cell heads it, `variant="actions"` pins top-right, and every other cell
  renders as a label/value pair from its `label` prop. Header uses `on-surface-variant` rather
  than the accent, so blue is no longer applied to every column heading.
- **All 12 tables migrated:** customers, products, categories, invoices, quotations, payments,
  inventory stock, inventory movements, audit log, users, reports, customer payments, and the
  invoice detail payments table. The three that used raw shadcn `<Table>` and the one hand-rolled
  `<table>` (users) now go through `DataTable` too.
- **Nothing is hidden on mobile any more.** Every `hidden md:table-cell` column was removed — the
  data appears in the card instead.
- **Duplicate page headers removed.** Six list views rendered their own `<h1>` on top of the
  `PageHeader` from the page component. The invoice one read "Documents — Manage Your Documents &
  Certifications", copy left over from a mockup.
- **Invoice row actions restored.** `invoices-view` imported `DropdownMenu` but never rendered it;
  the row had Download/Share buttons with no `onClick`, and the Finalize/Cancel/Delete handlers
  and dialogs were unreachable. Finalize / Record payment / Edit / Cancel / Delete are back, gated
  by status. Also removed the duplicate status filter (a pill strip and a Select bound to the same
  state) on invoices and quotations, and the dead PO Reference column.
- **`Tabs` and `Separator` orientation variants were dead.** `data-horizontal:` compiles to
  `[data-horizontal]`, but Radix sets `data-orientation="horizontal"` — so `flex-col` never
  applied and tab lists rendered _beside_ their content. Now `data-[orientation=horizontal]:`.
- **Settings and Reports** swap their tab strips for a full-width Select below `md` (seven and ten
  items respectively never fit a phone). Section cards gained spacing and now use `TonalCard`.
- **Filter bars** stack: full-width search, then filters in a 2-up grid, then a full-width primary
  button. Controls are `h-10` on mobile, `h-9` from `sm`. Icon buttons in rows are `size-9`/`10`.
- **Dashboard** KPI cards go 2-up on mobile with smaller chrome; the date range filter no longer
  takes three rows and its preset Select showed a blank value (it was bound to a value not in its
  own option list).
- `TablePagination`, `PageHeader`, `EmptyState` and the app shell gutters reworked for phone width.

**Verification:** `typecheck` and `build` pass; lint unchanged (remaining errors are pre-existing
react-hook-form `watch()` warnings and noise from `design_references/new billing/`). Checked in
Chrome at 400px and at desktop width: list pages, settings, products, dashboard, and the invoice
print document.

**Not done:** Phase 4 (dashboard charts) and Phase 6 (detail pages, the 961-line invoice form
dialog) remain.

## UI Redesign Phase 1 — One palette, one source of truth (Complete)

**Date:** 2026-09-02

**Goal:** Collapse the three competing colour systems into a single token set, per
`docs/ui-redesign-plan.md`. Direction chosen: "Technical Precision" blue, dark only.

**Changes:**

- Rewrote the token block in `src/app/globals.css` to the DESIGN.md palette — canvas `#131314`,
  card `#1e1f22`, elevated `#212327`, border `#2d2f34`, accent `--primary` `#8ab4f8`, solid action
  fill `--brand-solid` `#1a73e8`. Added `--violet` for refunded/converted states. `html/body` now
  reference tokens instead of literals.
- Replaced every colour literal in components with token classes: ~113 hex values (93 of them
  `#f97316`) and 194 off-palette Tailwind colours (`gray-400`, `emerald-400`, `rose-400`, …) plus
  51 `text-white`. Zero remain outside `globals.css` and the light-mode print documents.
- Separated the two meanings orange had been carrying: brand accent stays `--primary`, while
  "needs attention" states (pending, partially paid, sent, low stock) became `--warning`.
- `--accent` was pointing at the brand colour, which made shadcn menu-item focus a solid orange
  block; it now resolves to a subtle elevated surface as shadcn intends.
- `Button`'s default variant now uses `bg-brand-solid text-on-brand-solid`; removed the redundant
  per-call-site colour overrides on 10 buttons.
- `TonalCard` went from zero usages to the app's card primitive (variants default/elevated/sunken/
  outlined, padding scale, optional `as`), adopted at all 12 card sites including `DataTable`,
  `KpiCard`, the dashboard panels, the invoice payments section, and the login card.
- Chart colours (`trend-chart`, `category-sales`, `status-donut`, `dashboard-view`) now reference
  `var(--token)` rather than hex.
- Removed hardcoded inline styles: the dead `fontVariationSettings` in `bottom-nav`, and static
  `minWidth`/`width`/`left`/`top` in the charts became Tailwind classes. Only runtime-computed
  values (chart heights, data-driven bar widths, per-series colour) remain inline.
- Updated `CLAUDE.md` and `docs/ui-guidelines.md` — both still described the orange theme.

**Verification:** `npm run typecheck`, `npm run lint` (no new errors; the remaining ones are
pre-existing react-hook-form `watch()` warnings and lint noise from `design_references/new billing/`),
and `npm run build` all pass. Confirmed the served CSS on the running dev server carries the new
token values.

**Not done:** geometry, spacing and component structure are unchanged by design — this phase moved
colour to a single source, nothing else. Phases 2-6 remain.

Chronological record of sprint work. One entry per completed sprint.

## Sprint 6 — Settings & Company Configuration (Complete)

**Date:** 2026-08-03

**Goal:** Build the `/settings` page with company settings CRUD, user preferences, role/permission management, user management, audit log, and backup/restore.

**Changes:**

- Schema migration `prisma/migrations/20260803104646_add_settings_user_preferences_and_audit/` — added `UserPreferences` model, new `AuditAction` enum values (`USER_CREATED`, `USER_ROLE_UPDATED`, `ROLE_CREATED`, `ROLE_UPDATED`, `ROLE_DELETED`, `ROLE_PERMISSIONS_UPDATED`, `BACKUP_EXPORTED`, `BACKUP_IMPORTED`), and new `CompanySettings` fields (`currency`, `defaultGstRate`, `defaultTerms`).
- Validations `src/lib/validations/settings.ts` — shared Zod schemas for all settings domains: `companyProfileSchema`, `invoiceSettingsSchema`, `accountUpdateSchema`, `changePasswordSchema`, `preferencesSchema`, `roleCreateSchema`, `roleUpdateSchema`, `rolePermissionsSchema`, `userCreateSchema`, `userRoleSchema`, `auditLogQuerySchema`.
- Services `src/lib/services/settings.ts` — `getCompanySettings`, `updateCompanyProfile`, `updateInvoiceSettings`, `updateAccountProfile`, `changePassword`, `getUserPreferences`, `upsertUserPreferences`, `listAuditLog`.
- Services `src/lib/services/roles.ts` — `listUsers`, `createUser`, `assignUserRole`, `listRoles`, `createRole`, `updateRole`, `deleteRole`, `setRolePermissions`.
- Services `src/lib/services/backup.ts` — `exportSnapshot` and `importSnapshot` with full DB restore capability.
- API routes under `src/app/api/settings/` — company, invoice, account, account/password, preferences, users, users/[id]/role, roles, roles/[id], roles/[id]/permissions, audit-log, backup/export, backup/import. All follow the established pattern: `requireApiPermission` → `safeParse` → service → `ok`/`fail`/`fromError` → `logAudit`.
- Settings page `src/app/(app)/settings/page.tsx` — server component, `force-dynamic`, `requireUser()` guard.
- Feature client layer `src/features/settings/` — `types.ts`, `api.ts`, `hooks.ts`, `section-card.tsx`, `settings-view.tsx` (tabbed layout), `account-form.tsx`, `change-password-form.tsx`, `preferences-form.tsx`, `company-profile-form.tsx`, `invoice-settings-form.tsx`, `roles-view.tsx`, `users-view.tsx`, `audit-log-view.tsx`, `backup-view.tsx`.
- Updated `src/components/layout/user-menu.tsx` — Settings link added above Sign out.
- Updated `src/lib/format.ts` — `formatDateFor` and `formatDateTimeFor` helpers added.
- Updated `src/components/confirm-dialog.tsx` — `description` prop changed from `string` to `React.ReactNode`.

**Verification:** `npm run lint` (0 errors), `npm run typecheck` (only pre-existing dashboard errors), `npm run format:check`, and `npm run build` (compiles; build fails on pre-existing dashboard type errors unrelated to settings).

**Date:** 2026-08-03

**Goal:** A `/reports` module with 10 server-aggregated, admin-only reports (existing `reports:view` — the permission already excludes STAFF, so no RBAC/seed change), per-report filters, summary cards, pagination, CSV export, and a print/PDF page. All aggregation happens on the server via Prisma; money is never stored (balances/paid amounts computed from COMPLETED payments); the purchase report is intentionally omitted (no vendor model — documented as a limitation).

**Changes:**

- Validations `src/lib/validations/report.ts` — `REPORT_TYPES` (sales, payments, tax, customers, products, inventory, outstanding, top-products, top-customers, revenue-trends) and `REPORT_GRANULARITIES` (`auto`/`day`/`week`/`month`); per-type schemas via `z.discriminatedUnion("type")` using `dateInput`/`queryNumber`/`booleanInput` preprocess helpers (empty string → undefined); a `from ≤ to` refine reporting to `path: ["to"]`; and `reportQueryFromParams(searchParams)` used by the list, export, and print routes (tolerant of unknown keys like `autoprint`).
- Columns/DTO module `src/lib/reports/columns.ts` (pure types, shared server+client) — the 10 row DTO types + `ReportRow` union, status/method label records, `REPORT_TITLES`/`REPORT_DESCRIPTIONS`, and `ReportColumn<T>` metadata (key, label, align, hideBelow, mono, total, value, raw) for all 10 column sets using `formatMoney`/`formatNumber`/`formatDate`, plus a shared `REPORT_COLUMNS` map keyed by report type.
- Service `src/lib/services/reports.ts` — `runReport(query, { page, pageSize })` returning `{ items, summary, pagination, meta }` with 10 report functions:
  - `salesReport` — invoiced vs collected vs outstanding per invoice; `OVERDUE` resolved at read time (status in PENDING/PARTIALLY_PAID and `dueDate < now`); paid amounts via the shared `getPaidByInvoice` map.
  - `paymentReport` — per-payment rows with method/status filters, per-method and per-status totals.
  - `taxReport` — per-invoice taxable + CGST/SGST/IGST + GST total, plus a `rateBreakdown` in `meta` computed in JS from `InvoiceItem` rows (Prisma `groupBy` can't sum `cgstRate+sgstRate+igstRate`).
  - `customerReport` — per-customer billed/collected/outstanding/balance + quotation counts, sorted by billed desc.
  - `productReport` — per-product sold qty/revenue/tax + current stock valuation (inventory `quantity` × unit price).
  - `inventoryReport` — stock-status filter evaluated in JS after `findMany` (Prisma can't compare `quantity` vs `lowStockAt` in `WHERE`); movements grouped IN/OUT (ADJUSTMENT skipped).
  - `outstandingReport` — PENDING/PARTIALLY_PAID with balance > 0, `overdueOnly` filter, `daysOverdue`, sorted by days-overdue desc.
  - `topProductsReport` / `topCustomersReport` — rank + `percentageOfTotal`, `topN` (default 10, options 5/10/25/50).
  - `revenueTrendsReport` — day/week/month buckets (auto-chooses when `auto`) with invoiced (`invoiceDate`), collected (payment `paidAt`), GST, and outstanding series; every bucket returns all series.
  - Shared helpers `money`, `dateFilter`, `periodLabel`, `resolveIssuedStatus`, `daysBetween`, `percent`, `paginate`.
- Service `src/lib/services/payments.ts` — added exported `getPaidByInvoice(invoiceIds): Promise<Map<invoiceId, Decimal>>` (groupBy `invoiceId`, `status: "COMPLETED"`, `_sum.amount`); `src/lib/services/invoices.ts` now imports it (private copy removed).
- API routes (both guarded by `requireApiPermission(PERMISSIONS.REPORTS_VIEW)`): `GET /api/reports` (per-report rows + summary + pagination, page clamp 1–200) and `GET /api/reports/export` (pageSize 10 000, returns `{ rows, summary, meta }` for client-side CSV).
- CSV `src/lib/csv.ts` — `toCsv` (RFC-4180 quote escaping) + `downloadCsv` (Blob with UTF-8 BOM for Excel compatibility).
- Feature client layer `src/features/reports/{types,api,hooks}.ts` — server-shaped DTOs, `buildReportQuery`, `reportsApi.list`/`exportRows`, `useReport` (query key `["report", query]`).
- UI (`src/features/reports/`): `report-config.tsx` (REPORT_ORDER, per-type REPORT_FILTERS, status/method/granularity/topN option lists), `report-filters.tsx` (declarative filter bar — date from/to, `EntityCombobox` reusing `useCustomers`/`useCategories`, status/method/topN/granularity Selects, overdueOnly checkbox, reset), `report-summary.tsx` (summary cards), `report-table.tsx` (generic responsive `ReportTable<T>` with `hideBelow` columns + `TablePagination`), `reports-view.tsx` (type tabs, `PageHeader`, Export CSV + Print actions, `useReport`, loading/empty/error states, GST-by-rate panel for the tax report).
- `/reports` page (`src/app/(app)/reports/page.tsx`) + `/reports/print` page (`src/app/(app)/reports/print/page.tsx`, `force-dynamic`, `requirePermission(REPORTS_VIEW)`, runs the report at pageSize 10 000, builds `ReportCompanyInfo` from `CompanySettings`). Print document `src/features/reports/report-print-document.tsx` (server-compatible, shared `[data-print-area]` white document — company header, summary cards, repeated-head table with totals row via column `raw`, footer) and client `report-print-preview.tsx` (Back + Print toolbar, `?autoprint=1` auto-opens the browser print dialog after 400 ms, mirroring the invoice print flow).
- Nav + CSS: Reports already existed in the sidebar (`mainNav`); added it to the mobile `bottomNav` in `src/config/navigation.ts` (also under `reports:view`). Added `.report-doc` rules to the `@media print` block in `src/app/globals.css` (repeated table header, row break avoidance) alongside `.invoice-doc`.
- Removed a small duplication: `REPORT_COLUMNS` lives in `columns.ts` and is shared by the view, CSV export, and print document.

**Verification:** `npm run lint` (0 errors; only the 4 pre-existing warnings remain), `npm run typecheck`, and `npm run build` all pass; `/reports` and `/reports/print` compile as dynamic routes. Live E2E against PostgreSQL (running dev server, seeded admin sign-in): unauthenticated `/api/reports` → 401/redirect; signed in as admin — all 10 report types return 200, `/api/reports/export` → 200, `/reports` and `/reports/print?type=sales&autoprint=1` render (print document present). The dev database currently contains no invoices/payments/customers, so empty responses are correct; aggregation over real data (totals, rate breakdown, trends bucketing) remains to be data-verified once test data exists.

## Sprint 4 (Part 5) — Payment Management Module (Complete)

**Date:** 2026-08-02

**Goal:** Turn the single record-payment flow into a full payment management module: payment CRUD (create, read, edit, delete) and refunds for full/partial payments, a global `/payments` page, customer payment history, and a shared payments service so balances/status are always recomputed from COMPLETED payments.

**Changes:**

- Schema: added `PAYMENT_UPDATED`/`PAYMENT_DELETED`/`PAYMENT_REFUNDED` to the `AuditAction` enum; generated and applied migration `20260802140451_add_payment_crud_audit`.
- Validations (`src/lib/validations/payment.ts`): added `PAYMENT_STATUSES`, `paymentUpdateSchema` (partial — amount/method/status/reference/note/paidAt), `paymentListQuerySchema` (method/status/search/page/pageSize), and types `PaymentUpdatePayload`/`PaymentListQuery`.
- New shared service `src/lib/services/payments.ts`:
  - Helpers: `computePaidAmount(tx, invoiceId)` (sum of COMPLETED payments), `computeInvoicePaymentStatus(totalAmount, paidAmount)` → PENDING/PARTIALLY_PAID/PAID, `recomputeInvoicePaymentStatus(tx, invoiceId, totalAmount)`.
  - `listAllPayments` / `listCustomerPayments` — paginated, search (invoice no / customer name / reference), method/status filters, pageSize clamped to [1, 200], includes invoice + customer + acting user.
  - `updatePayment` / `deletePayment` / `refundPayment` — inside `prisma.$transaction`, all revalidate the balance and recompute the invoice status; money is never stored. Rules: invoice must be PENDING/PARTIALLY_PAID/PAID and payment must be COMPLETED (else 409 `CONFLICT`); edit amount must be > 0 and ≤ `totalAmount − (other COMPLETED payments)` (else 422 `PAYMENT_EXCEEDS_BALANCE` with `{ outstanding }`); refund flips status to REFUNDED (kept on the row, excluded from balance); delete removes the row. Returns `PaymentDetail`.
- Refactored `src/lib/services/invoices.ts`: `addPayment` now reuses the shared `computePaidAmount` + `recomputeInvoicePaymentStatus`; the local `PaymentDetail`/`toPaymentDetail` were replaced by the exports from `payments.ts` (behavior unchanged).
- API routes (all guarded by the existing `invoices:view` permission):
  - `GET /api/payments` — global payment list with filters/search/pagination.
  - `GET /api/customers/[id]/payments` — customer-scoped payment history.
  - `PATCH` + `DELETE /api/invoices/[id]/payments/[paymentId]` — edit / delete a COMPLETED payment.
  - `POST /api/invoices/[id]/payments/[paymentId]/refund` — refund a COMPLETED payment.
  - All mutations audit `PAYMENT_UPDATED`/`PAYMENT_DELETED`/`PAYMENT_REFUNDED` (create keeps `INVOICE_PAYMENT_RECEIVED`) with metadata `{ paymentId, invoiceId, amount, method }`.
- Frontend payment feature `src/features/payments/{types,api,hooks}.ts` (`paymentsApi.list` / `listCustomerPayments`, `usePayments` / `useCustomerPayments`, query keys `["payments"]`/`["customer-payments"]`), `PaymentStatusBadge` (COMPLETED/REFUNDED/FAILED/PENDING), `PaymentsView` (search + method/status filters + paginated table), `PaymentsPage`, and `CustomerPaymentsSection` (added to the customer detail page below the Activity card).
- Added `/payments` page (`src/app/(app)/payments/page.tsx`, `force-dynamic`) and "Payments" entries in `src/config/navigation.ts` main + bottom nav under `invoices:view` (no new RBAC permission).
- Invoice payment CRUD UI: `src/features/invoices/api.ts` gained `updatePayment`/`refundPayment`/`deletePayment`; `hooks.ts` gained `useUpdatePayment`/`useRefundPayment`/`useDeletePayment` and now invalidates `["invoice-payments"]`/`["payments"]`/`["customer-payments"]`; `payment-form-dialog.tsx` rewritten with edit-mode support (prefills an existing payment); the invoice detail page's `PaymentsSection` now shows a status column with `PaymentStatusBadge` and per-row Edit / Refund / Delete actions with confirmation dialogs (delete destructive), plus loading/error states.

**Verification:** `npm run lint` (0 errors), `npm run typecheck`, `npm run format:check`, and `npm run build` all pass. Live E2E against PostgreSQL (dev server restarted so the new enum values reach the running Prisma client): unauthenticated `/api/payments` → 401; empty-state search/filter responses; created a customer + invoice, finalized it, and exercised the full flow — partial payment 1000 (invoice PARTIALLY_PAID, balance 2360 → 1360), overpay 5000 → 422 `PAYMENT_EXCEEDS_BALANCE` `{ outstanding: "1360" }`, remaining 1360 (invoice PAID, balance 0), edit 1000 → 500 (balance 500), edit to 5000 → 422 `{ outstanding: "1000" }` (`total − other COMPLETED`), refund 1360 → REFUNDED + excluded from balance (1860), delete 500 → removed (balance 2360); guard rules — payment on a DRAFT invoice → 409, edit/refund of an already-REFUNDED payment → 409; filters (status/method/search), pagination clamp (pageSize 999 → 200), and `/api/customers/[id]/payments` all verified; all 5 audit actions written with `{ paymentId, invoiceId, amount, method }`. QA test data (customer, 2 invoices, 1 refunded payment, 8 audit rows) was removed afterward.

## Sprint 4 (Part 4) — Invoice Experience (Complete)

**Date:** 2026-08-02

**Goal:** Close out the invoice half of the billing sprint with a professional invoice document: print/PDF (print-to-PDF, no new dependencies), a preview route, duplicate, discount/extra-charges, terms & conditions, server-computed amount-in-words, an activity timeline, and a share foundation — all backed by the same server-computed data that the screen renders (guaranteed print parity).

**Changes:**

- Added `Invoice.terms String?` to `prisma/schema.prisma`; generated and applied migration `20260802134636_add_invoice_terms`.
- Added `src/lib/number-to-words.ts` — `amountInWords` using the Indian numbering system (crore/lakh/thousand), paise-aware, returns `""` for non-finite/negative/≥ 1e9.
- Extended `src/lib/validations/invoice.ts`: optional `terms` (≤ 4000), `extraReason` (≤ 200), `extraCharges` (±999_999_999.99) on both create and update schemas.
- Extended `src/lib/services/invoices.ts`:
  - `computeTotals` now takes `extraCharges` and includes it in `totalAmount` (line-item amounts unchanged).
  - `InvoiceDetail` DTO + `toDetail` expose `terms`, `extraCharges`, `extraReason`, `amountInWords` (stored value, with a fallback compute for legacy rows), `orderNo`/`orderDate`/`dcNo`/`dcDate`.
  - `createInvoice`/`updateInvoice` persist extra charges/reason/terms and always recompute and store `amountInWords`; `updateInvoice` recomputes component totals only when items change and always rebuilds `totalAmount` from the (possibly unchanged) components + extra.
  - New `duplicateInvoice(id, userId)` — copies customer, dates, order/dc references, totals, extra charges, notes, terms, amount-in-words, and all line items (incl. HSN) under a fresh number as a DRAFT, inside one transaction.
  - New `listInvoiceTimeline(id)` — reads `AuditLog` rows (`entityType: "Invoice"`) newest-first, returning id/action/createdAt/user/metadata.
- Added API routes (both guarded by `invoices:view`): `POST /api/invoices/[id]/duplicate` (201 + `INVOICE_CREATED` audit) and `GET /api/invoices/[id]/timeline`.
- Extended the feature client layer `src/features/invoices/{types,api,hooks}.ts`: `InvoiceDetail` gains the new fields; new `TimelineEntry` and `InvoiceCompanyInfo` types; `duplicate`/`timeline` API calls; `useInvoiceTimeline` query and `useDuplicateInvoice` mutation; timeline query key invalidated with other invoice data.
- Added `src/features/invoices/invoice-print-document.tsx` (server-compatible, no `"use client"`): the shared white A4-style invoice document — company header + logo, TAX INVOICE title, bill-to + details grid, full line-items table (#/Description+HSN, Qty, Rate, Taxable Amount, GST%, GST Amount, Total), amount-in-words, notes, terms & conditions, totals block (subtotal, CGST/SGST/IGST, discount/extra charges, paid/balance, bold total), signature lines, and a footer strip. Light-mode classes regardless of app theme; renders identically on the detail page, preview, and print.
- Added `src/features/invoices/invoice-print-preview.tsx` (client): toolbar (Back to invoice + Print) and the document wrapped in `data-print-area`; auto-triggers `window.print()` after 400 ms when `autoprint` is set.
- Added `src/features/invoices/invoice-timeline.tsx` (client): "Activity" card listing audit events with icon/label mapping (created/updated/deleted/issued/payment received/cancelled, payment amount + actor shown where available), empty state, and loading skeletons.
- Added server page `/invoices/[id]/print` (`src/app/(app)/invoices/[id]/print/page.tsx`, `force-dynamic`): loads `CompanySettings` (logo) + `getInvoice(id)`, renders `InvoicePrintPreview`; `?autoprint=1` opens the browser print dialog (user picks "Save as PDF").
- Refactored `invoice-detail-page.tsx`: main content is now `<InvoicePrintDocument>` inside `data-print-area`; a `print:hidden` toolbar adds Print, a Share / Export dropdown (Copy link, Preview, Download PDF), Duplicate, and the existing lifecycle actions; Payments and the new Activity timeline render below the document, both `print:hidden`. Removed the local `CompanyPrintInfo` type in favor of the shared `InvoiceCompanyInfo` from `invoice-print-document` (exported via `types.ts`).
- Updated `src/app/(app)/invoices/[id]/page.tsx` to build `InvoiceCompanyInfo` incl. `logoUrl`.
- Updated `invoice-form-dialog.tsx`: new "Extra charges / discount" section (amount + reason) and a "Terms & conditions" textarea; the live summary adds a discount/extra-charges row and includes it in the total (preview only — the server recomputes); `emptyValues`/`fromDetail`/`onSubmit` wired.
- Updated `invoices-view.tsx`: invoice numbers are now links to the detail page.
- Extended `src/app/globals.css` `@media print` with `.invoice-doc` rules (repeated table header, row break avoidance).

**Verification:** `npm run db:generate`, `npm run lint` (0 errors; the 4 pre-existing warnings remain), `npm run typecheck`, `npm run format:check`, and `npm run build` all pass; the new routes `/invoices/[id]/print`, `/api/invoices/[id]/duplicate`, and `/api/invoices/[id]/timeline` compile. Fixes during this pass: moved JSX out of the print page's `try/catch` (react-hooks/error-boundaries) and suppressed the `<img>` lint warning for the print logo. Live browser E2E (discount + terms invoice, duplicate, timeline, print, `?autoprint=1`) is still pending.

## Sprint 4 (Part 3) — Billing · Payments, Lifecycle & Inventory Updates (Complete)

**Date:** 2026-08-02

**Goal:** Close out the invoice half of the billing sprint: the invoice status lifecycle (DRAFT → PENDING → PARTIALLY_PAID/PAID → CANCELLED, with OVERDUE computed on read), payment recording with system-computed balances, and inventory updates (auto stock-out on finalize, restoration on cancel).

**Changes:**

- Added `Invoice.dueDate` and changed the invoice status default to `DRAFT` in `prisma/schema.prisma`; added `INVOICE_FINALIZED`/`INVOICE_PAYMENT_RECEIVED` to the `AuditAction` enum; generated and applied migration `20260802133400_add_invoice_due_date_and_lifecycle_audit`.
- Extended `DomainError` (`src/lib/errors.ts`) with `public readonly details?: unknown` and updated `fromError` in `src/lib/api.ts` so structured error details (e.g. per-product stock shortages) reach the client.
- Rewrote the invoice validations (`src/lib/validations/invoice.ts`): status is no longer client-settable (invoices are always created as DRAFT); added an optional `dueDate` that defaults to the invoice date. Added `src/lib/validations/payment.ts` (`paymentCreateSchema`: positive amount, PAYMENT_METHODS enum, reference ≤ 100, note ≤ 300, optional paidAt).
- Rewrote the service layer `src/lib/services/invoices.ts`:
  - `listInvoices`/`getInvoice` now return `dueDate`, `paidAmount`, `balance`, and `cancelledAt`; OVERDUE is resolved in SQL for the list (`dueDate < now` with PENDING/PARTIALLY_PAID) and on read for the detail.
  - `finalizeInvoice` — DRAFT only (409 otherwise); re-validates that the customer is active and that stock is available, then deducts stock for product-linked items via atomic conditional `updateMany` (overselling is impossible; `INSUFFICIENT_STOCK` 422 carries `{ shortages }` details; fractional product quantities rejected with `FRACTIONAL_STOCK`). Records StockMovement rows (`OUT`, reference = invoice no) and an `INVOICE_FINALIZED` audit entry.
  - `cancelInvoice` — PENDING/PARTIALLY_PAID only, and only when no COMPLETED payments exist; restores stock (`IN` movements, reference = invoice no), stamps `cancelledAt`, and audits `INVOICE_CANCELLED`.
  - `addPayment` — records a payment against PENDING/PARTIALLY_PAID/PAID invoices; overpayment is rejected (`PAYMENT_EXCEEDS_BALANCE`, 422); status auto-transitions to PARTIALLY_PAID or PAID; balances are always computed from COMPLETED payments (money is never stored). `listPayments` returns method/status/reference/note/paidAt/acting user.
  - `updateInvoice`/`deleteInvoice` guard to DRAFT only (409).
- Added API routes: `POST /api/invoices/[id]/finalize`, `POST /api/invoices/[id]/cancel`, `GET/POST /api/invoices/[id]/payments` — all gated by `invoices:view`; payment POST validates the body and audits `INVOICE_PAYMENT_RECEIVED` (422 on bad input).
- Updated `src/lib/services/quotations.ts` `convertQuotation` to create a **DRAFT** invoice (stock is deducted only at finalize, not on conversion).
- Extended the feature client layer `src/features/invoices/{types,api,hooks}.ts` with `dueDate`/`paidAmount`/`balance`/`cancelledAt` and `PaymentDetail`/`PaymentMethod` types, `finalize`/`cancel`/`listPayments`/`addPayment` API calls, and `useFinalizeInvoice`/`useCancelInvoice`/`useInvoicePayments`/`useAddPayment` hooks (invalidate invoices/inventory/inventory-movements/customer keys).
- Updated `InvoiceFormDialog` (`invoice-form-dialog.tsx`): removed the status selector (always Draft), added a Payment due date field.
- Added `PaymentFormDialog` (`src/features/invoices/payment-form-dialog.tsx`): amount/method/reference/note/paid date, outstanding balance shown, defaults paid date to today.
- Updated `invoices-view.tsx`: added a due date column and a Paid (paid/total) column; row menu now follows the lifecycle — Finalize (DRAFT), Record payment (PENDING/PARTIALLY_PAID/OVERDUE), Cancel (unpaid PENDING/OVERDUE), Edit/Delete (DRAFT); confirmation dialogs + payment form wired.
- Updated `invoice-detail-page.tsx`: lifecycle buttons (Finalize / Cancel / Record payment), a payment summary card (Total / Paid / Balance due), a payments history table, and confirmation dialogs.

**Verification:** `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass. Fixes made during this pass: regenerated the stale Prisma client (new `dueDate` field + enum values), removed an unused `InvoiceStatus` import, and Prettier-formatted the six rewritten files. Live browser E2E of the invoice flow is still pending.

## Sprint 4 (Part 2) — Billing · Invoices (Complete)

**Date:** 2026-08-02

**Goal:** Implement the invoice half of the billing sprint: invoice CRUD with GST-aware line items, a draft/pending lifecycle (locked statuses reserved for later sprints), server-computed totals, a detail page, and audit logging — mirroring the quotation engine.

**Changes:**

- Added `INVOICE_UPDATED`/`INVOICE_DELETED` to the `AuditAction` enum in `prisma/schema.prisma`; generated and applied migration `20260802131951_add_invoice_update_delete_audit`.
- Extracted the shared document-number helpers from `quotations.ts` into `src/lib/services/document-numbers.ts` (`formatDocumentNumber`, `nextInvoiceNumber`, `nextQuotationNumber`, `TransactionClient`); quotations now import them (removes duplicated logic).
- Added shared Zod schemas in `src/lib/validations/invoice.ts`: create/update (customer, invoice date, status restricted to DRAFT/PENDING, notes ≤ 2000, 1–100 line items each with product/description/quantity/unit price/GST 0–100). Locked statuses (PARTIALLY_PAID/PAID/OVERDUE/CANCELLED/VOID) are never accepted from the client and are reserved for the payments and cancellation sprints. No discount field exists (confirmed out of scope).
- Added the service layer `src/lib/services/invoices.ts`:
  - `listInvoices` — search (invoice number, customer name), status filter, pagination, newest first.
  - `getInvoice`/`createInvoice`/`updateInvoice`/`deleteInvoice` — CRUD over invoice + line items; money fields are always system-computed (quantity × unit price).
  - `computeTotals` — splits GST into CGST + SGST (rate/2 each) for intra-state customers and charges IGST for inter-state customers, comparing the customer's state against the company settings' state (identical to quotations).
  - `assertEditable` — only DRAFT/PENDING invoices can be edited or deleted; locked statuses reject with 409 `CONFLICT`.
  - Invoice numbering from `CompanySettings` (`nextInvoiceNo`, `INV-0001` format).
- Added API routes (all guarded by the existing `invoices:view` permission via `requireApiPermission`):
  - `GET /api/invoices`, `POST /api/invoices` → 201 + `INVOICE_CREATED` audit.
  - `GET/PATCH/DELETE /api/invoices/[id]` — PATCH/DELETE refuse locked statuses (409) and audit `INVOICE_UPDATED`/`INVOICE_DELETED`.
- Added the feature client layer `src/features/invoices/{types,api,hooks}.ts` — `useInvoices`, `useInvoice`, and create/update/delete mutations; mutations invalidate `["invoices"]`, `["invoice"]`, and `["customers"]` query keys.
- Added `/invoices` page (`src/app/(app)/invoices/page.tsx` + `src/features/invoices/invoices-view.tsx`): debounced search, status Select filter (all 7 statuses), paginated table (invoice number, customer, date, status badge, total) with a row dropdown (Edit / Delete — disabled for locked statuses), empty/error/loading states, and an `InvoiceStatusBadge` component (7 statuses).
- Added `InvoiceFormDialog` (`src/features/invoices/invoice-form-dialog.tsx`): React Hook Form + `zodResolver`, customer and product comboboxes, a line-item editor with live per-item amounts, a live CGST/SGST/total summary, and status/notes fields. Editing recomputes the combined GST rate from the stored CGST/IGST split (same approach as quotations).
- Added `/invoices/[id]` detail page (server component `src/app/(app)/invoices/[id]/page.tsx` loads `CompanySettings`; client `src/features/invoices/invoice-detail-page.tsx` renders): invoice header with status + total, Bill-To/From cards, a line-items table, totals summary + notes, and Edit / Delete actions (both disabled for locked statuses) with confirmation dialogs. No print button yet (PDF/print is out of scope for Part 2).

**Verification:** `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass. Fixes made during this pass: regenerated the stale Prisma client (new enum values) so `INVOICE_UPDATED`/`INVOICE_DELETED` typecheck, and removed an unused `TransactionClient` import left in `quotations.ts` after the extraction. Live browser E2E of the invoice flow is still pending.

## Sprint 4 (Part 1) — Billing · Quotations (Complete)

**Date:** 2026-08-02

**Goal:** Implement the quotations half of the billing sprint: quotation CRUD with GST-aware line items, a status lifecycle (DRAFT/SENT/ACCEPTED/REJECTED plus system-computed EXPIRED and CONVERTED), duplication, conversion to invoices, a printable detail page, and audit logging.

**Changes:**

- Added the `QuotationStatus` enum (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED) and `QUOTATION_CREATED`/`QUOTATION_UPDATED`/`QUOTATION_DELETED`/`QUOTATION_CONVERTED` audit actions to `prisma/schema.prisma`; generated and applied migration `20260802101627_add_quotation_status_and_audit`.
- Added shared Zod schemas in `src/lib/validations/quotation.ts`: create/update (customer, date, valid-until, status restricted to the user-settable values, notes, 1–100 line items each with product/description/quantity/unit price/GST 0–100), duplicate (status only), and convert (optional order/dc references). EXPIRED and CONVERTED are system-computed and never accepted from the client.
- Added the service layer `src/lib/services/quotations.ts`:
  - `listQuotations` — search (quotation number, customer name), status filter with EXPIRED resolved from `validUntil` in SQL, pagination, newest first.
  - `getQuotation`/`createQuotation`/`updateQuotation`/`deleteQuotation` — CRUD over quotation + line items; money fields are always system-computed from quantity × unit price.
  - `computeTotals` — splits GST into CGST + SGST (rate/2 each) for intra-state customers and charges IGST for inter-state customers, comparing the customer's state against the company settings' state.
  - `duplicateQuotation` — copies the source under a fresh number with a new date.
  - `convertQuotation` — creates a PENDING invoice copying the customer, line items, and totals, marks the source CONVERTED, and never touches inventory; already-CONVERTED/EXPIRED/REJECTED sources are rejected with 409.
  - Document numbering sequences from `CompanySettings` (`nextQuotationNo`/`nextInvoiceNo`) via `formatDocumentNumber`.
- Added API routes (all guarded by the existing `quotations:view` permission via `requireApiPermission`):
  - `GET /api/quotations`, `POST /api/quotations` → 201 + `QUOTATION_CREATED` audit.
  - `GET/PATCH/DELETE /api/quotations/[id]` — PATCH/DELETE refuse CONVERTED quotations (409) and audit `QUOTATION_UPDATED`/`QUOTATION_DELETED`.
  - `POST /api/quotations/[id]/duplicate`, `POST /api/quotations/[id]/convert` → 201; convert also writes a `QUOTATION_CONVERTED` audit entry.
- Added the feature client layer `src/features/quotations/{types,api,hooks}.ts` — `useQuotations`, `useQuotation`, and create/update/delete/duplicate/convert mutations; mutations invalidate `["quotations"]`, `["quotation"]`, and `["customers"]` query keys.
- Added `/quotations` page (`src/app/(app)/quotations/page.tsx` + `src/features/quotations/quotations-view.tsx`): debounced search, status Select filter, paginated table (quotation number, customer, date, valid-until, status badge, total) with a row dropdown (Duplicate / Edit / Convert to invoice / Delete), empty/error/loading states, and a `QuotationStatusBadge` component.
- Added `QuotationFormDialog` (`src/features/quotations/quotation-form-dialog.tsx`): React Hook Form + `zodResolver`, customer and product comboboxes, a line-item editor with live per-item amounts, a live CGST/SGST/total summary, and status/notes fields. Editing recomputes the combined GST rate from the stored CGST/IGST split.
- Added `/quotations/[id]` detail page (server component `src/app/(app)/quotations/[id]/page.tsx` loads `CompanySettings`; client `src/features/quotations/quotation-detail-page.tsx` renders): quotation header with status + total, Bill-To/From cards, a line-items table, totals summary + notes, and Print / Duplicate / Convert to invoice / Edit / Delete actions with confirmation dialogs.
- Added print support: `@media print` styles in `src/app/globals.css` (A4, monochrome `[data-print-area]`) and `print:hidden` chrome (sidebar/top bar/bottom nav) in `src/components/layout/app-shell.tsx` so the detail page prints cleanly.

**Verification:** `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass; `prisma migrate status` shows the local PostgreSQL instance is up to date. Fixes made during this pass: regenerated the stale Prisma client (new enum values), switched the update payload to `Prisma.QuotationUncheckedUpdateInput` so `customerId` can be updated, widened the convert signature to accept `Date | null` for order/dc dates, and derived the combined GST rate in the form dialog from the stored CGST/IGST split. Live browser E2E of the quotations flow is still pending.

## Sprint 3 — Customers (Complete)

**Date:** 2026-08-02

**Goal:** Implement the customer module: customer CRUD, search/filter/pagination, a detail page with history, and audit logging — reusing the Sprint 2 API and feature conventions.

**Changes:**

- Added shared Zod schemas in `src/lib/validations/customer.ts` (`customerCreateSchema`/`customerUpdateSchema`): name required (1–200), email (≤200), phone (`/^[0-9+\-\s()]{7,20}$/`), address (≤500), city/state (≤100), pincode (`/^[0-9]{6}$/`), GSTIN (uppercased, Indian GSTIN pattern). Empty strings are normalized to `null` via `z.preprocess` so an edit that clears an optional field explicitly nulls it out on update (instead of silently keeping the previous value).
- Added the service layer `src/lib/services/customers.ts` — `listCustomers` (search name/email/phone/GSTIN, city/state filters, pagination, plus distinct city/state filter options in the same transaction), `getCustomer`, `createCustomer`, `updateCustomer`, `deleteCustomer` (soft delete via `deletedAt`, preserves invoice/quote references), and `listFilterOptions`. The list returns invoice/quote counts per customer.
- Added API routes (both guarded by the existing `customers:view` permission via `requireApiPermission`):
  - `GET /api/customers` — search/city/state filters + pagination; `POST /api/customers` → 201 + `CUSTOMER_CREATED` audit.
  - `GET /api/customers/[id]`, `PATCH` (`CUSTOMER_UPDATED` audit), `DELETE` (soft delete + `CUSTOMER_DELETED` audit).
- Added `CUSTOMER_DELETED` to the `AuditAction` enum in `prisma/schema.prisma`; generated and applied migration `20260802095000_add_customer_delete_audit`.
- Added the feature client layer `src/features/customers/{types,api,hooks}.ts` — `useCustomers`, `useCustomer`, `useCreateCustomer`, `useUpdateCustomer`, `useDeleteCustomer` with query keys `["customers"]`/`["customer"]`.
- Added `/customers` page (`src/app/(app)/customers/page.tsx`): search (debounced), city/state Select filters, paginated table (name, phone, city, state, GSTIN, invoice/quote counts) with row dropdown (View/Edit/Delete), and a customer add/edit dialog (`CustomerFormDialog`) using React Hook Form + `zodResolver`. Delete confirmation warns when the customer already has invoices.
- Added `/customers/[id]` detail page (`src/app/(app)/customers/[id]/page.tsx`): profile card, invoice/quote stat cards, activity placeholder (reserved for the billing sprint), edit + delete actions, loading/not-found states.
- The Customers entry already existed in the sidebar/bottom nav from the initial scaffold; no navigation or RBAC changes were needed.

**Verification:** `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass. Live E2E against PostgreSQL (running dev server): unauthenticated → 401; create → 201; invalid input → 422 with issue details; search + city filter + pagination; single GET; PATCH → 200; DELETE soft-delete → 200 (`deletedAt` set), subsequent GET → 404, excluded from lists; unknown id → 404; `CUSTOMER_CREATED`/`CUSTOMER_UPDATED`/`CUSTOMER_DELETED` audit rows all written. Code-review pass found one data-correctness bug — optional fields could never be cleared via edit (empty input normalized to `undefined`, which PATCH skips) — fixed by normalizing empty strings to `null` in the shared schema so clearing now writes `NULL`; re-verified end-to-end (PATCH `{"email":null,"phone":null}` clears them while keeping other fields; create with empty strings stores `NULL`). Note: after adding the `CUSTOMER_DELETED` enum value, the long-running dev server had to be restarted so its in-memory Prisma client would accept the new action; re-verified end-to-end after restart (create + delete produced both audit rows).

## Inventory Management Module (Complete)

**Date:** 2026-08-02

**Goal:** Add a dedicated Inventory Management module on top of the existing products/inventory backend: an `/inventory` page with current stock levels and a movement-history (audit-trail) view, plus dedicated inventory API routes.

**Changes:**

- Added `GET /api/inventory` — lists current stock for active products with search (name/SKU/HSN), category filter, stock-status filter (`all`/`in`/`low`/`out`, Zod-validated → 422 on invalid), pagination, and a summary (total/in-stock/low/out-of-stock counts). Search and category run in SQL; the low/in/out status is evaluated in JS because Prisma cannot compare the `quantity` and `lowStockAt` columns in a `WHERE` clause.
- Added `GET /api/inventory/movements` — paginated stock-movement audit trail, newest first, with product name search, movement-type filter (`all`/`IN`/`OUT`/`ADJUSTMENT`, Zod-validated), user attribution, and soft-deleted products kept visible for historical context.
- Extended `src/lib/services/inventory.ts` with `listInventory`, `listMovements`, and `computeStockStatus`; extended `src/lib/validations/inventory.ts` with `STOCK_STATUS_FILTERS`/`stockStatusFilterSchema` and `MOVEMENT_TYPE_FILTERS`/`movementTypeFilterSchema`.
- Added `/inventory` page (`src/app/(app)/inventory/page.tsx`) with two tabs — **Stock levels** (summary stat cards, search, category + status filters, current-stock table with low-stock/out-of-stock badges and per-row "Adjust stock", pagination) and **Movement history** (search, type filter, signed quantity/type badges, reason + acting user, pagination). Loading/empty/error states reuse the shared components.
- Added inventory feature client layer: `src/features/inventory/{types,api,hooks}.ts` (`inventoryApi.list`/`movements`, `useInventory`/`useInventoryMovements`).
- Extracted the stock status indicator from `products-view.tsx` into a shared `src/components/stock-status.tsx` (`StockStatusBadge`) and reused it in both Products and Inventory views (removes duplicated logic).
- Refactored `ProductStockDialog` to accept a generic `StockTarget { id, name, inventory }` so the same adjustment dialog is reused on the Inventory page; added `formatDateTime` to `src/lib/format.ts` for history timestamps.
- `src/features/products/hooks.ts` now invalidates the `inventory`/`inventory-movements` query keys alongside products/categories so stock edits refresh the Inventory page.
- Added "Inventory" to the sidebar navigation (`src/config/navigation.ts`) under the existing `products:view` permission (no new RBAC permission; bottom nav unchanged).
- Live E2E verification against PostgreSQL (production build + `next start`): unauthenticated → 401; inventory list + summary, status filter (`low` counts before/after an adjustment, `in`), invalid status → 422; movements list with user attribution + type filters, product-name search; stock adjustment via the existing endpoint still enforces non-negative (422 `NEGATIVE_STOCK`). Test stock was restored to its original level afterward.

**Verification:** `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass.

## Products & Inventory — Live Verification & Delete-Audit Gap Fix

**Date:** 2026-08-02

**Goal:** Live-verify the Product Management module against the running PostgreSQL instance and close the audit-logging gap so product deletions are tracked like category deletions.

**Changes:**

- Added `PRODUCT_DELETED` to the `AuditAction` enum in `prisma/schema.prisma`; generated and applied migration `20260802094000_add_product_delete_audit`.
- Wired best-effort `logAudit` into the product DELETE route handler (`src/app/api/products/[id]/route.ts`) with entity type/id and name metadata, mirroring the category convention.
- Live E2E verification of the products & inventory APIs against PostgreSQL (production build + `next start`):
  - Unauthenticated requests (GET/POST `/api/products`, POST `/api/products/[id]/stock`) → 401.
  - Create → 201; `Inventory` row + opening `StockMovement` created in the same transaction.
  - Duplicate `(category, name)` → 409; invalid input → 422 with issue details; invalid JSON → 400.
  - Search by name/SKU/HSN, category filter, pagination (`page`/`pageSize`/`totalPages`), single GET, unknown id → 404.
  - PATCH update → 200; PATCH with invalid values → 422; PATCH to a non-existent category → 404.
  - Stock adjustments: `IN` → 35, `OUT` → 30, `ADJUSTMENT` (absolute) → 100 with low-stock threshold update; each movement recorded in `StockMovement` with the acting user; over-withdrawal → 422 `NEGATIVE_STOCK`; `IN`/`OUT` with quantity 0 → 422.
  - DELETE soft-delete → 200 (`deletedAt` set, row kept); subsequent GET → 404; excluded from lists.
  - Audit entries confirmed in `AuditLog`: `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_DELETED`, `INVENTORY_ADJUSTMENT` (×3), all user-attributed.
  - QA test records were soft-deleted through the app's own APIs; only the seeded sample data remains.

**Verification:** `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass.

## Category Module — Audit Gap Pass & Live Verification

**Date:** 2026-08-02

**Goal:** Verify the Category Management module against the running database and close the audit-logging gap so category mutations are tracked like product mutations.

**Changes:**

- Added `CATEGORY_CREATED`, `CATEGORY_UPDATED`, and `CATEGORY_DELETED` to the `AuditAction` enum in `prisma/schema.prisma`; generated and applied migration `20260802091929_add_category_audit_actions`.
- Wired best-effort `logAudit` into the category route handlers (`src/app/api/categories/route.ts`, `src/app/api/categories/[id]/route.ts`) with entity type/id and name metadata, mirroring the product convention.
- Live E2E verification of the categories API against PostgreSQL (production build + `next start`): unauthenticated → 401; create → 201; invalid input → 422; duplicate name → 409; search, pagination, single GET, PATCH, DELETE (soft-delete → 404 on subsequent GET); all three category audit actions confirmed in `AuditLog`.

**Verification:** `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass.

## Sprint 2 — Products, Categories & Inventory (Complete)

**Date:** 2026-08-02

**Goal:** Implement the products module: category CRUD, product CRUD, and inventory with stock movements and low-stock tracking.

**Changes:**

- Added `src/lib/errors.ts` — `DomainError` for expected business-rule failures (e.g. negative stock).
- Added `src/lib/api.ts` — consistent API response helpers (`ok`, `fail`, `fromError`, `requireApiPermission`, `getPaginationParams`) and the `{ data }` / `{ error: { code, message, details? } }` contract.
- Added `src/lib/format.ts` — `formatMoney`, `formatNumber`, `formatDate` (en-IN INR).
- Added `src/lib/audit.ts` — best-effort `logAudit` helper (audits product creates/updates and inventory adjustments).
- Added `src/lib/client/api.ts` — typed `apiFetch` wrapper + `ApiError` for client calls.
- Added Zod schemas in `src/lib/validations/` (`category`, `product`, `inventory`, `helpers`) reused by both API routes and client forms.
- Added services in `src/lib/services/` (`categories`, `products`, `inventory`) — thin route handlers delegate here; product creation opens Inventory + StockMovement in a transaction; stock adjustments can never go negative and always record a movement; category deletion cascade-soft-deletes its products.
- Added API routes: `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/[id]`, `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/[id]`, `POST /api/products/[id]/stock` — all guarded by the `products:view` permission.
- Added `/products` page (`src/app/(app)/products/page.tsx`) with Products and Categories tabs.
- Added reusable UI: `SearchInput`, `ConfirmDialog`, `TableSkeleton`, `TablePagination`, `ErrorState`, plus a `useDebouncedValue` hook.
- Added feature UI under `src/features/products/` — products/categories views, product form, category form, stock-adjust dialog, and TanStack Query hooks.
- Renumbered the roadmap so this sprint is Sprint 2; User Management moved to a later sprint.

**Verification:** `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass. Live CRUD requires PostgreSQL (not yet provisioned).

## Sprint 1 — Authentication (Complete)

**Date:** 2026-08-02

**Goal:** Implement the complete authentication module: login, logout, protected routes, session handling, current authenticated user, and RBAC.

**Changes:**

- Added `src/config/rbac.ts` — role (`ADMIN`, `STAFF`) and permission constants, role→permission mapping, and type guards/`hasPermission` helper.
- Added `src/lib/auth/current-user.ts` — server-side `getCurrentUser()`, `requireUser()`, `can()`, and `requirePermission()` helpers that resolve the Better Auth session and load role/permissions from Prisma.
- Added login page `src/app/(auth)/login/page.tsx` and `src/components/auth/login-form.tsx` (React Hook Form + Zod + Better Auth `signIn.email`).
- Added `src/components/layout/user-menu.tsx` — top-bar account menu with avatar, name, email, role badge, and sign out.
- Protected all `(app)` routes via `requireUser()` in `src/app/(app)/layout.tsx`; layout now passes the resolved user/role/permissions into the app shell.
- Made sidebar, top bar, and bottom nav user/permission-aware; Settings navigation is admin-only.
- Added `prisma/seed.ts` (idempotent roles/permissions/admin-user seed) plus `db:seed` script and Prisma config `migrations.seed`.
- Fixed missing typography tokens in `src/app/globals.css` so the DESIGN.md scale (`text-headline-*`, `text-body-*`, `text-label-md`, `text-mono-sm`) actually applies.

**Verification:** `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` all pass. The seed and live login flow require PostgreSQL (not yet provisioned).

## Sprint 0 — Project Foundation (Complete)

**Date:** prior (see git history)

**Goal:** Replace the MERN app with the documented Next.js stack and prepare the architecture for all planned modules.

**Changes:** Scaffolded Next.js 16 + TypeScript + Tailwind 4; configured Prisma 7 with the full data model and initial migration; wired Better Auth (route handler + client); installed shadcn/ui and the design system; added ESLint/Prettier, npm scripts, `.env.example`, path aliases; built the app shell and shared components.
