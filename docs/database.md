# Database Guidelines

## Database

- PostgreSQL
- Prisma ORM
- UUID Primary Keys
- UTC timestamps

## Core Entities

- Users
- Roles
- Customers
- Categories
- Products
- Inventory
- Quotations
- Quotations Items
- Invoices
- Invoice Items
- Payments
- Company Settings
- Audit Logs

## Common Columns

Every table should contain:

- id
- createdAt
- updatedAt
- deletedAt (where Soft Delete is used)

## Relationships

Customer → Many Invoices

Invoice → Many Invoice Items

Category → Many Products

Product → Many Invoice Items

User → Creates Invoices

Invoice → Payment

## Database Rules

- Use foreign keys.
- Use indexes on searchable fields.
- Use transactions for invoice creation.
- Never duplicate calculated totals.
- Store monetary values using Decimal.
- Never store derived data unless required for reporting.

## Naming

Tables:
snake_case

Columns:
camelCase in Prisma

Database:
snake_case

## Migration Rules

- Never edit existing migrations.
- Create new migrations only.
- Review migrations before applying.
