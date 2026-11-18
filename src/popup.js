"use strict";
const toggle = document.getElementById("enabled");

browser.storage.sync.get("enabled").then(({ enabled }) => {
  toggle.checked = enabled !== false;
});
toggle.addEventListener("change", () => {
  browser.storage.sync.set({ enabled: toggle.checked });
});
