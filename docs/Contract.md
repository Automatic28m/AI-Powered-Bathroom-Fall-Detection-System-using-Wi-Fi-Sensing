# Team Contract

Our agreement on who does what and how we work together. If something here stops working, we change it together.

## 1. Project

| | |
|---|---|
| **Code** | C2 |
| **Title (TH)** | ระบบตรวจจับการล้มอัจฉริยะด้วยปัญญาประดิษฐ์จากคลื่นไวไฟ |
| **In short** | Real-time bathroom fall detection using Wi-Fi CSI, DAPD heatmaps and a Vision Language Model (VLM), with a web app for monitoring and email alerts. No cameras, no wearables. |
| **Program** | Computer Engineering, Faculty of Engineering, RMUTT |
| **Semester** | 1/2569 |
| **Advisors** | ดร.พชร ศรีมุกข์ (main), ดร.อนุรักษ์ พรหมโคตร (co-advisor) |

## 2. Team

| Name | Student ID | Role | GitHub |
|---|---|---|---|
| พัลลภ บุญเหลือ | 116730462006-1 | AI development + AI service + deployment | phanlop.auto@gmail.com |
| ศักดา เบ้าคำ | 116730462016-0 | IoT: hardware, firmware, gateway | sakda130646@gmail.com |
| พลกฤต สมทรง | 116730462007-9 | Web app (Next.js) + documentation | phonlakrit012@gmail.com |

## 3. Who owns what

"Owner" means you drive it and make sure it gets done. You can ask for help, but it's on you.

### พัลลภ: AI + AI service + deployment
- CSI processing on the central server (Python AI service: receives the gateway's UDP packets)
- Converting CSI time-series into DAPD heatmaps
- VLM on vLLM: zero-shot, few-shot and LoRA experiments, compared against the R(2+1)D baseline (DapFall)
- Dataset split (70:15:15) and evaluation: accuracy, precision, recall, F1, false alarms per hour, inference time. Target: **≥ 85% accuracy**
- Fall decision: saving fall events and heatmaps to the database
- Email alerts when a fall is detected
- Server setup: WSL2, Docker Compose, PostgreSQL, vLLM, Cloudflare Tunnel

### ศักดา: IoT
- ESP32 Tx/Rx boards and firmware (2.4 GHz, ~100 Hz CSI sampling)
- SBC gateway: reads CSI from the Rx over serial and sends it to the server over UDP (the server IP and port live in the gateway config)
- Installing the boards in the test bathroom (opposite walls, ≥ 1.70 m apart, ≥ 1.00 m high)
- Baseline recording script for an empty bathroom
- Running data collection with volunteers (at least 5 people)

### พลกฤต: web app + docs
- The whole Next.js app, front and back:
  - **API routes**, **login** (Better Auth), roles and permission checks, audit logging
  - **Database schema** (Prisma migrations), agreed with พัลลภ (see section 6)
  - **Admin pages:** manage accounts, houses and bathrooms, baseline upload, pair users with bathrooms, fall dashboard and history, audit logs
  - **User pages:** login, house overview, latest falls, alert on/off per bathroom
  - Real-time dashboard updates (Server-Sent Events)
- Project report chapters
- Presentation slides
- Test plan for the system and the web app

## 4. Shared work

- **Volunteer test sessions:** ศักดา leads, everyone helps run them
- **Final demo:** all three prepare and rehearse together
- **Review:** someone else looks at your work before it's merged or submitted
- **Report:** พลกฤต assembles it, and each owner writes or checks the technical parts in their own area

## 5. How we work

- **Daily chat:** Discord
- **Weekly meeting:** every **Tuesday at 1:00 PM**
  - Each person covers what they did, what's next, and anything blocking them
- **Deadlines:** if you can't make one, tell the team at least **2 days ahead**
- **Decisions:** majority vote (2 of 3). If we're stuck, we ask the advisor.
- **Code:** everything goes on GitHub. Branch and commit rules are in `GIT_FLOW.md`.

## 6. Handoffs between parts

Before building, each pair agrees on the data format and writes it down (in `Design.md` or a shared doc). If the format changes, tell the other person first.

| Handoff | Who agrees on it |
|---|---|
| Gateway → server (UDP packet format) | ศักดา + พัลลภ |
| AI service ↔ web app (database tables, `NOTIFY` events, `/data` folder layout) | พัลลภ + พลกฤต |

The Prisma schema is the single source of truth for the database. Any change goes through a PR that both พัลลภ and พลกฤต review.

## 7. Agreed by

- [ ] พัลลภ บุญเหลือ, date: ____________
- [ ] ศักดา เบ้าคำ, date: ____________
- [ ] พลกฤต สมทรง, date: ____________
