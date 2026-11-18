"use strict";
// Runs in each chosen site: sets the site's font, or clears it, and follows changes live.
(function () {
  if (globalThis.firefontsReady) return;
  globalThis.firefontsReady = true;

  const root = document.documentElement;
  // Blank and srcdoc frames have no hostname of their own; they belong to the page that holds them.
  let host = location.hostname;
  if (!host) {
    try {
      host = parent.location.hostname;
    } catch {}
  }
  if (!FF.validHost(host)) return;
  const key = FF.keyFor(host);
  // Set once a live change arrives, so the slower first read can't undo it.
  let settled = false;
  // The value now applied, so a page that strips it from <html> gets it back.
  let current = "";

  function apply(value) {
    const family = FF.cssFamily(value);
    current = family ? value : "";
    if (family) {
      root.style.setProperty("--firefonts-font", family);
      root.setAttribute("data-firefonts", "");
    } else {
      root.removeAttribute("data-firefonts");
      root.style.removeProperty("--firefonts-font");
    }
  }

  // Pages that rewrite <html> attributes would otherwise drop the font until the next change.
  const restore = () => {
    if (current && (!root.hasAttribute("data-firefonts") || !root.style.getPropertyValue("--firefonts-font"))) apply(current);
  };
  new MutationObserver(restore).observe(root, { attributes: true, attributeFilter: ["data-firefonts", "style"] });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !Object.hasOwn(changes, key)) return;
    settled = true;
    apply(changes[key].newValue);
  });
  browser.storage.sync.get(key).then((items) => {
    if (!settled) apply(items?.[key]);
  });
})();
