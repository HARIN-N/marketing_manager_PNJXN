// js/utils.js
// Small, dependency-free helper functions used across the app.

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Deterministic colour from a string, used for logo tiles / avatars so the
// same client always gets the same colour without storing one explicitly.
const PALETTE = ["#556B2F", "#2563A8", "#B4740E", "#7C4DA6", "#B3261E", "#1E7B4D", "#8A5A2B", "#3D5A80"];
export function colorFor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function formatDate(iso, opts = {}) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", ...opts });
}

export function formatDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function daysBetween(a, b = new Date()) {
  const MS = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b) - new Date(a)) / MS);
}

export function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

export function isOverdue(iso, doneStatuses = ["DONE", "PUBLISHED"], status) {
  if (!iso) return false;
  if (doneStatuses.includes(status)) return false;
  return new Date(iso) < new Date(new Date().toDateString());
}

export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function qs(sel, el = document) {
  return el.querySelector(sel);
}
export function qsa(sel, el = document) {
  return [...el.querySelectorAll(sel)];
}

export function toast(message, type = "success") {
  let stack = qs(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity 200ms ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 220);
  }, 3000);
}

export function confirmAction({ title, message, confirmLabel = "Delete", danger = true }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay open";
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px">
        <div class="modal-header"><h2>${escapeHtml(title)}</h2></div>
        <div class="modal-body"><p class="muted">${escapeHtml(message)}</p></div>
        <div class="modal-footer">
          <button class="btn" data-act="cancel">Cancel</button>
          <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-act="confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.dataset.act === "cancel") {
        overlay.remove();
        resolve(false);
      }
      if (e.target.dataset.act === "confirm") {
        overlay.remove();
        resolve(true);
      }
    });
  });
}

// Query-string helpers (used for client-detail.html?id=...)
export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
