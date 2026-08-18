import { initShell } from "./app.js";
import { getDashboardKpis, getAttentionItems, getTodaysWork, listClients, computeClientHealth, resetDemoData } from "./db.js";
import { escapeHtml, qs, confirmAction, toast } from "./utils.js";

const user = await initShell({ active: "dashboard" });
if (user) {
  qs("#dash-greeting").textContent = `Good ${partOfDay()}, ${user.name.split(" ")[0]}`;
  qs("#dash-date").textContent = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  await renderAll();
}

qs("#reset-demo-btn").addEventListener("click", async () => {
  const ok = await confirmAction({
    title: "Reset demo data?",
    message: "This restores all clients, content, tasks and approvals to their original seed state. Anything you've added or changed will be lost.",
    confirmLabel: "Reset data",
  });
  if (!ok) return;
  await resetDemoData();
  toast("Demo data reset.");
  renderAll();
});

function partOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

async function renderAll() {
  const [kpis, attention, today, clients] = await Promise.all([getDashboardKpis(), getAttentionItems(), getTodaysWork(), listClients()]);
  renderKpis(kpis);
  renderAttention(attention);
  renderToday(today);
  renderHealth(clients);
}

function renderKpis(k) {
  const cards = [
    { label: "Active Clients", value: k.activeClients, href: "clients.html" },
    { label: "Tasks Due Today", value: k.tasksDueToday, href: "tasks.html" },
    { label: "Pending Approvals", value: k.pendingApprovals, href: "approvals.html" },
    { label: "Overdue Tasks", value: k.overdueTasks, href: "tasks.html", danger: k.overdueTasks > 0 },
    { label: "Content Scheduled", value: k.contentScheduled, href: "content.html" },
    { label: "Active Campaigns", value: k.activeCampaigns, href: "ads.html" },
  ];
  qs("#kpi-grid").innerHTML = cards
    .map(
      (c) => `
    <a class="kpi-card" href="${c.href}">
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value" style="${c.danger ? "color:var(--color-danger)" : ""}">${c.value}</div>
    </a>`
    )
    .join("");
}

function renderAttention(items) {
  qs("#attention-count").textContent = items.length;
  if (items.length === 0) {
    qs("#attention-list").innerHTML = emptyState("Nothing needs attention", "Every client is on track. Nice work.");
    return;
  }
  qs("#attention-list").innerHTML = items
    .slice(0, 8)
    .map(
      (a) => `
    <div class="attention-item">
      <span class="attention-sev ${a.severity}"></span>
      <div class="attention-body">
        <div class="client-name">${escapeHtml(a.client)}</div>
        <div class="desc">${escapeHtml(a.description)}</div>
        <div class="meta">${escapeHtml(a.date)}</div>
      </div>
      <a class="btn btn-sm" href="${a.link}">${a.action}</a>
    </div>`
    )
    .join("");
}

function renderToday(items) {
  qs("#today-count").textContent = items.length;
  if (items.length === 0) {
    qs("#today-list").innerHTML = emptyState("Nothing on the calendar today", "Enjoy the breathing room, or plan ahead for next week.");
    return;
  }
  qs("#today-list").innerHTML = items
    .map(
      (i) => `
    <a class="timeline-item" href="${i.link}" style="text-decoration:none;color:inherit;">
      <div class="timeline-time">${i.time}</div>
      <div class="timeline-body">
        <div class="client-name">${escapeHtml(i.client || "Internal")}</div>
        <div class="desc-title">${escapeHtml(i.title)}</div>
        <div class="meta faint" style="font-size:11px;">${escapeHtml(i.sub || "")}</div>
      </div>
    </a>`
    )
    .join("");
}

async function renderHealth(clients) {
  const active = clients.filter((c) => c.status === "Active").slice(0, 6);
  if (active.length === 0) {
    qs("#health-list").innerHTML = emptyState("No active clients yet", "Add your first client to see health scores here.");
    return;
  }
  const scored = await Promise.all(active.map(async (c) => ({ client: c, health: await computeClientHealth(c.id) })));
  scored.sort((a, b) => a.health.overall - b.health.overall);
  qs("#health-list").innerHTML = scored
    .map(
      ({ client, health }) => `
    <a href="client-detail.html?id=${client.id}" style="text-decoration:none;color:inherit;">
      <div class="health-row">
        <div class="h-label">${escapeHtml(client.name)}</div>
        <div class="health-track"><div class="health-fill" style="width:${health.overall}%; background:${healthColor(health.overall)}"></div></div>
        <div class="health-score">${health.overall}</div>
      </div>
    </a>`
    )
    .join("");
}

function healthColor(v) {
  if (v >= 75) return "var(--color-success)";
  if (v >= 50) return "var(--color-warning)";
  return "var(--color-danger)";
}

function emptyState(title, sub) {
  return `<div class="empty-state"><div class="icon">✓</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(sub)}</p></div>`;
}
