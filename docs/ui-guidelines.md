# UI Guidelines

## Design Reference

The HTML files inside `design_references/` are visual references only.

Do not copy HTML directly.

Recreate the design using the project technology stack.

## Design Goals

- Professional
- Minimal
- Business focused
- Consistent
- Fast
- Accessible

## Layout

- Persistent Sidebar
- Top Navigation
- Responsive Content Area
- Consistent Page Headers

## Components

Create reusable components for:

- Buttons
- Inputs
- Tables
- Cards
- Dialogs
- Forms
- Badges
- Dropdowns
- Pagination
- Empty States

## Styling

- Tailwind CSS only. No hex literals in components, no inline styles except for
  runtime-computed values (chart heights, data-driven bar widths).
- All colour comes from the tokens in `src/app/globals.css` ("Technical Precision", dark only):
  `background` / `surface-container` / `surface-container-high` for tone, `outline-variant` for
  every boundary, `primary` (`#8ab4f8`) for accents and `brand-solid` (`#1a73e8`) for the one
  solid action fill. Status uses `success` / `warning` / `error` / `violet`.
- Cards use the `TonalCard` primitive.
- Use shadcn/ui components.
- Maintain consistent spacing.
- Maintain consistent border radius.
- Maintain consistent shadows.

## Tables

- Sticky headers
- Pagination
- Sorting
- Filtering
- Loading state
- Empty state

## Forms

- React Hook Form
- Zod Validation
- Clear validation messages

## UX

- Loading indicators
- Success feedback
- Error feedback
- Confirmation dialogs for destructive actions

Maintain a consistent visual language across every page.
