"use strict";
const $ = (id) => document.getElementById(id);
const on = $("on");
const font = $("font");
const note = $("note");
let tab;
let host;
// True while the permission prompt is open, so typing can't save before the site is granted.
let asking = false;
// The font in use on this site, named when the typed one can't replace it.
let saved = "";
// The stylesheet goes into the tab once per popup; it does nothing while the font is off.
let styled = false;
// Fonts the user added as files.
const userFonts = [];
// With "Apply this font to all websites" on (the default), the font here is the one every listed site uses.
let allMode = true;

// True when this computer can draw the font, judged by text width against generic fonts.
function available(name) {
  if (FF.BUNDLED.includes(name) || FF.GENERIC.includes(name) || userFonts.includes(name)) return true;
  const ctx = document.createElement("canvas").getContext("2d");
  // Without a canvas there is no way to tell, so trust the name.
  if (!ctx) return true;
  const sample = "mmmmmmmmmmlli1WQ@#";
  return ["monospace", "serif", "sans-serif"].some((base) => {
    ctx.font = `72px ${base}`;
    const width = ctx.measureText(sample).width;
    ctx.font = `72px "${name}", ${base}`;
    return ctx.measureText(sample).width !== width;
  });
}

// Previews the typed font in the field and says what is wrong with it.
function check() {
  const name = FF.cleanName(font.value);
  font.style.fontFamily = FF.cssFamily(name);
  const ok = Boolean(name) && available(name);
  const problem = !name ? "Type a font name" : ok ? "" : "Not found on this computer";
  note.textContent = problem && on.checked && saved && saved !== name ? `${problem}. Still using ${saved}.` : problem;
  return ok;
}

// Saves run one after another, so a quick off and on can't land out of order.
let queue = Promise.resolve();
function save(enabled) {
  const key = FF.keyFor(host);
  const value = FF.cleanName(font.value);
  queue = queue.then(async () => {
    if (!enabled) await browser.storage.sync.remove(key);
    else if (allMode) await browser.storage.sync.set(FF.everywhere(await browser.storage.sync.get(null), value, [host]));
    else await browser.storage.sync.set({ [key]: value });
    saved = enabled ? value : "";
  });
  return queue.catch((error) => {
    queue = Promise.resolve();
    throw error;
  });
}

function block() {
  $("app").hidden = true;
  $("blocked").hidden = false;
}

// Runs an injection in every frame, or in the page alone when a frame refuses it; only the page must succeed.
async function everyFrame(run, details) {
  try {
    await run({ ...details, target: { tabId: tab.id, allFrames: true } });
  } catch {
    await run({ ...details, target: { tabId: tab.id } });
  }
}

// Applies the font to the open tab now; later visits use the registered script.
async function inject() {
  if (!styled) {
    await everyFrame((d) => browser.scripting.insertCSS(d), { files: ["fonts.css"], origin: "USER" });
    styled = true;
  }
  await everyFrame((d) => browser.scripting.executeScript(d), { files: ["lib.js", "apply.js"] });
}

async function turnOn() {
  await save(true);
  try {
    await inject();
  } catch {
    await save(false);
    block();
  }
}

on.addEventListener("change", () => {
  if (!on.checked) {
    save(false).catch(() => {});
    check();
    return;
  }
  if (!check()) {
    on.checked = false;
    font.focus();
    return;
  }
  // Firefox only shows the permission prompt during the click, so ask before any await.
  let request;
  try {
    request = browser.permissions.request({ origins: [FF.patternFor(host)] });
  } catch {
    request = Promise.reject();
  }
  asking = true;
  // Firefox closes the popup while its prompt is open, so the font is saved now; the background script
  // applies it to the open tab once the site is allowed. Without the site's permission it stays unused.
  const saving = save(true);
  Promise.all([request, saving])
    .then(async ([granted]) => {
      asking = false;
      // Refused, or turned off or cleared while the prompt was open.
      if (!granted || !on.checked || !check()) {
        on.checked = false;
        await save(false);
        return;
      }
      await turnOn();
    })
    .catch(() => {
      asking = false;
      on.checked = false;
      note.textContent = "Couldn't save the font";
    });
});

let timer;
font.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (check() && on.checked && !asking) {
      save(true).catch(() => {
        note.textContent = "Couldn't save the font";
      });
    }
  }, 300);
});

async function init() {
  // Fonts the user added are loaded here too, so the field can preview them and knows they exist.
  const files = FF.filesFrom(await browser.storage.local.get(null));
  for (const [name, data] of Object.entries(files)) {
    try {
      const face = new FontFace(name, data);
      await face.load();
      document.fonts.add(face);
      userFonts.push(name);
    } catch {}
  }
  // The user's own fonts and the ones that ship with the extension are offered as suggestions.
  const names = [...new Set([...userFonts, ...FF.BUNDLED])].sort((a, b) => a.localeCompare(b));
  $("bundled").append(...names.map((name) => new Option(name)));
  [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  try {
    const url = new URL(tab?.url);
    if (url.protocol === "https:" || url.protocol === "http:") host = url.hostname;
  } catch {}
  if (!FF.validHost(host) || FF.RESTRICTED.includes(host)) {
    block();
    return;
  }
  $("host").textContent = host.replace(/^www\./, "");
  const items = (await browser.storage.sync.get(null)) || {};
  allMode = FF.allSites(items);
  saved = FF.cleanName(items[FF.keyFor(host)]);
  font.value = saved || FF.cleanName(items[FF.CHOSEN]) || FF.DEFAULT;
  if (saved) {
    try {
      on.checked = await browser.permissions.contains({ origins: [FF.patternFor(host)] });
    } catch {}
  }
  check();
  on.disabled = false;
}

// A file picker would close the popup, so fonts are added on their own page.
$("manage").addEventListener("click", () => {
  browser.runtime.openOptionsPage();
  window.close();
});

init();
