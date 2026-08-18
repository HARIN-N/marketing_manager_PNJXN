import { initShell } from "./app.js";
import { listClients, listTasks, addTask, updateTask, deleteTask, getTask, CONSTANTS } from "./db.js";
import { escapeHtml, qs, qsa, getParam, formatDateShort, isOverdue, toast, confirmAction } from "./utils.js";
import { priorityPill } from "./ui.js";

const user = await initShell({ active: "tasks" });
let CLIENTS = [];
let CLIENT_MAP = {};
let VIEW = "kanban";

if (user) {
  CLIENTS = await listClients();
  CLIENT_MAP = Object.fromEntries(CLIENTS.map((c) => [c.id, c]));
  populateFilters();
  wireControls();
  await renderAll();

  const openId = getParam("open");
  if (openId) openTaskModal(openId);
}

function populateFilters() {
  qs("#f-client").insertAdjacentHTML("beforeend", CLIENTS.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join(""));
  qs("#f-category").insertAdjacentHTML("beforeend", CONSTANTS.TASK_CATEGORIES.map((c) => `<option>${c}</option>`).join(""));
  qs("#f-priority").insertAdjacentHTML("beforeend", CONSTANTS.PRIORITIES.map((p) => `<option>${p}</option>`).join(""));
}

function wireControls() {
  qsa(".pill-toggle button[data-view]").forEach((btn) =>
    btn.addEventListener("click", () => {
      qsa(".pill-toggle button[data-view]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      VIEW = btn.dataset.view;
      qs("#kanban-view").style.display = VIEW === "kanban" ? "block" : "none";
      qs("#list-view").style.display = VIEW === "list" ? "block" : "none";
    })
  );
  ["f-client", "f-category", "f-priority"].forEach((id) => qs(`#${id}`).addEventListener("change", renderAll));
  qs("#add-task-btn").addEventListener("click", () => openTaskModal(null));
}

function currentFilters() {
  return {
    clientId: qs("#f-client").value || undefined,
  };
}

async function renderAll() {
  let tasks = await listTasks(currentFilters());
  const category = qs("#f-category").value;
  const priority = qs("#f-priority").value;
  if (category) tasks = tasks.filter((t) => t.category === category);
  if (priority) tasks = tasks.filter((t) => t.priority === priority);
  renderKanban(tasks);
  renderList(tasks);
}

function renderKanban(tasks) {
  const board = qs("#kanban-board");
  board.innerHTML = CONSTANTS.TASK_STATUSES.map((status) => {
    const items = tasks.filter((t) => t.status === status);
    return `<div class="kanban-col" data-status="${status}">
      <div class="kanban-col-head"><h3>${status}</h3><span class="kanban-count">${items.length}</span></div>
      <div class="kanban-cards" data-status="${status}">
        ${items.length === 0 ? `<p class="faint" style="font-size:11.5px;padding:8px 4px;">No tasks</p>` : items.map(taskCard).join("")}
      </div>
    </div>`;
  }).join("");
  wireKanban(board);
}

function taskCard(t) {
  const overdue = isOverdue(t.dueDate, ["DONE"], t.status);
  return `<div class="kanban-card" draggable="true" data-id="${t.id}">
    <div class="k-client">${escapeHtml(CLIENT_MAP[t.clientId]?.name || "Internal")}</div>
    <div class="k-title">${escapeHtml(t.title)}</div>
    <div class="k-meta">${priorityPill(t.priority)}<span style="font-size:11px;font-weight:600;color:${overdue ? "var(--color-danger)" : "var(--color-faint)"}">${formatDateShort(t.dueDate)}</span></div>
  </div>`;
}

function wireKanban(scope) {
  qsa(".kanban-card", scope).forEach((card) => {
    card.addEventListener("click", () => openTaskModal(card.dataset.id));
    card.addEventListener("dragstart", () => card.classList.add("dragging"));
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });
  qsa(".kanban-cards", scope).forEach((col) => {
    col.addEventListener("dragover", (e) => { e.preventDefault(); col.closest(".kanban-col").classList.add("drag-over"); });
    col.addEventListener("dragleave", () => col.closest(".kanban-col").classList.remove("drag-over"));
    col.addEventListener("drop", async (e) => {
      e.preventDefault();
      col.closest(".kanban-col").classList.remove("drag-over");
      const dragging = qs(".dragging", scope);
      if (!dragging) return;
      await updateTask(dragging.dataset.id, { status: col.dataset.status });
      toast(`Moved to ${col.dataset.status}.`);
      renderAll();
    });
  });
}

function renderList(tasks) {
  const body = qs("#list-body");
  if (tasks.length === 0) {
    body.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="icon">✅</div><h3>No tasks match</h3><p>Try adjusting your filters.</p></div></td></tr>`;
    return;
  }
  body.innerHTML = tasks
    .map(
      (t) => `<tr class="row-link" data-id="${t.id}">
      <td data-label="Title">${escapeHtml(t.title)}</td>
      <td data-label="Client">${escapeHtml(CLIENT_MAP[t.clientId]?.name || "Internal")}</td>
      <td data-label="Category">${escapeHtml(t.category)}</td>
      <td data-label="Priority">${priorityPill(t.priority)}</td>
      <td data-label="Due date">${formatDateShort(t.dueDate)}</td>
      <td data-label="Status">${t.status}</td>
    </tr>`
    )
    .join("");
  qsa("tr.row-link", body).forEach((row) => row.addEventListener("click", () => openTaskModal(row.dataset.id)));
}

async function openTaskModal(id) {
  const overlay = qs("#task-overlay");
  const isNew = !id;
  const t = isNew
    ? { title: "", description: "", clientId: qs("#f-client").value || "", category: CONSTANTS.TASK_CATEGORIES[0], assignedTo: "", priority: "MEDIUM", status: "TODO", dueDate: new Date().toISOString().slice(0, 10) }
    : await getTask(id);

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h2>${isNew ? "New Task" : "Edit Task"}</h2><button class="icon-btn" id="tm-close">✕</button></div>
      <div class="modal-body">
        <div class="field"><label>Title</label><input class="input" id="t-title" value="${escapeHtml(t.title)}" /></div>
        <div class="field"><label>Client</label><select class="input" id="t-client"><option value="">Internal / no client</option>${CLIENTS.map((c) => `<option value="${c.id}" ${c.id === t.clientId ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}</select></div>
        <div class="field"><label>Description</label><textarea class="input" id="t-desc">${escapeHtml(t.description || "")}</textarea></div>
        <div class="form-grid-2">
          <div class="field"><label>Category</label><select class="input" id="t-category">${CONSTANTS.TASK_CATEGORIES.map((c) => `<option ${c === t.category ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label>Priority</label><select class="input" id="t-priority">${CONSTANTS.PRIORITIES.map((c) => `<option ${c === t.priority ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label>Status</label><select class="input" id="t-status">${CONSTANTS.TASK_STATUSES.map((c) => `<option ${c === t.status ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label>Due date</label><input class="input" type="date" id="t-due" value="${t.dueDate}" /></div>
        </div>
      </div>
      <div class="modal-footer">
        ${!isNew ? `<button class="btn btn-danger" id="t-delete">Delete</button>` : ""}
        <button class="btn btn-primary" id="t-save">${isNew ? "Create Task" : "Save changes"}</button>
      </div>
    </div>`;
  overlay.classList.add("open");
  const close = () => { overlay.classList.remove("open"); history.replaceState(null, "", "tasks.html"); };
  qs("#tm-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  qs("#t-delete")?.addEventListener("click", async () => {
    const ok = await confirmAction({ title: "Delete task?", message: "This action cannot be undone." });
    if (!ok) return;
    await deleteTask(id);
    toast("Task deleted.");
    close();
    renderAll();
  });

  qs("#t-save").addEventListener("click", async () => {
    const patch = {
      title: qs("#t-title").value.trim(),
      clientId: qs("#t-client").value || null,
      description: qs("#t-desc").value,
      category: qs("#t-category").value,
      priority: qs("#t-priority").value,
      status: qs("#t-status").value,
      dueDate: qs("#t-due").value,
    };
    if (!patch.title) return toast("Title is required.", "danger");
    if (isNew) {
      await addTask({ ...patch, assignedTo: user.id });
      toast("Task created.");
    } else {
      await updateTask(id, patch);
      toast("Task updated.");
    }
    close();
    renderAll();
  });
}
