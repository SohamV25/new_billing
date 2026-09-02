# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Billing Dashboard — a single Next.js (App Router) full-stack app for products, customers,
invoices, payments, inventory, quotations, reports, and settings. Postgres via Prisma,
Better Auth for auth, Tailwind v4 + shadcn/ui for the interface.

Read before starting work: `AGENTS.md` (hard rules), `IMPLEMENTATION_PLAN.md` (what to build
next), `docs/ui-guidelines.md`, `docs/coding-standards.md`, `docs/architecture.md`,
`docs/business-rules.md`. `AGENTS.md` wins on any conflict with this file.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build
npm run typecheck      # tsc --noEmit — run after every change
npm run lint           # eslint
npm run format         # prettier --write .
npm run db:migrate     # prisma migrate dev
npm run db:seed        # seed data
npm run db:studio      # prisma studio
```

There is no test suite. `npm run typecheck && npm run lint` is the verification gate.

## Architecture

- `src/app/(app)/*` — authenticated routes. Route files are thin: they render a feature page
  component and nothing else.
- `src/features/<module>/` — the real work. Each module holds `api.ts` (fetch layer),
  `hooks.ts` (TanStack Query hooks), `types.ts`, and its page/dialog/view components.
- `src/app/api/**/route.ts` — Route Handlers. Use `ok()` / `fail()` / `fromError()` and the
  auth guard from `src/lib/api.ts`; every response goes through them so the shape stays
  `{ data }` or `{ error: { code, message } }`. Never leak internal errors or stack traces.
- `src/components/` — shared components (`data-table`, `page-header`, `confirm-dialog`,
  `empty-state`, `error-state`, `form-field`, `table-pagination`, `table-skeleton`, …).
  `src/components/ui/` is shadcn/ui — extend rather than fork.
- `src/lib/` — prisma client, auth, formatting, csv, errors. `src/config/` — navigation, rbac.

Conventions: TypeScript strict, no `any`; files kebab-case, components PascalCase; Tailwind
only, no inline styles; path aliases (`@/…`); Prisma for all DB access, transactions for
multi-step writes; validate every request with Zod.

## UI work

Design tokens live in `src/app/globals.css` — the "Technical Precision" palette (dark only,
blue accent `--primary` `#8ab4f8`, solid action fill `--brand-solid` `#1a73e8`), with shadcn
semantic variables mapped onto them. Tailwind classes only: never a hex literal, an off-palette
Tailwind colour (`gray-400`, `emerald-400`, …), or an inline `style` for anything that isn't a
runtime-computed value. Cards go through `TonalCard`, not a repeated class string.
`design_references/` is visual reference only; recreate designs in our stack, never copy HTML.

Skills to invoke for UI tasks — load the skill _before_ writing the component, not after:

| Task                                                                                                 | Skill                                                             |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Any visual/design decision: layout, color, typography, spacing, icons, motion, product-type patterns | `ui-ux-pro-max`                                                   |
| Building or modifying components, pages, forms, responsive layouts, WCAG/a11y, state                 | `agent-skills:frontend-ui-engineering`                            |
| Any chart, graph, KPI tile, sparkline, or dashboard visualization (reports + dashboard modules)      | `dataviz`                                                         |
| Verifying a change in the real app (start it, click through, screenshot)                             | `run`, then `claude-in-chrome`                                    |
| Runtime debugging in the browser — DOM, console errors, network, rendering                           | `agent-skills:browser-testing-with-devtools`                      |
| Slow pages, Core Web Vitals, bundle/render regressions                                               | `agent-skills:webperf` or `agent-skills:performance-optimization` |
| Reviewing UI code before it lands                                                                    | `/code-review`, or `agent-skills:code-review-and-quality`         |
| A design supplied as a Figma file or figma.com URL                                                   | the Figma MCP skills (`/figma-use`, `/figma-generate-design`)     |

`artifact-design` / `artifact-diagramming` apply only to published Artifacts — not to this
app's code.

UI expectations that hold everywhere: tables get sticky headers, sorting, filtering,
pagination, loading and empty states; forms use React Hook Form + Zod with visible validation
messages; destructive actions get a confirm dialog; every async action gets loading, success,
and error feedback (`sonner` for toasts). Keep the visual language identical across modules.

## Working style

One feature at a time, then stop for review before starting the next module. Never modify
unrelated files or introduce breaking changes without approval. Improve an existing component
before creating a near-duplicate. When a sprint finishes, update `docs/project-log.md`,
`IMPLEMENTATION_PLAN.md`, and `README.md` if setup changed.

## Skill Routing & Execution Policy

- BEFORE running any complex task, inspect the installed skills in `.claude/skills/` and `~/.claude/skills/`.
- If a task involves domains covered by any installed skill, invoke that skill via the `Skill` meta-tool automatically.
- Multi-step tasks: chain together all relevant skills in sequence without asking for permission.
