"use strict";
// Turns the font on or off by marking <html>; fonts.css does the rest.
const root = document.documentElement;

function apply(enabled) {
  root.toggleAttribute("data-firefonts", enabled !== false);
}

apply(true);
browser.storage.sync.get("enabled").then(({ enabled }) => apply(enabled));
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && "enabled" in changes) apply(changes.enabled.newValue);
});
