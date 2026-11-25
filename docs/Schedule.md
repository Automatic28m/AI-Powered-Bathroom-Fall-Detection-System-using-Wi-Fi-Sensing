# Schedule

The plan by week. **Dates are TBD**: fill them in once the semester calendar and exam dates are confirmed.
We review this at the **Tuesday 1:00 PM meeting**. If a task slips, update this file the same week.

| | |
|---|---|
| **Week 1 starts** | TBD |
| **Progress exam** | TBD |
| **Final defense** | TBD |
| **Report due** | TBD |

---

## 1. Milestones

| # | Milestone | Done when | Week | Date |
|---|---|---|---|---|
| M0 | Kickoff | Repo, docs, Discord, hardware ordered | W1 | TBD |
| M1 | CSI flowing | Packets from the Rx arrive at the server through the Pi over UDP | W4 | TBD |
| M2 | Schema frozen (v1) | Prisma schema merged, reviewed by พัลลภ + พลกฤต | W3 | TBD |
| M3 | Hardware installed | Tx/Rx in the test bathroom, baseline recorded | W5 | TBD |
| M4 | Dataset collected | 5+ volunteers recorded, labeled, split 70:15:15 | W7 | TBD |
| M5 | Admin web working | Login, accounts, houses, bathrooms, watchers (WA-1 to WA-15) | W7 | TBD |
| M6 | Model chosen | Zero-shot, few-shot and LoRA results vs R(2+1)D, and VLM picked | W10 | TBD |
| M7 | End-to-end demo | Fall → dashboard ≤ 5 s → email ≤ 10 s, on the public URL | W12 | TBD |
| M8 | Progress exam | Slides + demo | TBD | TBD |
| M9 | Report complete | All chapters reviewed by every owner | W15 | TBD |
| M10 | Final defense | | W16 | TBD |

## 2. Work by person

### ศักดา: IoT

| Week | Task |
|---|---|
| W1 | Order or check the hardware: 2× ESP32, Pi Zero 2 W, OTG adapter or header, power supplies, microSD |
| W1–W3 | ESP32 Tx/Rx firmware (ESP-IDF + `esp-csi`), 100 Hz, UART ≥ 921600 |
| W2–W4 | Pi gateway: serial → UDP (packet format in `Design.md` §6.1), systemd, NTP → **M1** |
| W4–W5 | Install in the test bathroom, baseline script → **M3** |
| W5 | Draft `Installation.md` |
| W5–W7 | Run volunteer recording sessions (with the whole team) → **M4** |
| W8–W12 | Stability: long-run test (24 h+), packet-loss check, help with the integration |

### พัลลภ: AI + AI service + deployment

| Week | Task |
|---|---|
| W1–W2 | Server setup: WSL2 (mirrored networking), Docker, PostgreSQL, vLLM test serve |
| W1–W3 | Test the VLM candidates on the RTX 4070: does it serve, does LoRA train? (`Design.md` §13) |
| W2–W3 | Review the Prisma schema with พลกฤต → **M2** |
| W2–W5 | AI service: UDP ingest, ring buffer, filtering, DAPD heatmaps |
| W4–W5 | Write `Evaluation.md` + volunteer consent form |
| W6–W7 | Zero-shot and few-shot experiments |
| W6–W9 | R(2+1)D baseline |
| W7–W10 | LoRA / QLoRA experiments → **M6** |
| W8–W10 | Real-time pipeline: motion gate → VLM → fall event → NOTIFY |
| W9–W10 | Email alerts (SMTP) + `alert_deliveries` |
| W10–W11 | Cloudflare Tunnel + public deployment |
| W11–W12 | Evaluation run: accuracy, F1, false alarms/hr, latency → **M7** |

### พลกฤต: web app + docs

| Week | Task |
|---|---|
| W1 | Finish `GIT_FLOW.md`, `CONVENTIONS.md`, repo setup |
| W1–W2 | `DesignSystem.md` + wireframes of the main pages |
| W2–W3 | Prisma schema + migrations → **M2** |
| W3–W5 | Next.js setup, Better Auth (login, roles), accounts pages (WA-1 to WA-5) |
| W5–W7 | Houses, bathrooms, baseline upload, watchers (WA-6 to WA-15) + audit logging → **M5** |
| W8–W10 | Fall dashboard, history, chart, heatmap view, SSE live updates (WA-16) |
| W9–W10 | User pages (WU-1 to WU-4) |
| W10 | Audit log page (WA-17) |
| W10–W11 | Test plan + web testing |
| W1–W15 | Report chapters (continuous, see §3) |
| W13–W15 | Slides for the defense |

## 3. Report

| Chapter | Draft by | Technical input | Week |
|---|---|---|---|
| 1. Introduction | done | — | — |
| 2. Theory and related work | พลกฤต | พัลลภ (CSI, DAPD, VLM), ศักดา (ESP32) | W2–W6 |
| 3. Methodology / design | พลกฤต | All (from `Design.md`) | W5–W10 |
| 4. Results | พลกฤต | พัลลภ (evaluation), ศักดา (hardware tests) | W11–W14 |
| 5. Conclusion | พลกฤต | All | W14–W15 |

## 4. Dependencies (what blocks what)

```
Hardware (W1) ─► Firmware ─► Gateway ─► M1 CSI flowing ─► M3 Installed ─► M4 Dataset ─► M6 Model ─┐
                                                                                                  ├─► M7 End-to-end
Schema M2 (W3) ─► Web auth/accounts ─► M5 Admin web ─► Dashboard + SSE ────────────────────────────┤
                                                                                                  │
Server setup (W1) ─► AI service ingest ─► Real-time pipeline + email ─────────────────────────────┘
```

**Critical path:** hardware → dataset → model. If hardware is late, everything AI is late.
**To reduce the risk:**
- Order the hardware in week 1.
- Start the DAPD and AI-service code on recorded or sample CSI before the bathroom is ready.
- The web app depends only on the schema (M2), so it can go ahead in parallel.

## 5. Risks

| Risk | Plan B |
|---|---|
| Hardware delivery is late | Develop with any ESP32 on a desk. Install later. |
| Not enough volunteers | Recruit friends and classmates early. Book sessions in W4. |
| VLM accuracy < 85% | More LoRA data and augmentation. Fall back to a smaller or different candidate. Report vs R(2+1)D honestly. |
| WSL2 / vLLM setup problems | Start in W1. It's the first thing พัลลภ does. |
| พลกฤต overloaded (web + docs) | Others write their technical report sections. Review the load at the Tuesday meeting. |
