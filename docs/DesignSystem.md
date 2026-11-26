# Design System

Visual and component rules for the Next.js web app.
All UI must follow these tokens. Colors and spacing come from here, never from arbitrary Tailwind values.

---

## 1. Brand and tone

| Item | Value |
|---|---|
| Product name | Fall Watch |
| Audience | Thai caregivers and system admins |
| Tone | Clear, calm, trustworthy. Never alarming unless a fall actually happened. |
| Language | UI text in Thai. Code, comments, commits in English. |

---

## 2. Color tokens

We use Tailwind CSS v3 with a custom theme. These map to `tailwind.config.js`.

### 2.1 Semantic palette

| Token | Tailwind class | Hex | Usage |
|---|---|---|---|
| `color-bg` | `bg-slate-50` | `#f8fafc` | Page background |
| `color-surface` | `bg-white` | `#ffffff` | Cards, sidebars, modals |
| `color-border` | `border-slate-200` | `#e2e8f0` | All borders and dividers |
| `color-text-primary` | `text-slate-900` | `#0f172a` | Headings, body text |
| `color-text-secondary` | `text-slate-500` | `#64748b` | Labels, captions, placeholder |
| `color-text-inverse` | `text-white` | `#ffffff` | Text on dark backgrounds |

### 2.2 Brand colors

| Token | Tailwind class | Hex | Usage |
|---|---|---|---|
| `color-primary` | `bg-blue-600` | `#2563eb` | Primary buttons, active nav, links |
| `color-primary-hover` | `bg-blue-700` | `#1d4ed8` | Hover on primary buttons |
| `color-primary-light` | `bg-blue-50` | `#eff6ff` | Selected row, active badge bg |

### 2.3 Status colors

| Token | Tailwind class | Hex | Usage |
|---|---|---|---|
| `color-danger` | `bg-red-600` | `#dc2626` | Fall alert badge, delete button |
| `color-danger-light` | `bg-red-50` | `#fef2f2` | Fall alert row background |
| `color-warning` | `bg-amber-500` | `#f59e0b` | Needs recalibration badge |
| `color-warning-light` | `bg-amber-50` | `#fffbeb` | Warning row background |
| `color-success` | `bg-green-600` | `#16a34a` | Active / alerts enabled |
| `color-success-light` | `bg-green-50` | `#f0fdf4` | Success row background |
| `color-muted` | `bg-slate-400` | `#94a3b8` | Inactive, disabled, off |

---

## 3. Typography

Font stack: `'Noto Sans Thai', 'Inter', system-ui, sans-serif`

Add to `app/layout.js`:
```js
import { Inter, Noto_Sans_Thai } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const notoThai = Noto_Sans_Thai({ subsets: ['thai'], variable: '--font-noto-thai' })
```

| Role | Tailwind | Size | Weight | Usage |
|---|---|---|---|---|
| Page title | `text-2xl font-semibold` | 24 px | 600 | `<h1>` on each page |
| Section title | `text-lg font-semibold` | 18 px | 600 | Card headers, table titles |
| Body | `text-sm` | 14 px | 400 | Table cells, descriptions |
| Caption | `text-xs text-slate-500` | 12 px | 400 | Timestamps, helper text |
| Label | `text-xs font-medium` | 12 px | 500 | Form labels |
| Button | `text-sm font-medium` | 14 px | 500 | All buttons |

---

## 4. Spacing and layout

| Token | Value | Usage |
|---|---|---|
| Page padding | `p-6` (24 px) | Outer padding on every page |
| Card padding | `p-4` (16 px) | Inside cards |
| Section gap | `gap-6` | Between sections on a page |
| Form row gap | `gap-4` | Between form fields |
| Table row height | `h-12` (48 px) | `<tr>` min-height |

### Layout structure

```
┌─────────────────────────────────────────────┐
│  Sidebar (w-56, fixed, hidden on mobile)    │
│  ┌─────────────────────────────────────────┐│
│  │  Top bar (h-14): page title + user menu ││
│  │─────────────────────────────────────────││
│  │  Main content (flex-1, p-6, scroll)     ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

- Sidebar background: `bg-slate-900` (dark)
- Sidebar text: `text-slate-300`, active item: `text-white bg-slate-700`
- Top bar background: `bg-white border-b border-slate-200`

---

## 5. Components

All components use **shadcn/ui** as the base. Override only with Tailwind classes. No custom CSS files.

### 5.1 Buttons

| Variant | Classes | When |
|---|---|---|
| Primary | `bg-blue-600 hover:bg-blue-700 text-white` | Main action (Add, Save) |
| Destructive | `bg-red-600 hover:bg-red-700 text-white` | Delete, disable |
| Outline | `border border-slate-300 hover:bg-slate-50` | Secondary action (Cancel, Edit) |
| Ghost | `hover:bg-slate-100` | Icon buttons, table row actions |

Size: always `h-9 px-4` for normal buttons. Icon-only buttons: `h-9 w-9`.

### 5.2 Badges

```jsx
// Fall — red
<span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
  ล้ม
</span>

// Needs recalibration — amber
<span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
  ต้องสอบเทียบ
</span>

// Active / alert on — green
<span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
  เปิดการแจ้งเตือน
</span>
```

### 5.3 Cards

```jsx
<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
  {/* content */}
</div>
```

### 5.4 Tables

- Use shadcn/ui `<Table>` component.
- Header: `bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide`
- Row hover: `hover:bg-slate-50`
- Striped: **not used** (hover is enough)
- Pagination: `?page=1&pageSize=20` (see `CONVENTIONS.md`)

### 5.5 Forms

- Use shadcn/ui `<Input>`, `<Select>`, `<Checkbox>`, `<Label>`.
- Always pair `<Label>` with its control via `htmlFor`.
- Validation errors: `text-red-600 text-xs mt-1` below the field.
- Form layout: single-column on mobile, two-column (`grid grid-cols-2 gap-4`) on desktop.

### 5.6 Alert banner (fall notification)

```jsx
// Shown at the top of the fall dashboard when a new fall arrives via SSE
<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
  <AlertTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
  <div>
    <p className="text-sm font-semibold text-red-800">พบการล้ม — ห้องน้ำ A, บ้านสมชาย</p>
    <p className="text-xs text-red-600 mt-0.5">14:32:01 น. · ความเชื่อมั่น 91%</p>
  </div>
</div>
```

---

## 6. Icons

Library: `lucide-react` (included with shadcn/ui).

| Icon | Usage |
|---|---|
| `HomeIcon` | Houses nav |
| `BuildingIcon` | Bathrooms nav |
| `UsersIcon` | Accounts nav |
| `AlertTriangleIcon` | Fall events, warnings |
| `ActivityIcon` | Dashboard, real-time |
| `ClipboardListIcon` | Audit log |
| `BellIcon` / `BellOffIcon` | Alert toggle |
| `PencilIcon` | Edit |
| `TrashIcon` | Delete |
| `PlusIcon` | Add |
| `ChevronRightIcon` | Breadcrumbs |

Size: always `h-4 w-4` inline with text, `h-5 w-5` for standalone icon buttons.

---

## 7. Navigation structure

### Admin sidebar

```
📊 Dashboard          /admin
👥 Accounts           /admin/accounts
🏠 Houses             /admin/houses
🚿 Bathrooms          /admin/bathrooms
👁 Watchers           /admin/watchers
📋 Audit Log          /admin/audit-log
```

### User sidebar

```
🏠 บ้านของฉัน        /home
🔔 การแจ้งเตือน       /home/alerts
```

---

## 8. Date and time display

Store UTC in DB (see `CONVENTIONS.md`). Display in `Asia/Bangkok` using:

```js
// lib/format.js
export function formatDateTime(utcString) {
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(utcString))
}
```

---

## 9. Real-time (SSE) behavior

When a fall event arrives on `/events/stream`:

1. Play a soft alert sound (optional, user can mute).
2. Show the **red alert banner** (§5.6) at the top of the fall dashboard.
3. Prepend the new row to the fall events table without a full page reload.
4. The banner auto-dismisses after 10 s, or when the user clicks ✕.

---

## 10. Responsive breakpoints

| Breakpoint | Tailwind | Behavior |
|---|---|---|
| Mobile | (default) | Sidebar hidden (hamburger menu), single-column layout |
| Tablet | `md:` (768 px) | Sidebar visible, two-column forms |
| Desktop | `lg:` (1024 px) | Full layout, wider tables |

---

## 11. Open questions

| # | Question | Owner |
|---|---|---|
| Q1 | Should we use a dark sidebar or light? (Current: dark `slate-900`) | พลกฤต |
| Q2 | Do we need a Thai Buddhist Era (พ.ศ.) date format? | พลกฤต + team |
| Q3 | Exact chart library: Recharts or something else? (Design.md says Recharts) | พลกฤต |
