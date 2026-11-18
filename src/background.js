"use strict";
// Keeps one registered content script that covers every chosen site the user granted.
const ID = "firefonts";
// The user origin lets the font win over a site's own !important rules; frames without an origin of their
// own (about:blank, srcdoc) get it from the page that holds them.
const SCRIPT = {
  id: ID,
  css: ["fonts.css"],
  cssOrigin: "user",
  js: ["lib.js", "apply.js"],
  runAt: "document_start",
  allFrames: true,
  matchOriginAsFallback: true,
};

// Earlier builds kept every site in one "sites" setting; move each to its own key.
async function migrate(items) {
  const old = items.sites;
  if (old === undefined) return items;
  const moved = {};
  if (old && typeof old === "object" && !Array.isArray(old)) {
    for (const [host, value] of Object.entries(old)) {
      const font = FF.cleanName(value);
      const key = FF.keyFor(host);
      if (FF.validHost(host) && font && !Object.hasOwn(items, key)) moved[key] = font;
    }
  }
  await browser.storage.sync.set(moved);
  await browser.storage.sync.remove("sites");
  return { ...items, ...moved };
}

async function sync() {
  let items = (await browser.storage.sync.get(null)) || {};
  try {
    items = await migrate(items);
  } catch (error) {
    console.error("firefonts: could not move old settings", error);
  }
  const matches = [];
  for (const host of Object.keys(FF.sitesFrom(items))) {
    const pattern = FF.patternFor(host);
    try {
      if (await browser.permissions.contains({ origins: [pattern] })) matches.push(pattern);
    } catch (error) {
      console.error("firefonts:", host, error);
    }
  }
  const registered = await browser.scripting.getRegisteredContentScripts({ ids: [ID] });
  if (!matches.length) {
    if (registered.length) await browser.scripting.unregisterContentScripts({ ids: [ID] });
    return;
  }
  // Updating in place leaves no moment without the script, and keeps the old one if the update fails.
  if (registered.length) await browser.scripting.updateContentScripts([{ ...SCRIPT, matches }]);
  else await browser.scripting.registerContentScripts([{ ...SCRIPT, matches }]);
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
  if (area === "sync" && Object.keys(changes).some((k) => k.startsWith(FF.PREFIX) || k === "sites")) schedule();
});
