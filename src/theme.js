// System, light or dark theme for the extension's pages, cycled by the #theme button.
// Kept in localStorage so it applies before the first paint.
"use strict";
(() => {
  const order = ["system", "light", "dark"];
  const names = { system: "System theme", light: "Light theme", dark: "Dark theme" };
  const saved = () => {
    try {
      const theme = localStorage.getItem("theme");
      return order.includes(theme) ? theme : "system";
    } catch {
      return "system";
    }
  };
  const apply = (theme) => {
    document.documentElement.style.colorScheme = theme === "system" ? "" : theme;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", theme === "system" ? "light dark" : theme);
    const button = document.getElementById("theme");
    if (!button) return;
    button.setAttribute("aria-label", names[theme]);
    button.title = names[theme];
    for (const icon of button.querySelectorAll("[data-theme]")) icon.toggleAttribute("hidden", icon.dataset.theme !== theme);
  };
  apply(saved());
  document.addEventListener("DOMContentLoaded", () => {
    apply(saved());
    document.getElementById("theme")?.addEventListener("click", () => {
      const next = order[(order.indexOf(saved()) + 1) % order.length];
      try {
        localStorage.setItem("theme", next);
      } catch {}
      apply(next);
      document.getElementById("spoken").textContent = names[next];
    });
  });
})();
