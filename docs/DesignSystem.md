# Design System

Visual and component rules for the **FallWatch.** Next.js web app, adapted from the **Sedap** admin dashboard template.
All UI must follow these tokens. Colors, radii, and shadows come from here.

---

## 1. Brand and tone

| Item | Value |
|---|---|
| Product name | `FallWatch.` (ระบบตรวจจับการล้มอัจฉริยะด้วยคลื่นไวไฟ) |
| Audience | Thai caregivers (ญาติ/ผู้ดูแล) and system admins (ผู้ดูแลระบบ) |
| Tone | Light, clean, calm, trustworthy. Clear alert hierarchy when a fall happens. |
| Theme mode | **Light mode only** (soft gray canvas `#f3f2f7` with crisp white cards `#ffffff`) |
| Language | UI text in Thai. Code, comments, commits in English. |

---

## 2. Color tokens

Adapted from Sedap's theme palette into Tailwind CSS (`tailwind.config.js` & `globals.css`).

### 2.1 Surfaces & Borders

| Token | Hex | Tailwind / CSS usage | Usage |
|---|---|---|---|
| `bg-subtle` | `#f3f2f7` | `bg-[#f3f2f7]` | Page background canvas |
| `bg-default` | `#ffffff` | `bg-white` | Cards, sidebar, topbar (mobile), modals, inputs |
| `bg-muted` | `#ebeaf1` | `bg-[#ebeaf1]` | Subtle hover/divider surfaces |
| `border-default` | `#ebebeb` | `border-[#ebebeb]` | Input borders, table dividers |
| `border-highlight` | `#d0d6de` | `border-[#d0d6de]` | Hover borders, vertical dividers |

### 2.2 Text Colors

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `text-default` | `#333333` | `text-[#333333]` | Primary body text |
| `text-muted` | `#464255` | `text-[#464255]` | Page headings, card titles, nav items |
| `text-subtle` | `#a3a3a3` | `text-[#a3a3a3]` | Subtitles, timestamps, placeholders, inactive icons |
| `text-inverse` | `#ffffff` | `text-white` | Text on primary/danger buttons and auth brand panel |

### 2.3 Brand & Status Colors

Every semantic color has a `lighter` tint (15% opacity) for soft badges, icon circles, and active nav backgrounds.

| Token | Hex | Lighter (15%) | Usage |
|---|---|---|---|
| `primary` (Emerald) | `#00b074` | `rgba(0, 176, 116, 0.15)` | Primary buttons, active sidebar pill & left bar, brand panel, "ปกติ / เปิดแจ้งเตือน" |
| `primary-dark` | `#009663` | — | Primary button hover |
| `info` (Sky Blue) | `#2d9cdb` | `rgba(45, 156, 219, 0.15)` | Charts, period filter icon, secondary action buttons |
| `danger` (Coral Red) | `#ff5b5b` | `rgba(255, 91, 91, 0.15)` | Fall alert banner, "พบการล้ม" badge, delete buttons, high-priority counter |
| `warning` (Amber) | `#f7c604` (`#d6ab00` text) | `rgba(247, 198, 4, 0.15)` | "ควรปรับเทียบใหม่" (Needs recalibration) badge & warning counter |
| `secondary` (Slate) | `#5e6c93` | `rgba(94, 108, 147, 0.15)` | Neutral badges, inactive states |

---

## 3. Typography

Font stack: `'Noto Sans Thai', 'Barlow', system-ui, sans-serif` (Brand logo uses `'Poppins'`).

Configured in `app/layout.js` via `next/font/google`:
```js
import { Barlow, Noto_Sans_Thai, Poppins } from 'next/font/google'

const barlow = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-barlow' })
const notoThai = Noto_Sans_Thai({ subsets: ['thai'], weight: ['400', '500', '600', '700'], variable: '--font-noto-thai' })
const poppins = Poppins({ subsets: ['latin'], weight: ['700'], variable: '--font-poppins' })
```

| Role | Tailwind | Size | Weight | Usage |
|---|---|---|---|---|
| Brand logo | `font-brand text-3xl font-bold tracking-tight` | 30 px | 700 | `FallWatch.` with green/amber dot |
| Page title | `text-2xl sm:text-[2rem] font-semibold text-[#464255]` | 24–32 px | 600 | `<h1>` / `<h2>` page heading |
| Card title | `text-lg sm:text-xl font-bold text-[#464255]` | 18–20 px | 700 | Card headers, modal titles |
| Stat number | `text-3xl sm:text-4xl font-bold text-[#464255]` | 30–36 px | 700 | KPI numbers on stat cards |
| Body | `text-sm sm:text-base text-[#333333]` | 14–16 px | 400 | Table cells, descriptions |
| Caption | `text-xs text-[#a3a3a3]` | 12 px | 400 | Timestamps, helper text |
| Label | `text-xs font-medium text-[#464255]` | 12 px | 500 | Form labels |
| Button | `text-sm font-semibold` | 14 px | 600 | All buttons |

---

## 4. Spacing, Radii, and Layout

| Token | Value | Usage |
|---|---|---|
| Page canvas | `bg-[#f3f2f7] min-h-screen` | Main app background |
| Card radius | `rounded-[14px]` | All cards, dropdowns, modals, inputs, buttons |
| Card shadow | `shadow-[0_4px_8px_0_rgb(0_0_0/0.04)]` | Borderless white cards |
| Card padding | `p-6 sm:p-7` | Inside cards |
| Section gap | `gap-6` | Between stat cards and chart/table grids |
| Control height | `h-11` or `h-12` (`44–48px`) | Standard Sedap button & input height |

### 4.1 App Shell Layout (Authenticated)

```
┌──────────────┬───────────────────────────────────────────────┐
│  White       │  Topbar: Search | 🔔 Alerts | 👤 สวัสดี, Name │
│  Sidebar     ├───────────────────────────────────────────────┤
│  (w-64/72)   │  Page Header (Title + Subtitle + Filter)      │
│              │  ───────────────────────────────────────────  │
│  FallWatch.  │  Main Content (bg-[#f3f2f7], cards grid)      │
│  │ Active    │                                               │
│  │ (green)   │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

- **Sidebar:** `bg-white`, sticky `lg:w-72` on desktop, slide-out drawer on mobile.
- **Active Nav Item:** `bg-[#00b074]/15 text-[#00b074] font-bold rounded-lg` + vertical green bar on the left edge (`w-1.5 bg-[#00b074] rounded-e-md`).
- **Topbar:** Search input (`bg-[#fdfdfd] rounded-[14px]`), square tinted notification buttons (`size-11 rounded-[14px] bg-[#2d9cdb]/15` or `bg-[#ff5b5b]/15`) with floating circular count badge, and user profile dropdown.

### 4.2 Auth Layout (Login)

Split-screen layout (Sedap `auth-layout`):
- **Left panel (`lg:grid-cols-[minmax(0,36rem)_1fr]`):** `bg-[#00b074]` with subtle decorative `bg-white/10` circles, `FallWatch.` logo, privacy-first headline ("เฝ้าระวังการล้มในห้องน้ำแบบเรียลไทม์ ไร้กล้อง ไร้สายรัดข้อมือ").
- **Right panel:** Centered white card (`rounded-[14px]`) with Username/Email + Password form. **No sign-up link** (Admin creates all accounts).

---

## 5. Components

### 5.1 Buttons

| Variant | Classes | When |
|---|---|---|
| Primary | `bg-[#00b074] hover:bg-[#009663] text-white rounded-[14px]` | Main action (เข้าสู่ระบบ, บันทึก, เพิ่มข้อมูล) |
| Destructive | `bg-[#ff5b5b] hover:bg-[#e64545] text-white rounded-[14px]` | Delete, disable account |
| Outline Info | `border border-[#2d9cdb] text-[#2d9cdb] hover:bg-[#2d9cdb]/15 rounded-[14px]` | View report, export, view heatmap |
| Outline Neutral | `border border-[#ebebeb] text-[#464255] hover:bg-[#f3f2f7] rounded-[14px]` | Cancel, secondary actions |
| Subtle Square Icon | `size-11 rounded-[14px] bg-[#2d9cdb]/15 text-[#2d9cdb]` | Topbar alerts, quick icon actions |

### 5.2 Badges

```jsx
// Fall — Coral Red
<span className="inline-flex items-center rounded-full bg-[#ff5b5b]/15 px-3 py-1 text-xs font-semibold text-[#e64545]">
  พบการล้ม
</span>

// Needs recalibration — Amber
<span className="inline-flex items-center rounded-full bg-[#f7c604]/15 px-3 py-1 text-xs font-semibold text-[#d6ab00]">
  ควรปรับเทียบใหม่
</span>

// Normal / Alerts ON — Emerald Green
<span className="inline-flex items-center rounded-full bg-[#00b074]/15 px-3 py-1 text-xs font-semibold text-[#009663]">
  เปิดการแจ้งเตือน
</span>

// Off / Inactive — Slate
<span className="inline-flex items-center rounded-full bg-[#5e6c93]/15 px-3 py-1 text-xs font-semibold text-[#5e6c93]">
  ปิดการใช้งาน
</span>
```

### 5.3 Stat Cards (KPI)

```jsx
<div className="rounded-[14px] bg-white p-6 shadow-[0_4px_8px_0_rgb(0_0_0/0.04)] flex items-center gap-5">
  <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#00b074]/15 text-[#00b074]">
    <Icon className="size-7" />
  </span>
  <div>
    <p className="text-3xl font-bold text-[#464255] leading-none">3</p>
    <p className="mt-2 text-sm text-[#464255]">เหตุการณ์ล้มวันนี้</p>
  </div>
</div>
```

### 5.4 Tables

- Inside a `rounded-[14px] bg-white shadow-[0_4px_8px_0_rgb(0_0_0/0.04)]` card.
- Header: `bg-[#f3f2f7]/60 text-xs font-semibold text-[#464255] uppercase`
- Row hover: `hover:bg-[#f3f2f7]/50`
- Pagination: `?page=1&pageSize=20` (see `CONVENTIONS.md`).

### 5.5 Alert Banner (SSE Real-time Fall)

```jsx
// Shown at the top of Dashboard / User Home when a new fall arrives via SSE
<div className="flex items-start gap-3 rounded-[14px] border border-[#ff5b5b]/30 bg-[#ff5b5b]/10 p-4 shadow-[0_4px_8px_0_rgb(0_0_0/0.04)]">
  <AlertTriangle className="size-5 text-[#e64545] mt-0.5 shrink-0" />
  <div className="flex-1">
    <p className="text-sm font-bold text-[#8f2a2a]">พบการล้ม — ห้องน้ำ A, บ้านสมชาย</p>
    <p className="text-xs text-[#e64545] mt-0.5">14:32:01 น. · ความเชื่อมั่น 91%</p>
  </div>
  <button className="text-xs font-semibold text-[#e64545] hover:underline">ดู Heatmap</button>
</div>
```

---

## 6. Navigation Structure

### Admin Sidebar (`/admin`)
- ภาพรวมระบบ (`/admin`)
- บัญชีผู้ใช้งาน (`/admin/accounts`)
- ข้อมูลบ้าน (`/admin/houses`)
- ข้อมูลห้องน้ำ (`/admin/bathrooms`)
- ผู้ติดตามห้องน้ำ (`/admin/watchers`)
- บันทึกการใช้งาน (`/admin/audit-log`)

### User Sidebar (`/home`)
- บ้านของฉัน (`/home`)
- ตั้งค่าการแจ้งเตือน (`/home/alerts`)

---

## 7. Date and Time Display

Store UTC in DB (see `CONVENTIONS.md`). Display in `Asia/Bangkok` using `lib/format.js`.
