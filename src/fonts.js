"use strict";
// Adds font files the user picks to the extension, so any site can use them by name, and removes them.
const note = document.getElementById("note");

// Loads a stored font into this page so its name can be drawn in it; false when the file isn't a font.
async function use(name, data) {
  try {
    const face = new FontFace(name, data);
    await face.load();
    document.fonts.add(face);
    return true;
  } catch {
    return false;
  }
}

// The font every listed website uses, and the one a new website starts with.
const chosenFont = async () => FF.cleanName((await browser.storage.sync.get(FF.CHOSEN))[FF.CHOSEN]) || FF.DEFAULT;

// Whether the chosen font goes to every website (the default), or each website keeps its own.
const allToggle = document.getElementById("all");

async function choose(name) {
  const items = await browser.storage.sync.get(null);
  await browser.storage.sync.set(allToggle.checked ? FF.everywhere(items, name) : { [FF.CHOSEN]: name });
}

allToggle.addEventListener("change", async () => {
  await browser.storage.sync.set({ [FF.ALL]: allToggle.checked });
  if (allToggle.checked) await browser.storage.sync.set(FF.everywhere(await browser.storage.sync.get(null), await chosenFont()));
  showSites();
});

// Every font the user can pick: their own and the bundled ones, A to Z.
let fontNames = [...FF.BUNDLED];

// The font list opens over the page, from the chosen font (section 1) or a website's font (section 3), with the
// current font right where the button was. Focus stays on the button: the arrow keys, Home, End, Page Up and
// Page Down move through the list, typing jumps to a font, Enter, Space or Tab picks, Escape closes it unchanged,
// and Delete removes a font the user added.
const list = document.getElementById("fontlist");
const ROWS = 8;
// The open list: the button it came from, the font it showed, what picking does and which fonts can be removed.
let open = null;
let active = -1;
const rows = () => [...list.children];

function setActive(index) {
  const all = rows();
  active = Math.max(0, Math.min(all.length - 1, index));
  all.forEach((row, i) => row.classList.toggle("active", i === active));
  const row = all[active];
  open.trigger.setAttribute("aria-activedescendant", row.id);
  if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
  else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
}

function fill() {
  list.replaceChildren(
    ...fontNames.map((name, i) => {
      const row = document.createElement("li");
      row.id = `font-${i}`;
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", String(name === open.current));
      row.dataset.name = name;
      const text = document.createElement("span");
      text.textContent = name;
      text.style.fontFamily = FF.cssFamily(name);
      row.append(text);
      if (open.removable.includes(name)) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "field-action";
        remove.tabIndex = -1;
        remove.title = `Remove ${name}`;
        remove.setAttribute("aria-hidden", "true");
        row.setAttribute("aria-description", "Press Delete to remove");
        remove.append(rowTemplate.content.querySelector(".field-action svg").cloneNode(true));
        row.append(remove);
      }
      return row;
    }),
  );
}

function openList(trigger, label, current, pick, removable = []) {
  closeList();
  open = { trigger, current, pick, removable };
  fill();
  list.setAttribute("aria-label", label);
  list.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  // The current font lands over the button, with as many fonts above and below it as the list and the window allow.
  const all = rows();
  const index = Math.max(0, fontNames.indexOf(current));
  const height = all[0].offsetHeight;
  const shown = Math.min(ROWS, all.length);
  const box = trigger.getBoundingClientRect();
  const above = Math.floor((box.top - 8) / height);
  const below = Math.floor((innerHeight - 8 - box.bottom) / height);
  let at = Math.max(Math.floor((shown - 1) / 2), shown - 1 - below);
  at = Math.max(0, Math.min(at, above, index));
  const first = Math.max(0, Math.min(index - at, all.length - shown));
  at = index - first;
  const page = list.offsetParent.getBoundingClientRect();
  list.style.left = `${box.left - page.left}px`;
  list.style.width = `${box.width}px`;
  list.style.top = `${box.top - page.top - at * height - list.clientTop}px`;
  list.scrollTop = first * height;
  setActive(index);
}

function closeList(chosen) {
  if (!open) return;
  const { trigger, current, pick } = open;
  open = null;
  list.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
  trigger.removeAttribute("aria-activedescendant");
  if (chosen && chosen !== current) pick(chosen);
}

// Removes a font the user added; the chosen font and any website that used it go back to the default.
async function removeFont(name) {
  await browser.storage.local.remove(FF.fileKey(name));
  const items = await browser.storage.sync.get(null);
  const users = Object.keys(items).filter((key) => (key === FF.CHOSEN || key.startsWith(FF.PREFIX)) && FF.cleanName(items[key]) === name);
  if (users.length) await browser.storage.sync.set(Object.fromEntries(users.map((key) => [key, FF.DEFAULT])));
  showSites();
  await show();
  if (!open) return;
  open.removable = open.removable.filter((own) => own !== name);
  if (open.current === name) open.current = FF.DEFAULT;
  fill();
  setActive(Math.min(active, fontNames.length - 1));
}

// Typing a few letters quickly jumps to the next font whose name starts with them.
let typed = "";
let typedAt = 0;
function typeahead(key) {
  const now = Date.now();
  typed = now - typedAt < 600 ? typed + key.toLowerCase() : key.toLowerCase();
  typedAt = now;
  const start = typed.length === 1 ? active + 1 : active;
  for (let step = 0; step < fontNames.length; step++) {
    const i = (start + step) % fontNames.length;
    if (fontNames[i].toLowerCase().startsWith(typed)) return setActive(i);
  }
}

// Makes a button open the list. `details` gives the list's label, the font shown, what picking does and which
// fonts can be removed, read each time the list opens.
function listFrom(trigger, details) {
  // Enter and Space are handled on key down, so the click the browser sends after them is ignored.
  let keyed = 0;
  const openIt = () => {
    const { label, current, pick, removable } = details();
    openList(trigger, label, current, pick, removable);
  };
  trigger.addEventListener("click", (event) => {
    if (event.detail === 0 && Date.now() - keyed < 500) return;
    if (open?.trigger === trigger) closeList();
    else openIt();
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") keyed = Date.now();
    if (open?.trigger !== trigger) {
      if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
      event.preventDefault();
      return openIt();
    }
    const name = fontNames[active];
    const typing = typed && Date.now() - typedAt < 600;
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && (event.key !== " " || typing)) typeahead(event.key);
    else if (event.key === "ArrowDown") setActive(active + 1);
    else if (event.key === "ArrowUp") event.altKey ? closeList(name) : setActive(active - 1);
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(fontNames.length - 1);
    else if (event.key === "PageDown") setActive(active + ROWS - 1);
    else if (event.key === "PageUp") setActive(active - ROWS + 1);
    else if (event.key === "Enter" || event.key === " ") closeList(name);
    else if (event.key === "Escape") closeList();
    else if (event.key === "Tab") return closeList(name);
    else if (event.key === "Delete" && open.removable.includes(name)) removeFont(name);
    else return;
    event.preventDefault();
  });
}

// The pointer shades the font it is over; a click picks it, or removes it with its cross.
list.addEventListener("pointermove", (event) => {
  const row = event.target.closest("[role=option]");
  if (!row || row.classList.contains("active")) return;
  const top = list.scrollTop;
  setActive(rows().indexOf(row));
  list.scrollTop = top;
});
list.addEventListener("click", (event) => {
  const row = event.target.closest("[role=option]");
  if (!row) return;
  if (event.target.closest(".field-action")) removeFont(row.dataset.name);
  else closeList(row.dataset.name);
});
// Clicking the list keeps focus on its button; clicking anywhere else, or resizing the window, closes it.
list.addEventListener("focus", () => open?.trigger.focus({ preventScroll: true }));
document.addEventListener("pointerdown", (event) => {
  if (open && !list.contains(event.target) && !open.trigger.contains(event.target)) closeList();
});
addEventListener("resize", () => closeList());

// Shows a font on its button, drawn in itself.
function showOn(button, name) {
  const text = button.querySelector("span");
  text.textContent = name;
  text.style.fontFamily = FF.cssFamily(name);
}

// The preview sentence, drawn in the chosen font; the user's own sentence is kept for next time.
const sample = document.getElementById("sample");
const SAMPLE = "sample";
const showSample = (name) => (sample.style.fontFamily = FF.cssFamily(name));
browser.storage.local.get(SAMPLE).then((items) => {
  if (typeof items[SAMPLE] === "string") sample.value = items[SAMPLE];
});
sample.addEventListener("input", () => browser.storage.local.set({ [SAMPLE]: sample.value }));

// Section 1 shows only the chosen font, drawn in itself; a click opens the list.
const chooser = document.getElementById("chooser");
let ownFonts = [];

function showChosen(name) {
  showOn(chooser, name);
  showSample(name);
}

listFrom(chooser, () => ({
  label: "Choose your font",
  current: chooser.querySelector("span").textContent,
  pick: async (name) => {
    showChosen(name);
    await choose(name);
    showSites();
  },
  removable: ownFonts,
}));

// Loads the user's own fonts and lists them with the bundled ones, A to Z.
async function show() {
  const files = FF.filesFrom(await browser.storage.local.get(null));
  ownFonts = Object.keys(files);
  for (const name of ownFonts) await use(name, files[name]);
  fontNames = [...new Set([...ownFonts, ...FF.BUNDLED])].sort((a, b) => a.localeCompare(b));
  showChosen(await chosenFont());
}

document.getElementById("add").addEventListener("click", () => document.getElementById("files").click());

document.getElementById("files").addEventListener("change", async (event) => {
  const failed = [];
  for (const file of event.target.files) {
    const name = FF.cleanName(file.name.replace(/\.(ttf|otf|woff2?)$/i, ""));
    const data = await file.arrayBuffer();
    if (!name || !(await use(name, data))) {
      failed.push(file.name);
      continue;
    }
    try {
      await browser.storage.local.set({ [FF.fileKey(name)]: data });
    } catch {
      failed.push(file.name);
    }
  }
  event.target.value = "";
  note.textContent = failed.length ? `Couldn't add ${failed.join(", ")}` : "";
  show();
});

show();

// Websites: each added site gets the default font, and Firefox asks for access to that site only.
const siteField = document.getElementById("site");
const sites = document.getElementById("sites");
const rowTemplate = document.getElementById("site-row");

// Accepts "example.com" as well as a pasted address like "https://www.example.com/page".
function hostFrom(text) {
  const value = text.trim().toLowerCase();
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname;
  } catch {
    return "";
  }
}

// The site's favicon address, found once and kept in storage.local. Not finding one is not kept, so a site
// that was offline gets another look next time.
// Reads the icon the home page declares, or falls back to /favicon.ico, and keeps it only if it loads.
const loads = (url) =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth > 0);
    image.onerror = () => resolve(false);
    image.src = url;
  });

async function faviconFor(host) {
  const key = `icon:${host}`;
  const saved = (await browser.storage.local.get(key))[key];
  if (saved) return saved;
  const candidates = [];
  try {
    const response = await fetch(`https://${host}/`, { credentials: "omit" });
    const page = new DOMParser().parseFromString(await response.text(), "text/html");
    for (const link of page.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')) {
      const href = link.getAttribute("href");
      if (!href || !URL.canParse(href, response.url)) continue;
      const url = new URL(href, response.url);
      // Only icons on public https addresses: never plain http, an IP address or a local name.
      if (url.protocol === "https:" && FF.validHost(url.hostname) && url.hostname.includes(".") && !/^[\d.]+$/.test(url.hostname)) candidates.push(url.href);
    }
  } catch {}
  candidates.push(`https://${host}/favicon.ico`);
  for (const url of candidates) {
    if (await loads(url)) {
      await browser.storage.local.set({ [key]: url });
      return url;
    }
  }
  return "";
}

// Whether an icon is all one dark or one light shade, like GitHub's black mark, so the page can flip it when it
// would vanish against the theme. Read from the icon's own pixels: "" when it has colour, null when it can't be read.
async function toneOf(url) {
  try {
    const blob = await (await fetch(url, { credentials: "omit" })).blob();
    const image = new Image();
    image.src = URL.createObjectURL(blob);
    await image.decode();
    const canvas = new OffscreenCanvas(32, 32);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, 32, 32);
    URL.revokeObjectURL(image.src);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    let count = 0;
    let light = 0;
    let colour = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 128) continue;
      const [red, green, blue] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      count++;
      light += (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
      colour += (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;
    }
    if (!count || colour / count > 0.15) return "";
    const average = light / count;
    return average < 0.3 ? "dark" : average > 0.8 ? "light" : "";
  } catch {
    return null;
  }
}

async function toneFor(host, url) {
  const key = `tone:${host}`;
  const saved = (await browser.storage.local.get(key))[key];
  if (saved !== undefined) return saved;
  const tone = await toneOf(url);
  if (tone !== null) await browser.storage.local.set({ [key]: tone });
  return tone;
}

async function showIcon(row, host) {
  const url = await faviconFor(host);
  if (!url) return;
  const image = row.querySelector("img");
  toneFor(host, url).then((tone) => tone && (image.dataset.tone = tone));
  // A kept icon that stops loading is forgotten, and the globe stays.
  image.onerror = () => browser.storage.local.remove([`icon:${host}`, `tone:${host}`]);
  image.onload = () => {
    image.hidden = false;
    row.querySelector(".globe").toggleAttribute("hidden", true);
  };
  image.src = url;
}

// The order the user dragged the sites into. Sites missing from it (added on another device) follow, A to Z.
const ORDER = "sites-order";

function ordered(hosts, order) {
  const known = (Array.isArray(order) ? order : []).filter((host) => hosts.includes(host));
  return [...known, ...hosts.filter((host) => !known.includes(host)).sort()];
}

// The order is one setting, so past a few hundred sites it can outgrow sync's 8 KB per setting; the sites are
// kept regardless, and those beyond the saved order follow A to Z.
const saveOrder = (order = [...sites.children].map((row) => row.dataset.host)) =>
  browser.storage.sync.set({ [ORDER]: order }).catch((error) => console.error("firefonts: order not saved", error));

// Asks Firefox for a site; false when it is refused, or asked outside a click or key press.
async function allow(host) {
  try {
    return await browser.permissions.request({ origins: [FF.patternFor(host)] });
  } catch {
    return false;
  }
}

// Draws the websites list; `focus` names the site whose box takes the focus afterwards.
async function showSites(focus) {
  const items = await browser.storage.sync.get(null);
  const fontsBySite = FF.sitesFrom(items);
  allToggle.checked = FF.allSites(items);
  sites.classList.toggle("each", !allToggle.checked);
  sites.replaceChildren(
    ...ordered(Object.keys(fontsBySite), items[ORDER])
      .map((host) => {
        const row = rowTemplate.content.firstElementChild.cloneNode(true);
        row.dataset.host = host;
        const pick = row.querySelector(".font-pick");
        showOn(pick, fontsBySite[host]);
        pick.setAttribute("aria-label", `Font for ${host}`);
        listFrom(pick, () => ({
          label: `Font for ${host}`,
          current: pick.querySelector("span").textContent,
          pick: (name) => {
            showOn(pick, name);
            browser.storage.sync.set({ [FF.keyFor(host)]: name });
          },
        }));
        const handle = row.querySelector(".handle");
        handle.setAttribute("aria-label", `Move ${host}`);
        handle.title = `Move ${host}`;
        handle.addEventListener("pointerdown", (event) => drag(event, row));
        handle.addEventListener("keydown", (event) => moveByKey(event, row));
        editable(row.querySelector("input"), host);
        // A site added on another device, or taken back in Firefox's settings, waits for Firefox's permission,
        // and isn't contacted for its icon until then.
        const allowButton = row.querySelector(".allow");
        allowButton.setAttribute("aria-label", `Allow ${host}`);
        browser.permissions.contains({ origins: [FF.patternFor(host)] }).then((granted) => {
          allowButton.hidden = granted;
          row.classList.toggle("waiting", !granted);
          if (granted) showIcon(row, host);
        });
        allowButton.addEventListener("click", async () => {
          if (await allow(host)) showSites(host);
        });
        const remove = row.querySelector(".field-action");
        remove.setAttribute("aria-label", `Remove ${host}`);
        remove.title = `Remove ${host}`;
        remove.addEventListener("click", async () => {
          await browser.storage.sync.remove(FF.keyFor(host));
          await browser.storage.local.remove([`icon:${host}`, `tone:${host}`]);
          const next = row.nextElementSibling || row.previousElementSibling;
          row.remove();
          (next ? next.querySelector("input") : siteField).focus();
          await saveOrder();
        });
        return row;
      }),
  );
  if (focus) sites.querySelector(`[data-host="${CSS.escape(focus)}"] input`)?.focus();
}

// A website's box: shown short ("youtube.com"), and the full address while focused, with the caret kept where it
// was clicked. Editing it and pressing Enter (or leaving the box) changes the site; Escape puts it back. Firefox
// asks for a new site only on a key press or click, so leaving the box for a site it hasn't allowed keeps the
// typed address in the box, marked, until Enter asks for it.
function editable(field, host) {
  const full = `https://${host}`;
  const short = host.replace(/^www\./, "");
  const hidden = full.length - short.length;
  field.value = short;
  field.setAttribute("aria-label", host);
  let done = false;
  // An address typed for a site Firefox hasn't allowed yet, shown until Enter asks for it or Escape drops it.
  let draft = null;
  // Where in the short text a click landed, read before the text grows, and put back once the click is over.
  let clicked = null;
  field.addEventListener("pointerdown", (event) => {
    if (document.activeElement === field) return;
    clicked = document.caretPositionFromPoint?.(event.clientX, event.clientY)?.offset ?? null;
  });
  field.addEventListener("focus", () => {
    done = false;
    field.value = draft ?? full;
    if (clicked === null || draft !== null) return field.setSelectionRange(field.value.length, field.value.length);
    const at = Math.min(clicked, short.length) + hidden;
    clicked = null;
    field.addEventListener("pointerup", () => field.setSelectionRange(at, at), { once: true });
    field.setSelectionRange(at, at);
  });
  const finish = async (asking) => {
    if (done) return;
    done = true;
    const typed = field.value;
    const result = typed.trim() !== full && (await renameSite(host, typed, asking));
    draft = result === "ask" || result === "invalid" ? typed : null;
    if (draft !== null) {
      field.value = draft;
      field.setAttribute("aria-invalid", "true");
      field.title = result === "ask" ? "Press Enter to allow this site" : "Not a website address, or already listed";
    } else if (!result) {
      field.value = document.activeElement === field ? full : short;
      field.removeAttribute("aria-invalid");
      field.removeAttribute("title");
    }
  };
  field.addEventListener("keydown", (event) => {
    // Enter that ends a word being composed (Chinese, Japanese, Korean input) isn't a submit.
    if (event.key === "Enter" && !event.isComposing) {
      done = false;
      finish(true).then(() => draft === null && field.blur());
    }
    if (event.key === "Escape") {
      draft = null;
      field.removeAttribute("aria-invalid");
      field.removeAttribute("title");
      field.value = full;
      field.blur();
    }
  });
  field.addEventListener("blur", async () => {
    await finish(false);
    if (document.activeElement !== field && draft === null) field.value = short;
  });
  field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
}

// Moves a site's font to a new address, in the same place in the list. False when the address isn't usable, and
// "invalid" when it names no usable or new site, "ask" when Firefox must be asked for it but `asking` is false (not from a key press or click).
async function renameSite(host, text, asking) {
  const next = hostFrom(text);
  const taken = [...sites.children].some((row) => row.dataset.host === next);
  if (!FF.validHost(next) || taken) return next === host ? false : "invalid";
  if (!asking && !(await browser.permissions.contains({ origins: [FF.patternFor(next)] }))) return "ask";
  if (asking && !(await allow(next))) return false;
  const key = FF.keyFor(host);
  const font = (await browser.storage.sync.get(key))[key] || (await chosenFont());
  const order = [...sites.children].map((row) => (row.dataset.host === host ? next : row.dataset.host));
  await browser.storage.sync.set({ [FF.keyFor(next)]: font });
  await browser.storage.sync.remove(key);
  await saveOrder(order);
  await browser.storage.local.remove([`icon:${host}`, `tone:${host}`]);
  await showSites(next);
  return true;
}

async function addSite() {
  const host = hostFrom(siteField.value);
  const valid = FF.validHost(host);
  siteField.setAttribute("aria-invalid", String(!valid));
  if (!valid) return;
  // Asked straight from the click or key press, as Firefox requires.
  if (!(await allow(host))) return;
  const order = [...sites.children].map((row) => row.dataset.host).filter((known) => known !== host);
  await browser.storage.sync.set({ [FF.keyFor(host)]: await chosenFont() });
  await saveOrder([...order, host]);
  siteField.value = "";
  siteField.removeAttribute("aria-invalid");
  showSites();
  siteField.focus();
}

document.getElementById("add-site").addEventListener("click", addSite);
siteField.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.isComposing) addSite();
});
siteField.addEventListener("input", () => siteField.removeAttribute("aria-invalid"));

showSites();

// Changes made in the popup or on another device show when the page is looked at again.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || open) return;
  show();
  showSites();
});

// Moving rows. Every row that changes place slides there from where it was.
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function slide(rows, change) {
  const before = new Map(rows.map((row) => [row, row.getBoundingClientRect().top]));
  change();
  if (still()) return;
  for (const [row, top] of before) {
    const shift = top - row.getBoundingClientRect().top;
    if (shift) row.animate([{ transform: `translateY(${shift}px)` }, { transform: "none" }], { duration: 150, easing: "ease" });
  }
}

// Dragging by the handle: the row follows the pointer, a line shows where it will land, and the order
// changes only when it is dropped.
function drag(event, row) {
  if (event.button !== 0) return;
  event.preventDefault();
  const handle = event.currentTarget;
  handle.setPointerCapture(event.pointerId);
  handle.focus();
  row.classList.add("dragging");
  const startY = event.clientY;
  const middle = (el) => el.offsetTop + el.offsetHeight / 2;
  let target = row.nextElementSibling;

  const mark = () => {
    for (const el of sites.children) el.classList.remove("drop-before", "drop-after");
    if (target === row.nextElementSibling) return;
    if (target) target.classList.add("drop-before");
    else sites.lastElementChild.classList.add("drop-after");
  };
  const move = (e) => {
    row.style.translate = `0 ${e.clientY - startY}px`;
    const rowMiddle = middle(row) + e.clientY - startY;
    target = [...sites.children].find((el) => el !== row && middle(el) > rowMiddle) ?? null;
    mark();
  };
  const end = () => {
    handle.removeEventListener("pointermove", move);
    for (const el of sites.children) el.classList.remove("drop-before", "drop-after");
    row.classList.remove("dragging");
    const moved = target !== row.nextElementSibling;
    slide([...sites.children], () => {
      row.style.translate = "";
      if (moved) sites.insertBefore(row, target);
    });
    if (moved) saveOrder();
  };
  handle.addEventListener("pointermove", move);
  handle.addEventListener("lostpointercapture", end, { once: true });
}

// The arrow keys move a row up or down by one place, for anyone not using a pointer.
function moveByKey(event, row) {
  const target = event.key === "ArrowUp" ? row.previousElementSibling : event.key === "ArrowDown" ? row.nextElementSibling?.nextElementSibling ?? null : undefined;
  if (target === undefined || (event.key === "ArrowUp" && !target) || (event.key === "ArrowDown" && !row.nextElementSibling)) return;
  event.preventDefault();
  slide([...sites.children], () => sites.insertBefore(row, target));
  row.querySelector(".handle").focus();
  saveOrder();
}
