# Design: Wi-Fi CSI Fall Detection System

How the system is built. **What** it must do is in `PRD.md`. **Who** does each part is in `Contract.md`.

---

## 1. Architecture

```
 BATHROOM                          LAB / LAN                                  INTERNET
┌───────────────────────┐     ┌──────────────────────────────────────────┐
│ ESP32 Tx ~~Wi-Fi~~>   │     │ Edge Server (Windows 11 → WSL2 → Docker) │
│        (person)       │     │                                          │
│ ESP32 Rx              │     │  ┌──────────────┐   OpenAI-compatible    │
│   │ UART ≥921600      │     │  │ ai-service   │──── HTTP ────┐         │
│   ▼                   │ UDP │  │ (Python)     │              ▼         │
│ Pi Zero 2 W gateway ──┼─────┼─>│ ingest       │        ┌──────────┐    │
└───────────────────────┘     │  │ → filter     │        │ vLLM     │    │
                              │  │ → DAPD       │        │ (VLM)    │    │
                              │  │ → classify   │        └──────────┘    │
                              │  │ → alert ─────┼──> SMTP (email) ───────┼──> caregivers
                              │  └──────┬───────┘                        │
                              │         │ SQL + NOTIFY                   │
                              │         ▼                                │
                              │  ┌──────────────┐    ┌──────────────┐    │
                              │  │ PostgreSQL   │<──>│ web (Next.js)│    │      ┌───────────┐
                              │  └──────────────┘    │ UI + API     │<───┼──────│ Browser   │
                              │                      └──────┬───────┘    │      └───────────┘
                              │  /data (files) <────────────┘            │          ▲
                              │                      cloudflared ────────┼── HTTPS ─┘
                              └──────────────────────────────────────────┘
```

**Main principle:** Python owns *detection*. Next.js owns *people*. PostgreSQL connects them.

- **ai-service (Python):** receives CSI, decides fall or normal, saves the fall event, and sends the alerts.
- **web (Next.js):** everything a person clicks, plus its own API routes, login, and admin data management.
- They never call each other directly. They share the database, a `NOTIFY` channel, and the `/data` folder.

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Firmware | **ESP-IDF** (C) + Espressif `esp-csi` | Full access to the CSI API |
| Gateway | **Raspberry Pi Zero 2 W**, Raspberry Pi OS Lite 64-bit, Python 3 (`pyserial`, `socket`) | See §8 |
| AI service | **Python 3.11+**, NumPy/SciPy, Pillow/Matplotlib (heatmaps), SQLAlchemy + psycopg | asyncio UDP listener |
| AI internal API | **FastAPI** | Internal only: health, model status, test inference. Not exposed to the internet. |
| Model serving | **vLLM** (OpenAI-compatible server) | Serves LoRA adapters with `--enable-lora` |
| Training | PyTorch, Hugging Face Transformers + **PEFT** (LoRA / QLoRA) | QLoRA if the model is ~7B |
| Database | **PostgreSQL 16+** | See §5 |
| Web app | **Next.js** (App Router, Node runtime, self-hosted), **JavaScript** (no TypeScript) | UI + API route handlers. JSDoc + zod instead of types (see `CONVENTIONS.md`). |
| ORM / migrations | **Prisma** | The single source of truth for the database schema. Python reads and writes the same tables. |
| Auth | **Better Auth** (email/username + password, sign-up off) | Only admins create accounts (WA-1, WA-3) |
| UI | Tailwind CSS + shadcn/ui, Recharts | |
| Real-time | PostgreSQL `LISTEN/NOTIFY` → Next.js **Server-Sent Events** | |
| Email | **SMTP** (Gmail app password to start) via Python `smtplib` | 500 emails/day is plenty. Can move to Resend later. |
| Deployment | **Docker Compose** inside **WSL2** (mirrored networking) | See §9 |
| Public access | **Cloudflare Tunnel** (`cloudflared`) | HTTPS, no open ports, works behind the university NAT |

## 3. Components and owners

| Component | Owner |
|---|---|
| ESP32 Tx/Rx firmware, Pi gateway, UDP sender | ศักดา |
| ai-service: ingest, filter, DAPD, VLM, fall decision, alerts | พัลลภ |
| vLLM setup, model training and evaluation | พัลลภ |
| Next.js UI, API routes, auth | พลกฤต |
| Prisma schema (DB) | พลกฤต writes it. พัลลภ reviews every change, because Python reads and writes the same tables. |
| Docker Compose, WSL2, Cloudflare Tunnel | พัลลภ |

## 4. Detection pipeline (ai-service)

```
UDP packet → per-room ring buffer (by Rx MAC) → every 1 s:
   ├─ motion gate: CSI variance over the last 3 s > threshold?  no → skip
   └─ yes → background removal (room baseline) → filtering
          → DAPD heatmap (3 s window = 300 samples @ 100 Hz)
          → vLLM: "fall" | "normal" + confidence (JSON)
          → fall AND confidence ≥ threshold AND not in cooldown?
               → save heatmap PNG → INSERT fall_events → NOTIFY
               → email every watcher with alerts_enabled
```

| Parameter | Start value | Stored in |
|---|---|---|
| Window length | 3 s (300 samples) | `settings` |
| Hop (how often to check) | 1 s | `settings` |
| Confidence threshold | 0.70 | `settings` |
| Cooldown per room after a fall | 60 s | `settings` |

- **Motion gate:** a cheap variance check before calling the VLM. It saves GPU time and cuts false alarms when the room is empty.
- **Cooldown:** one fall gives one event and one email, not one per second.
- **Packet loss:** the gateway sequence number shows gaps. If a window is missing more than 20% of its packets, skip it and log it.
- **Baselines:** each room's baseline is loaded from `/data/baselines/` (the path is in the DB) and cached. When `NOTIFY baseline_changed` arrives, the cache reloads.
- **Latency budget** (PRD §6.1): window 3 s (unavoidable) + DAPD < 0.3 s + VLM ≤ 2 s + DB < 0.1 s, which keeps it under 5 s to the dashboard. The email is sent right after the insert, so it's well under 10 s.

## 5. Database (PostgreSQL)

### 5.1 Tables

```
accounts            id PK, role ('admin'|'user'), username UQ, email UQ,
                    password_hash, full_name, phone, address NULL,
                    house_id FK→houses NULL, is_active, created_at, created_by FK→accounts
houses              id PK, name, address, created_at
bathrooms           id PK, house_id FK→houses, name, rx_mac UQ,
                    last_calibrated_at, created_at
baselines           id PK, bathroom_id FK→bathrooms, file_path, recorded_at,
                    uploaded_by FK→accounts, is_current
bathroom_watchers   account_id FK, bathroom_id FK, alerts_enabled, PK(account_id, bathroom_id)
fall_events         id PK, bathroom_id FK, detected_at, confidence,
                    heatmap_path, model_version, result JSONB, created_at
alert_deliveries    id PK, fall_event_id FK, account_id FK, channel ('email'|…),
                    status ('sent'|'failed'), sent_at, error NULL
audit_logs          id PK, actor_id FK→accounts, action ('create'|'update'|'delete'),
                    entity_type, entity_id, details JSONB, created_at
settings            key PK, value JSONB
```

Better Auth adds its own `session` / `account` / `verification` tables. Its `user` table is mapped onto `accounts`.

### 5.2 Rules

- **Calibration status** isn't stored. It's worked out from `last_calibrated_at + settings.recalibration_months` (default 6), and the UI shows "needs recalibration" when the date has passed (WA-11).
- **An admin can't delete their own account** (WA-2). This is checked in the API.
- **Every create, update or delete** from the web writes an `audit_logs` row in the same transaction (WA-17).
- **`alert_deliveries.channel`** is text, so LINE or SMS can be added later without changing the schema (PRD NF-5).
- **Real-time:** a trigger on `fall_events` INSERT runs `pg_notify('fall_events', id)`. Next.js holds one `LISTEN` connection and sends the event to open dashboards over SSE.
- **Indexes:** `fall_events(bathroom_id, detected_at DESC)` and `audit_logs(created_at DESC)`.

### 5.3 Who writes what

| Table | Next.js | Python |
|---|---|---|
| accounts, houses, bathrooms, baselines, watchers, settings | read/write | read |
| fall_events, alert_deliveries | read | **write** |
| audit_logs | write | — |

## 6. Interfaces

### 6.1 Gateway → server: UDP (binary, little-endian)

| Offset | Size | Field |
|---|---|---|
| 0 | 2 | magic `0x43 0x53` ("CS") |
| 2 | 1 | version (= 1) |
| 3 | 1 | flags (reserved) |
| 4 | 4 | seq (uint32, +1 per packet, per gateway) |
| 8 | 8 | timestamp_us (uint64, gateway clock, NTP-synced) |
| 16 | 6 | rx_mac |
| 22 | 1 | rssi (int8) |
| 23 | 1 | channel (uint8) |
| 24 | 2 | csi_len (uint16, bytes) |
| 26 | n | csi (int8 I/Q pairs, as the ESP32 gives them) |

- One CSI frame per datagram. That's ~150–410 B, well under the MTU.
- Server port: **UDP 5005** (LAN only).
- Owners: ศักดา + พัลลภ. Any change means bumping `version`.

### 6.2 Next.js API routes (`/api/...`)

| Route | Methods | Who | PRD |
|---|---|---|---|
| `/auth/*` | Better Auth | all | WU-1 |
| `/accounts` | GET, POST | admin | WA-1, WA-3, WA-4 |
| `/accounts/:id` | PATCH, DELETE | admin | WA-2, WA-5 |
| `/houses`, `/houses/:id` | GET, POST, PATCH | admin | WA-6–8 |
| `/bathrooms`, `/bathrooms/:id` | GET, POST, PATCH | admin | WA-9, 10, 12 |
| `/bathrooms/:id/baseline` | POST (file upload) | admin | WA-9, 12 |
| `/watchers` | GET, POST, DELETE | admin | WA-13–15 |
| `/fall-events` | GET (filter, paginate) | admin: all; user: own house | WA-16, WU-2 |
| `/fall-events/:id/heatmap` | GET (image, auth checked) | same as above | WA-16 |
| `/stats/falls?days=7` | GET | admin | WA-16 |
| `/audit-logs` | GET (filter) | admin | WA-17 |
| `/me/house` | GET | user | WU-2 |
| `/me/watchers/:bathroomId` | PATCH `{alerts_enabled}` | user | WU-3, WU-4 |
| `/events/stream` | GET (SSE) | logged in | real-time |

All JSON. Errors come back as `{ "error": { "code": "...", "message": "..." } }`. Every route checks the session and role on the server.

### 6.3 vLLM result (ai-service → DB `fall_events.result`)

```json
{ "label": "fall", "confidence": 0.91, "model": "<model-name>+lora-v2", "inference_ms": 640 }
```

## 7. File storage (`/data` on the server SSD)

```
/data
├─ baselines/<bathroom_id>/<timestamp>.npy     written by Next.js upload, read by Python
├─ heatmaps/<yyyy-mm>/<fall_event_id>.png      written by Python, served by Next.js (auth checked)
├─ recordings/<session>/<volunteer>/*.bin      raw CSI for the dataset, never in the DB
└─ models/                                     LoRA adapters
```

`/data` is a Docker volume shared by `web` and `ai-service`. Heatmaps are **never** in `public/`. Each request checks that the user can see that bathroom.

## 8. Gateway: Raspberry Pi Zero 2 W

**Verdict: feasible.** The job is to read serial data and send it over UDP at ~40 KB/s, which uses under 10% CPU.

| Rule | Why |
|---|---|
| ESP32 UART at **≥ 921600 baud**, binary output preferred | 115200 baud carries only ~10 packets/s of text CSI |
| Pi Wi-Fi on a **different, non-overlapping channel** from Tx/Rx (e.g. 1 vs 11). Mount the Pi outside the bathroom if possible. | The Pi's Wi-Fi is 2.4 GHz only, in the same band as the CSI link |
| Connect with a **micro-USB OTG adapter**, or solder a header and use the **PL011 UART** on GPIO 14/15 (disable Bluetooth and the serial console) | The board has one data USB port and no header soldered. The mini-UART is unstable. |
| Raspberry Pi OS Lite, **no logging to the SD card**, run as a `systemd` service with auto-restart | Avoids SD card wear and recovers from crashes |
| **NTP** time sync, plus seq and timestamp in every packet | Detects packet loss and puts packets in order |
| Server IP and port in `/etc/csi-gateway.conf` | Matches PRD HW-3 |

## 9. Deployment and public access

```
Windows 11 Pro
└─ WSL2 Ubuntu (networkingMode=mirrored)  ← so UDP 5005 from the Pi reaches containers
   └─ docker compose
      ├─ postgres     5432  internal only
      ├─ vllm         8000  internal only (GPU)
      ├─ ai-service   UDP 5005 (LAN) + 8001 internal
      ├─ web          3000  internal → exposed only through cloudflared
      └─ cloudflared        outbound tunnel → https://<domain>
```

- **WSL2 mirrored networking** (`.wslconfig`): without it, WSL2 sits behind NAT and the Pi's UDP packets can't reach the container. Also allow UDP 5005 in Windows Firewall, LAN profile only.
- **Cloudflare Tunnel:** gives a public HTTPS URL without opening ports on the university network. A custom domain needs a domain on Cloudflare. For testing, a free `trycloudflare.com` quick tunnel works, but its URL changes on each run.
- **Only `web` is public.** PostgreSQL, vLLM, ai-service and UDP never face the internet.
- **Uptime:** the site is up only while the lab PC is on. Set Windows to never sleep, and set Docker to start at login.

## 10. Security and privacy (public web app)

- HTTPS everywhere, through Cloudflare.
- Passwords hashed (Better Auth: scrypt/argon2). Sessions in httpOnly, secure cookies. No public sign-up.
- Rate limiting on login.
- A role check on **every** API route, done on the server, not just hidden in the UI.
- Users can only see their own house's data. Every query is filtered by `house_id`.
- Heatmap images go through an authorized route, never as static files.
- Secrets (DB password, SMTP, Better Auth secret, tunnel token) live in `.env`, which is **never committed**. Commit a `.env.example` instead.
- **PDPA:** the system stores names, phones, emails and addresses. Collect only what the PRD needs, and get consent from volunteers and users. Nothing from inside the bathroom is stored except CSI and heatmaps, which aren't images of a person.
- Back up PostgreSQL nightly (`pg_dump`) to a second disk or cloud drive.

## 11. Gaps in the System Diagram (fixed in this design)

| Missing in the diagram | Where it's handled |
|---|---|
| Recording raw CSI for the dataset | `/data/recordings/` (§7) |
| Alert manager → email, and reading who to notify | §4 + `bathroom_watchers`, `alert_deliveries` |
| Where heatmap images are stored | `/data/heatmaps/` + `fall_events.heatmap_path` |
| Matching packets to a room | `rx_mac` in the UDP header ↔ `bathrooms.rx_mac` |
| The dashboard writes too (admin pages, baseline upload) | Next.js API (§6.2) |
| How the dashboard updates in real time | `NOTIFY` → SSE (§5.2) |

## 12. Open questions

| # | Question | Owner |
|---|---|---|
| Q1 | **Which VLM?** Open. Candidates are in §13. | พัลลภ |
| Q2 | Domain name for Cloudflare Tunnel (buy one, or use a quick tunnel for now) | team |
| Q3 | Should the 6-month recalibration period be configurable in the UI? (It's already stored in `settings`.) | พลกฤต + พัลลภ |

**Decided:** the whole Next.js app (UI + API + auth) belongs to พลกฤต (see `Contract.md`).

## 13. VLM candidates (RTX 4070, 12 GB)

> **Not decided yet.** This is an open question (§12 Q1). The table lists candidates to test, not a choice.

| Model | Released | Size in memory (approx.) | Serve on vLLM | Fine-tune on 12 GB | Role |
|---|---|---|---|---|---|
| **Qwen3.5-2B** | Mar 2026 | ~4–5 GB bf16 | bf16, fast | LoRA in bf16 ✅ | Fastest, fits easily, many experiments possible |
| **Qwen3.5-4B** | Mar 2026 | ~8–9 GB bf16 | bf16 (tight) or FP8 | QLoRA (4-bit) ✅ | More capacity than 2B |
| Qwen3-VL-4B-Instruct | Oct 2025 | ~8–9 GB bf16 | bf16 or FP8 | QLoRA ✅ | Older and more widely used, with many fine-tuning guides |
| Qwen3-VL-8B-Instruct | Oct 2025 | ~16 GB bf16 → AWQ/FP8 ~6–9 GB | quantized only | QLoRA, tight ⚠️ | Upper bound. Only if the 4B models fall short. |
| Gemma 4 E4B | Apr 2026 | ~8 GB (est.) | yes (vLLM day-0) | QLoRA (est.) | Optional second model family for comparison |

**Notes:**
- **DAPD heatmaps are not natural photos.** Expect zero-shot to be weak and LoRA to give most of the gain. That's fine, and it's a finding worth reporting.
- **No prior work found** that uses a VLM on CSI heatmaps for fall detection. DapFall uses R(2+1)D (94.3% TPR, 6.25% FPR in its original environment), so the VLM approach is new. That's a strong point for the committee, but also a risk. Keep R(2+1)D running as the baseline.
- **Fine-tune the language part only.** Freeze the vision encoder and train LoRA on the LLM layers to stay within 12 GB. Unsloth or PEFT + bitsandbytes for QLoRA.
- **Ask for a short, fixed answer** (JSON `{"label","confidence"}`, `max_tokens` ≈ 20) to keep inference ≤ 2 s. Confidence can come from the token log-probabilities of `fall` / `normal` rather than from the model's own number.
- **Versions:** Qwen3.5 needs transformers ≥ 5.2. Pin vLLM and transformers versions in the Dockerfile.
- **Verify on the real GPU:** the memory numbers above are estimates. Run one serve test and one LoRA training test before committing.
