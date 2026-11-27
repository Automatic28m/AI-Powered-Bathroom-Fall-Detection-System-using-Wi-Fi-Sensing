# Conventions

Shared rules so the code looks like one team wrote it. If a rule gets in the way, raise it at the Tuesday meeting and change it here.

## 1. General

| Rule | Detail |
|---|---|
| Language | Code, comments, commits and PRs in **English**. UI text can be Thai. |
| Encoding | UTF-8, **LF** line endings, newline at the end of each file (enforced by `.editorconfig` and `.gitattributes` at the repo root) |
| Indentation | Python and C: 4 spaces. JavaScript, JSON, YAML: 2 spaces. |
| Time | Store and send in **UTC, ISO 8601** (`2027-01-15T07:30:00Z`). Display in **Asia/Bangkok**. |
| MAC address | Lowercase with colons: `a4:cf:12:3b:9e:01` |
| Units in names | Add the unit when it isn't obvious: `timeout_ms`, `window_s`, `rate_hz` |
| Comments | Explain **why**, not what. No commented-out code in `main`. |
| TODOs | `TODO(name): ...`, with an owner |

`.editorconfig` at the repo root:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.{py,c,h}]
indent_size = 4

[*.md]
trim_trailing_whitespace = false
```

## 2. Firmware: C (ESP-IDF), `firmware/`

| Item | Rule |
|---|---|
| Format | `clang-format` (ESP-IDF style file) |
| Names | `snake_case` functions and variables, `UPPER_SNAKE` macros and constants, `module_` prefix (e.g. `csi_init()`) |
| Config | Use `menuconfig` / `sdkconfig.defaults` for baud rate, channel, sample rate. No magic numbers in code. |
| Logging | `ESP_LOGI/W/E(TAG, ...)` with one `TAG` per file |
| Errors | Check every `esp_err_t`. Use `ESP_ERROR_CHECK` only at startup. |

## 3. Python: `gateway/`, `ai/`

| Item | Rule |
|---|---|
| Version | Python **3.11+** |
| Format + lint | **ruff** (`ruff format`, `ruff check`), line length 100 |
| Names | `snake_case` functions, variables and modules. `PascalCase` classes. `UPPER_SNAKE` constants. |
| Type hints | On all public functions |
| Dependencies | `pyproject.toml` with pinned versions. One virtual env per folder (`.venv/`, never committed). |
| Logging | `logging` module, never `print` in services. One logger per module: `log = logging.getLogger(__name__)`. |
| Config | Environment variables (via `pydantic-settings` or `os.environ`), never hard-coded |
| DB access | SQLAlchemy Core or ORM against the tables defined by Prisma. **Don't create or alter tables from Python.** |
| Tests | `pytest`, files `tests/test_*.py` |
| Notebooks | Allowed in `ai/notebooks/` for experiments. Clear outputs before committing. Reusable code moves into modules. |

`ai/` layout:

```
ai/
├─ service/        real-time: ingest, dsp, dapd, classify, alerts
├─ training/       dataset, LoRA, R(2+1)D baseline, evaluation
├─ notebooks/
├─ tests/
└─ pyproject.toml
```

## 4. JavaScript: `web/` (Next.js)

| Item | Rule |
|---|---|
| Language | **JavaScript** (`.js`, `.jsx`), ES modules (`import`/`export`) |
| Framework | Next.js **App Router** |
| Format + lint | **Prettier** + **ESLint** (`next/core-web-vitals`). Run before every commit. |
| Names | `camelCase` variables and functions. `PascalCase` React components and their files (`FallChart.jsx`). `kebab-case` route folders (`app/fall-events/`). `UPPER_SNAKE` constants. |
| Types | No TypeScript, so use **JSDoc** on shared functions and data shapes (`/** @param {string} id */`) |
| Validation | **zod** schemas for every API request body and query. Never trust input. |
| Components | Server Components by default. Add `"use client"` only when needed (state, events, SSE). |
| Styling | Tailwind + shadcn/ui only. No inline style objects. Colors and spacing from `DesignSystem.md`. |
| Secrets | Only `NEXT_PUBLIC_*` env vars reach the browser. Never put secrets in them. |

`web/` layout:

```
web/
├─ app/
│  ├─ (auth)/login/
│  ├─ admin/            admin pages
│  ├─ home/             user pages
│  └─ api/              route handlers (see Design.md §6.2)
├─ components/          shared UI (PascalCase.jsx)
├─ lib/                 db.js (Prisma client), auth.js, validators/, audit.js
├─ prisma/schema.prisma
└─ public/              static assets only (never heatmaps)
```

### API route rules

1. Check the **session and role first**, on the server, in every handler.
2. Validate the input with zod.
3. Do the work. Writes go in a transaction **with an `audit_logs` row**.
4. Return JSON. Success: the resource or `{ items, total }` for lists. Error: `{ "error": { "code": "NOT_FOUND", "message": "..." } }` with the right HTTP status.

| Status | When |
|---|---|
| 200 / 201 | OK / created |
| 400 | Validation failed |
| 401 / 403 | Not logged in / not allowed |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate username or MAC) |
| 500 | Bug: log it |

Lists use `?page=1&pageSize=20`.

## 5. Database (PostgreSQL via Prisma)

| Item | Rule |
|---|---|
| Source of truth | `web/prisma/schema.prisma`. Changes only through Prisma migrations, in a PR reviewed by พัลลภ + พลกฤต. |
| Table names in DB | `snake_case`, plural (`fall_events`) via `@@map` |
| Column names in DB | `snake_case` (`detected_at`) via `@map` |
| Prisma model / field | `PascalCase` singular model (`FallEvent`), `camelCase` fields (`detectedAt`) |
| Keys | `id` primary key. Foreign keys are `<table_singular>_id` (`bathroom_id`). |
| Timestamps | `created_at`, plus `updated_at` where rows change. Type `timestamptz`, stored as UTC. |
| Booleans | `is_` / `has_` prefix, or a clear adjective (`alerts_enabled`) |
| Never | Store passwords in plain text, or store file contents in the DB (store the path) |

Example:

```prisma
model FallEvent {
  id           Int       @id @default(autoincrement())
  bathroomId   Int       @map("bathroom_id")
  detectedAt   DateTime  @map("detected_at") @db.Timestamptz
  confidence   Float
  heatmapPath  String    @map("heatmap_path")
  result       Json
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz
  bathroom     Bathroom  @relation(fields: [bathroomId], references: [id])

  @@index([bathroomId, detectedAt(sort: Desc)])
  @@map("fall_events")
}
```

Python then queries `fall_events.detected_at`, the same name.

## 6. Environment variables

- `UPPER_SNAKE`, prefixed by service when shared: `DATABASE_URL`, `SMTP_HOST`, `VLLM_BASE_URL`, `CSI_UDP_PORT`.
- Every variable is listed in `.env.example` with a fake value and a one-line comment.
- `.env` is never committed (see `GIT_FLOW.md` §5).

## 7. Files and data (`/data`)

Follow the layout in `Design.md` §7. File names: lowercase, no spaces, `-` or `_` separators. Timestamps as `YYYYMMDDTHHMMSSZ`.

## 8. Documentation

- Docs live in `docs/` as Markdown. File names follow the existing ones (`PRD.md`, `Design.md`).
- Each folder (`firmware/`, `gateway/`, `ai/`, `web/`, `infra/`) has a short `README.md`: what it is, how to run it, how to test it.
- If you change a behavior in the PRD or Design, update the doc **in the same PR**.

## 9. Before you open a PR

- [ ] Formatter + linter pass (`ruff`, `prettier`/`eslint`, `clang-format`)
- [ ] It runs locally, and tests pass if the folder has them
- [ ] No secrets, data files or model weights in the diff
- [ ] Docs updated if behavior changed
- [ ] PR title follows the commit format (`feat(web): ...`)
