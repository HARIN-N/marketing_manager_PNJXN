import { initShell } from "./app.js";
import { listClients, listSeoKeywords } from "./db.js";
import { escapeHtml, qs, formatDateShort, getParam } from "./utils.js";
import { emptyState } from "./ui.js";

const user = await initShell({ active: "seo" });
let CLIENTS = [];
let CLIENT_MAP = {};

if (user) {
  CLIENTS = await listClients();
  CLIENT_MAP = Object.fromEntries(CLIENTS.map((c) => [c.id, c]));
  qs("#f-client").insertAdjacentHTML("beforeend", CLIENTS.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join(""));
  const preClient = getParam("client");
  if (preClient) qs("#f-client").value = preClient;
  qs("#f-client").addEventListener("change", render);
  await render();
}

async function render() {
  const clientId = qs("#f-client").value || undefined;
  const kws = await listSeoKeywords(clientId);

  const improved = kws.filter((k) => k.current < k.previous).length;
  const declined = kws.filter((k) => k.current > k.previous).length;
  const top10 = kws.filter((k) => k.current <= 10).length;
  qs("#seo-kpis").innerHTML = [
    ["Tracked keywords", kws.length],
    ["Improved", improved],
    ["Declined", declined],
    ["In top 10", top10],
  ].map(([label, value]) => `<div class="kpi-card" style="cursor:default;"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div></div>`).join("");

  const body = qs("#seo-body");
  if (kws.length === 0) {
    body.innerHTML = `<tr><td colspan="8">${emptyState("No keywords tracked", "Keywords tracked for SEO-enabled clients will appear here.", "🔍")}</td></tr>`;
    return;
  }
  body.innerHTML = kws
    .map((k) => {
      const delta = k.previous - k.current;
      return `<tr>
        <td data-label="Client">${escapeHtml(CLIENT_MAP[k.clientId]?.name || "")}</td>
        <td data-label="Keyword">${escapeHtml(k.keyword)}</td>
        <td data-label="Volume">${k.searchVolume.toLocaleString()}</td>
        <td data-label="Current">#${k.current}</td>
        <td data-label="Previous">#${k.previous}</td>
        <td data-label="Change" class="${delta > 0 ? "text-success" : delta < 0 ? "text-danger" : ""}">${delta > 0 ? "+" : ""}${delta}</td>
        <td data-label="Target">#${k.target}</td>
        <td data-label="Last checked">${formatDateShort(k.lastChecked)}</td>
      </tr>`;
    })
    .join("");
}
