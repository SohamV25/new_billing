# UI Redesign Plan

Status: Phases 1, 2, 3 and 5 complete (2026-09-02). Phases 4 and 6 pending.
The app is treated as **mobile-first** — it is used on phones in practice.

## Decisions

- **Palette:** Technical Precision blue — the spec already in
  `design_references/technical_precision/DESIGN.md`, matching `crm Dashboard/Dashboard Dark-1`.
- **Theme:** dark only. `next-themes` stays wired but tokens commit to dark.
- **Print document is out of scope.** `invoice-print-document.tsx` and the `@media print`
  block in `globals.css` match an approved reference and stay light-mode. Do not touch.

## Target tokens

| Role               | Value     | Use                                   |
| ------------------ | --------- | ------------------------------------- |
| canvas             | `#131314` | app background                        |
| card               | `#1E1F22` | cards, sidebar, table body            |
| elevated           | `#212327` | modals, popovers, table header, hover |
| border             | `#2D2F34` | every 1px boundary                    |
| on-surface         | `#E5E2E3` | primary text                          |
| on-surface-variant | `#C3C6D1` | secondary text                        |
| accent             | `#8AB4F8` | active nav, links, chart highlight    |
| primary            | `#1A73E8` | solid primary button                  |

Radius: 12px cards, 16px large dashboard sections, 8px buttons/inputs, pill for chips.
Type: Inter for UI, Geist for IDs and numeric/tabular data.

## Findings this plan addresses

1. Three unrelated palettes coexist — sidebar `#12141d`, page `#1a1a1a`, dashboard cards
   `#1a1d2e`, tables `#242424`.
2. ~113 hardcoded hex values across 25 files (93 × `#f97316`); the `globals.css` token set is
   unused by feature code; `TonalCard` has zero usages.
3. Six list pages render two headers — `*-page.tsx` `PageHeader` plus a hardcoded `<h1>` in
   `*-view.tsx`. `invoices-view.tsx:150` reads "Documents — Manage Your Documents &
   Certifications", copy left over from a mockup.
4. `invoices-view.tsx` imports `DropdownMenu` but never renders it; row Download/Share buttons
   have no `onClick`; Finalize/Cancel/Delete handlers and their confirm dialogs are unreachable.
5. `/invoices` has a segmented status filter and a status Select bound to the same state, plus a
   PO Reference column that always renders an em dash.
6. Mobile tables hide columns instead of collapsing to cards (see `mobile designs/`).
7. `StatusBadge` is dot+text where references use pill chips, and carries three parallel 24-key
   maps with `cancelled`/`canceled` duplicated.
8. `bottom-nav.tsx:44` uses an inline style, which `AGENTS.md` forbids.

## Reference inventory

Every file in `design_references/` and what it dictates. Reviewed 2026-09-02.

| Reference                                    | Drives                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `technical_precision/DESIGN.md`              | The palette, type scale, radii. Implemented (Phase 1).                                     |
| `mobile designs/Transactions.jpg`            | Label/value card rows on mobile. Implemented (Phase 5).                                    |
| `mobile designs/Tables Mobile*.jpg`          | Card-per-row lists. Implemented (Phase 5).                                                 |
| `table/Dark Table.png`                       | Pill status chips, per-row actions, numbered pagination. Chips still to do.                |
| `crm Dashboard/*.jpg`                        | KPI tiles, quick-action cards with circular arrow, muted bars + one highlight. Phase 4.    |
| `charts/*.png`, `dashboard/**`               | Chart treatment: one highlighted bar, tabbed range switcher, sparklines in tiles. Phase 4. |
| `account_stitch_billing/screen.png`          | **Settings as a grouped list** — see Phase 7.                                              |
| `new_bill_stitch_billing/screen.png`         | **Invoice form as a full-screen sheet** with sticky total bar — Phase 6.                   |
| `new_quotation_stitch_billing/screen.png`    | Same for quotations, plus Save Draft / Send split — Phase 6.                               |
| `bill_1002_stitch_billing/screen.png`        | **Invoice detail** layout + sticky action bar — Phase 6.                                   |
| `manage_customers_stitch_billing/screen.png` | Customer directory rows (avatar/name/email/chevron), FAB, ⌘K search — Phase 7.             |
| `awaiting_activation_stitch_billing/`        | Auth-screen language. Already followed by `/login`.                                        |
| `bill_preview/print.html`                    | The A4 print document. Implemented, out of scope.                                          |
| `new billing/`, `old billing/`               | Previous versions of this app, kept for reference only.                                    |

The six `*_stitch_billing/` screens are the most directly applicable — they are this product,
at phone width, in the blue palette. They were not consulted for Phases 1–5.

## Phases

Phases 1–2 are prerequisites. 3–6 ship independently, one at a time, review between each.

### Phase 1 — One palette, one source of truth — DONE

- Rewrite the `:root` token block and `@theme inline` map in `globals.css` to the table above.
- Replace all hardcoded hex in `src/components/` and `src/features/` with token classes.
- Make `TonalCard` the real card primitive (or delete it and standardize on one card class).
- Verify: no `#[0-9a-f]{6}` outside `globals.css` and the print document.

### Phase 2 — Structural breakage — DONE

- Delete the duplicate `<h1>` from the six list views; `PageHeader` owns page titles.
- Restore the invoice row dropdown: Finalize / Record payment / Edit / Cancel / Delete, gated by
  status exactly as `docs/project-status.md` describes.
- Remove the duplicate status filter and the dead PO Reference column.
- Remove the `bottom-nav.tsx` inline style.

### Phase 3 — Shared primitives — DONE

- `DataTable`: sticky header on `elevated`, row hover, alignment rules, numeric cells in Geist
  tabular-nums, right-aligned money.
- `StatusBadge`: pill chip, single map keyed by status with `{ label, className }`.
- `PageHeader`, `EmptyState`, `ErrorState`, `TableSkeleton`, `TablePagination`: consistent
  spacing rhythm (8px related, 16px sections, 32px major).

### Phase 4 — Dashboard and charts

- KPI cards on the reference pattern: label, large tabular value, delta with direction, optional
  sparkline.
- Rework the hand-rolled SVG charts (`trend-chart`, `status-donut`, `category-sales`): muted
  series with one highlighted bar, readable axis contrast, tabbed range switcher, hover tooltips.
- No charting dependency — `AGENTS.md` discourages new libraries and the SVG approach is sound.

### Phase 5 — Mobile — DONE

- Card-per-row lists below `md` instead of hidden columns, per `mobile designs/`.
- Sheet-based filters; verify touch targets.

### Phase 6 — Detail pages and forms (revised against the stitch screens)

`new_bill_stitch_billing`, `new_quotation_stitch_billing` and `bill_1002_stitch_billing` specify
this concretely:

- **Invoice / quotation form** becomes a full-screen sheet on mobile: `X  New Bill  [Draft]`
  header; grouped field sections with caption labels; each line item a card carrying
  QTY / PRICE / AMOUNT with inline inputs and a delete icon; a dashed "+ Add Item" button; a
  **sticky bottom bar** with the running Total and the primary action. Quotations additionally
  split the action into Save Draft / Send Quotation.
- **Invoice detail**: summary card pairing CLIENT against TOTAL AMOUNT (accent, large), then
  issued/due dates; a LINE ITEMS card with a tinted header row and description + sub-line per
  item; a payment-confirmation card; and a sticky bottom action bar (Download PDF / Share /
  Mark as Paid).
- This replaces the current 961-line dialog on mobile. It is the largest remaining piece of work
  and the one that matters most, since creating invoices is the app's core job.

### Phase 7 — Navigation and settings (new, from the stitch screens)

- **Settings as a grouped list** (`account_stitch_billing`): caption headers in accent, cards of
  rows with leading icon + label + chevron and an optional trailing value ("Theme & Display —
  Dark"), and a destructive outlined Sign Out. This supersedes the mobile Select added in
  Phase 5, which was a stopgap.
- **Customer directory rows** (`manage_customers_stitch_billing`): avatar initials tile + name +
  email + chevron, rather than the generic label/value card. Data-dense lists (invoices,
  payments) keep the label/value card, which `Transactions.jpg` confirms.
- Section header pattern: `ACTIVE CUSTOMERS (24)` with an inline `+ ADD NEW` text action.
- A FAB for the primary create action, and the top bar carrying avatar + app name + notifications.

## Skills

Load `ui-ux-pro-max` before visual work, `agent-skills:frontend-ui-engineering` for components
and forms, `dataviz` before Phase 4. See `CLAUDE.md`.

## Verification

`npm run typecheck && npm run lint && npm run build` after every phase, then check the affected
pages in Chrome at 400px and at desktop width. There is no test suite.
