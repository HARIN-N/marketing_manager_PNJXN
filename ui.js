// js/ui.js
// Small shared rendering helpers so every page renders statuses/priorities
// consistently without duplicating markup logic.
import { escapeHtml } from "./utils.js";

const STATUS_COLOR = {
  IDEA: "neutral", DRAFT: "neutral", DESIGNING: "info", "INTERNAL REVIEW": "info",
  "CLIENT REVIEW": "warning", "CHANGES REQUESTED": "danger", APPROVED: "success",
  SCHEDULED: "success", PUBLISHED: "success",
  TODO: "neutral", "IN PROGRESS": "info", REVIEW: "warning", BLOCKED: "danger", DONE: "success",
};
const PRIORITY_COLOR = { LOW: "neutral", MEDIUM: "info", HIGH: "warning", URGENT: "danger" };
const CLIENT_STATUS_COLOR = { Active: "success", Onboarding: "info", Paused: "warning" };

export function statusPill(status) {
  return `<span class="badge badge-${STATUS_COLOR[status] || "neutral"}">${escapeHtml(status)}</span>`;
}
export function priorityPill(p) {
  return `<span class="badge badge-${PRIORITY_COLOR[p] || "neutral"}">${escapeHtml(p)}</span>`;
}
export function clientStatusPill(status) {
  return `<span class="badge badge-${CLIENT_STATUS_COLOR[status] || "neutral"}">${escapeHtml(status)}</span>`;
}
export function healthColor(v) {
  if (v >= 75) return "var(--color-success)";
  if (v >= 50) return "var(--color-warning)";
  return "var(--color-danger)";
}
export function emptyState(title, sub, icon = "🗒️") {
  return `<div class="empty-state"><div class="icon">${icon}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(sub)}</p></div>`;
}
