import { initShell } from "./app.js";
import { listClients, listContent, addContent, updateContent, listComments, addComment, getContentById, CONSTANTS } from "./db.js";
import { escapeHtml, qs, qsa, getParam, formatDateShort, toast } from "./utils.js";
import { statusPill, priorityPill, emptyState } from "./ui.js";
import { getCurrentUser } from "./auth.js";

const user = await initShell({ active: "content" });
let CLIENTS = [];
let CLIENT_MAP = {};
let VIEW = "calendar";
let CAL_DATE = new Date();

if (user) {
  CLIENTS = await listClients();
  CLIENT_MAP = Object.fromEntries(CLIENTS.map((c) => [c.id, c]));
  populateFilters();
  wireControls();
  await renderAll();

  const preClient = getParam("client");
  if (preClient) qs("#f-client").value = preClient;
  const openId = getParam("open");
  if (openId) openContentModal(openId);
  if (preClient) await renderAll();
}

function populateFilters() {
  qs("#f-client").insertAdjacentHTML("beforeend", CLIENTS.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join(""));
  qs("#f-platform").insertAdjacentHTML("beforeend", CONSTANTS.PLATFORMS.map((p) => `<option>${p}</option>`).join(""));
  qs("#f-status").insertAdjacentHTML("beforeend", CONSTANTS.CONTENT_STATUSES.map((s) => `<option>${s}</option>`).join(""));
  qs("#f-type").insertAdjacentHTML("beforeend", CONSTANTS.CONTENT_TYPES.map((t) => `<option>${t}</option>`).join(""));
}

function wireControls() {
  qsa(".pill-toggle button[data-view]").forEach((btn) =>
    btn.addEventListener("click", () => {
      qsa(".pill-toggle button[data-view]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      VIEW = btn.dataset.view;
      qs("#calendar-view").style.display = VIEW === "calendar" ? "block" : "none";
      qs("#list-view").style.display = VIEW === "list" ? "block" : "none";
    })
  );
  ["f-client", "f-platform", "f-status", "f-type"].forEach((id) => qs(`#${id}`).addEventListener("change", renderAll));
  qs("#cal-prev").addEventListener("click", () => { CAL_DATE.setMonth(CAL_DATE.getMonth() - 1); renderAll(); });
  qs("#cal-next").addEventListener("click", () => { CAL_DATE.setMonth(CAL_DATE.getMonth() + 1); renderAll(); });
  qs("#cal-today").addEventListener("click", () => { CAL_DATE = new Date(); renderAll(); });
  qs("#add-content-btn").addEventListener("click", () => openContentModal(null));
}

function currentFilters() {
  return {
    clientId: qs("#f-client").value || undefined,
    platform: qs("#f-platform").value || undefined,
    status: qs("#f-status").value || undefined,
    type: qs("#f-type").value || undefined,
  };
}

async function renderAll() {
  const items = await listContent(currentFilters());
  renderCalendar(items);
  renderList(items);
}

function renderCalendar(items) {
  qs("#cal-month-label").textContent = CAL_DATE.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const grid = qs("#cal-grid");
  const year = CAL_DATE.getFullYear();
  const month = CAL_DATE.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const byDate = {};
  items.forEach((c) => {
    const key = c.publishDate;
    (byDate[key] = byDate[key] || []).push(c);
  });

  let cells = "";
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d) => (cells += `<div class="cal-dow">${d}</div>`));

  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    let dateObj, otherMonth = false;
    if (dayNum < 1) { dateObj = new Date(year, month - 1, prevMonthDays + dayNum); otherMonth = true; }
    else if (dayNum > daysInMonth) { dateObj = new Date(year, month + 1, dayNum - daysInMonth); otherMonth = true; }
    else { dateObj = new Date(year, month, dayNum); }
    const iso = dateObj.toISOString().slice(0, 10);
    const isToday = dateObj.toDateString() === new Date().toDateString();
    const dayItems = byDate[iso] || [];
    cells += `<div class="cal-cell ${otherMonth ? "other-month" : ""} ${isToday ? "today" : ""}">
      <div class="date-num">${dateObj.getDate()}</div>
      ${dayItems.slice(0, 3).map((c) => `<div class="cal-chip open-content" data-id="${c.id}" style="background:${chipColor(c.status)};color:${chipText(c.status)}" title="${escapeHtml(CLIENT_MAP[c.clientId]?.name || "")} — ${escapeHtml(c.title)}">${escapeHtml(CLIENT_MAP[c.clientId]?.name?.split(" ")[0] || "")}: ${escapeHtml(c.title)}</div>`).join("")}
      ${dayItems.length > 3 ? `<div class="faint" style="font-size:10px;">+${dayItems.length - 3} more</div>` : ""}
    </div>`;
  }
  grid.innerHTML = cells;
  qsa(".open-content", grid).forEach((chip) => chip.addEventListener("click", () => openContentModal(chip.dataset.id)));
}
function chipColor(status) {
  const map = { "CLIENT REVIEW": "var(--color-warning-bg)", "CHANGES REQUESTED": "var(--color-danger-bg)", PUBLISHED: "var(--color-success-bg)", SCHEDULED: "var(--color-success-bg)", APPROVED: "var(--color-success-bg)" };
  return map[status] || "var(--color-info-bg)";
}
function chipText(status) {
  const map = { "CLIENT REVIEW": "var(--color-warning)", "CHANGES REQUESTED": "var(--color-danger)", PUBLISHED: "var(--color-success)", SCHEDULED: "var(--color-success)", APPROVED: "var(--color-success)" };
  return map[status] || "var(--color-info)";
}

function renderList(items) {
  const body = qs("#list-body");
  if (items.length === 0) {
    body.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">🗒️</div><h3>No content matches</h3><p>Try adjusting your filters, or create a new content item.</p></div></td></tr>`;
    return;
  }
  body.innerHTML = items
    .map(
      (c) => `
    <tr class="row-link" data-id="${c.id}">
      <td data-label="Title">${escapeHtml(c.title)}</td>
      <td data-label="Client">${escapeHtml(CLIENT_MAP[c.clientId]?.name || "Unassigned")}</td>
      <td data-label="Type">${escapeHtml(c.type)}</td>
      <td data-label="Platform">${escapeHtml(c.platform)}</td>
      <td data-label="Publish date">${formatDateShort(c.publishDate)}</td>
      <td data-label="Status">${statusPill(c.status)}</td>
      <td data-label="Priority">${priorityPill(c.priority)}</td>
    </tr>`
    )
    .join("");
  qsa("tr.row-link", body).forEach((row) => row.addEventListener("click", () => openContentModal(row.dataset.id)));
}

async function openContentModal(id) {
  const overlay = qs("#content-overlay");
  const isNew = !id;
  const item = isNew
    ? { title: "", clientId: qs("#f-client").value || CLIENTS[0]?.id || "", type: CONSTANTS.CONTENT_TYPES[0], platform: CONSTANTS.PLATFORMS[0], topic: "", campaign: "", caption: "", hashtags: "", cta: "", creativeLink: "", publishDate: new Date().toISOString().slice(0, 10), status: "IDEA", priority: "MEDIUM", approvalHistory: [] }
    : await getContentById(id);
  const comments = isNew ? [] : await listComments(id);

  overlay.innerHTML = `
    <div class="modal modal-wide">
      <div class="modal-header"><h2>${isNew ? "New Content" : escapeHtml(item.title)}</h2><button class="icon-btn" id="cm-close">✕</button></div>
      <div class="modal-body">
        <div class="form-grid-2">
          <div class="field"><label>Client</label><select class="input" id="f-c-client">${CLIENTS.map((c) => `<option value="${c.id}" ${c.id === item.clientId ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}</select></div>
          <div class="field"><label>Status</label><select class="input" id="f-c-status">${CONSTANTS.CONTENT_STATUSES.map((s) => `<option ${s === item.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field"><label>Title</label><input class="input" id="f-c-title" value="${escapeHtml(item.title)}" /></div>
          <div class="field"><label>Priority</label><select class="input" id="f-c-priority">${CONSTANTS.PRIORITIES.map((s) => `<option ${s === item.priority ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field"><label>Type</label><select class="input" id="f-c-type">${CONSTANTS.CONTENT_TYPES.map((s) => `<option ${s === item.type ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field"><label>Platform</label><select class="input" id="f-c-platform">${CONSTANTS.PLATFORMS.map((s) => `<option ${s === item.platform ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field"><label>Publish date</label><input class="input" type="date" id="f-c-date" value="${item.publishDate}" /></div>
          <div class="field"><label>Topic</label><input class="input" id="f-c-topic" value="${escapeHtml(item.topic || "")}" /></div>
        </div>
        <div class="field"><label>Caption</label><textarea class="input" id="f-c-caption">${escapeHtml(item.caption || "")}</textarea></div>
        ${!isNew ? `
        <div class="divider"></div>
        <h3 style="margin-bottom:10px;">Comments</h3>
        <div id="comments-list">${comments.length ? comments.map((c) => `<div class="comment-item"><div class="avatar" style="width:26px;height:26px;font-size:10px;">${escapeHtml(c.user.split(" ").map((w) => w[0]).join(""))}</div><div class="c-body"><div class="c-head">${escapeHtml(c.user)}<span>${formatDateShort(c.date)}</span></div><div class="c-text">${escapeHtml(c.message)}</div></div></div>`).join("") : `<p class="muted" style="font-size:12.5px;">No comments yet.</p>`}</div>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <input class="input" id="new-comment" placeholder="Add a comment…" />
          <button class="btn" id="add-comment-btn">Send</button>
        </div>` : ""}
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="cm-save">${isNew ? "Create Content" : "Save changes"}</button>
      </div>
    </div>`;
  overlay.classList.add("open");
  const close = () => { overlay.classList.remove("open"); history.replaceState(null, "", "content.html"); };
  qs("#cm-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  qs("#add-comment-btn")?.addEventListener("click", async () => {
    const input = qs("#new-comment");
    if (!input.value.trim()) return;
    await addComment(id, { user: user.name, message: input.value.trim() });
    const list = await listComments(id);
    qs("#comments-list").innerHTML = list.map((c) => `<div class="comment-item"><div class="avatar" style="width:26px;height:26px;font-size:10px;">${escapeHtml(c.user.split(" ").map((w) => w[0]).join(""))}</div><div class="c-body"><div class="c-head">${escapeHtml(c.user)}<span>${formatDateShort(c.date)}</span></div><div class="c-text">${escapeHtml(c.message)}</div></div></div>`).join("");
    input.value = "";
  });

  qs("#cm-save").addEventListener("click", async () => {
    const patch = {
      clientId: qs("#f-c-client").value,
      title: qs("#f-c-title").value.trim(),
      status: qs("#f-c-status").value,
      priority: qs("#f-c-priority").value,
      type: qs("#f-c-type").value,
      platform: qs("#f-c-platform").value,
      publishDate: qs("#f-c-date").value,
      topic: qs("#f-c-topic").value,
      caption: qs("#f-c-caption").value,
    };
    if (!patch.title) return toast("Title is required.", "danger");
    if (isNew) {
      await addContent({ ...patch, assignedTo: user.id });
      toast("Content created.");
    } else {
      const statusChanged = patch.status !== item.status;
      await updateContent(id, patch, statusChanged ? { action: "Status updated", note: `Changed to ${patch.status}.` } : null);
      toast("Content updated.");
    }
    close();
    renderAll();
  });
}
