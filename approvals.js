import { initShell } from "./app.js";
import { listClients, listContent, updateContent, listComments, addComment, getContentById } from "./db.js";
import { escapeHtml, qs, qsa, formatDateShort, daysBetween, toast } from "./utils.js";
import { emptyState } from "./ui.js";

const user = await initShell({ active: "approvals" });
let CLIENTS = [];
let CLIENT_MAP = {};
let ACTIVE_TAB = "Pending";

if (user) {
  CLIENTS = await listClients();
  CLIENT_MAP = Object.fromEntries(CLIENTS.map((c) => [c.id, c]));
  qs("#f-client").insertAdjacentHTML("beforeend", CLIENTS.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join(""));
  qs("#f-client").addEventListener("change", render);
  qsa(".tab", qs("#approval-tabs")).forEach((t) =>
    t.addEventListener("click", () => {
      qsa(".tab", qs("#approval-tabs")).forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      ACTIVE_TAB = t.dataset.tab;
      render();
    })
  );
  await render();
}

const STATUS_FOR_TAB = {
  Pending: (c) => c.status === "CLIENT REVIEW",
  Approved: (c) => ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(c.status),
  "Changes Requested": (c) => c.status === "CHANGES REQUESTED",
};

async function render() {
  const clientId = qs("#f-client").value || undefined;
  const all = await listContent({ clientId });
  const items = all.filter(STATUS_FOR_TAB[ACTIVE_TAB]);

  if (items.length === 0) {
    qs("#approval-list").innerHTML = emptyState(
      ACTIVE_TAB === "Pending" ? "Your approval queue is clear" : `No items in "${ACTIVE_TAB}"`,
      ACTIVE_TAB === "Pending" ? "Nice work — nothing is waiting on a client decision." : "Nothing to show here right now.",
      "✓"
    );
    return;
  }

  qs("#approval-list").innerHTML = `<div class="card" style="padding:0;">${items
    .map((c) => {
      const submitted = [...c.approvalHistory].reverse().find((h) => h.action === "Submitted for approval");
      const waitDays = submitted ? daysBetween(submitted.date) : 0;
      return `
      <div class="attention-item" style="padding:var(--space-4) var(--space-5);">
        <span class="attention-sev ${waitDays >= 3 ? "high" : waitDays >= 1 ? "medium" : "low"}"></span>
        <div class="attention-body">
          <div class="client-name">${escapeHtml(CLIENT_MAP[c.clientId]?.name || "Unknown client")}</div>
          <div class="desc">${escapeHtml(c.title)}</div>
          <div class="meta">${ACTIVE_TAB === "Pending" ? `Waiting ${waitDays} day${waitDays === 1 ? "" : "s"}` : formatDateShort(c.publishDate)} · Submitted by ${escapeHtml(c.assignedTo || "team")}</div>
        </div>
        <button class="btn btn-sm review-btn" data-id="${c.id}">Review</button>
      </div>`;
    })
    .join("")}</div>`;

  qsa(".review-btn").forEach((b) => b.addEventListener("click", () => openReviewModal(b.dataset.id)));
}

async function openReviewModal(id) {
  const overlay = qs("#approval-overlay");
  const item = await getContentById(id);
  const comments = await listComments(id);
  const client = CLIENT_MAP[item.clientId];

  overlay.innerHTML = `
    <div class="modal modal-wide">
      <div class="modal-header"><h2>${escapeHtml(item.title)}</h2><button class="icon-btn" id="rv-close">✕</button></div>
      <div class="modal-body">
        <p class="muted" style="font-size:12.5px;margin-bottom:var(--space-4);">${escapeHtml(client?.name || "")} · ${escapeHtml(item.type)} · ${escapeHtml(item.platform)} · Publishing ${formatDateShort(item.publishDate)}</p>
        <div class="field"><label>Caption</label><div class="card card-tight" style="background:var(--color-bg);font-size:13.5px;">${escapeHtml(item.caption || "No caption written yet.")}</div></div>
        ${item.hashtags ? `<div class="field"><label>Hashtags</label><p style="font-size:13px;">${escapeHtml(item.hashtags)}</p></div>` : ""}
        <div class="divider"></div>
        <h3 style="margin-bottom:10px;">Approval history</h3>
        <div>${item.approvalHistory.map((h) => `<div class="history-item"><span class="h-date">${formatDateShort(h.date)}</span><span><b>${escapeHtml(h.action)}</b>${h.note ? " — " + escapeHtml(h.note) : ""}</span></div>`).join("")}</div>
        <div class="divider"></div>
        <h3 style="margin-bottom:10px;">Comments</h3>
        <div id="comments-list">${comments.length ? comments.map((c) => `<div class="comment-item"><div class="avatar" style="width:26px;height:26px;font-size:10px;">${escapeHtml(c.user.split(" ").map((w) => w[0]).join(""))}</div><div class="c-body"><div class="c-head">${escapeHtml(c.user)}<span>${formatDateShort(c.date)}</span></div><div class="c-text">${escapeHtml(c.message)}</div></div></div>`).join("") : `<p class="muted" style="font-size:12.5px;">No comments yet.</p>`}</div>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <input class="input" id="new-comment" placeholder="Add a comment…" />
          <button class="btn" id="add-comment-btn">Send</button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" id="rv-changes">Request changes</button>
        <button class="btn btn-primary" id="rv-approve">Approve</button>
      </div>
    </div>`;
  overlay.classList.add("open");
  const close = () => overlay.classList.remove("open");
  qs("#rv-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  qs("#add-comment-btn").addEventListener("click", async () => {
    const input = qs("#new-comment");
    if (!input.value.trim()) return;
    await addComment(id, { user: user.name, message: input.value.trim() });
    const list = await listComments(id);
    qs("#comments-list").innerHTML = list.map((c) => `<div class="comment-item"><div class="avatar" style="width:26px;height:26px;font-size:10px;">${escapeHtml(c.user.split(" ").map((w) => w[0]).join(""))}</div><div class="c-body"><div class="c-head">${escapeHtml(c.user)}<span>${formatDateShort(c.date)}</span></div><div class="c-text">${escapeHtml(c.message)}</div></div></div>`).join("");
    input.value = "";
  });

  qs("#rv-approve").addEventListener("click", async () => {
    await updateContent(id, { status: "APPROVED" }, { action: "Approved", note: `Approved by ${user.name}.` });
    toast("Content approved.");
    close();
    render();
  });
  qs("#rv-changes").addEventListener("click", async () => {
    await updateContent(id, { status: "CHANGES REQUESTED" }, { action: "Changes requested", note: `Requested by ${user.name}.` });
    toast("Changes requested.", "danger");
    close();
    render();
  });
}
