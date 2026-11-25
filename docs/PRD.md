# PRD: Wi-Fi CSI Fall Detection System

**Project code:** C2
**Title (TH):** ระบบตรวจจับการล้มอัจฉริยะด้วยปัญญาประดิษฐ์จากคลื่นไวไฟ
**Semester:** 1/2569, Computer Engineering, RMUTT
**Owners:** see `Contract.md`
**Source:** Chapter 1 (บทที่ 1), approved at the pre-project exam on 14 Oct 2569

---

## 1. Problem

Thailand is becoming a super-aged society. More than 3 million Thai elderly people fall each year (about 30% of them), and **the bathroom is the most common place**. After a fall, getting help within the "Golden Hour" matters a lot. If help comes late, the risk of death or permanent disability goes up sharply.

Today's options fall short:

- **CCTV:** not acceptable in a bathroom because of privacy.
- **Wearables:** elderly people forget to wear them, or the battery runs out.

## 2. Solution

A bathroom fall detector that uses **Wi-Fi Channel State Information (CSI)** instead of cameras or wearables:

1. Two ESP32 boards (Tx and Rx) on opposite walls send and receive Wi-Fi signals across the room.
2. A gateway (single-board computer) reads the raw CSI from the Rx and sends it to a central server over UDP.
3. The server turns the CSI time-series into **DAPD heatmap** images.
4. A **Vision Language Model (VLM)** served on vLLM classifies each heatmap as **normal** or **fall**, with a confidence score.
5. A **web app** shows the status in real time and **emails** caregivers when someone falls.

## 3. Objectives

| # | Objective |
|---|---|
| O1 | Build a real-time bathroom fall detector based on Wi-Fi CSI, with no CCTV and no wearables, so users keep their privacy. |
| O2 | Apply a VLM to classify falls from DAPD heatmaps generated from CSI time-series data. |
| O3 | Build a web app for real-time monitoring and fall alerts. |

## 4. Users

| User | Who they are | What they need |
|---|---|---|
| **Admin** | The person who runs the system | Manages accounts, houses and bathrooms, and keeps an eye on falls everywhere |
| **User** | A family member or caregiver | Sees their own house and gets an email when someone falls |
| **Technician** | Installs the hardware on site | Installs the boards, records a baseline, and gives the baseline file and the Rx MAC address to the admin |
| **Monitored person** | The elderly person in the bathroom | Doesn't use the system directly and needs nothing on them |

## 5. Functional requirements

### 5.1 Edge hardware and gateway

| ID | Requirement |
|---|---|
| HW-1 | At least 1 ESP32 (2.4 GHz Wi-Fi) as the receiver (Rx) |
| HW-2 | At least 1 ESP32 (2.4 GHz Wi-Fi) as the transmitter (Tx) |
| HW-3 | At least 1 single-board computer (**Raspberry Pi Zero 2 W**) as the gateway. It reads raw CSI from the Rx over serial and sends it to the central server over UDP. The server IP and port are set in the gateway config file. |
| HW-4 | Collects CSI at about **100 Hz** |
| HW-5 | 2.4 GHz band, IEEE 802.11 b/g/n |

### 5.2 Signal processing and AI

| ID | Requirement |
|---|---|
| AI-1 | CSI is processed on the central server |
| AI-2 | CSI time-series is converted to DAPD heatmap images |
| AI-3 | A VLM served on **vLLM** classifies each heatmap as **normal** or **fall**, with a confidence score |
| AI-4 | The VLM is tested as zero-shot, few-shot and LoRA fine-tuned, and compared with an **R(2+1)D** baseline (from the DapFall paper) |
| AI-5 | Data from **at least 5 volunteers**, split 70:15:15 into train, validation and test sets |
| AI-6 | Evaluation reports overall accuracy, precision, recall and F1 for the fall class, false alarms per hour, and inference time |

### 5.3 Web app: admin

**Accounts**

| ID | Requirement |
|---|---|
| WA-1 | Add an admin account (username, password, full name, phone, email) |
| WA-2 | Delete another admin account. An admin can't delete their own account. |
| WA-3 | Add a user account (username, password, full name, phone, email, address) |
| WA-4 | List user accounts (username, email, linked house, number of bathrooms watched, date added) |
| WA-5 | Turn a user account on or off |

**Houses**

| ID | Requirement |
|---|---|
| WA-6 | Add a house (name, address, date added) |
| WA-7 | View houses and their details (name, address, number of bathrooms, users, date added) |
| WA-8 | Edit a house |

**Bathrooms**

| ID | Requirement |
|---|---|
| WA-9 | Add a bathroom to a house (room name, Rx MAC address, baseline file) |
| WA-10 | View bathrooms and their details (name, house, Rx MAC, date added, calibration status) |
| WA-11 | Calibration status shows **"needs recalibration"** after a set period, e.g. 6 months since the last calibration |
| WA-12 | Edit a bathroom (name, Rx MAC, baseline file) |

**Who watches which bathroom**

| ID | Requirement |
|---|---|
| WA-13 | Link a user account to a house |
| WA-14 | Choose which bathrooms each user watches |
| WA-15 | Change or remove a user-bathroom pairing |

**Fall monitoring**

| ID | Requirement |
|---|---|
| WA-16 | Overview dashboard: at least the **10 latest falls**, a chart of falls over a recent period (e.g. the last 7 days), and the full fall history across all houses (date and time, house, bathroom, DAPD heatmap image) |

**Audit log**

| ID | Requirement |
|---|---|
| WA-17 | View and filter the log of additions, deletions and edits (who did it, what kind of action, when) |

### 5.4 Web app: user

| ID | Requirement |
|---|---|
| WU-1 | Log in with a username or email, plus a password |
| WU-2 | Overview of their own house: number of bathrooms watched, family members in the same house, at least the 10 latest falls |
| WU-3 | Alert status for each bathroom they watch (room name, alerts on or off) |
| WU-4 | Turn alerts on or off for each bathroom |
| WU-5 | Get an **email** alert when a fall happens |

## 6. Non-functional requirements

| ID | Requirement |
|---|---|
| NF-1 | **Privacy:** no cameras and no wearables. Only Wi-Fi signals are used. |
| NF-2 | **Accuracy:** overall accuracy of at least **85%** |
| NF-3 | **Real-time:** see the latency targets in 6.1 |
| NF-4 | **Server hardware:** see 6.2 |
| NF-5 | **Alert channels:** email first. The alert code must make it easy to add channels later (e.g. LINE, SMS, push), so adding one doesn't mean changing the detection code. |
| NF-6 | **Public access:** the web app is reachable by users over the internet via HTTPS. Only the web app is public. The database, AI service and gateway traffic stay on the local network. |

### 6.1 Latency targets

Times are measured from the end of the fall motion.

| Stage | Target (95% of falls) |
|---|---|
| Fall appears on the web dashboard | **≤ 5 s** |
| Email alert sent (handed to the mail server) | **≤ 10 s** |
| VLM inference per heatmap (part of the 5 s) | **≤ 2 s** |

**Why these numbers:**
- The medical deadline is the Golden Hour, which is 60 minutes. A few seconds of system delay doesn't matter for that. What matters is that the system is reliable and doesn't miss falls.
- The fall motion itself takes about 1 to 2 seconds. The system has to collect a CSI window of about 2 to 4 seconds at 100 Hz before it can tell a fall apart from sitting or bending down, so some delay can't be avoided.
- A small VLM on an RTX 4070 should classify one heatmap in well under 2 seconds. That leaves room for the network, building the heatmap, and saving to the database.
- The email target ends when the mail is handed to the mail server. When it actually reaches the inbox depends on the email provider, which is outside our control, so we report it but don't use it as a target.

### 6.2 Server hardware (edge server)

| Part | Spec |
|---|---|
| CPU | Intel Core i5-9500, 3.00 GHz (turbo ~4.4 GHz), 6 cores / 6 threads, 9 MB L3, virtualization on |
| GPU | NVIDIA GeForce RTX 4070, **12 GB GDDR6X**, 5,888 CUDA cores, PCIe 3.0 x16 |
| RAM | 32 GB DDR4, dual channel (2 × 16 GB), running at 2400 MT/s (the modules support XMP 3200). 2 of 4 slots used. |
| Storage | 512 GB NVMe SSD |
| Mainboard | Gigabyte Z370 AORUS Ultra Gaming 2.0 |
| Network | Ethernet |
| OS | Windows 11 Pro 64-bit (25H2) |

**What this means for the design:**
- **12 GB of VRAM limits the model size.** It fits a VLM of about 2 to 4B parameters at full precision, or about 7B when quantized (AWQ/GPTQ). LoRA fine-tuning of a 7B model needs QLoRA.
- **vLLM doesn't run natively on Windows.** It has to run in **WSL2** or Docker with GPU passthrough.
- **The CPU is the weak spot** (6 threads). Heatmap generation and the backend have to stay lightweight, or move to the GPU.
- Turning on XMP in the BIOS would raise RAM bandwidth for free.

## 7. Test environment

- Bathroom at least **1.70 m wide × 1.50 m long × 2.50 m high**
- Tx and Rx on opposite walls, **at least 1.70 m apart**, **at least 1.00 m** above the floor
- **One person** in the bathroom at a time, with the door closed

## 8. Out of scope

- Classifying the **type** of fall
- Finding **where** in the room the fall happened
- **Predicting** falls before they happen
- More than one person in the bathroom

**Planned for later:** alert channels other than email (e.g. LINE, SMS, push notifications). They aren't in this version, but the design leaves room for them (NF-5).

## 9. Success criteria

| Criterion | Target |
|---|---|
| Overall accuracy | ≥ 85% |
| Fall-class precision, recall and F1 | Reported, and compared with R(2+1)D |
| False alarms per hour | Reported |
| Inference time | Reported |
| Latency | Fall → dashboard ≤ 5 s, fall → email sent ≤ 10 s (95% of falls) |
| End-to-end demo | Fall in the test bathroom → event on the dashboard → email received |
| Web app | All WA-* and WU-* features working |

## 10. Expected benefits

1. A working prototype of real-time bathroom fall detection using Wi-Fi CSI that keeps users' privacy.
2. A VLM that classifies falls accurately from DAPD heatmaps.
3. A web app that lets caregivers monitor in real time and respond to accidents quickly.

## 11. Open questions

| # | Question | Owner |
|---|---|---|
| Q1 | Which VLM, within the 12 GB VRAM limit (see 6.2)? Open. Candidates are in `Design.md` §13. | พัลลภ |
| Q2 | Should the 6-month recalibration period be configurable? | พลกฤต + พัลลภ |

**Decided:** the gateway is a Raspberry Pi Zero 2 W. The stack is Next.js (web UI + API), Python (AI service), and PostgreSQL. See `Design.md`.
