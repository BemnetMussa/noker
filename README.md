# TemplateStack

A production-ready fullstack starter template built with Next.js, TypeScript, PostgreSQL, Prisma, BetterAuth, TailwindCSS, and shadcn/ui.
## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 16 (App Router)             |
| Language       | TypeScript                          |
| Database       | PostgreSQL                          |
| ORM            | Prisma                              |
| Authentication | BetterAuth                          |
| Styling        | TailwindCSS v4 + shadcn/ui         |
| Validation     | Zod + React Hook Form               |
| Deployment     | Vercel                              |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
- npm

### 1. Clone and Install

```bash
git clone https://github.com/BemnetMussa/TemplateStack.git
cd TemplateStack
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/templatestack"
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set Up the Database

```bash
npx prisma migrate dev --name init
```

This creates the database tables and generates the Prisma client.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                  # Next.js App Router (pages, layouts, API routes)
│   ├── (auth)/           # Auth pages (login, signup)
│   ├── (dashboard)/      # Protected pages (dashboard)
│   └── api/auth/         # BetterAuth API handler
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # Navbar, Sidebar, UserMenu
│   └── forms/            # LoginForm, SignupForm
├── features/             # Feature modules
│   └── auth/             # Auth client
├── server/               # Server-only code
│   ├── auth.ts           # BetterAuth configuration
│   └── db.ts             # Prisma client singleton
├── shared/               # Shared between client and server
│   ├── validators/       # Zod schemas
│   └── utils/            # API response helpers, error handling
├── lib/                  # Third-party helpers (cn utility)
├── generated/prisma/     # Prisma generated client (do not edit)
└── proxy.ts              # Route protection (Next.js 16 proxy)
```

## Key Features

- **Authentication** — Email/password signup, login, logout, and session handling via BetterAuth.
- **Protected Routes** — Middleware-based cookie check + server-side session validation in layouts.
- **Form Validation** — React Hook Form with Zod schemas shared between client and server.
- **Dashboard Layout** — Responsive sidebar navigation with mobile sheet drawer.
- **API Utilities** — Consistent `successResponse` / `errorResponse` helpers and `AppError` class.

## Available Scripts

| Command                    | Description                        |
| -------------------------- | ---------------------------------- |
| `npm run dev`              | Start development server           |
| `npm run build`            | Build for production               |
| `npm start`                | Start production server            |
| `npm run lint`             | Run ESLint                         |
| `npx prisma migrate dev`  | Run database migrations            |
| `npx prisma generate`     | Regenerate Prisma client           |
| `npx prisma studio`       | Open Prisma Studio (DB browser)    |

## Deploy to Vercel

1. Push your repo to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Add environment variables in the Vercel dashboard:
   - `DATABASE_URL` — Your production PostgreSQL connection string
   - `BETTER_AUTH_SECRET` — A strong random secret
   - `BETTER_AUTH_URL` — Your production URL (e.g., `https://your-app.vercel.app`)
   - `NEXT_PUBLIC_APP_URL` — Same as `BETTER_AUTH_URL`
4. Vercel auto-detects Next.js. The `postinstall` script in `package.json` runs `prisma generate` automatically during deployment.

## AI Guidance

- See `AI_RULES.md` for architecture conventions and where to add new features.
- See `.cursorrules` for Cursor-specific code generation rules.

## License

MIT
