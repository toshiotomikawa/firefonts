"use strict";
const $ = (id) => document.getElementById(id);
const on = $("on");
const font = $("font");
const note = $("note");
let tab;
let host;

// True when this computer can draw the font, judged by text width against generic fonts.
function available(name) {
  if (FF.BUNDLED.includes(name)) return true;
  const ctx = document.createElement("canvas").getContext("2d");
  const sample = "mmmmmmmmmmlli1WQ@#";
  return ["monospace", "serif", "sans-serif"].some((base) => {
    ctx.font = `72px ${base}`;
    const width = ctx.measureText(sample).width;
    ctx.font = `72px "${name}", ${base}`;
    return ctx.measureText(sample).width !== width;
  });
}

// Previews the typed font in the field and says when it is missing.
function check() {
  const name = FF.cleanName(font.value);
  font.style.fontFamily = name ? FF.cssFamily(name) : "";
  const ok = Boolean(name) && available(name);
  note.textContent = name && !ok ? "Not found on this computer" : "";
  return ok;
}

async function save(enabled) {
  const { sites = {} } = await browser.storage.sync.get("sites");
  if (enabled) sites[host] = FF.cleanName(font.value);
  else delete sites[host];
  await browser.storage.sync.set({ sites });
}

function block() {
  $("app").hidden = true;
  $("blocked").hidden = false;
}

// Applies the font to the open tab now; later visits use the registered script.
async function inject() {
  const target = { tabId: tab.id };
  await browser.scripting.insertCSS({ target, files: ["fonts.css"] });
  await browser.scripting.executeScript({ target, files: ["lib.js", "apply.js"] });
}

on.addEventListener("change", () => {
  if (!on.checked) {
    save(false);
    return;
  }
  if (!check()) {
    on.checked = false;
    font.focus();
    return;
  }
  // Firefox only shows the permission prompt during the click, so ask before any await.
  browser.permissions.request({ origins: [FF.patternFor(host)] }).then(async (granted) => {
    if (!granted) {
      on.checked = false;
      return;
    }
    await save(true);
    try {
      await inject();
    } catch {
      await save(false);
      block();
    }
  });
});

let timer;
font.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (check() && on.checked) save(true);
  }, 300);
});

async function init() {
  [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  try {
    const url = new URL(tab.url);
    if (url.protocol === "https:" || url.protocol === "http:") host = url.hostname;
  } catch {}
  if (!host) {
    block();
    return;
  }
  $("host").textContent = host.replace(/^www\./, "");
  const { sites = {} } = await browser.storage.sync.get("sites");
  if (sites[host]) {
    font.value = sites[host];
    on.checked = await browser.permissions.contains({ origins: [FF.patternFor(host)] });
  }
  check();
}

init();
