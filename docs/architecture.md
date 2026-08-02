# System Architecture

## Architecture Style

This project follows a modular, feature-based architecture.

Frontend and backend should remain loosely coupled through REST APIs.

## High Level Flow

User

↓

Next.js Frontend

↓

API Layer

↓

Business Logic

↓

Prisma ORM

↓

PostgreSQL

## Major Modules

- Authentication
- User Management
- Customers
- Categories
- Products
- Inventory
- Quotations
- Billing
- Reports
- Dashboard
- Settings

Each module should be developed independently and integrated through well-defined APIs.

## Design Principles

- Single Responsibility Principle
- Feature-based organization
- Reusable UI components
- Shared validation logic
- Thin controllers
- Business logic separated from routing
- Database access only through Prisma

## Data Flow

UI

↓

Validation

↓

API

↓

Business Logic

↓

Database

↓

Response

↓

UI Update

## AI Development Strategy

Every implementation must focus on one module only.

No module should depend on unfinished features unless explicitly planned.

Architecture changes require approval before implementation.
