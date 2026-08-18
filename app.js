// js/app.js
// Renders the shared app shell (sidebar + topbar + mobile bottom nav) on every
// protected page, wires up global search, quick add, and the notification
// bell. Import and call initShell({ active: 'dashboard' }) from each page.

import { requireAuth, getCurrentUser, logout } from "./auth.js";
import { initials, escapeHtml, debounce, qs, qsa, toast } from "./utils.js";
import { globalSearch, getAttentionItems, addClient, addTask, addContent, CONSTANTS } from "./db.js";

const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  clients: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="18" cy="8" r="2.4"/><path d="M15.5 14.2c2.6.4 4.5 2.8 4.5 5.8"/></svg>',
  content: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/></svg>',
  tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l2.5 2.5L16 9"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>',
  approvals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
  brand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a5 5 0 015 5c0 3-2 4-2 7H9c0-3-2-4-2-7a5 5 0 015-5z"/><path d="M9 21h6M10 18h4"/></svg>',
  seo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11l2 2 4-4"/></svg>',
  ads: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11v2a2 2 0 002 2h1l3 5V4L6 9H5a2 2 0 00-2 2z"/><path d="M15 8a4 4 0 010 8M18 5a8 8 0 010 14"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
  team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="9" r="2.5"/><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 14.3c2.6.3 4.5 2.5 4.5 5.7"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21a2 2 0 01-4 0v-.2a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H3a2 2 0 010-4h.2a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.6V3a2 2 0 014 0v.2a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.6 1H21a2 2 0 010 4h-.2a1.7 1.7 0 00-1.6 1z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
};

const NAV = [
  { key: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "dashboard" },
  { key: "clients", label: "Clients", href: "clients.html", icon: "clients" },
  { key: "content", label: "Content", href: "content.html", icon: "content" },
  { key: "tasks", label: "Tasks", href: "tasks.html", icon: "tasks" },
  { key: "approvals", label: "Approvals", href: "approvals.html", icon: "approvals" },
  { key: "brand-brain", label: "Brand Brain", href: "brand-brain.html", icon: "brand" },
  { key: "seo", label: "SEO", href: "seo.html", icon: "seo" },
  { key: "ads", label: "Ads", href: "ads.html", icon: "ads" },
  { key: "reports", label: "Reports", href: "reports.html", icon: "reports" },
  { key: "team", label: "Team", href: "team.html", icon: "team" },
  { key: "settings", label: "Settings", href: "settings.html", icon: "settings" },
];

const BOTTOM_NAV_KEYS = ["dashboard", "clients", "tasks", "approvals", "content"];

export async function initShell({ active }) {
  const user = requireAuth();
  if (!user) return null;

  document.body.insertAdjacentHTML("afterbegin", shellHtml(active, user));
  wireSidebar();
  wireTopbar(user);
  await wireAttentionBadge();
  return user;
}

function shellHtml(active, user) {
  const navItems = NAV.map(
    (n) => `
    <a class="sidebar-link ${n.key === active ? "active" : ""}" href="${n.href}">
      ${ICONS[n.icon]}<span>${n.label}</span>
    </a>`
  ).join("");

  const bottomItems = BOTTOM_NAV_KEYS.map((key) => {
    const n = NAV.find((x) => x.key === key);
    return `<a href="${n.href}" class="${key === active ? "active" : ""}">${ICONS[n.icon]}<span>${n.label}</span></a>`;
  }).join("");

  return `
  <div class="app-shell-inject">
    <div class="sidebar">
      <div class="sidebar-brand">
        <div class="mark">M</div>
        <div class="name">MARKETING OS<span>Agency workspace</span></div>
      </div>
      <nav class="sidebar-nav">${navItems}</nav>
      <div class="sidebar-footer">
        <div class="sidebar-user" id="sidebar-user">
          <div class="avatar">${initials(user.name)}</div>
          <div class="who">
            <div class="n">${escapeHtml(user.name)}</div>
            <div class="r">${escapeHtml(user.role)}</div>
          </div>
        </div>
      </div>
    </div>
    <nav class="bottom-nav">${bottomItems}</nav>
  </div>
  <div class="topbar-inject">
    <span class="workspace-pill">Agency Workspace</span>
    <div class="topbar-search dropdown" id="search-wrap">
      ${ICONS.search}
      <input class="input" id="global-search" type="search" placeholder="Search clients, content, tasks, keywords…" autocomplete="off" aria-label="Global search"/>
      <div class="dropdown-menu" id="search-results" style="left:0;right:auto;width:100%;max-height:340px;overflow-y:auto;"></div>
    </div>
    <div class="topbar-actions">
      <div class="dropdown" id="notif-wrap">
        <button class="icon-btn" id="notif-btn" aria-label="Notifications">${ICONS.bell}<span class="dot" id="notif-dot" hidden></span></button>
        <div class="dropdown-menu" id="notif-menu" style="width:320px;"></div>
      </div>
      <button class="btn btn-primary btn-sm" id="quick-add-btn">${ICONS.plus} Quick Add</button>
      <div class="dropdown" id="profile-wrap">
        <div class="avatar" id="profile-avatar" style="cursor:pointer" role="button" tabindex="0" aria-label="Profile menu">${initials(user.name)}</div>
        <div class="dropdown-menu" id="profile-menu">
          <div class="dropdown-item" style="pointer-events:none;">
            <div><b>${escapeHtml(user.name)}</b><br><span class="muted" style="font-size:11.5px">${escapeHtml(user.email)}</span></div>
          </div>
          <div class="dropdown-sep"></div>
          <a class="dropdown-item" href="settings.html">Settings</a>
          <div class="dropdown-item" id="logout-btn">Log out</div>
        </div>
      </div>
    </div>
  </div>
  <div id="quick-add-overlay" class="modal-overlay"></div>
  `;
}

// Move injected sidebar/topbar into the actual layout containers expected by
// each page's HTML (#sidebar-slot, #topbar-slot). This keeps page markup declarative.
function mountShell() {
  const sidebarSlot = document.getElementById("sidebar-slot");
  const topbarSlot = document.getElementById("topbar-slot");
  const bundle = document.querySelector(".app-shell-inject");
  const topbarBundle = document.querySelector(".topbar-inject");
  if (sidebarSlot && bundle) {
    sidebarSlot.replaceWith(bundle.querySelector(".sidebar"));
    document.body.appendChild(bundle.querySelector(".bottom-nav"));
    bundle.remove();
  }
  if (topbarSlot && topbarBundle) {
    topbarSlot.append(...topbarBundle.childNodes);
    topbarBundle.remove();
  }
}
mountShell();

function wireSidebar() {
  // no-op placeholder for future keyboard nav / collapse behaviour
}

function wireTopbar(user) {
  const search = qs("#global-search");
  const results = qs("#search-results");
  search?.addEventListener(
    "input",
    debounce(async (e) => {
      const q = e.target.value;
      if (!q) {
        results.classList.remove("open");
        return;
      }
      const items = await globalSearch(q);
      if (items.length === 0) {
        results.innerHTML = `<div class="dropdown-item" style="pointer-events:none;color:var(--color-muted)">No results for "${escapeHtml(q)}"</div>`;
      } else {
        results.innerHTML = items
          .map((r) => `<a class="dropdown-item" href="${r.link}"><span class="badge badge-neutral">${r.type}</span><span>${escapeHtml(r.label)}</span></a>`)
          .join("");
      }
      results.classList.add("open");
    }, 220)
  );
  document.addEventListener("click", (e) => {
    if (!qs("#search-wrap")?.contains(e.target)) results?.classList.remove("open");
  });

  const notifBtn = qs("#notif-btn");
  const notifMenu = qs("#notif-menu");
  notifBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();
    closeAllDropdowns(notifMenu);
    if (!notifMenu.classList.contains("open")) {
      const items = await getAttentionItems();
      notifMenu.innerHTML = items.length
        ? items
            .slice(0, 6)
            .map(
              (a) =>
                `<a class="dropdown-item" href="${a.link}" style="align-items:flex-start;">
                  <span class="badge badge-${a.severity === "high" ? "danger" : a.severity === "medium" ? "warning" : "info"}" style="margin-top:2px;"></span>
                  <span><b style="font-size:12px;">${escapeHtml(a.client)}</b><br><span style="font-size:12.5px;">${escapeHtml(a.description)}</span></span>
                </a>`
            )
            .join("") + `<div class="dropdown-sep"></div><a class="dropdown-item" href="dashboard.html" style="justify-content:center;font-weight:700;">View all</a>`
        : `<div class="dropdown-item" style="pointer-events:none;color:var(--color-muted)">You're all caught up.</div>`;
    }
    notifMenu.classList.toggle("open");
  });

  const profileAvatar = qs("#profile-avatar");
  const profileMenu = qs("#profile-menu");
  profileAvatar?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns(profileMenu);
    profileMenu.classList.toggle("open");
  });
  qs("#logout-btn")?.addEventListener("click", () => {
    logout();
    window.location.href = "../login.html";
  });

  document.addEventListener("click", () => closeAllDropdowns());

  qs("#quick-add-btn")?.addEventListener("click", openQuickAdd);
}

function closeAllDropdowns(except) {
  qsa(".dropdown-menu").forEach((m) => {
    if (m !== except) m.classList.remove("open");
  });
}

async function wireAttentionBadge() {
  const items = await getAttentionItems();
  const dot = qs("#notif-dot");
  if (dot) dot.hidden = items.length === 0;
}

// ---------------------------------------------------------------------------
// Quick Add modal
// ---------------------------------------------------------------------------
function openQuickAdd() {
  const overlay = qs("#quick-add-overlay");
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h2>Quick Add</h2><button class="icon-btn" id="qa-close">✕</button></div>
      <div class="modal-body">
        <div class="checkbox-grid" style="margin-bottom:4px;">
          ${quickAddOption("client", "New Client")}
          ${quickAddOption("task", "New Task")}
          ${quickAddOption("content", "New Content")}
        </div>
        <div id="qa-form" style="margin-top:var(--space-5);"></div>
      </div>
    </div>`;
  overlay.classList.add("open");
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.id === "qa-close") overlay.classList.remove("open");
  });
  qsa(".chip-check", overlay).forEach((chip) => {
    chip.addEventListener("click", () => {
      qsa(".chip-check", overlay).forEach((c) => c.classList.remove("checked"));
      chip.classList.add("checked");
      renderQuickAddForm(chip.dataset.kind, overlay);
    });
  });
  renderQuickAddForm("task", overlay);
  qsa(".chip-check", overlay)[1].classList.add("checked");
}

function quickAddOption(kind, label) {
  return `<label class="chip-check" data-kind="${kind}"><input type="radio" name="qa-kind"/>${label}</label>`;
}

async function renderQuickAddForm(kind, overlay) {
  const target = qs("#qa-form", overlay);
  if (kind === "task") {
    target.innerHTML = `
      <div class="field"><label>Title</label><input class="input" id="qa-title" placeholder="e.g. Review Instagram creative"/></div>
      <div class="form-grid-2">
        <div class="field"><label>Category</label><select class="input" id="qa-category">${CONSTANTS.TASK_CATEGORIES.map((c) => `<option>${c}</option>`).join("")}</select></div>
        <div class="field"><label>Priority</label><select class="input" id="qa-priority">${CONSTANTS.PRIORITIES.map((p) => `<option>${p}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Due date</label><input class="input" type="date" id="qa-due"/></div>
      <button class="btn btn-primary btn-block" id="qa-submit">Create Task</button>`;
    qs("#qa-submit", overlay).addEventListener("click", async () => {
      const title = qs("#qa-title", overlay).value.trim();
      if (!title) return toast("Give the task a title first.", "danger");
      await addTask({
        title,
        category: qs("#qa-category", overlay).value,
        priority: qs("#qa-priority", overlay).value,
        dueDate: qs("#qa-due", overlay).value || new Date().toISOString().slice(0, 10),
        clientId: null,
        assignedTo: getCurrentUser().id,
      });
      toast("Task created.");
      overlay.classList.remove("open");
      setTimeout(() => window.location.reload(), 400);
    });
  } else if (kind === "client") {
    target.innerHTML = `
      <div class="field"><label>Client name</label><input class="input" id="qa-title" placeholder="e.g. Northgate Clinics"/></div>
      <div class="field"><label>Industry</label><select class="input" id="qa-industry">${CONSTANTS.INDUSTRIES.map((i) => `<option>${i}</option>`).join("")}</select></div>
      <button class="btn btn-primary btn-block" id="qa-submit">Create Client</button>
      <p class="hint" style="margin-top:8px;">For full onboarding (services, team, KPIs) use the Clients page → Add Client.</p>`;
    qs("#qa-submit", overlay).addEventListener("click", async () => {
      const name = qs("#qa-title", overlay).value.trim();
      if (!name) return toast("Give the client a name first.", "danger");
      const client = await addClient({ name, industry: qs("#qa-industry", overlay).value, logoText: initials(name) });
      toast("Client created.");
      overlay.classList.remove("open");
      setTimeout(() => (window.location.href = `client-detail.html?id=${client.id}`), 400);
    });
  } else if (kind === "content") {
    target.innerHTML = `
      <div class="field"><label>Title</label><input class="input" id="qa-title" placeholder="e.g. World Tourism Day Reel"/></div>
      <div class="form-grid-2">
        <div class="field"><label>Type</label><select class="input" id="qa-type">${CONSTANTS.CONTENT_TYPES.map((t) => `<option>${t}</option>`).join("")}</select></div>
        <div class="field"><label>Platform</label><select class="input" id="qa-platform">${CONSTANTS.PLATFORMS.map((p) => `<option>${p}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Publish date</label><input class="input" type="date" id="qa-due"/></div>
      <button class="btn btn-primary btn-block" id="qa-submit">Create Content</button>
      <p class="hint" style="margin-top:8px;">Assign it to a client from the Content page after creating.</p>`;
    qs("#qa-submit", overlay).addEventListener("click", async () => {
      const title = qs("#qa-title", overlay).value.trim();
      if (!title) return toast("Give the content a title first.", "danger");
      await addContent({
        title,
        type: qs("#qa-type", overlay).value,
        platform: qs("#qa-platform", overlay).value,
        publishDate: qs("#qa-due", overlay).value || new Date().toISOString().slice(0, 10),
        clientId: null,
        assignedTo: getCurrentUser().id,
      });
      toast("Content created.");
      overlay.classList.remove("open");
      setTimeout(() => (window.location.href = "content.html"), 400);
    });
  }
}

export { ICONS };
