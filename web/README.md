# web — Next.js App

The web front-end and API for the Fall Watch system.

**Owner:** พลกฤต สมทรง

## Stack

| Item | Choice |
|---|---|
| Framework | Next.js 15, App Router |
| Language | JavaScript (no TypeScript). JSDoc + zod for types. |
| Auth | Better Auth |
| ORM | Prisma (schema in `prisma/schema.prisma`) |
| UI | Tailwind CSS + shadcn/ui + Recharts |
| Real-time | Server-Sent Events (SSE) via PostgreSQL LISTEN/NOTIFY |

## Folder layout

```
web/
├─ app/
│  ├─ (auth)/login/      Login page
│  ├─ admin/             Admin pages (WA-*)
│  ├─ home/              User pages (WU-*)
│  └─ api/               Route handlers (see Design.md §6.2)
├─ components/           Shared UI components (PascalCase.jsx)
├─ lib/
│  ├─ db.js              Prisma client singleton
│  ├─ auth.js            Better Auth config
│  ├─ format.js          Date/time formatters (Asia/Bangkok)
│  ├─ audit.js           Audit log helper
│  └─ validators/        Zod schemas for API inputs
├─ prisma/
│  └─ schema.prisma      Single source of truth for the DB schema
└─ public/               Static assets only (never heatmaps)
```

## How to run (once setup is done)

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# → fill in DATABASE_URL, BETTER_AUTH_SECRET, etc.

# Run database migrations
pnpm prisma migrate dev

# Start dev server
pnpm dev
```

## Environment variables

See `.env.example` for the full list. Required:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret for session signing |
| `NEXT_PUBLIC_APP_URL` | Public base URL (e.g. https://your-domain.com) |

## Code conventions

See `docs/CONVENTIONS.md` §4 (JavaScript) and §5 (Database).

Key rules:
- Server Components by default. `"use client"` only for state/events/SSE.
- Check session + role on the server in every API route handler.
- Validate all inputs with zod.
- Every DB write includes an `audit_logs` row in the same transaction.
- Never put secrets in `NEXT_PUBLIC_*` env vars.
