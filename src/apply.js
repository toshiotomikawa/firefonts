"use strict";
// Runs in each chosen site: sets the site's font, or clears it, and follows changes live.
(function () {
  if (globalThis.firefontsReady) return;
  globalThis.firefontsReady = true;

  const root = document.documentElement;
  const host = location.hostname;

  function apply(sites) {
    const font = sites && sites[host];
    if (font) {
      root.style.setProperty("--firefonts-font", FF.cssFamily(font));
      root.setAttribute("data-firefonts", "");
    } else {
      root.removeAttribute("data-firefonts");
      root.style.removeProperty("--firefonts-font");
    }
  }

  browser.storage.sync.get("sites").then(({ sites }) => apply(sites));
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.sites) apply(changes.sites.newValue);
  });
})();
