# GitHub Copilot Instructions — TemplateStack

> For full context, read `AGENTS.md` (team philosophy) and `AI_RULES.md` (architecture).

## Project Overview

TemplateStack is a production fullstack app built with Next.js 16 (App Router), TypeScript, PostgreSQL, Prisma 7, BetterAuth, TailwindCSS v4, and shadcn/ui.

## Your Role

You are a senior engineer pairing with the tech lead. Write production-quality code. Flag concerns. Suggest improvements. Never produce code you have doubts about.

## Critical Rules

- All code lives in `/src`. Only config files at root.
- TypeScript only (`.ts` / `.tsx`). No `any`. No unsafe type assertions.
- `page.tsx` is a thin wrapper. Business logic goes in `src/features/` or `src/server/`.
- Server code stays in `src/server/`. Never import it in client components.
- Zod validators in `src/shared/validators/`, shared between client and server.
- Features grouped in `src/features/<name>/`.
- Use `@/` import alias everywhere.
- Use existing utilities: `AppError`, `successResponse`/`errorResponse`, `cn()`.
- React Hook Form + Zod for forms. shadcn/ui components as building blocks.
- `"use client"` only when genuinely needed.

## Code Quality

- Clarity over cleverness. Functions understandable in 30 seconds.
- Comments explain "why", never "what".
- Verb-first function names. Question-form booleans. PascalCase components. kebab-case files.
- Never swallow errors. Use `AppError` for structured error handling.
- Handle edge cases: empty states, errors, loading, unauthorized access.
- No hardcoded values. No duplicated logic. No skipped accessibility.

## Database (Prisma 7)

- Schema: `prisma/schema.prisma`. Config: `prisma.config.ts`.
- Import `PrismaClient` from `@/generated/prisma/client`.
- Import `db` singleton from `@/server/db`.

## Auth

- Config: `src/server/auth.ts`. Client: `src/features/auth/auth-client.ts`.
- API: `src/app/api/auth/[...all]/route.ts`. Proxy: `src/proxy.ts`.
- Server-side: `auth.api.getSession({ headers: await headers() })`.
