import { initShell } from "./app.js";
import { listClients, listAdCampaigns } from "./db.js";
import { escapeHtml, qs } from "./utils.js";
import { emptyState } from "./ui.js";

const user = await initShell({ active: "ads" });
let CLIENTS = [];
let CLIENT_MAP = {};

if (user) {
  CLIENTS = await listClients();
  CLIENT_MAP = Object.fromEntries(CLIENTS.map((c) => [c.id, c]));
  qs("#f-client").insertAdjacentHTML("beforeend", CLIENTS.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join(""));
  qs("#f-client").addEventListener("change", render);
  qs("#f-platform").addEventListener("change", render);
  await render();
}

async function render() {
  const clientId = qs("#f-client").value || undefined;
  let campaigns = await listAdCampaigns(clientId);
  const platform = qs("#f-platform").value;
  if (platform) campaigns = campaigns.filter((c) => c.platform === platform);

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConv = campaigns.reduce((s, c) => s + c.conversions, 0);

  qs("#ads-kpis").innerHTML = [
    ["Total spend", `₹${totalSpend.toLocaleString()}`],
    ["Total clicks", totalClicks.toLocaleString()],
    ["Leads", totalLeads],
    ["Conversions", totalConv],
  ].map(([label, value]) => `<div class="kpi-card" style="cursor:default;"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div></div>`).join("");

  const grid = qs("#ads-grid");
  if (campaigns.length === 0) {
    grid.innerHTML = emptyState("No campaigns yet", "Ad campaigns for clients running Meta, Google or LinkedIn ads will appear here.", "📣");
    return;
  }
  grid.innerHTML = campaigns
    .map(
      (a) => `
    <div class="card">
      <div class="card-title-row"><h2>${escapeHtml(a.name)}</h2><span class="badge badge-${a.status === "ACTIVE" ? "success" : "neutral"}">${a.status}</span></div>
      <p class="muted" style="font-size:12px;margin-bottom:10px;">${escapeHtml(CLIENT_MAP[a.clientId]?.name || "")} · ${escapeHtml(a.platform)} · ${escapeHtml(a.objective)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
        <div><div class="faint" style="font-size:11px;">SPEND</div><b>₹${a.spend.toLocaleString()} / ₹${a.budget.toLocaleString()}</b></div>
        <div><div class="faint" style="font-size:11px;">CLICKS</div><b>${a.clicks.toLocaleString()}</b></div>
        <div><div class="faint" style="font-size:11px;">LEADS</div><b>${a.leads}</b></div>
        <div><div class="faint" style="font-size:11px;">CONVERSIONS</div><b>${a.conversions}</b></div>
      </div>
    </div>`
    )
    .join("");
}
