# VIEMS — Venus Enterprises Inventory Management System
### Next.js 14 + Tailwind CSS Frontend

---

## Project Structure

```
viems/
├── app/
│   ├── admin/              ← Admin layout & all admin pages
│   │   ├── layout.tsx      ← Wraps every /admin/* page
│   │   ├── page.tsx        ← /admin — Dashboard
│   │   ├── po/page.tsx     ← Purchase Orders
│   │   ├── grn/page.tsx    ← Goods Received Note
│   │   ├── gin/page.tsx    ← Goods Issue Note
│   │   ├── drn/page.tsx    ← Damage Report
│   │   ├── persons/page.tsx← Persons & Roles
│   │   └── ...             ← All other admin pages (stubs ready)
│   ├── user/               ← User layout (Technical Officer)
│   │   ├── layout.tsx
│   │   └── page.tsx        ← Task Board
│   └── driver/             ← User layout (Driver role)
│       ├── layout.tsx
│       └── page.tsx        ← Driver GINs
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx ← Shell: sidebar + topbar
│   │   ├── AdminSidebar.tsx← Dark sidebar with full nav
│   │   └── AdminTopbar.tsx ← Search, notifications, user chip
│   ├── user/
│   │   ├── UserSidebar.tsx ← White sidebar, role-scoped nav
│   │   ├── UserTopbar.tsx  ← Topbar for user/driver
│   │   ├── UserLayoutWrapper.tsx
│   │   └── DriverLayoutWrapper.tsx
│   └── shared/
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       └── Logo.tsx
├── app/globals.css         ← Tailwind + custom classes
└── tailwind.config.ts
```

---

## Step-by-Step Local Setup

### Prerequisites
- Node.js v18 or later — download from https://nodejs.org
- VS Code — download from https://code.visualstudio.com

---

### Step 1 — Open the project in VS Code

1. Move/copy the `viems` folder to wherever you keep your projects (e.g. `Documents/projects/viems`)
2. Open VS Code
3. File → Open Folder → select the `viems` folder
4. VS Code will open with the project

---

### Step 2 — Open the integrated terminal

In VS Code: **Terminal → New Terminal** (or press Ctrl+` on Windows/Linux, Cmd+` on Mac)

You should see a terminal at the bottom pointing to your `viems` folder.

---

### Step 3 — Install dependencies

In the terminal, run:

```bash
npm install
```

This installs Next.js, React, Tailwind, Lucide icons, and TypeScript. Takes 1–2 minutes.

---

### Step 4 — Start the dev server

```bash
npm run dev
```

You will see output like:
```
▲ Next.js 14.2.3
- Local:   http://localhost:3000
```

---

### Step 5 — Open in browser

Open your browser and go to:

```
http://localhost:3000
```

It auto-redirects to `/admin` — the Admin Dashboard.

To view the other layouts:
- **Admin:**  http://localhost:3000/admin
- **User (TO):** http://localhost:3000/user
- **Driver:** http://localhost:3000/driver

---

### Step 6 — Recommended VS Code Extensions

Install these from the Extensions panel (Ctrl+Shift+X):

| Extension | ID |
|-----------|-----|
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` |
| ES7+ React/Redux Snippets | `dsznajder.es7-react-js-snippets` |
| Prettier - Code formatter | `esbenp.prettier-vscode` |
| Auto Import - ES6 | `NuclleaR.vscode-extension-auto-import` |
| GitLens | `eamodio.gitlens` |

---

## Routes Reference

| URL | Layout | Who sees it |
|-----|--------|-------------|
| `/admin` | Admin (dark sidebar) | Main Admin |
| `/admin/po` | Admin | Main Admin |
| `/admin/grn` | Admin | Main Admin |
| `/admin/gin` | Admin | Main Admin |
| `/admin/drn` | Admin | Main Admin |
| `/admin/rwo` | Admin | Main Admin |
| `/admin/persons` | Admin | Main Admin |
| `/user` | User (white sidebar) | Technical Officer |
| `/user/receipt` | User | TO — Confirm receipt |
| `/user/grtn` | User | TO — Raise GRtN |
| `/user/damage` | User | TO — Report damage |
| `/user/hours` | User | TO — Log machine hours |
| `/driver` | Driver (white + amber) | Driver (role-switched) |

---

## Connecting to NestJS Backend

When your NestJS + Prisma + PostgreSQL backend is ready:

1. Create a `.env.local` file in the root:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

2. Replace the static data in each page with API calls, for example in `app/admin/page.tsx`:
```ts
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`);
const stats = await res.json();
```

3. For authenticated routes, use Next.js middleware (`middleware.ts`) to check JWT tokens and redirect unauthenticated users.

---

## Mobile Responsive Behaviour

| Breakpoint | Sidebar behaviour |
|------------|-------------------|
| Mobile (< 1024px) | Sidebar hidden, opens via hamburger menu (slide-in drawer with overlay) |
| Desktop (≥ 1024px) | Sidebar always visible |

Table columns progressively hide on smaller screens (using `hidden sm:table-cell`, `hidden md:table-cell`).
