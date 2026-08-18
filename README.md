# marketing_manager_PNJXN
# Marketing OS

*One workspace for everything marketing.*

An internal web application for a digital marketing agency to manage clients, content, tasks, approvals, brand guidelines, SEO, ads, reporting, and team workflow — in one place instead of scattered across WhatsApp, spreadsheets, and five other tools.

**This build is a fully working, click-through product**, not a static mockup. Every button does something real: creating a client actually creates a client, dragging a task across the kanban board actually changes its status, approving content actually writes an approval history entry. Right now all of that runs against a **local mock database** (browser `localStorage`) instead of Supabase — see [Current status](#current-status-whats-real-vs-mocked) below for exactly what that means.

---

## Current status: what's real vs. mocked

| Layer | Status |
|---|---|
| UI, navigation, responsive layout | **Real.** Vanilla HTML/CSS/JS, no build step. |
| Create/edit/delete clients, content, tasks, comments, Brand Brain | **Real interactions**, persisted to `localStorage` (see `js/db.js`). |
| Client health scoring, attention alerts, "today's work" | **Real computation** from the data above — nothing hardcoded, see `computeClientHealth()` / `getAttentionItems()` in `js/db.js`. |
| Dashboard, calendar, kanban, approval center | **Fully interactive.** |
| Authentication | **Mocked.** `js/auth.js` logs any email/password in as a demo admin and stores a session flag in `localStorage`. Not secure, not multi-user. |
| Database | **Mocked.** `js/db.js` seeds realistic demo data on first load and persists all changes to `localStorage`. No real multi-user sync. |
| AI Content Assistant | **Mocked.** Produces a template-based draft using the client's Brand Brain, entirely in the browser. No OpenAI call is made yet. |
| Supabase / PostgreSQL / Row Level Security | **Designed, not connected.** `supabase/schema.sql` and `supabase/policies.sql` define the target schema and RLS rules. See "Connecting Supabase" below. |
| File uploads (Supabase Storage) | **Not implemented.** The Files tab shows folder structure only. |

This mirrors the phased approach requested in the build brief: Phase 1 (architecture, design system) and Phase 2 (dashboard, clients, client workspace) are complete and fully interactive against mock data. Phases 3–7 (real Supabase wiring, file storage, real AI calls, deeper SEO/Ads/Reports, deployment) are scaffolded (schema, folder structure, stub pages) but not wired to a live backend — see [What's left](#whats-left) for the concrete next steps.

---

## Why this architecture proves the "client-agnostic" requirement

The core design constraint in the brief was: **a brand-new client, from an industry the agency has never served, must be onboardable through configuration — never through code changes.**

To prove that:

- **No client names appear in application logic.** Search the codebase — there is no `if client === "..."` anywhere. Every page renders from whatever is in `clients`, `services`, `platforms`, etc.
- **Tabs on a client workspace are computed from that client's configured services** (`availableTabs()` in `js/client-detail.js`). A client with no SEO service simply never sees an SEO tab.
- **Seed data includes two clients from completely unrelated industries** — Stackflow (B2B SaaS) and Verdanta (D2C skincare) — alongside the agency's real hospitality clients, each with entirely different services, KPIs, platforms, and Brand Brain tone. Open their workspaces and compare them to Mosaic Hotels or Jim's Jungle Retreat: same app, same code, completely different content.
- **The "Add Client" wizard** (`clients.html` → "+ Add Client") walks through identity → services/platforms → goals/team → workflow/reporting, and generates the client's workspace from that configuration — no developer involved.
- **Custom fields** (`client.customFields`) let one client carry a "Booking engine URL" and another carry a "CRM identifier" without either polluting the other's schema.

---

## Tech stack

- **Frontend:** HTML + CSS + vanilla JavaScript (ES modules). No framework, no build step — open `index.html` through a static server and it runs.
- **Data layer today:** `localStorage`, abstracted behind async functions in `js/db.js` so it can be swapped for Supabase calls without touching any page.
- **Data layer designed for:** Supabase (PostgreSQL + Auth + Storage + Row Level Security).
- **AI (designed for):** OpenAI API, called from a server-side function — never from the browser.
- **Deployment target:** Vercel or Netlify (static hosting + serverless functions for AI).

---

## Folder structure

```
marketing-os/
├── index.html                 # redirects to login or dashboard
├── login.html
├── pages/                     # one HTML file per module
│   ├── dashboard.html
│   ├── clients.html
│   ├── client-detail.html     # the dynamic per-client workspace (all tabs)
│   ├── content.html           # agency-wide content calendar/list
│   ├── tasks.html              # agency-wide kanban/list
│   ├── approvals.html
│   ├── brand-brain.html
│   ├── seo.html
│   ├── ads.html
│   ├── reports.html
│   ├── team.html
│   └── settings.html
├── css/
│   ├── variables.css          # design tokens (colours, spacing, radii)
│   ├── base.css                # reset + typography
│   ├── layout.css              # app shell: sidebar, topbar, page grid
│   ├── components.css          # buttons, cards, badges, modals, kanban, calendar…
│   └── responsive.css          # tablet/mobile breakpoints, bottom nav
├── js/
│   ├── db.js                   # THE MOCK DATA LAYER — read this first
│   ├── auth.js                 # mock session handling
│   ├── app.js                  # shared shell: sidebar, topbar, search, quick add
│   ├── ui.js                   # shared badge/pill rendering helpers
│   ├── utils.js                # formatting, toasts, confirm dialogs, etc.
│   └── <page>.js                # one controller per page in pages/
├── supabase/
│   ├── schema.sql               # target Postgres schema
│   ├── policies.sql             # target Row Level Security policies
│   └── seed.sql                  # example seed pattern (see note inside)
├── .env.example
├── package.json
└── README.md   ← you are here
```

**Why one `db.js` instead of scattering `localStorage` calls everywhere:** every page (`clients.js`, `tasks.js`, `content.js`, ...) only ever calls functions like `listClients()`, `addTask()`, `computeClientHealth()`. None of them know or care that the data currently lives in `localStorage`. That means connecting Supabase later is a **single-file change** (see below) instead of a rewrite.

---

## Running it locally

No build step required.

```bash
npm install       # optional, only needed for the `serve` dev script
npm run dev        # serves the folder at http://localhost:5173
```

Or just open `index.html` with any static file server (VS Code "Live Server", `npx serve`, `python -m http.server`, etc.) — it must be served over `http://`/`https://`, not opened as a `file://` path, because ES modules require it.

**Logging in:** any email/password works (demo auth). You'll land on the dashboard as the seeded admin, Nikhil Verma.

**Resetting demo data:** Settings → Danger zone → "Reset demo data", or the same button on the Dashboard header.

---

## Connecting Supabase (the real next step)

This is the single most important thing to do before using this in production.

1. **Create a Supabase project.** Run `supabase/schema.sql`, then `supabase/policies.sql`, then port the seed data (see the note inside `supabase/seed.sql` — the fastest path is a one-time Node script that reads the `SEED` object at the top of `js/db.js` and inserts it via the Supabase JS client, since that object already has the exact shape you need).
2. **Add the Supabase JS client** (`@supabase/supabase-js` via a `<script type="module">` CDN import, or bundle it — no build step is required to use it from a CDN).
3. **Rewrite `js/db.js` function bodies only.** Every exported function signature (`listClients()`, `addTask(data)`, `updateContent(id, patch)`, …) stays the same — swap the `localStorage` read/write inside each one for `await supabase.from('clients').select()` etc. No page-level file (`clients.js`, `dashboard.js`, ...) needs to change.
4. **Replace `js/auth.js`** with real Supabase Auth calls (`supabase.auth.signInWithPassword`, `supabase.auth.onAuthStateChange`), keeping the same exported function names (`login`, `logout`, `getCurrentUser`, `requireAuth`) so `app.js` and every page keep working unmodified.
5. **Turn on the RLS policies** in `supabase/policies.sql` — they're written to match the role model in section 36 of the brief (Admin/Manager see everything, others only see clients they're a member of via `client_members`).
6. **Wire Supabase Storage** for the Files tab: create a `client-files` bucket, and replace the placeholder folder cards in `renderFilesTab()` (`js/client-detail.js`) with real `supabase.storage.from('client-files').list()/upload()/download()` calls.

---

## AI Assistant architecture (designed, not yet live)

The Brand Brain tab includes a "Generate draft" button today — it's a client-side template, clearly not a real model call, so nobody mistakes it for production AI.

To make it real **without ever exposing an OpenAI key to the browser**:

1. Create a serverless function (Vercel: `/api/generate-content.js`, Netlify: `/.netlify/functions/generate-content`).
2. The function reads `OPENAI_API_KEY` from its own environment (never `VITE_`-prefixed, never bundled into frontend JS).
3. The frontend (`renderBrandBrainTab()` in `js/client-detail.js`) posts `{ clientId, contentType, platform, topic }` to that function.
4. The function fetches that **one client's** Brand Brain from Supabase server-side (using the service role key, also never exposed to the browser), builds the prompt, calls OpenAI, and returns the draft.
5. The frontend shows the draft in an editable field. **Nothing is ever auto-published** — every AI draft becomes a `DRAFT`-status content item requiring the normal human approval flow, exactly as it does today with the mock version.

This keeps the tenant isolation promise from the brief: a request for Client A can only ever see Client A's Brand Brain, because the lookup happens server-side keyed off `clientId`, scoped by the same Row Level Security that protects everything else.

---

## Design system

Tokens live in `css/variables.css` — background `#F7F8FA`, primary text `#111827`, accent `#556B2F`, with semantic success/warning/danger/info colours. Dark mode is wired at the CSS-variable level (`[data-theme="dark"]`) and toggleable from Settings, though light is the default. Reusable components (buttons, cards, badges, modals, tabs, kanban cards, calendar cells, toasts, skeleton loaders, empty states) live in `css/components.css` so no page hand-rolls its own button or card styling.

---

## How to add a new client (no code required)

1. Clients → **+ Add Client**.
2. Walk through the 4-step wizard: identity → services & platforms → goals & team → workflow & reporting.
3. You're dropped straight into that client's new workspace on the Brand Brain tab — fill in tone, voice, and rules.
4. Add your first content item and task from inside the workspace.

The client immediately shows up on the Dashboard, Clients grid, Content calendar, Tasks board, and Brand Brain overview — because every one of those reads from the same `clients` collection, not a hardcoded list.

## How to remove demo data

Settings → Danger zone → Reset demo data restores the original seed — it doesn't delete it permanently. To ship with a genuinely empty workspace, once Supabase is connected, simply don't run `supabase/seed.sql` (or delete the seeded rows) — the mock seed in `js/db.js` only runs in this pre-Supabase build.

## How to add team members

Currently team members are part of the seed data in `js/db.js` (`team` array). Once Supabase Auth is connected, invite flows should create a matching `profiles` row (see `supabase/schema.sql`) — a Team → "Invite" UI is one of the items in "What's left" below.

---

## What's left

Being transparent about the gap between this build and the full brief:

- **Supabase wiring** (see above) — the biggest one. Everything else assumes this is done first.
- **Real AI calls** via a serverless function (architecture above is ready to slot in).
- **File upload/preview/download** via Supabase Storage (Files tab currently shows folder placeholders only).
- **Real Google Analytics / Search Console / Meta Ads API / GBP integrations** — `client_integrations` table and Settings → Integrations panel are scaffolded; the actual OAuth flows are not implemented.
- **Configurable per-client workflow stages** — the schema (`workflow_stages` table) supports it, but the UI currently uses one fixed content-status pipeline (`CONSTANTS.CONTENT_STATUSES` in `js/db.js`) for every client. Making that per-client-configurable is a moderate follow-up.
- **PDF/CSV report export** — Reports tab lists reports and has a "Generate Report" action; export formats aren't built yet.
- **Team invite flow / granular role editing UI** — Team page is currently read-only.
- **Charts** (Chart.js) for SEO/Ads trend lines — current SEO/Ads pages use tables and KPI tiles; a lightweight chart library can be dropped in via CDN without a build step.

None of these require restructuring what's already built — they're additive, which is exactly the point of the `db.js` abstraction and the tab/service-driven client workspace.
