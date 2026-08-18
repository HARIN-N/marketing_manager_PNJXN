import { initShell } from "./app.js";
import { listTeam, listClients, listTasks } from "./db.js";
import { escapeHtml, qs, initials, colorFor } from "./utils.js";

const user = await initShell({ active: "team" });
if (user) {
  const [team, clients, tasks] = await Promise.all([listTeam(), listClients(), listTasks()]);

  qs("#team-grid").innerHTML = team
    .map((member) => {
      const assignedClients = clients.filter((c) =>
        [c.accountManager, c.contentManager, c.designer, c.seoManager, c.adsManager].includes(member.name)
      );
      const activeTasks = tasks.filter((t) => t.assignedTo === member.id && t.status !== "DONE").length;
      return `
      <div class="card">
        <div class="client-card-head">
          <div class="avatar avatar-lg" style="background:${colorFor(member.name)}">${initials(member.name)}</div>
          <div class="info">
            <h3>${escapeHtml(member.name)}</h3>
            <div class="industry">${escapeHtml(member.role)} · ${escapeHtml(member.department)}</div>
          </div>
        </div>
        <div class="client-card-stats">
          <div>Assigned clients<b>${assignedClients.length}</b></div>
          <div>Active tasks<b>${activeTasks}</b></div>
          <div><span class="badge badge-success">${escapeHtml(member.status)}</span></div>
        </div>
        ${assignedClients.length ? `<div class="tag-list" style="margin-top:12px;">${assignedClients.map((c) => `<span class="tag">${escapeHtml(c.name)}</span>`).join("")}</div>` : ""}
      </div>`;
    })
    .join("");
}
