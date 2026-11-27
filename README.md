# FallWatch. — Bathroom Fall Detection with Wi-Fi Sensing

**ระบบตรวจจับการล้มอัจฉริยะด้วยปัญญาประดิษฐ์จากคลื่นไวไฟ** (Project C2, Computer Engineering, RMUTT, 1/2569)

Real-time bathroom fall detection with no cameras and no wearables. Two ESP32 boards measure Wi-Fi
Channel State Information (CSI) across the room, a server turns it into DAPD heatmaps, and a Vision
Language Model decides between "normal" and "fall". A web app shows the status live and emails
caregivers when someone falls.

```
ESP32 Tx ~~Wi-Fi~~> ESP32 Rx ─serial─> Pi gateway ─UDP─> AI service (DAPD + VLM) ─> PostgreSQL ─> Next.js web + email
```

See [`System Diagram.png`](System%20Diagram.png) and [`docs/Design.md`](docs/Design.md) for the full design.

## Repo layout

| Folder | What | Owner | Status |
|---|---|---|---|
| [`firmware/`](firmware/) | ESP32 Tx/Rx CSI firmware + host check tools | ศักดา | In progress |
| `gateway/` | Pi Zero 2 W: serial → UDP | ศักดา | Not started |
| `ai/` | AI service (ingest, DAPD, VLM) + training | พัลลภ | Not started |
| [`web/`](web/) | Next.js web app + API, Prisma schema | พลกฤต | In progress |
| `infra/` | Docker Compose, Cloudflare Tunnel, WSL2 | พัลลภ | Not started |
| [`docs/`](docs/) | PRD, design, conventions, schedule | all | Ongoing |

Each folder has its own `README.md` with how to run and test it.

## Docs

| Doc | What it covers |
|---|---|
| [`PRD.md`](docs/PRD.md) | Requirements and feature IDs (WA-*, WU-*) |
| [`Design.md`](docs/Design.md) | Architecture, database, interfaces, deployment |
| [`Schedule.md`](docs/Schedule.md) | Week-by-week plan and milestones |
| [`GIT_FLOW.md`](docs/GIT_FLOW.md) | Branches, commits, pull requests |
| [`CONVENTIONS.md`](docs/CONVENTIONS.md) | Code style for C, Python, JavaScript and the database |
| [`DesignSystem.md`](docs/DesignSystem.md) | Colors, type and components for the web UI |
| [`Wireframes.md`](docs/Wireframes.md) | Layout of every web page |
| [`Contract.md`](docs/Contract.md) | Team, roles and how we work |

## Quick start

- **Web app:** PostgreSQL 16 + Node.js 20+, see [`web/README.md`](web/README.md#how-to-run).
- **Firmware:** Arduino core for ESP32-S3, see [`firmware/README.md`](firmware/README.md).

## Contributing

1. Branch off `develop`: `feat/web-houses-page`, `fix/gateway-serial-reconnect`, … ([`GIT_FLOW.md`](docs/GIT_FLOW.md) §2)
2. Commit with Conventional Commits: `feat(web): add bathroom baseline upload`
3. Open a PR into `develop` and fill in the template. Changes to `web/prisma/` need พัลลภ + พลกฤต.

Repo-wide editor and line-ending rules are in [`.editorconfig`](.editorconfig) and [`.gitattributes`](.gitattributes) (UTF-8, LF).

## Team

| Name | Role |
|---|---|
| พัลลภ บุญเหลือ | AI, AI service, deployment |
| ศักดา เบ้าคำ | IoT: hardware, firmware, gateway |
| พลกฤต สมทรง | Web app, documentation |

Advisors: ดร.พชร ศรีมุกข์, ดร.อนุรักษ์ พรหมโคตร
