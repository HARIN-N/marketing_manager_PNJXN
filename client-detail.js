import { initShell } from "./app.js";
import {
  getClient, updateClient, deleteClient, getBrandBrain, upsertBrandBrain,
  listContent, addContent, updateContent, getContentById, listComments, addComment,
  listTasks, addTask, updateTask, getTask, deleteTask, computeClientHealth, listSeoKeywords, listAdCampaigns, listReports,
  CONSTANTS,
} from "./db.js";
import { escapeHtml, qs, qsa, colorFor, getParam, formatDate, formatDateShort, daysBetween, toast, confirmAction, uid } from "./utils.js";
import { getCurrentUser } from "./auth.js";

const user = await initShell({ active: "clients" });
const clientId = getParam("id");
let CLIENT, BRAIN, HEALTH;
let ACTIVE_TAB = getParam("tab") || "overview";

if (user) {
  if (!clientId) {
    qs("#page-root").innerHTML = `<div class="empty-state"><h3>No client selected</h3><p><a href="clients.html">Back to Clients</a></p></div>`;
  } else {
    await load();
  }
}

async function load() {
  CLIENT = await getClient(clientId);
  if (!CLIENT) {
    qs("#page-root").innerHTML = `<div class="empty-state"><h3>Client not found</h3><p><a href="clients.html">Back to Clients</a></p></div>`;
    return;
  }
  BRAIN = await getBrandBrain(clientId);
  HEALTH = await computeClientHealth(clientId);
  render();
}

function availableTabs() {
  const s = CLIENT.services || [];
  const tabs = [{ key: "overview", label: "Overview" }];
  if (s.includes("Content") || s.includes("Social Media")) tabs.push({ key: "content", label: "Content" });
  tabs.push({ key: "tasks", label: "Tasks" });
  tabs.push({ key: "approvals", label: "Approvals" });
  tabs.push({ key: "brand", label: "Brand Brain" });
  if (s.includes("SEO")) tabs.push({ key: "seo", label: "SEO" });
  if (s.some((x) => x.includes("Ads"))) tabs.push({ key: "ads", label: "Ads" });
  tabs.push({ key: "reports", label: "Reports" });
  tabs.push({ key: "files", label: "Files" });
  return tabs;
}

function render() {
  const tabs = availableTabs();
  if (!tabs.find((t) => t.key === ACTIVE_TAB)) ACTIVE_TAB = "overview";

  qs("#page-root").innerHTML = `
    <div class="page-header">
      <div style="display:flex;gap:var(--space-4);align-items:center;">
        <div class="logo-tile avatar-lg" style="background:${colorFor(CLIENT.name)}">${escapeHtml(CLIENT.logoText || "")}</div>
        <div>
          <div class="eyebrow">${escapeHtml(CLIENT.industry)} · ${escapeHtml(CLIENT.businessType || "")}</div>
          <h1>${escapeHtml(CLIENT.name)}</h1>
          <p class="sub">${statusBadge(CLIENT.status)} <span style="margin-left:8px;">Health score <b style="color:${healthColor(HEALTH.overall)}">${HEALTH.overall}/100</b></span></p>
        </div>
      </div>
      <div class="page-actions">
        <button class="btn" id="edit-client-btn">Edit client</button>
        <button class="btn btn-danger" id="delete-client-btn">Delete</button>
      </div>
    </div>

    <div class="tabs" id="tabs-row">
      ${tabs.map((t) => `<div class="tab ${t.key === ACTIVE_TAB ? "active" : ""}" data-tab="${t.key}">${t.label}</div>`).join("")}
    </div>

    <div id="tab-body"></div>
  `;

  qs("#edit-client-btn").addEventListener("click", openEditClientModal);
  qs("#delete-client-btn").addEventListener("click", onDeleteClient);
  qsa(".tab", qs("#tabs-row")).forEach((t) =>
    t.addEventListener("click", () => {
      ACTIVE_TAB = t.dataset.tab;
      history.replaceState(null, "", `client-detail.html?id=${clientId}&tab=${ACTIVE_TAB}`);
      render();
    })
  );

  renderTabBody();
}

function statusBadge(status) {
  const map = { Active: "success", Onboarding: "info", Paused: "warning" };
  return `<span class="badge badge-${map[status] || "neutral"}">${escapeHtml(status)}</span>`;
}
function healthColor(v) {
  if (v >= 75) return "var(--color-success)";
  if (v >= 50) return "var(--color-warning)";
  return "var(--color-danger)";
}

async function renderTabBody() {
  const body = qs("#tab-body");
  body.innerHTML = `<div class="skel-line skeleton" style="width:60%"></div>`;
  if (ACTIVE_TAB === "overview") return renderOverview(body);
  if (ACTIVE_TAB === "content") return renderContentTab(body);
  if (ACTIVE_TAB === "tasks") return renderTasksTab(body);
  if (ACTIVE_TAB === "approvals") return renderApprovalsTab(body);
  if (ACTIVE_TAB === "brand") return renderBrandBrainTab(body);
  if (ACTIVE_TAB === "seo") return renderSeoTab(body);
  if (ACTIVE_TAB === "ads") return renderAdsTab(body);
  if (ACTIVE_TAB === "reports") return renderReportsTab(body);
  if (ACTIVE_TAB === "files") return renderFilesTab(body);
}

// ---------------------------------------------------------------------------
// OVERVIEW
// ---------------------------------------------------------------------------
async function renderOverview(body) {
  const [content, tasks] = await Promise.all([listContent({ clientId }), listTasks({ clientId })]);
  const statusCounts = {};
  content.forEach((c) => (statusCounts[c.status] = (statusCounts[c.status] || 0) + 1));
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;

  body.innerHTML = `
    <div class="two-col">
      <div class="stack">
        <div class="card">
          <div class="card-title-row"><h2>Client information</h2></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:13px;">
            ${infoRow("Website", CLIENT.website)}
            ${infoRow("Location", CLIENT.location)}
            ${infoRow("Time zone", CLIENT.timezone)}
            ${infoRow("Start date", formatDate(CLIENT.startDate))}
            ${infoRow("Instagram", CLIENT.social?.instagram)}
            ${infoRow("Facebook", CLIENT.social?.facebook)}
            ${infoRow("LinkedIn", CLIENT.social?.linkedin)}
            ${infoRow("Reporting frequency", CLIENT.reportingFrequency)}
            ${infoRow("Approval workflow", CLIENT.approvalWorkflow)}
            ${infoRow("Client contact", CLIENT.contact?.name ? `${CLIENT.contact.name} · ${CLIENT.contact.email}` : "")}
          </div>
          ${CLIENT.customFields?.length ? `<div class="divider"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:13px;">${CLIENT.customFields.map((f) => infoRow(f.label, f.value)).join("")}</div>` : ""}
          ${CLIENT.notes ? `<div class="divider"></div><p class="muted" style="font-size:12.5px;"><b>Notes:</b> ${escapeHtml(CLIENT.notes)}</p>` : ""}
        </div>

        <div class="card">
          <div class="card-title-row"><h2>Team assigned</h2></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
            ${infoRow("Account manager", CLIENT.accountManager)}
            ${infoRow("Content manager", CLIENT.contentManager)}
            ${infoRow("Designer", CLIENT.designer)}
            ${infoRow("SEO manager", CLIENT.seoManager)}
            ${infoRow("Ads manager", CLIENT.adsManager)}
          </div>
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <div class="card-title-row"><h2>Health breakdown</h2></div>
          ${Object.entries(HEALTH.breakdown).map(([label, val]) => `
            <div class="health-row">
              <div class="h-label">${label}</div>
              <div class="health-track"><div class="health-fill" style="width:${val}%;background:${healthColor(val)}"></div></div>
              <div class="health-score">${val}</div>
            </div>`).join("")}
        </div>

        <div class="card">
          <div class="card-title-row"><h2>Content status</h2></div>
          ${Object.keys(statusCounts).length === 0 ? `<p class="muted" style="font-size:13px;">No content yet.</p>` :
            Object.entries(statusCounts).map(([status, count]) => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid var(--color-border);">
              <span>${statusPill(status)}</span><b>${count}</b>
            </div>`).join("")}
        </div>

        <div class="card">
          <div class="card-title-row"><h2>Task progress</h2></div>
          <p style="font-size:13px;margin-bottom:8px;">${doneTasks} of ${tasks.length} tasks completed</p>
          <div class="health-track"><div class="health-fill" style="width:${tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0}%"></div></div>
        </div>
      </div>
    </div>
  `;
}
function infoRow(label, value) {
  return `<div><div class="faint" style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px;">${escapeHtml(label)}</div><div>${value ? escapeHtml(value) : '<span class="faint">—</span>'}</div></div>`;
}

// ---------------------------------------------------------------------------
// CONTENT TAB
// ---------------------------------------------------------------------------
async function renderContentTab(body) {
  const items = await listContent({ clientId });
  body.innerHTML = `
    <div class="section-title-row">
      <p class="muted" style="font-size:13px;">${items.length} content item${items.length === 1 ? "" : "s"}</p>
      <button class="btn btn-primary btn-sm" id="add-content-btn">+ New Content</button>
    </div>
    ${items.length === 0 ? `<div class="empty-state"><div class="icon">🗒️</div><h3>No content yet</h3><p>Create the first content item for ${escapeHtml(CLIENT.name)}.</p></div>` : `
    <div class="card" style="padding:0;overflow-x:auto;">
      <table class="data-table">
        <thead><tr><th>Title</th><th>Type</th><th>Platform</th><th>Publish date</th><th>Status</th><th>Priority</th></tr></thead>
        <tbody>
          ${items.map((c) => `
          <tr class="row-link" data-id="${c.id}">
            <td data-label="Title">${escapeHtml(c.title)}</td>
            <td data-label="Type">${escapeHtml(c.type)}</td>
            <td data-label="Platform">${escapeHtml(c.platform)}</td>
            <td data-label="Publish date">${formatDateShort(c.publishDate)}</td>
            <td data-label="Status">${statusPill(c.status)}</td>
            <td data-label="Priority">${priorityPill(c.priority)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`}
  `;
  qsa("tr.row-link", body).forEach((row) => row.addEventListener("click", () => openContentModal(row.dataset.id)));
  qs("#add-content-btn")?.addEventListener("click", () => openContentModal(null));

  const openId = getParam("open");
  if (openId) openContentModal(openId);
}

function statusPill(status) {
  const map = {
    IDEA: "neutral", DRAFT: "neutral", DESIGNING: "info", "INTERNAL REVIEW": "info",
    "CLIENT REVIEW": "warning", "CHANGES REQUESTED": "danger", APPROVED: "success",
    SCHEDULED: "success", PUBLISHED: "success",
    TODO: "neutral", "IN PROGRESS": "info", REVIEW: "warning", BLOCKED: "danger", DONE: "success",
  };
  return `<span class="badge badge-${map[status] || "neutral"}">${escapeHtml(status)}</span>`;
}
function priorityPill(p) {
  const map = { LOW: "neutral", MEDIUM: "info", HIGH: "warning", URGENT: "danger" };
  return `<span class="badge badge-${map[p] || "neutral"}">${escapeHtml(p)}</span>`;
}

async function openContentModal(id) {
  const overlay = qs("#edit-client-overlay");
  const isNew = !id;
  const item = isNew
    ? { title: "", type: CONSTANTS.CONTENT_TYPES[0], platform: CONSTANTS.PLATFORMS[0], topic: "", campaign: "", caption: "", hashtags: "", cta: "", creativeLink: "", publishDate: new Date().toISOString().slice(0, 10), status: "IDEA", priority: "MEDIUM", notes: "", approvalHistory: [] }
    : await getContentById(id);

  const comments = isNew ? [] : await listComments(id);

  overlay.innerHTML = `
    <div class="modal modal-wide">
      <div class="modal-header"><h2>${isNew ? "New Content" : escapeHtml(item.title)}</h2><button class="icon-btn" id="cm-close">✕</button></div>
      <div class="modal-body">
        <div class="form-grid-2">
          <div class="field"><label>Title</label><input class="input" id="f-title" value="${escapeHtml(item.title)}" /></div>
          <div class="field"><label>Status</label><select class="input" id="f-status">${CONSTANTS.CONTENT_STATUSES.map((s) => `<option ${s === item.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field"><label>Type</label><select class="input" id="f-type">${CONSTANTS.CONTENT_TYPES.map((s) => `<option ${s === item.type ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field"><label>Platform</label><select class="input" id="f-platform">${CONSTANTS.PLATFORMS.map((s) => `<option ${s === item.platform ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field"><label>Publish date</label><input class="input" type="date" id="f-date" value="${item.publishDate}" /></div>
          <div class="field"><label>Priority</label><select class="input" id="f-priority">${CONSTANTS.PRIORITIES.map((s) => `<option ${s === item.priority ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field"><label>Topic</label><input class="input" id="f-topic" value="${escapeHtml(item.topic || "")}" /></div>
          <div class="field"><label>Campaign</label><input class="input" id="f-campaign" value="${escapeHtml(item.campaign || "")}" /></div>
        </div>
        <div class="field"><label>Caption</label><textarea class="input" id="f-caption">${escapeHtml(item.caption || "")}</textarea></div>
        <div class="form-grid-2">
          <div class="field"><label>Hashtags</label><input class="input" id="f-hashtags" value="${escapeHtml(item.hashtags || "")}" /></div>
          <div class="field"><label>CTA</label><input class="input" id="f-cta" value="${escapeHtml(item.cta || "")}" /></div>
        </div>
        <div class="field"><label>Creative link</label><input class="input" id="f-creative" value="${escapeHtml(item.creativeLink || "")}" placeholder="Link to Drive / Figma / creative file" /></div>

        ${!isNew ? `
        <div class="divider"></div>
        <h3 style="margin-bottom:10px;">Approval history</h3>
        <div>${item.approvalHistory.length ? item.approvalHistory.map((h) => `<div class="history-item"><span class="h-date">${formatDateShort(h.date)}</span><span><b>${escapeHtml(h.action)}</b>${h.note ? " — " + escapeHtml(h.note) : ""}</span></div>`).join("") : `<p class="muted" style="font-size:12.5px;">No history yet.</p>`}</div>

        <div class="divider"></div>
        <h3 style="margin-bottom:10px;">Comments</h3>
        <div id="comments-list">${comments.length ? comments.map(commentHtml).join("") : `<p class="muted" style="font-size:12.5px;">No comments yet.</p>`}</div>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <input class="input" id="new-comment" placeholder="Add a comment…" />
          <button class="btn" id="add-comment-btn">Send</button>
        </div>
        ` : ""}
      </div>
      <div class="modal-footer">
        ${!isNew ? `
          <button class="btn" id="cm-request-changes">Request changes</button>
          <button class="btn" id="cm-approve">Approve</button>
        ` : ""}
        <button class="btn btn-primary" id="cm-save">${isNew ? "Create Content" : "Save changes"}</button>
      </div>
    </div>`;
  overlay.classList.add("open");
  qs("#cm-close").addEventListener("click", () => { overlay.classList.remove("open"); clearOpenParam(); });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) { overlay.classList.remove("open"); clearOpenParam(); } });

  qs("#add-comment-btn")?.addEventListener("click", async () => {
    const input = qs("#new-comment");
    if (!input.value.trim()) return;
    await addComment(id, { user: user.name, message: input.value.trim() });
    const list = await listComments(id);
    qs("#comments-list").innerHTML = list.map(commentHtml).join("");
    input.value = "";
    toast("Comment added.");
  });

  qs("#cm-approve")?.addEventListener("click", async () => {
    await updateContent(id, { status: "APPROVED" }, { action: "Approved", note: `Approved by ${user.name}.` });
    toast("Content approved.");
    overlay.classList.remove("open");
    clearOpenParam();
    renderTabBody();
  });
  qs("#cm-request-changes")?.addEventListener("click", async () => {
    await updateContent(id, { status: "CHANGES REQUESTED" }, { action: "Changes requested", note: `Requested by ${user.name}.` });
    toast("Changes requested.", "danger");
    overlay.classList.remove("open");
    clearOpenParam();
    renderTabBody();
  });

  qs("#cm-save").addEventListener("click", async () => {
    const patch = {
      title: qs("#f-title").value.trim(),
      status: qs("#f-status").value,
      type: qs("#f-type").value,
      platform: qs("#f-platform").value,
      publishDate: qs("#f-date").value,
      priority: qs("#f-priority").value,
      topic: qs("#f-topic").value,
      campaign: qs("#f-campaign").value,
      caption: qs("#f-caption").value,
      hashtags: qs("#f-hashtags").value,
      cta: qs("#f-cta").value,
      creativeLink: qs("#f-creative").value,
    };
    if (!patch.title) return toast("Title is required.", "danger");
    if (isNew) {
      await addContent({ ...patch, clientId, assignedTo: user.id });
      toast("Content created.");
    } else {
      const statusChanged = patch.status !== item.status;
      await updateContent(id, patch, statusChanged ? { action: "Status updated", note: `Changed to ${patch.status}.` } : null);
      toast("Content updated.");
    }
    overlay.classList.remove("open");
    clearOpenParam();
    renderTabBody();
  });
}
function commentHtml(c) {
  return `<div class="comment-item"><div class="avatar" style="width:26px;height:26px;font-size:10px;">${escapeHtml(c.user.split(" ").map((w) => w[0]).join(""))}</div><div class="c-body"><div class="c-head">${escapeHtml(c.user)}<span>${formatDateShort(c.date)}</span></div><div class="c-text">${escapeHtml(c.message)}</div></div></div>`;
}
function clearOpenParam() {
  history.replaceState(null, "", `client-detail.html?id=${clientId}&tab=${ACTIVE_TAB}`);
}

// ---------------------------------------------------------------------------
// TASKS TAB (kanban, drag & drop)
// ---------------------------------------------------------------------------
async function renderTasksTab(body) {
  const tasks = await listTasks({ clientId });
  body.innerHTML = `
    <div class="section-title-row">
      <p class="muted" style="font-size:13px;">${tasks.length} task${tasks.length === 1 ? "" : "s"}</p>
      <button class="btn btn-primary btn-sm" id="add-task-btn">+ New Task</button>
    </div>
    <div class="kanban-board">
      ${CONSTANTS.TASK_STATUSES.map((status) => `
        <div class="kanban-col" data-status="${status}">
          <div class="kanban-col-head"><h3>${status}</h3><span class="kanban-count">${tasks.filter((t) => t.status === status).length}</span></div>
          <div class="kanban-cards" data-status="${status}">
            ${tasks.filter((t) => t.status === status).map(taskCardHtml).join("")}
          </div>
        </div>`).join("")}
    </div>
  `;
  wireKanban(body, "clientId");
  qs("#add-task-btn").addEventListener("click", () => openTaskModal(null));

  const openId = getParam("open");
  if (openId) openTaskModal(openId);
}
function taskCardHtml(t) {
  return `<div class="kanban-card" draggable="true" data-id="${t.id}">
    <div class="k-title">${escapeHtml(t.title)}</div>
    <div class="k-meta">${priorityPill(t.priority)}<span class="faint" style="font-size:11px;">${formatDateShort(t.dueDate)}</span></div>
  </div>`;
}
function wireKanban(scope) {
  qsa(".kanban-card", scope).forEach((card) => {
    card.addEventListener("click", () => openTaskModal(card.dataset.id));
    card.addEventListener("dragstart", () => card.classList.add("dragging"));
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });
  qsa(".kanban-cards", scope).forEach((col) => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      col.closest(".kanban-col").classList.add("drag-over");
    });
    col.addEventListener("dragleave", () => col.closest(".kanban-col").classList.remove("drag-over"));
    col.addEventListener("drop", async (e) => {
      e.preventDefault();
      col.closest(".kanban-col").classList.remove("drag-over");
      const dragging = qs(".dragging", scope);
      if (!dragging) return;
      const id = dragging.dataset.id;
      const newStatus = col.dataset.status;
      await updateTask(id, { status: newStatus });
      toast(`Moved to ${newStatus}.`);
      renderTabBody();
    });
  });
}
async function openTaskModal(id) {
  const overlay = qs("#edit-client-overlay");
  const isNew = !id;
  const t = isNew
    ? { title: "", description: "", category: CONSTANTS.TASK_CATEGORIES[0], assignedTo: "", priority: "MEDIUM", status: "TODO", dueDate: new Date().toISOString().slice(0, 10) }
    : await getTask(id);

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h2>${isNew ? "New Task" : "Edit Task"}</h2><button class="icon-btn" id="tm-close">✕</button></div>
      <div class="modal-body">
        <div class="field"><label>Title</label><input class="input" id="t-title" value="${escapeHtml(t.title)}" /></div>
        <div class="field"><label>Description</label><textarea class="input" id="t-desc">${escapeHtml(t.description || "")}</textarea></div>
        <div class="form-grid-2">
          <div class="field"><label>Category</label><select class="input" id="t-category">${CONSTANTS.TASK_CATEGORIES.map((c) => `<option ${c === t.category ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label>Priority</label><select class="input" id="t-priority">${CONSTANTS.PRIORITIES.map((c) => `<option ${c === t.priority ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label>Status</label><select class="input" id="t-status">${CONSTANTS.TASK_STATUSES.map((c) => `<option ${c === t.status ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label>Due date</label><input class="input" type="date" id="t-due" value="${t.dueDate}" /></div>
        </div>
        <div class="field"><label>Assigned to</label><input class="input" id="t-assigned" value="${escapeHtml(t.assignedTo || "")}" placeholder="Team member id or name" /></div>
      </div>
      <div class="modal-footer">
        ${!isNew ? `<button class="btn btn-danger" id="t-delete">Delete</button>` : ""}
        <button class="btn btn-primary" id="t-save">${isNew ? "Create Task" : "Save changes"}</button>
      </div>
    </div>`;
  overlay.classList.add("open");
  qs("#tm-close").addEventListener("click", () => { overlay.classList.remove("open"); clearOpenParam(); });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) { overlay.classList.remove("open"); clearOpenParam(); } });

  qs("#t-delete")?.addEventListener("click", async () => {
    const ok = await confirmAction({ title: "Delete task?", message: "This action cannot be undone." });
    if (!ok) return;
    await deleteTask(id);
    toast("Task deleted.");
    overlay.classList.remove("open");
    clearOpenParam();
    renderTabBody();
  });

  qs("#t-save").addEventListener("click", async () => {
    const patch = {
      title: qs("#t-title").value.trim(),
      description: qs("#t-desc").value,
      category: qs("#t-category").value,
      priority: qs("#t-priority").value,
      status: qs("#t-status").value,
      dueDate: qs("#t-due").value,
      assignedTo: qs("#t-assigned").value,
    };
    if (!patch.title) return toast("Title is required.", "danger");
    if (isNew) {
      await addTask({ ...patch, clientId });
      toast("Task created.");
    } else {
      await updateTask(id, patch);
      toast("Task updated.");
    }
    overlay.classList.remove("open");
    clearOpenParam();
    renderTabBody();
  });
}

// ---------------------------------------------------------------------------
// APPROVALS TAB
// ---------------------------------------------------------------------------
async function renderApprovalsTab(body) {
  const content = await listContent({ clientId });
  const groups = {
    Pending: content.filter((c) => c.status === "CLIENT REVIEW"),
    "Changes Requested": content.filter((c) => c.status === "CHANGES REQUESTED"),
    Approved: content.filter((c) => ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(c.status)),
  };
  body.innerHTML = Object.entries(groups).map(([label, items]) => `
    <div class="card" style="margin-bottom:var(--space-4);">
      <div class="card-title-row"><h2>${label}</h2><span class="badge badge-neutral">${items.length}</span></div>
      ${items.length === 0 ? `<p class="muted" style="font-size:13px;">Nothing here.</p>` : items.map((c) => {
        const submitted = [...c.approvalHistory].reverse().find((h) => h.action === "Submitted for approval");
        const waitDays = submitted ? daysBetween(submitted.date) : 0;
        return `
        <div class="attention-item">
          <div class="attention-body">
            <div class="desc" style="font-weight:600;">${escapeHtml(c.title)}</div>
            <div class="meta">${label === "Pending" ? `Waiting ${waitDays} day${waitDays === 1 ? "" : "s"}` : formatDateShort(c.publishDate)}</div>
          </div>
          <button class="btn btn-sm open-content" data-id="${c.id}">Review</button>
        </div>`;
      }).join("")}
    </div>`).join("");
  qsa(".open-content", body).forEach((b) => b.addEventListener("click", () => openContentModal(b.dataset.id)));
}

// ---------------------------------------------------------------------------
// BRAND BRAIN TAB
// ---------------------------------------------------------------------------
async function renderBrandBrainTab(body) {
  const b = BRAIN || {};
  body.innerHTML = `
    <div class="card">
      <div class="card-title-row"><h2>Brand Brain — ${escapeHtml(CLIENT.name)}</h2><span class="badge badge-primary">Used by AI assistant</span></div>
      <p class="muted" style="font-size:12.5px;margin-bottom:var(--space-4);">This is the single source of truth for tone, voice and rules used whenever content is generated for this client. It is never shared with another client's workspace.</p>

      <div class="form-grid-2">
        <div class="field"><label>Brand personality</label><input class="input" id="bb-personality" value="${escapeHtml(b.personality || "")}" /></div>
        <div class="field"><label>Target audience</label><input class="input" id="bb-audience" value="${escapeHtml(b.targetAudience || "")}" /></div>
      </div>
      <div class="field"><label>Tone of voice (comma-separated)</label><input class="input" id="bb-tone" value="${escapeHtml((b.tone || []).join(", "))}" /></div>
      <div class="field"><label>Writing style</label><textarea class="input" id="bb-style">${escapeHtml(b.writingStyle || "")}</textarea></div>
      <div class="field"><label>Brand story</label><textarea class="input" id="bb-story">${escapeHtml(b.brandStory || "")}</textarea></div>
      <div class="field"><label>Core messaging</label><input class="input" id="bb-messaging" value="${escapeHtml(b.coreMessaging || "")}" /></div>
      <div class="form-grid-2">
        <div class="field"><label>Words to use (comma-separated)</label><input class="input" id="bb-use" value="${escapeHtml((b.wordsToUse || []).join(", "))}" /></div>
        <div class="field"><label>Words to avoid (comma-separated)</label><input class="input" id="bb-avoid" value="${escapeHtml((b.wordsToAvoid || []).join(", "))}" /></div>
      </div>
      <div class="field"><label>Content pillars (comma-separated)</label><input class="input" id="bb-pillars" value="${escapeHtml((b.contentPillars || []).join(", "))}" /></div>
      <div class="field"><label>Visual direction</label><textarea class="input" id="bb-visual">${escapeHtml(b.visualDirection || "")}</textarea></div>
      <div class="field"><label>Competitors (comma-separated)</label><input class="input" id="bb-competitors" value="${escapeHtml((b.competitors || []).join(", "))}" /></div>
      <div class="field"><label>Special instructions</label><textarea class="input" id="bb-special">${escapeHtml(b.specialInstructions || "")}</textarea></div>

      <button class="btn btn-primary" id="bb-save">Save Brand Brain</button>
    </div>

    <div class="card" style="margin-top:var(--space-4);">
      <div class="card-title-row"><h2>AI Content Assistant</h2></div>
      <p class="muted" style="font-size:12.5px;margin-bottom:var(--space-4);">Generates on-brand drafts using the Brand Brain above. All output is a draft — nothing is published without human approval.</p>
      <div class="form-grid-2">
        <div class="field"><label>Content type</label><select class="input" id="ai-type">${CONSTANTS.CONTENT_TYPES.map((t) => `<option>${t}</option>`).join("")}</select></div>
        <div class="field"><label>Platform</label><select class="input" id="ai-platform">${CONSTANTS.PLATFORMS.map((t) => `<option>${t}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Topic / goal</label><input class="input" id="ai-topic" placeholder="e.g. Monsoon season launch offer" /></div>
      <div class="checkbox-grid" style="margin-bottom:var(--space-4);">
        ${["Generate Caption", "Generate Hooks", "Generate CTA", "Generate Hashtags"].map((x) => `<span class="chip-check" data-ai="${x}">${x}</span>`).join("")}
      </div>
      <button class="btn" id="ai-generate-btn">Generate draft</button>
      <div id="ai-output" style="margin-top:var(--space-4);"></div>
    </div>
  `;

  qs("#bb-save").addEventListener("click", async () => {
    const data = {
      personality: qs("#bb-personality").value,
      targetAudience: qs("#bb-audience").value,
      tone: splitList(qs("#bb-tone").value),
      writingStyle: qs("#bb-style").value,
      brandStory: qs("#bb-story").value,
      coreMessaging: qs("#bb-messaging").value,
      wordsToUse: splitList(qs("#bb-use").value),
      wordsToAvoid: splitList(qs("#bb-avoid").value),
      contentPillars: splitList(qs("#bb-pillars").value),
      visualDirection: qs("#bb-visual").value,
      competitors: splitList(qs("#bb-competitors").value),
      specialInstructions: qs("#bb-special").value,
    };
    BRAIN = await upsertBrandBrain(clientId, data);
    toast("Brand Brain saved.");
  });

  qs("#ai-generate-btn").addEventListener("click", () => {
    const topic = qs("#ai-topic").value.trim() || "your next post";
    const tone = (BRAIN?.tone || []).join(", ") || "on-brand";
    const pillar = (BRAIN?.contentPillars || [])[0] || "brand storytelling";
    const messaging = BRAIN?.coreMessaging || "";
    qs("#ai-output").innerHTML = `
      <div class="card card-tight" style="background:var(--color-bg);">
        <p class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Draft — edit before saving</p>
        <p style="font-size:13.5px;margin-bottom:8px;"><b>Headline:</b> ${escapeHtml(topic)} — ${escapeHtml(pillar)}</p>
        <p style="font-size:13.5px;margin-bottom:8px;"><b>Caption:</b> ${escapeHtml(messaging ? `${messaging} ` : "")}A ${escapeHtml(tone.toLowerCase())} take on ${escapeHtml(topic.toLowerCase())}, written in ${escapeHtml(CLIENT.name)}'s voice.</p>
        <p style="font-size:13.5px;margin-bottom:8px;"><b>CTA:</b> Learn more</p>
        <p style="font-size:13.5px;"><b>Hashtags:</b> ${(BRAIN?.contentPillars || []).slice(0, 3).map((p) => "#" + p.replace(/\s+/g, "")).join(" ") || "#" + CLIENT.name.replace(/\s+/g, "")}</p>
        <button class="btn btn-sm" style="margin-top:10px;" id="ai-save-draft">Save as content idea</button>
      </div>`;
    qs("#ai-save-draft").addEventListener("click", async () => {
      await addContent({
        clientId, title: `${topic} — AI draft`, type: qs("#ai-type").value, platform: qs("#ai-platform").value,
        topic, caption: `${messaging ? messaging + " " : ""}A ${tone.toLowerCase()} take on ${topic.toLowerCase()}.`,
        status: "DRAFT", assignedTo: user.id,
      });
      toast("Saved as a content idea in DRAFT status.");
    });
  });

  qsa("[data-ai]", body).forEach((chip) => chip.addEventListener("click", () => chip.classList.toggle("checked")));
}
function splitList(str) {
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// SEO / ADS / REPORTS / FILES (lighter read-mostly tabs)
// ---------------------------------------------------------------------------
async function renderSeoTab(body) {
  const kws = await listSeoKeywords(clientId);
  body.innerHTML = `
    <div class="card" style="padding:0;overflow-x:auto;">
      <table class="data-table">
        <thead><tr><th>Keyword</th><th>Volume</th><th>Current</th><th>Previous</th><th>Change</th><th>Target</th><th>Last checked</th></tr></thead>
        <tbody>
          ${kws.length === 0 ? `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--color-muted);">No keywords tracked yet for this client.</td></tr>` :
          kws.map((k) => {
            const delta = k.previous - k.current;
            return `<tr>
              <td data-label="Keyword">${escapeHtml(k.keyword)}</td>
              <td data-label="Volume">${k.searchVolume.toLocaleString()}</td>
              <td data-label="Current">#${k.current}</td>
              <td data-label="Previous">#${k.previous}</td>
              <td data-label="Change" class="${delta > 0 ? "text-success" : delta < 0 ? "text-danger" : ""}">${delta > 0 ? "+" : ""}${delta}</td>
              <td data-label="Target">#${k.target}</td>
              <td data-label="Last checked">${formatDateShort(k.lastChecked)}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}
async function renderAdsTab(body) {
  const campaigns = await listAdCampaigns(clientId);
  body.innerHTML = campaigns.length === 0
    ? `<div class="empty-state"><div class="icon">📣</div><h3>No campaigns yet</h3><p>Ad campaigns for ${escapeHtml(CLIENT.name)} will appear here once created.</p></div>`
    : `<div class="client-grid">${campaigns.map((a) => `
      <div class="card">
        <div class="card-title-row"><h2>${escapeHtml(a.name)}</h2><span class="badge badge-${a.status === "ACTIVE" ? "success" : "neutral"}">${a.status}</span></div>
        <p class="muted" style="font-size:12px;margin-bottom:10px;">${escapeHtml(a.platform)} · ${escapeHtml(a.objective)}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
          ${infoRow("Spend", `₹${a.spend.toLocaleString()} / ₹${a.budget.toLocaleString()}`)}
          ${infoRow("Clicks", a.clicks.toLocaleString())}
          ${infoRow("Leads", a.leads)}
          ${infoRow("Conversions", a.conversions)}
        </div>
      </div>`).join("")}</div>`;
}
async function renderReportsTab(body) {
  const reports = await listReports(clientId);
  body.innerHTML = `
    <div class="section-title-row"><p class="muted" style="font-size:13px;">${reports.length} report${reports.length === 1 ? "" : "s"}</p><button class="btn btn-primary btn-sm" id="gen-report-btn">Generate Report</button></div>
    ${reports.length === 0 ? `<div class="empty-state"><div class="icon">📄</div><h3>No reports yet</h3><p>Generate the first monthly report for ${escapeHtml(CLIENT.name)}.</p></div>` : `
    <div class="card" style="padding:0;">
      <table class="data-table">
        <thead><tr><th>Period</th><th>Prepared by</th><th>Status</th><th>Generated</th></tr></thead>
        <tbody>${reports.map((r) => `<tr><td data-label="Period">${escapeHtml(r.period)}</td><td data-label="Prepared by">${escapeHtml(r.preparedBy)}</td><td data-label="Status">${statusPill(r.status === "Completed" ? "DONE" : "TODO")}</td><td data-label="Generated">${formatDateShort(r.generatedAt)}</td></tr>`).join("")}</tbody>
      </table>
    </div>`}
  `;
  qs("#gen-report-btn").addEventListener("click", () => toast("Report generation pulls live data — wire this up once Supabase analytics tables are connected."));
}
async function renderFilesTab(body) {
  const folders = ["Brand Assets", "Creatives", "Reports", "Documents", "Campaigns", "Other"];
  body.innerHTML = `<div class="client-grid">${folders.map((f) => `
    <div class="card" style="text-align:center;padding:var(--space-6) var(--space-4);cursor:pointer;" class="folder-card">
      <div style="font-size:28px;margin-bottom:8px;">📁</div>
      <h3>${f}</h3><p class="muted" style="font-size:12px;">0 files</p>
    </div>`).join("")}</div>
    <p class="hint" style="margin-top:var(--space-4);">File upload/preview/download connects to Supabase Storage once the backend is wired up — see README.</p>`;
}

// ---------------------------------------------------------------------------
// Edit / delete client
// ---------------------------------------------------------------------------
function openEditClientModal() {
  const overlay = qs("#edit-client-overlay");
  const c = CLIENT;
  overlay.innerHTML = `
    <div class="modal modal-wide">
      <div class="modal-header"><h2>Edit ${escapeHtml(c.name)}</h2><button class="icon-btn" id="ec-close">✕</button></div>
      <div class="modal-body">
        <div class="form-grid-2">
          <div class="field"><label>Client name</label><input class="input" id="e-name" value="${escapeHtml(c.name)}" /></div>
          <div class="field"><label>Status</label><select class="input" id="e-status">${["Active", "Onboarding", "Paused"].map((s) => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field"><label>Industry</label><select class="input" id="e-industry">${CONSTANTS.INDUSTRIES.map((i) => `<option ${i === c.industry ? "selected" : ""}>${i}</option>`).join("")}</select></div>
          <div class="field"><label>Website</label><input class="input" id="e-website" value="${escapeHtml(c.website || "")}" /></div>
          <div class="field"><label>Account manager</label><input class="input" id="e-am" value="${escapeHtml(c.accountManager || "")}" /></div>
          <div class="field"><label>Content manager</label><input class="input" id="e-cm" value="${escapeHtml(c.contentManager || "")}" /></div>
          <div class="field"><label>Designer</label><input class="input" id="e-designer" value="${escapeHtml(c.designer || "")}" /></div>
          <div class="field"><label>SEO manager</label><input class="input" id="e-seo" value="${escapeHtml(c.seoManager || "")}" /></div>
        </div>
        <div class="field"><label>Services (comma-separated)</label><input class="input" id="e-services" value="${escapeHtml((c.services || []).join(", "))}" /></div>
        <div class="field"><label>Notes</label><textarea class="input" id="e-notes">${escapeHtml(c.notes || "")}</textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn" id="ec-cancel">Cancel</button>
        <button class="btn btn-primary" id="ec-save">Save changes</button>
      </div>
    </div>`;
  overlay.classList.add("open");
  const close = () => overlay.classList.remove("open");
  qs("#ec-close").addEventListener("click", close);
  qs("#ec-cancel").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  qs("#ec-save").addEventListener("click", async () => {
    const name = qs("#e-name").value.trim();
    if (!name) return toast("Client name is required.", "danger");
    CLIENT = await updateClient(clientId, {
      name, status: qs("#e-status").value, industry: qs("#e-industry").value, website: qs("#e-website").value,
      accountManager: qs("#e-am").value, contentManager: qs("#e-cm").value, designer: qs("#e-designer").value, seoManager: qs("#e-seo").value,
      services: splitList(qs("#e-services").value), notes: qs("#e-notes").value,
    });
    toast("Client updated.");
    close();
    HEALTH = await computeClientHealth(clientId);
    render();
  });
}

async function onDeleteClient() {
  const ok = await confirmAction({ title: `Delete ${CLIENT.name}?`, message: "This permanently removes the client and all of its content and tasks. This action cannot be undone." });
  if (!ok) return;
  await deleteClient(clientId);
  toast("Client deleted.");
  window.location.href = "clients.html";
}
