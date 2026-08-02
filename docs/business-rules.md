# Business Rules

## Authentication

- Only authenticated users may access the dashboard.
- Access is controlled through roles.

## Products

- Product names should be unique within a category.
- Price cannot be negative.
- Stock cannot become negative.

## Customers

- Customers cannot be permanently deleted if invoices exist.
- Customer history must remain available.

## Quotations

- Quotations do not affect inventory.
- Quotations may expire.
- Expired quotations cannot be converted into invoices.

## Invoices

- Invoice numbers must be unique.
- Invoice totals are system calculated.
- Paid invoices cannot be edited.
- Cancelled invoices must restore inventory.
- Invoice Items are immutable after payment.

## Inventory

- Every stock change must be logged.
- Inventory cannot become negative.
- Manual adjustments require an audit log.

## Payments

- Payment cannot exceed invoice amount.
- Invoice status updates automatically after payment.
- Partial payments are supported if enabled.

## Audit

Every critical action must be logged.

Examples:

- Login
- Invoice Creation
- Invoice Cancellation
- Inventory Adjustment
- User Role Changes
- Settings Changes
