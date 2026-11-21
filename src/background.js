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

// Sites set to a font the extension no longer ships move to the bundled font that replaced it.
async function replaceDropped(items) {
  const files = FF.filesFrom(await browser.storage.local.get(null));
  const changed = FF.replacements(items, files);
  if (!Object.keys(changed).length) return items;
  await browser.storage.sync.set(changed);
  return { ...items, ...changed };
}

async function sync() {
  let items = (await browser.storage.sync.get(null)) || {};
  try {
    items = await replaceDropped(await migrate(items));
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
  const write = (script) =>
    registered.length
      ? browser.scripting.updateContentScripts([script])
      : browser.scripting.registerContentScripts([script]);
  try {
    await write({ ...SCRIPT, matches });
  } catch (error) {
    // A Firefox without the user origin or the frame fallback still gets the font, as a plain page stylesheet.
    const { cssOrigin, matchOriginAsFallback, ...basic } = SCRIPT;
    await write({ ...basic, matches });
    console.error("firefonts: registered without user origin", error);
  }
}

// Runs syncs one after another so they never overlap.
let queue = Promise.resolve();
function schedule() {
  queue = queue.then(sync).catch((error) => console.error("firefonts:", error));
}

browser.runtime.onStartup.addListener(schedule);
browser.runtime.onInstalled.addListener(schedule);
// The popup closes while Firefox asks for a site, so tabs already open on it get the font from here.
async function applyOpen(origins = []) {
  for (const origin of origins) {
    for (const tab of await browser.tabs.query({ url: origin })) {
      const every = async (run, details) => {
        try {
          await run({ ...details, target: { tabId: tab.id, allFrames: true } });
        } catch {
          await run({ ...details, target: { tabId: tab.id } });
        }
      };
      try {
        await every((d) => browser.scripting.insertCSS(d), { files: ["fonts.css"], origin: "USER" });
        await every((d) => browser.scripting.executeScript(d), { files: ["lib.js", "apply.js"] });
      } catch (error) {
        console.error("firefonts:", origin, error);
      }
    }
  }
}

browser.permissions.onAdded.addListener((added) => {
  schedule();
  applyOpen(added.origins).catch((error) => console.error("firefonts:", error));
});
browser.permissions.onRemoved.addListener(schedule);
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && Object.keys(changes).some((k) => k.startsWith(FF.PREFIX) || k === "sites")) schedule();
});
