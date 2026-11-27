# web — FallWatch. Next.js App

The web app and API for **FallWatch.**, the bathroom fall detection system that uses Wi-Fi CSI
(ระบบตรวจจับการล้มอัจฉริยะด้วยปัญญาประดิษฐ์จากคลื่นไวไฟ, Project C2, 1/2569).
Admins manage accounts, houses, bathrooms and watchers. Users see their house and get email alerts when a fall happens.

**Owner:** พลกฤต สมทรง

## Progress

Plan from [`docs/Schedule.md`](../docs/Schedule.md) §2 (พลกฤต: web app + docs).
**Current target: up to W2–W3, Prisma schema + migrations → M2.**

| Week | Task | Status |
|---|---|---|
| W1 | `GIT_FLOW.md`, `CONVENTIONS.md`, repo setup | ✅ Done |
| W1–W2 | `DesignSystem.md` + wireframes of the main pages | ✅ Done |
| W2–W3 | Prisma schema + migrations → **M2** | ✅ Done and tested on PostgreSQL 16. Waiting for PR review. |
| W3–W5 | Next.js setup, Better Auth, accounts pages (WA-1 to WA-5) | 🟡 Started early: Next.js setup and page shells only |
| W5–W7 | Houses, bathrooms, baseline upload, watchers (WA-6 to WA-15) + audit logging → M5 | ⬜ Not started |
| W8–W10 | Fall dashboard, history, chart, heatmap view, SSE (WA-16) | ⬜ Not started |
| W9–W10 | User pages (WU-1 to WU-4) | ⬜ Not started |
| W10 | Audit log page (WA-17) | ⬜ Not started |
| W10–W11 | Test plan + web testing | ⬜ Not started |

### What's done

**W1: repo setup and team docs**
- [`GIT_FLOW.md`](../docs/GIT_FLOW.md) and [`CONVENTIONS.md`](../docs/CONVENTIONS.md) are written. The code follows them, and TODOs are written as `TODO(name): ...`.
- `web/` has `.gitignore`, `.editorconfig` (UTF-8, LF, 2 spaces) and `.gitattributes` (LF on every OS).
- Prettier, ESLint and `jsconfig.json` (the `@/` import path) are set up.

**W1–W2: design**
- [`DesignSystem.md`](../docs/DesignSystem.md) covers colors, fonts (Noto Sans Thai, Barlow, Poppins), layout, buttons, badges, stat cards, tables and the fall alert banner. It's adapted from the **Sedap** template (MIT), which sits in `sedap/` for reference and isn't committed.
- [`Wireframes.md`](../docs/Wireframes.md) has a layout for every page: login, admin dashboard, accounts, houses, bathrooms, watchers, audit log, user home, alert settings and the heatmap modal.

**W2–W3: database (M2)**
- [`prisma/schema.prisma`](prisma/schema.prisma) has all 9 tables from [`Design.md`](../docs/Design.md) §5.1: `accounts`, `houses`, `bathrooms`, `baselines`, `bathroom_watchers`, `fall_events`, `alert_deliveries`, `audit_logs` and `settings`. It also has the Better Auth tables `sessions`, `auth_accounts` and `verifications`.
- [`prisma/migrations/0001_init`](prisma/migrations/0001_init/migration.sql) creates the tables, the indexes on `fall_events(bathroom_id, detected_at DESC)` and `audit_logs(created_at DESC)`, and the `pg_notify('fall_events', id)` trigger used for real-time updates (SSE).
- [`prisma/seed.mjs`](prisma/seed.mjs) adds the default settings: `window_s`, `hop_s`, `confidence_threshold`, `cooldown_s` and `recalibration_months` = 6.
- Differences from `Design.md` §5.1, to raise in the M2 review:
  - Passwords are hashed by Better Auth and stored in `auth_accounts.password`, not in `accounts`.
  - An admin can delete another admin (WA-2). `audit_logs.actor_id` and `baselines.uploaded_by` become NULL instead of blocking the delete, and each audit row keeps `details.actorUsername`.
  - Calibration status isn't stored. It's worked out from `last_calibrated_at` + `recalibration_months` (WA-11).

**Started early (W3–W5)**
- The app shell (sidebar + topbar) and the menus for both roles.
- Page shells for `/login`, `/admin` and `/home`. These are UI only: no data yet, and **you can't log in yet**.

### Scope check (Chapter 1 §1.3.3 and §1.3.6)

The schema was tested on PostgreSQL 16. Each scope item was run as real queries, inside a transaction that was rolled back afterwards. **20/20 passed.**

| Scope (Chapter 1) | Covered by | Test |
|---|---|---|
| Add admin: username, password, full name, phone, email | `accounts` + `auth_accounts.password` | ✅ |
| Delete another admin, but not yourself | Deleting works and history is kept (`SET NULL`). The "not yourself" rule goes in the API. | ✅ |
| Add user, also with an address | `accounts.address` | ✅ |
| List users: username, email, house, number of bathrooms watched, date added | `accounts` + `house` + count of `bathroom_watchers` | ✅ |
| Turn a user account on or off | `accounts.is_active` | ✅ |
| Add, view and edit a house: name, address, date added, number of bathrooms, users | `houses` | ✅ |
| Add and edit a bathroom: name, Rx MAC, baseline file. A MAC can't be used twice. | `bathrooms.rx_mac` (unique) + `baselines` | ✅ |
| "ควรปรับเทียบใหม่" after 6 months | `last_calibrated_at` + `settings.recalibration_months` | ✅ |
| Link a user to a house, choose which bathrooms they watch, change or remove a pairing | `accounts.house_id`, `bathroom_watchers` | ✅ |
| Dashboard: at least 10 latest falls, 7-day chart, history with date, house, bathroom and heatmap | `fall_events` + index `(bathroom_id, detected_at DESC)` | ✅ |
| View and filter the audit log by who, action type and date | `audit_logs` + index `(created_at DESC)` | ✅ |
| User logs in with username or email | `username` and `email` are both unique | ✅ |
| User overview: bathrooms watched, family in the same house, at least 10 latest falls | `bathroom_watchers`, `accounts.house_id`, `fall_events` | ✅ |
| User sees alert status per bathroom and turns it on or off | `bathroom_watchers.alerts_enabled` | ✅ |
| Email alert when a fall happens | `alert_deliveries` (`channel` = `email`) | ✅ |
| VLM result: 2 states with a confidence value (§1.3.3) | `fall_events.confidence`, `result`, `model_version` | ✅ |
| Real-time dashboard updates | trigger `pg_notify('fall_events', id)`: notification received on insert | ✅ |

### Left to finish M2

- [x] Run `npx prisma migrate dev` against a real PostgreSQL. The migration applied, and the database matches `schema.prisma` with no drift.
- [ ] Open a PR into `develop` and get it reviewed by **พัลลภ + พลกฤต** (required for `prisma/`, `GIT_FLOW.md` §4).

### Next (W3–W5)

- Set up Better Auth in `lib/auth.js`: numeric IDs, `user.fields.name → fullName`, and the username plugin so users can log in with a username or email (WU-1).
- Wire up the login form, check the session and role on `/admin` and `/home`, and seed the first admin account.
- Build the accounts pages (WA-1 to WA-5).

## Stack

| Item | Choice |
|---|---|
| Framework | Next.js 15, App Router |
| Language | JavaScript (no TypeScript). JSDoc + zod for types. |
| Auth | Better Auth |
| ORM | Prisma 6 (schema in `prisma/schema.prisma`) |
| UI | Tailwind CSS + components adapted from the Sedap template (MIT) + Recharts |
| Real-time | Server-Sent Events (SSE) via PostgreSQL LISTEN/NOTIFY |

## Folder layout

```
web/
├─ app/
│  ├─ (auth)/login/      Login page (WU-1)
│  ├─ admin/             Admin pages (WA-*)
│  ├─ home/              User pages (WU-*)
│  └─ api/               Route handlers (see Design.md §6.2)
├─ components/           Shared UI: AppShell, Sidebar, Topbar
├─ lib/
│  ├─ db.js              Prisma client singleton
│  ├─ format.js          Date/time formatters (Asia/Bangkok)
│  ├─ auth.js            Better Auth config (W3–W5)
│  ├─ audit.js           Audit log helper (W5–W7)
│  └─ validators/        Zod schemas for API inputs
├─ prisma/
│  ├─ schema.prisma      Single source of truth for the DB schema
│  ├─ migrations/        SQL migrations
│  └─ seed.mjs           Default rows for the settings table
├─ public/               Static assets only (never heatmaps)
└─ sedap/                Sedap template, for reference only (git-ignored)
```

## How to run

Needs Node.js 20+ and PostgreSQL 16 (local, or in Docker).

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# → fill in DATABASE_URL, BETTER_AUTH_SECRET, etc.

# Create the tables and seed the settings
npx prisma migrate dev
npx prisma db seed

# Start the dev server → http://localhost:3000
npm run dev
```

A quick local database with Docker:

```bash
docker run -d --name fallwatch-db -p 5432:5432 \
  -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=fallwatch postgres:16
```

For now the pages run without a database. Only the Prisma commands need one. Until login is built, open `/admin` or `/home` directly to see the pages.

**Changing the schema:** edit `schema.prisma`, run `npx prisma migrate dev --name <change>`, and open a PR reviewed by พัลลภ + พลกฤต. Never edit a migration after it's merged.

## Environment variables

See `.env.example` for the full list. Required:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret for session signing |
| `NEXT_PUBLIC_APP_URL` | Public base URL (e.g. https://your-domain.com) |

## Code conventions

See [`docs/CONVENTIONS.md`](../docs/CONVENTIONS.md) §4 (JavaScript) and §5 (Database). Run `npm run lint` and `npm run format` before each commit.

Key rules:
- Server Components by default. `"use client"` only for state, events or SSE.
- Check the session and role on the server in every API route handler.
- Validate all inputs with zod.
- Every DB write includes an `audit_logs` row in the same transaction.
- Never put secrets in `NEXT_PUBLIC_*` env vars.
