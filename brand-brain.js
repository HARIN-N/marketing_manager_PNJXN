import { initShell } from "./app.js";
import { listClients, getBrandBrain } from "./db.js";
import { escapeHtml, qs, colorFor } from "./utils.js";

const user = await initShell({ active: "brand-brain" });
if (user) {
  const clients = await listClients();
  const enriched = await Promise.all(clients.map(async (c) => ({ client: c, brain: await getBrandBrain(c.id) })));

  qs("#brand-grid").innerHTML = enriched
    .map(({ client, brain }) => {
      const configured = brain && (brain.personality || (brain.tone && brain.tone.length));
      return `
      <a class="client-card" href="client-detail.html?id=${client.id}&tab=brand" style="text-decoration:none;color:inherit;">
        <div class="client-card-head">
          <div class="logo-tile" style="background:${colorFor(client.name)}">${escapeHtml(client.logoText || "")}</div>
          <div class="info"><h3>${escapeHtml(client.name)}</h3><div class="industry">${escapeHtml(client.industry)}</div></div>
        </div>
        ${configured ? `
          <p style="font-size:12.5px;font-weight:600;margin-bottom:6px;">${escapeHtml(brain.personality || "")}</p>
          <div class="tag-list">${(brain.tone || []).slice(0, 4).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
          ${brain.coreMessaging ? `<p class="muted" style="font-size:12px;margin-top:10px;font-style:italic;">"${escapeHtml(brain.coreMessaging)}"</p>` : ""}
        ` : `<p class="muted" style="font-size:12.5px;">Brand Brain not set up yet — click to configure.</p>`}
      </a>`;
    })
    .join("");
}
