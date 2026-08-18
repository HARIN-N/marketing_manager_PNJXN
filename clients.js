import { initShell } from "./app.js";
import { listClients, addClient, computeClientHealth, listTasks, listContent, CONSTANTS } from "./db.js";
import { escapeHtml, qs, qsa, colorFor, toast } from "./utils.js";

const user = await initShell({ active: "clients" });
let ALL_CLIENTS = [];
let VIEW = "grid";

if (user) {
  populateIndustryFilter();
  await loadAndRender();
  wireControls();
}

function populateIndustryFilter() {
  const sel = qs("#filter-industry");
  CONSTANTS.INDUSTRIES.forEach((i) => sel.insertAdjacentHTML("beforeend", `<option>${i}</option>`));
}

async function loadAndRender() {
  ALL_CLIENTS = await listClients();
  await render();
}

function wireControls() {
  qsa(".pill-toggle button").forEach((btn) =>
    btn.addEventListener("click", () => {
      qsa(".pill-toggle button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      VIEW = btn.dataset.view;
      qs("#client-grid").style.display = VIEW === "grid" ? "grid" : "none";
      qs("#client-list-wrap").style.display = VIEW === "list" ? "block" : "none";
    })
  );
  qs("#client-search").addEventListener("input", render);
  qs("#filter-industry").addEventListener("change", render);
  qs("#filter-status").addEventListener("change", render);
  qs("#add-client-btn").addEventListener("click", openAddClientWizard);
}

function filteredClients() {
  const q = qs("#client-search").value.toLowerCase();
  const industry = qs("#filter-industry").value;
  const status = qs("#filter-status").value;
  return ALL_CLIENTS.filter((c) => {
    if (q && !c.name.toLowerCase().includes(q)) return false;
    if (industry && c.industry !== industry) return false;
    if (status && c.status !== status) return false;
    return true;
  });
}

async function render() {
  const clients = filteredClients();
  const grid = qs("#client-grid");

  if (clients.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🔍</div><h3>No clients match</h3><p>Try a different search or filter.</p></div>`;
    qs("#client-table tbody").innerHTML = "";
    return;
  }

  const enriched = await Promise.all(
    clients.map(async (c) => {
      const [health, tasks, content] = await Promise.all([
        computeClientHealth(c.id),
        listTasks({ clientId: c.id, status: undefined }),
        listContent({ clientId: c.id, status: "CLIENT REVIEW" }),
      ]);
      const activeTasks = tasks.filter((t) => t.status !== "DONE").length;
      return { client: c, health, activeTasks, approvals: content.length };
    })
  );

  grid.innerHTML = enriched
    .map(
      ({ client, health, activeTasks, approvals }) => `
    <a class="client-card" href="client-detail.html?id=${client.id}" style="text-decoration:none;color:inherit;">
      <div class="client-card-head">
        <div class="logo-tile" style="background:${colorFor(client.name)}">${escapeHtml(client.logoText || client.name.slice(0, 2).toUpperCase())}</div>
        <div class="info">
          <h3>${escapeHtml(client.name)}</h3>
          <div class="industry">${escapeHtml(client.industry)}</div>
        </div>
      </div>
      <div class="service-pills">${client.services.slice(0, 4).map((s) => `<span class="service-pill">${escapeHtml(s)}</span>`).join("") || `<span class="service-pill">No services configured</span>`}</div>
      <div class="client-card-stats">
        <div>Health<b style="color:${healthColor(health.overall)}">${health.overall}</b></div>
        <div>Active tasks<b>${activeTasks}</b></div>
        <div>Approvals<b>${approvals}</b></div>
        <div>${statusBadge(client.status)}</div>
      </div>
    </a>`
    )
    .join("");

  qs("#client-table tbody").innerHTML = enriched
    .map(
      ({ client, health, activeTasks, approvals }) => `
    <tr class="row-link" onclick="window.location.href='client-detail.html?id=${client.id}'">
      <td data-label="Client"><div style="display:flex;align-items:center;gap:8px;"><div class="logo-tile" style="width:28px;height:28px;font-size:11px;background:${colorFor(client.name)}">${escapeHtml(client.logoText || "")}</div>${escapeHtml(client.name)}</div></td>
      <td data-label="Industry">${escapeHtml(client.industry)}</td>
      <td data-label="Account Manager">${escapeHtml(client.accountManager || "—")}</td>
      <td data-label="Health"><span style="color:${healthColor(health.overall)};font-weight:700;">${health.overall}</span></td>
      <td data-label="Active Tasks">${activeTasks}</td>
      <td data-label="Approvals">${approvals}</td>
      <td data-label="Status">${statusBadge(client.status)}</td>
    </tr>`
    )
    .join("");
}

function healthColor(v) {
  if (v >= 75) return "var(--color-success)";
  if (v >= 50) return "var(--color-warning)";
  return "var(--color-danger)";
}
function statusBadge(status) {
  const map = { Active: "success", Onboarding: "info", Paused: "warning" };
  return `<span class="badge badge-${map[status] || "neutral"}">${escapeHtml(status)}</span>`;
}

// ---------------------------------------------------------------------------
// Add Client — onboarding wizard (client-agnostic: no hardcoded industries
// beyond the configurable CONSTANTS list, which any future client can extend).
// ---------------------------------------------------------------------------
const WIZARD_STEPS = ["Identity", "Services & platforms", "Goals & team", "Workflow & reporting"];
let wizardState = {};

function openAddClientWizard() {
  wizardState = { services: [], platforms: [], goals: [] };
  let step = 0;
  const overlay = qs("#add-client-overlay");

  function draw() {
    overlay.innerHTML = `
      <div class="modal modal-wide">
        <div class="modal-header">
          <div>
            <h2>New Client Onboarding</h2>
            <p class="muted" style="font-size:12px;margin-top:2px;">Step ${step + 1} of ${WIZARD_STEPS.length} — ${WIZARD_STEPS[step]}</p>
          </div>
          <button class="icon-btn" id="wiz-close">✕</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;gap:4px;margin-bottom:var(--space-5);">
            ${WIZARD_STEPS.map((_, i) => `<div style="height:4px;flex:1;border-radius:3px;background:${i <= step ? "var(--color-primary)" : "var(--color-border)"}"></div>`).join("")}
          </div>
          <div id="wiz-step-body"></div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="wiz-back">${step === 0 ? "Cancel" : "Back"}</button>
          <button class="btn btn-primary" id="wiz-next">${step === WIZARD_STEPS.length - 1 ? "Create Client" : "Next"}</button>
        </div>
      </div>`;
    overlay.classList.add("open");
    renderStepBody(step);

    qs("#wiz-close").addEventListener("click", () => overlay.classList.remove("open"));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
    qs("#wiz-back").addEventListener("click", () => {
      if (step === 0) return overlay.classList.remove("open");
      step--;
      draw();
    });
    qs("#wiz-next").addEventListener("click", async () => {
      if (!captureStep(step)) return;
      if (step === WIZARD_STEPS.length - 1) {
        await submitWizard(overlay);
        return;
      }
      step++;
      draw();
    });
  }
  draw();
}

function renderStepBody(step) {
  const body = qs("#wiz-step-body");
  if (step === 0) {
    body.innerHTML = `
      <div class="field"><label>Client name</label><input class="input" id="w-name" value="${escapeHtml(wizardState.name || "")}" placeholder="e.g. Northgate Clinics" /></div>
      <div class="form-grid-2">
        <div class="field"><label>Industry / business type</label>
          <select class="input" id="w-industry">${CONSTANTS.INDUSTRIES.map((i) => `<option ${wizardState.industry === i ? "selected" : ""}>${i}</option>`).join("")}</select>
        </div>
        <div class="field"><label>Business type detail</label><input class="input" id="w-businessType" value="${escapeHtml(wizardState.businessType || "")}" placeholder="e.g. Multi-location dental clinic" /></div>
      </div>
      <div class="field"><label>Target audience</label><textarea class="input" id="w-audience" placeholder="Who is this client trying to reach?">${escapeHtml(wizardState.targetAudience || "")}</textarea></div>
      <div class="field"><label>Website</label><input class="input" id="w-website" value="${escapeHtml(wizardState.website || "")}" placeholder="https://" /></div>
    `;
  }
  if (step === 1) {
    body.innerHTML = `
      <div class="field"><label>Services required</label>
        <div class="checkbox-grid">${CONSTANTS.SERVICES.map((s) => chip("service", s, wizardState.services.includes(s))).join("")}</div>
      </div>
      <div class="field"><label>Platforms used</label>
        <div class="checkbox-grid">${CONSTANTS.PLATFORMS.map((p) => chip("platform", p, wizardState.platforms.includes(p))).join("")}</div>
      </div>
      <p class="hint">Only the modules and platforms selected here will appear in this client's workspace — nothing else is hardcoded.</p>
    `;
    wireChips(body);
  }
  if (step === 2) {
    body.innerHTML = `
      <div class="field"><label>Primary goals</label>
        <div class="checkbox-grid">${["Brand awareness", "Lead generation", "Direct bookings", "Ecommerce revenue", "Community building", "SEO visibility", "Membership growth"].map((g) => chip("goal", g, wizardState.goals.includes(g))).join("")}</div>
      </div>
      <div class="form-grid-2">
        <div class="field"><label>Account manager</label><input class="input" id="w-am" value="${escapeHtml(wizardState.accountManager || "")}" placeholder="e.g. Ananya Rao" /></div>
        <div class="field"><label>Content manager</label><input class="input" id="w-cm" value="${escapeHtml(wizardState.contentManager || "")}" placeholder="e.g. Devika Nair" /></div>
      </div>
      <div class="field"><label>Client contact name & email</label>
        <div class="form-grid-2">
          <input class="input" id="w-contact-name" value="${escapeHtml(wizardState.contactName || "")}" placeholder="Contact name" />
          <input class="input" id="w-contact-email" value="${escapeHtml(wizardState.contactEmail || "")}" placeholder="Contact email" />
        </div>
      </div>
    `;
    wireChips(body);
  }
  if (step === 3) {
    body.innerHTML = `
      <div class="form-grid-2">
        <div class="field"><label>Reporting frequency</label>
          <select class="input" id="w-reporting">
            ${["Weekly", "Bi-weekly", "Monthly", "Quarterly"].map((f) => `<option ${wizardState.reportingFrequency === f ? "selected" : ""}>${f}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Approval workflow</label>
          <select class="input" id="w-workflow">
            ${["Standard", "Fast-track", "Legal review", "Multi-stage"].map((f) => `<option ${wizardState.approvalWorkflow === f ? "selected" : ""}>${f}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="field"><label>Time zone</label><input class="input" id="w-tz" value="${escapeHtml(wizardState.timezone || "Asia/Kolkata")}" /></div>
      <div class="field"><label>Notes</label><textarea class="input" id="w-notes">${escapeHtml(wizardState.notes || "")}</textarea></div>
      <p class="hint">After creation, you'll be taken straight to this client's workspace to set up their Brand Brain.</p>
    `;
  }
}

function chip(group, value, checked) {
  return `<label class="chip-check ${checked ? "checked" : ""}" data-group="${group}" data-value="${escapeHtml(value)}"><input type="checkbox" ${checked ? "checked" : ""}/>${escapeHtml(value)}</label>`;
}
function wireChips(scope) {
  qsa(".chip-check", scope).forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("checked");
      const input = qs("input", chip);
      input.checked = chip.classList.contains("checked");
      const group = chip.dataset.group + "s";
      const val = chip.dataset.value;
      const key = group === "services" ? "services" : group === "platforms" ? "platforms" : "goals";
      if (chip.classList.contains("checked")) {
        if (!wizardState[key].includes(val)) wizardState[key].push(val);
      } else {
        wizardState[key] = wizardState[key].filter((v) => v !== val);
      }
    });
  });
}

function captureStep(step) {
  if (step === 0) {
    const name = qs("#w-name").value.trim();
    if (!name) {
      toast("Client name is required.", "danger");
      return false;
    }
    wizardState.name = name;
    wizardState.industry = qs("#w-industry").value;
    wizardState.businessType = qs("#w-businessType").value;
    wizardState.targetAudience = qs("#w-audience").value;
    wizardState.website = qs("#w-website").value;
  }
  if (step === 2) {
    wizardState.accountManager = qs("#w-am").value;
    wizardState.contentManager = qs("#w-cm").value;
    wizardState.contactName = qs("#w-contact-name").value;
    wizardState.contactEmail = qs("#w-contact-email").value;
  }
  if (step === 3) {
    wizardState.reportingFrequency = qs("#w-reporting").value;
    wizardState.approvalWorkflow = qs("#w-workflow").value;
    wizardState.timezone = qs("#w-tz").value;
    wizardState.notes = qs("#w-notes").value;
  }
  return true;
}

async function submitWizard(overlay) {
  const btn = qs("#wiz-next");
  btn.disabled = true;
  btn.textContent = "Creating…";
  const client = await addClient({
    name: wizardState.name,
    industry: wizardState.industry,
    businessType: wizardState.businessType,
    logoText: wizardState.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(""),
    status: "Onboarding",
    services: wizardState.services,
    platforms: wizardState.platforms,
    targetAudience: wizardState.targetAudience,
    goals: wizardState.goals,
    website: wizardState.website,
    accountManager: wizardState.accountManager,
    contentManager: wizardState.contentManager,
    contact: { name: wizardState.contactName, email: wizardState.contactEmail, phone: "" },
    reportingFrequency: wizardState.reportingFrequency,
    approvalWorkflow: wizardState.approvalWorkflow,
    timezone: wizardState.timezone,
    notes: wizardState.notes,
  });
  toast(`${client.name} created. Let's set up their Brand Brain.`);
  window.location.href = `client-detail.html?id=${client.id}&tab=brand`;
}
