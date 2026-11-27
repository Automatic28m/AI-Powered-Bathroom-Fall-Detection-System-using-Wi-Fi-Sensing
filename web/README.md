# web — FallWatch. Next.js App

The web app and API for **FallWatch.**, the bathroom fall detection system that uses Wi-Fi CSI
(ระบบตรวจจับการล้มอัจฉริยะด้วยปัญญาประดิษฐ์จากคลื่นไวไฟ, Project C2, 1/2569).
Admins manage accounts, houses, bathrooms and watchers. Users see their house and get email alerts when a fall happens.

**Owner:** พลกฤต สมทรง

## Progress

Plan from [`docs/Schedule.md`](../docs/Schedule.md) §2 (พลกฤต: web app + docs).
**Current target: up to W3–W5, Next.js setup, Better Auth (login, roles), accounts pages (WA-1 to WA-5).** W5–W7 hasn't started.

| Week    | Task                                                                              | Status                                                                                                                           |
| ------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| W1      | `GIT_FLOW.md`, `CONVENTIONS.md`, repo setup                                       | ✅ Done. Root README, `.editorconfig`, `.gitattributes` and PR template are on branch `chore/repo-setup`, waiting for PR review. |
| W1–W2   | `DesignSystem.md` + wireframes of the main pages                                  | ✅ Done                                                                                                                          |
| W2–W3   | Prisma schema + migrations → **M2**                                               | ✅ `0001_init` merged into `develop` (PR #4). `0002_auth_serial_ids` waiting for review by พัลลภ → then M2 is frozen.             |
| W3–W5   | Next.js setup, Better Auth (login, roles), accounts pages (WA-1 to WA-5)          | ✅ Done and tested end to end. Waiting for PR review.                                                                            |
| W5–W7   | Houses, bathrooms, baseline upload, watchers (WA-6 to WA-15) + audit logging → M5 | ⬜ Not started                                                                                                                   |
| W8–W10  | Fall dashboard, history, chart, heatmap view, SSE (WA-16)                         | ⬜ Not started                                                                                                                   |
| W9–W10  | User pages (WU-1 to WU-4)                                                         | ⬜ Not started                                                                                                                   |
| W10     | Audit log page (WA-17)                                                            | ⬜ Not started                                                                                                                   |
| W10–W11 | Test plan + web testing                                                           | ⬜ Not started                                                                                                                   |

### What's done

**W1: repo setup and team docs**

- [`GIT_FLOW.md`](../docs/GIT_FLOW.md) and [`CONVENTIONS.md`](../docs/CONVENTIONS.md) are written. The code follows them, and TODOs are written as `TODO(name): ...`.
- `GIT_FLOW.md` now matches how the repo really works: feature branches start from and merge into **`develop`** (the default branch). `main` only gets `develop` at milestones, and milestone tags go on `main`.
- The repo root has a `README.md`, `.editorconfig` (UTF-8, LF, 2 spaces; 4 for Python/C), `.gitattributes` (LF on every OS) and `.github/pull_request_template.md` (branch `chore/repo-setup`). `web/` keeps its own `.gitignore`.
- Prettier, ESLint and `jsconfig.json` (the `@/` import path) are set up.

**W1–W2: design**

- [`DesignSystem.md`](../docs/DesignSystem.md) covers colors, fonts (Noto Sans Thai, Barlow, Poppins), layout, buttons, badges, stat cards, tables and the fall alert banner. It's adapted from the **Sedap** template (MIT), which sits in `sedap/` for reference and isn't committed.
- [`Wireframes.md`](../docs/Wireframes.md) has a layout for every page: login, admin dashboard, accounts, houses, bathrooms, watchers, audit log, user home, alert settings and the heatmap modal.

**W2–W3: database (M2)**

- [`prisma/schema.prisma`](prisma/schema.prisma) has all 9 tables from [`Design.md`](../docs/Design.md) §5.1: `accounts`, `houses`, `bathrooms`, `baselines`, `bathroom_watchers`, `fall_events`, `alert_deliveries`, `audit_logs` and `settings`. It also has the Better Auth tables `sessions`, `auth_accounts` and `verifications`.
- [`prisma/migrations/0001_init`](prisma/migrations/0001_init/migration.sql) creates the tables, the indexes on `fall_events(bathroom_id, detected_at DESC)` and `audit_logs(created_at DESC)`, and the `pg_notify('fall_events', id)` trigger used for real-time updates (SSE).
- [`prisma/seed.mjs`](prisma/seed.mjs) adds the default settings: `window_s`, `hop_s`, `confidence_threshold`, `cooldown_s` and `recalibration_months` = 6.
- Differences from the first draft of `Design.md` §5.1 (Design.md is now updated to match):
  - Passwords are hashed by Better Auth and stored in `auth_accounts.password`, not in `accounts`.
  - An admin can delete another admin (WA-2). `audit_logs.actor_id` and `baselines.uploaded_by` become NULL instead of blocking the delete, and each audit row keeps `details.actorUsername`.
  - Calibration status isn't stored. It's worked out from `last_calibrated_at` + `recalibration_months` (WA-11).

**W3–W5: login, roles and accounts** (branch `feat/web-auth`)

- **Next.js setup:** Next.js 15.5.29 (was 15.1.0, which has a known middleware auth-bypass bug), Better Auth 1.7.21, zod 4 and Prisma 6.19.3, all pinned to exact versions.
- **Better Auth** ([`lib/auth.js`](lib/auth.js)) is mapped onto our tables (`accounts`, `auth_accounts`, `sessions`, `verifications`) with numeric IDs.
  - Login works with a username or an email (WU-1), with a show/hide password button (Wireframes.md §1).
  - Public sign-up is off.
  - Login is rate-limited to 5 tries per minute (Design.md §10).
  - A turned-off account can't log in (WA-5).
- **Roles:**
  - [`middleware.js`](middleware.js) sends anyone without a session to `/login`.
  - The real check runs on the server in every layout and API route ([`lib/session.js`](lib/session.js)).
  - Admins land on `/admin`, users on `/home`, and each role is sent back if it opens the other's pages.
  - There's a logout button in the topbar.
- **Accounts API**: `GET`/`POST /api/accounts` and `PATCH`/`DELETE /api/accounts/:id` (Design.md §6.2).
  - Errors use one JSON shape ([`lib/api.js`](lib/api.js)), and every input is validated with zod ([`lib/validators/account.js`](lib/validators/account.js)).
  - Every change writes an `audit_logs` row in the same transaction ([`lib/audit.js`](lib/audit.js)).
- **Accounts page** `/admin/accounts` (Wireframes.md §3):

  | PRD  | What you can do                                                                                                                         |
  | ---- | --------------------------------------------------------------------------------------------------------------------------------------- |
  | WA-1 | "+ เพิ่ม Admin": username, password, full name, phone, email                                                                              |
  | WA-2 | Delete another admin. There's no delete button on your own row, and the API refuses with 403. History stays in the audit log.           |
  | WA-3 | "+ เพิ่ม User": the same fields plus an address                                                                                           |
  | WA-4 | Table of username, email, role, linked house, bathrooms watched, date added and status. Has search, a role filter and 20 rows per page. |
  | WA-5 | On/off switch for user accounts. Turning one off logs that user out everywhere.                                                         |

- **First admin:** `npx prisma db seed` creates it from the `SEED_ADMIN_*` variables, but only when no admin exists yet.
- **Migration [`0002_auth_serial_ids`](prisma/migrations/0002_auth_serial_ids/migration.sql):** the 3 Better Auth tables now use `SERIAL` IDs, and `schema.prisma` matches (`prisma migrate diff` shows no drift). Better Auth's numeric-ID mode applies to every auth table, so text IDs would break login. The IDs are internal to Better Auth and Python never reads these tables. Applying it logs everyone out once. **พัลลภ needs to review this (it's in `prisma/`).**

### End-to-end test (W3–W5)

Run against a production build (`npm run build` + `next start`) and a real PostgreSQL 16 (last run 2026-11-27, test accounts removed afterwards): **29/29 passed.** Lint and build are clean.

| Area          | Checks                                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Not logged in | `/admin`, `/home` and `/` go to `/login`. The API returns 401. Public sign-up is blocked.                                                                                                    |
| Login (WU-1)  | Works with a username or an email. A wrong password gets 401. The 7th wrong try in a minute gets 429.                                                                                        |
| Roles         | An admin opening `/home` goes to `/admin`. A user opening `/admin` goes to `/home`. A user calling `/api/accounts` gets 403.                                                                 |
| WA-1 / WA-3   | Admin and user are created, with the username lowercased and the phone normalized. A user with no address, a bad phone or a short password gets 400. A duplicate username or email gets 409. |
| WA-4          | List, role filter and search work. No password data is ever returned.                                                                                                                        |
| WA-5          | Turning a user off ends their session and blocks login (`ACCOUNT_DISABLED`). Turning them back on lets them log in. Turning an admin on or off gets 403.                                     |
| WA-2          | Deleting yourself gets 403 (`CANNOT_DELETE_SELF`). Deleting a user gets 403. Deleting another admin gets 204 and ends their session. An unknown ID gets 404.                                 |
| Audit         | Each create, update and delete has its `audit_logs` row with `actorUsername`.                                                                                                                |

### Scope check (Chapter 1 §1.3.3 and §1.3.6)

The schema was tested on PostgreSQL 16. Each scope item was run as real queries, inside a transaction that was rolled back afterwards. **20/20 passed.**

| Scope (Chapter 1)                                                                                | Covered by                                                                                | Test |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---- |
| Add admin: username, password, full name, phone, email                                           | `accounts` + `auth_accounts.password`                                                     | ✅   |
| Delete another admin, but not yourself                                                           | Deleting works and history is kept (`SET NULL`). The "not yourself" rule goes in the API. | ✅   |
| Add user, also with an address                                                                   | `accounts.address`                                                                        | ✅   |
| List users: username, email, house, number of bathrooms watched, date added                      | `accounts` + `house` + count of `bathroom_watchers`                                       | ✅   |
| Turn a user account on or off                                                                    | `accounts.is_active`                                                                      | ✅   |
| Add, view and edit a house: name, address, date added, number of bathrooms, users                | `houses`                                                                                  | ✅   |
| Add and edit a bathroom: name, Rx MAC, baseline file. A MAC can't be used twice.                 | `bathrooms.rx_mac` (unique) + `baselines`                                                 | ✅   |
| "ควรปรับเทียบใหม่" after 6 months                                                                   | `last_calibrated_at` + `settings.recalibration_months`                                    | ✅   |
| Link a user to a house, choose which bathrooms they watch, change or remove a pairing            | `accounts.house_id`, `bathroom_watchers`                                                  | ✅   |
| Dashboard: at least 10 latest falls, 7-day chart, history with date, house, bathroom and heatmap | `fall_events` + index `(bathroom_id, detected_at DESC)`                                   | ✅   |
| View and filter the audit log by who, action type and date                                       | `audit_logs` + index `(created_at DESC)`                                                  | ✅   |
| User logs in with username or email                                                              | `username` and `email` are both unique                                                    | ✅   |
| User overview: bathrooms watched, family in the same house, at least 10 latest falls             | `bathroom_watchers`, `accounts.house_id`, `fall_events`                                   | ✅   |
| User sees alert status per bathroom and turns it on or off                                       | `bathroom_watchers.alerts_enabled`                                                        | ✅   |
| Email alert when a fall happens                                                                  | `alert_deliveries` (`channel` = `email`)                                                  | ✅   |
| VLM result: 2 states with a confidence value (§1.3.3)                                            | `fall_events.confidence`, `result`, `model_version`                                       | ✅   |
| Real-time dashboard updates                                                                      | trigger `pg_notify('fall_events', id)`: notification received on insert                   | ✅   |

### Left to finish M2

- [x] Run `npx prisma migrate dev` against a real PostgreSQL. The migration applied, and the database matches `schema.prisma` with no drift (re-checked 2026-11-27 with `prisma migrate diff`).
- [x] `0001_init` merged into `develop` (PR #4).
- [ ] Open a PR for `0002_auth_serial_ids` into `develop` and get it reviewed by **พัลลภ + พลกฤต** (required for `prisma/`, `GIT_FLOW.md` §4). Once merged, M2 is done.

### PR order

Each branch is based on `develop`, except `feat/web-auth`, which needs the serial-ID migration:

| #   | Branch                    | PR title                                                                                              | Reviewers    |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------- | ------------ |
| 1   | `chore/repo-setup`        | `chore(docs): add root readme, editorconfig, gitattributes and pr template` (+ GIT_FLOW on `develop`) | anyone       |
| 2   | `feat/db-auth-serial-ids` | `feat(db): use serial ids for better auth tables` → **M2**                                            | พัลลภ + พลกฤต |
| 3   | `feat/web-auth`           | `feat(web): add better auth login, roles and accounts pages` (WA-1 to WA-5, WU-1)                     | prefer พัลลภ  |

Open #3 against `feat/db-auth-serial-ids` until #2 is merged, then retarget it to `develop`.

### Next (W5–W7, not started)

- Houses (WA-6 to WA-8), bathrooms + baseline upload (WA-9 to WA-12), watchers (WA-13 to WA-15) → **M5**
- Reuse `lib/api.js`, `lib/session.js`, `lib/audit.js`, `components/Modal.jsx` and `components/ConfirmDialog.jsx`.

## Stack

| Item      | Choice                                                                     |
| --------- | -------------------------------------------------------------------------- |
| Framework | Next.js 15.5, App Router                                                   |
| Language  | JavaScript (no TypeScript). JSDoc + zod 4 for types.                       |
| Auth      | Better Auth 1.7 (email/username + password, username plugin)               |
| ORM       | Prisma 6.19 (schema in `prisma/schema.prisma`)                             |
| UI        | Tailwind CSS + components adapted from the Sedap template (MIT) + Recharts |
| Real-time | Server-Sent Events (SSE) via PostgreSQL LISTEN/NOTIFY                      |

## Folder layout

```
web/
├─ app/
│  ├─ (auth)/login/      Login page + LoginForm (WU-1)
│  ├─ admin/             Admin pages (WA-*), admin only
│  │  └─ accounts/       Accounts page (WA-1 to WA-5)
│  ├─ home/              User pages (WU-*), user only
│  └─ api/
│     ├─ auth/[...all]/  Better Auth endpoints (sign-in, sign-out, session)
│     └─ accounts/       Accounts API (WA-1 to WA-5)
├─ components/
│  ├─ AppShell, Sidebar, Topbar (logout)
│  ├─ Modal, ConfirmDialog
│  └─ accounts/          AccountsManager, AccountFormModal
├─ lib/
│  ├─ db.js              Prisma client singleton
│  ├─ auth.js            Better Auth server config
│  ├─ auth-client.js     Better Auth browser client
│  ├─ session.js         getCurrentUser, requirePageRole, requireApiRole
│  ├─ api.js             JSON errors, withApi wrapper, paging
│  ├─ audit.js           writeAudit (same transaction as the change)
│  ├─ accounts.js        Account list shape
│  ├─ format.js          Date/time formatters (Asia/Bangkok)
│  └─ validators/        zod schemas for API inputs
├─ middleware.js         No session cookie on /admin or /home → /login
├─ prisma/
│  ├─ schema.prisma      Single source of truth for the DB schema
│  ├─ migrations/        SQL migrations
│  └─ seed.mjs           Default settings + first admin (from SEED_ADMIN_*)
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
# → fill in DATABASE_URL, BETTER_AUTH_SECRET and the SEED_ADMIN_* values

# Create the tables, the default settings and the first admin
npx prisma migrate dev
npx prisma db seed

# Start the dev server → http://localhost:3000
npm run dev
```

`npm run build` and `npm run dev` share the `.next/` folder. If you build while the dev server is running, the dev server starts failing with `Cannot find module './vendor-chunks/...'`: stop it (Ctrl+C) and run `npm run dev` again.

A quick local database with Docker:

```bash
docker run -d --name fallwatch-db -p 5432:5432 \
  -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=fallwatch postgres:16
```

Then log in at `/login` with `SEED_ADMIN_USERNAME` (or `SEED_ADMIN_EMAIL`) and `SEED_ADMIN_PASSWORD`, and create the other accounts at `/admin/accounts`. If you type a wrong password more than 5 times in a minute, wait a minute before trying again.

### Quick review checklist (W3–W5)

1. Open `/login` and log in as the seed admin, once with the username and once with the email.
2. Go to **บัญชีผู้ใช้งาน** (`/admin/accounts`). Add an admin (WA-1) and a user with an address (WA-3).
3. Check the table (WA-4): search, the role filter, linked house, bathrooms watched and date added.
4. Turn the user off (WA-5), then try to log in as that user in a private window. You should see "บัญชีนี้ถูกปิดการใช้งาน". Turn it back on and log in: the user lands on `/home`, and opening `/admin` sends them back.
5. Delete the other admin (WA-2). Your own row has no delete button.

The other sidebar pages (houses, bathrooms, watchers, audit log, alert settings) are W5–W10 work, so they show 404 for now.

**Changing the schema:** edit `schema.prisma`, run `npx prisma migrate dev --name <change>`, and open a PR reviewed by พัลลภ + พลกฤต. Never edit a migration after it's merged.

## Environment variables

See `.env.example` for the full list. Required:

| Variable                                                         | Description                                                                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                   | PostgreSQL connection string                                                                                                 |
| `BETTER_AUTH_SECRET`                                             | Random secret for session signing (32+ characters, e.g. `openssl rand -hex 32`)                                              |
| `NEXT_PUBLIC_APP_URL`                                            | Public base URL (e.g. https://your-domain.com). Better Auth only accepts requests from this origin.                          |
| `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_EMAIL` | First admin, created by `npx prisma db seed` if no admin exists. `SEED_ADMIN_FULL_NAME` and `SEED_ADMIN_PHONE` are optional. |

## Code conventions

See [`docs/CONVENTIONS.md`](../docs/CONVENTIONS.md) §4 (JavaScript) and §5 (Database). Run `npm run lint` and `npm run format` before each commit.

Key rules:

- Server Components by default. `"use client"` only for state, events or SSE.
- Check the session and role on the server in every API route handler.
- Validate all inputs with zod.
- Every DB write includes an `audit_logs` row in the same transaction.
- Never put secrets in `NEXT_PUBLIC_*` env vars.

## Credits

The UI is adapted from the **Sedap** admin dashboard template, Copyright (c) 2026 Hummingbird UI, distributed by ThemeWagon under the MIT License.
The free version requires credit, so the app shows a ThemeWagon credit link in the sidebar and on the login page. Don't remove it.
The full license text is in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). The template itself (`sedap/`) is kept for reference only and isn't committed.
