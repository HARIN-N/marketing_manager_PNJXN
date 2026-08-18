import { initShell } from "./app.js";
import { resetDemoData } from "./db.js";
import { qs, qsa, toast, confirmAction } from "./utils.js";

const user = await initShell({ active: "settings" });
if (user) {
  qs("#theme-light").addEventListener("click", () => setTheme("light"));
  qs("#theme-dark").addEventListener("click", () => setTheme("dark"));

  qs("#reset-btn").addEventListener("click", async () => {
    const ok = await confirmAction({ title: "Reset demo data?", message: "This restores all seed data and discards anything you've added or changed." });
    if (!ok) return;
    await resetDemoData();
    toast("Demo data reset.");
  });

  qsa(".card .btn-primary.btn-sm").forEach((btn) => btn.addEventListener("click", () => toast("Saved (demo only — not persisted to a backend yet).")));
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "";
  qs("#theme-light").classList.toggle("active", theme === "light");
  qs("#theme-dark").classList.toggle("active", theme === "dark");
}
