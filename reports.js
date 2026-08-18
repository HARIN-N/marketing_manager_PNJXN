import { initShell } from "./app.js";
import { listClients, listReports } from "./db.js";
import { escapeHtml, qs, formatDateShort } from "./utils.js";
import { emptyState } from "./ui.js";

const user = await initShell({ active: "reports" });
if (user) {
  const clients = await listClients();
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const reports = await listReports();

  qs("#report-kpis").innerHTML = [
    ["Reports completed", reports.filter((r) => r.status === "Completed").length],
    ["Reports in progress", reports.filter((r) => r.status === "In Progress").length],
    ["Clients reported on", new Set(reports.map((r) => r.clientId)).size],
  ].map(([label, value]) => `<div class="kpi-card" style="cursor:default;"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div></div>`).join("");

  const body = qs("#report-body");
  if (reports.length === 0) {
    body.innerHTML = `<tr><td colspan="5">${emptyState("No reports yet", "Generate a report from any client's workspace to see it here.", "📄")}</td></tr>`;
  } else {
    body.innerHTML = reports
      .map(
        (r) => `<tr class="row-link" onclick="window.location.href='client-detail.html?id=${r.clientId}&tab=reports'">
        <td data-label="Client">${escapeHtml(clientMap[r.clientId]?.name || "")}</td>
        <td data-label="Period">${escapeHtml(r.period)}</td>
        <td data-label="Prepared by">${escapeHtml(r.preparedBy)}</td>
        <td data-label="Status"><span class="badge badge-success">${escapeHtml(r.status)}</span></td>
        <td data-label="Generated">${formatDateShort(r.generatedAt)}</td>
      </tr>`
      )
      .join("");
  }
}
