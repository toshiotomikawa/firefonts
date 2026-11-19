"use strict";
// Adds font files the user picks to the extension, so any site can use them by name, and removes them.
const list = document.getElementById("list");
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

async function show() {
  const fonts = FF.filesFrom(await browser.storage.local.get(null));
  list.replaceChildren();
  for (const [name, data] of Object.entries(fonts).sort(([a], [b]) => a.localeCompare(b))) {
    await use(name, data);
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = name;
    label.style.fontFamily = FF.cssFamily(name);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${name}`);
    remove.addEventListener("click", async () => {
      await browser.storage.local.remove(FF.fileKey(name));
      show();
    });
    item.append(label, remove);
    list.append(item);
  }
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
