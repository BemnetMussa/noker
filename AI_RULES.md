# AI Rules — TemplateStack Architecture Guide

> For team philosophy, coding standards, and your role as an AI agent, read `AGENTS.md`.
> This document is the **technical reference** for the project architecture.

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 16 (App Router)             |
| Language       | TypeScript (strict)                 |
| Database       | PostgreSQL + Prisma 7               |
| Authentication | BetterAuth (email/password)         |
| Styling        | TailwindCSS v4 + shadcn/ui (v4)    |
| Validation     | Zod + React Hook Form               |
| Deployment     | Vercel                              |

## Folder Structure

```
src/
├── app/              → Next.js App Router pages and layouts
├── components/       → Reusable UI components
│   ├── ui/           → shadcn/ui primitives (auto-generated, do not edit)
│   ├── layout/       → Navbar, Sidebar, UserMenu
│   └── forms/        → Form components (login, signup, etc.)
├── features/         → Feature modules (domain logic, grouped by feature)
│   └── <name>/       → components/, hooks.ts, actions.ts, types.ts
├── server/           → Server-only code (auth, db, services)
├── shared/           → Code shared between client and server
│   ├── validators/   → Zod schemas (single source of truth)
│   └── utils/        → API response helpers, error handling
├── lib/              → Third-party integration helpers (cn utility)
├── generated/prisma/ → Prisma generated client (do not edit)
└── proxy.ts          → Next.js 16 proxy (route protection)
```

## Key Conventions

### 1. Pages are thin
`page.tsx` imports components and passes server-fetched data down. Business logic belongs in `src/features/` or `src/server/`. If a page file exceeds ~30 lines, logic should be extracted.

### 2. Server/client boundary
`src/server/` is server-only. Never import from it in files with `"use client"`. The proxy (`src/proxy.ts`) and layouts handle auth gating; client components read session via `authClient.useSession()`.

### 3. One validator, used everywhere
Zod schemas in `src/shared/validators/` are the single source of truth. The same schema validates form input on the client and request bodies on the server. Never duplicate validation logic.

### 4. Feature-first organization
New features get their own folder in `src/features/<name>/`. This folder can contain:
- `components/` — Feature-specific UI
- `hooks.ts` — Custom React hooks
- `actions.ts` — Next.js server actions
- `types.ts` — Feature-specific TypeScript types

### 5. Component hierarchy
- `src/components/ui/` — shadcn/ui primitives. Added via `npx shadcn@latest add <name>`. Do not manually edit.
- `src/components/layout/` — App-wide structural components (Navbar, Sidebar, UserMenu).
- `src/components/forms/` — Reusable form components.
- `src/components/` — Other shared components that do not fit the above categories.

### 6. TypeScript everywhere
No `.js` files. All code is `.ts` or `.tsx`. Strict mode is enabled. No `any`.

## Adding a New Feature (Step-by-Step)

1. **Plan the data model.** Add Prisma models to `prisma/schema.prisma`.
2. **Migrate.** Run `npx prisma migrate dev --name <description>` then `npx prisma generate`.
3. **Define validators.** Create `src/shared/validators/<feature>.ts` with Zod schemas.
4. **Server logic.** Add queries/mutations to `src/server/` (or use server actions in `src/features/<name>/actions.ts`).
5. **Build the feature module.** Create `src/features/<feature>/` with components, hooks, types.
6. **Wire up the page.** Create `src/app/<route>/page.tsx` — keep it thin.
7. **Protect if needed.** Add route to `src/proxy.ts` matcher. Validate session in the layout.

## Authentication Flow

```
Client (browser)
  │
  ├─ signIn/signUp ──→ authClient (src/features/auth/auth-client.ts)
  │                         │
  │                         ▼
  │                    POST /api/auth/* ──→ route.ts (src/app/api/auth/[...all]/route.ts)
  │                                              │
  │                                              ▼
  │                                         auth (src/server/auth.ts)
  │                                              │
  │                                              ▼
  │                                         Prisma (src/server/db.ts) ──→ PostgreSQL
  │
  ├─ Navigate to /dashboard
  │       │
  │       ▼
  │   proxy.ts (cookie check) ──→ redirect to /login if no session cookie
  │       │
  │       ▼
  │   Dashboard layout (server-side session validation via auth.api.getSession)
  │       │
  │       ▼
  │   Dashboard page renders
```

## Database (Prisma 7)

| Concept            | Location                                |
| ------------------ | --------------------------------------- |
| Schema             | `prisma/schema.prisma`                  |
| Config (URL, etc.) | `prisma.config.ts`                      |
| Client singleton   | `src/server/db.ts`                      |
| Generated client   | `src/generated/prisma/client`           |
| Driver adapter     | `@prisma/adapter-pg` (PostgreSQL)       |

**Commands:**
- `npx prisma migrate dev --name <desc>` — create and apply migration
- `npx prisma generate` — regenerate client after schema changes
- `npx prisma studio` — visual database browser

**Imports:**
- `import { PrismaClient } from "@/generated/prisma/client"`
- `import { db } from "@/server/db"`

## API Patterns

**Responses** — use helpers from `@/shared/utils/api-response`:
```typescript
return successResponse({ user }, 201);
return errorResponse("Not found", 404, "USER_NOT_FOUND");
```

**Errors** — use `AppError` from `@/shared/utils/errors`:
```typescript
throw new AppError("Email already in use", 409, "EMAIL_TAKEN");
```

**Handling** — wrap with `handleError()`:
```typescript
try {
  // ...
} catch (error) {
  const { message, statusCode, code } = handleError(error);
  return errorResponse(message, statusCode, code);
}
```
