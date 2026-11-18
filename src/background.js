"use strict";
// Keeps one registered content script that covers every chosen site the user granted.
const ID = "firefonts";

async function sync() {
  const { sites = {} } = await browser.storage.sync.get("sites");
  const matches = [];
  for (const host of Object.keys(sites)) {
    const pattern = FF.patternFor(host);
    if (await browser.permissions.contains({ origins: [pattern] })) matches.push(pattern);
  }
  const registered = await browser.scripting.getRegisteredContentScripts({ ids: [ID] });
  if (registered.length) await browser.scripting.unregisterContentScripts({ ids: [ID] });
  if (!matches.length) return;
  await browser.scripting.registerContentScripts([{
    id: ID,
    matches,
    css: ["fonts.css"],
    js: ["lib.js", "apply.js"],
    runAt: "document_start",
    allFrames: true,
  }]);
}

// Runs syncs one after another so they never overlap.
let queue = Promise.resolve();
function schedule() {
  queue = queue.then(sync).catch((error) => console.error("firefonts:", error));
}

browser.runtime.onStartup.addListener(schedule);
browser.runtime.onInstalled.addListener(schedule);
browser.permissions.onAdded.addListener(schedule);
browser.permissions.onRemoved.addListener(schedule);
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.sites) schedule();
});
