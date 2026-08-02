# Coding Standards

## Language

- TypeScript only.
- Strict mode enabled.
- Avoid `any`.

## Naming

Variables:
camelCase

Components:
PascalCase

Files:
kebab-case

Constants:
UPPER_SNAKE_CASE

## Components

- Keep components small.
- Prefer reusable components.
- One responsibility per component.
- Move repeated logic into hooks or utilities.

## Styling

- Tailwind CSS only.
- No inline styles.
- Reuse design tokens.
- Follow ui-guidelines.md.

## Backend

- Validate every request.
- Handle all errors.
- Return consistent responses.
- Never expose stack traces.

## Database

- Use Prisma only.
- Never write raw SQL unless required.
- Prefer transactions for multi-step operations.

## Imports

- Group imports.
- Remove unused imports.
- Prefer path aliases.

## Documentation

Complex business logic should include short comments explaining _why_, not _what_.

## AI Rules

AI must improve existing code before creating duplicate implementations.

Maintain consistency with the existing architecture.

Every generated code change should be production-ready.
