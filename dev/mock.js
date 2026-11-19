// Stand-in for the parts of the extension API the pages use, so they run as plain web pages.
// Storage lives in IndexedDB, so added fonts survive the live reloads.
"use strict";
(() => {
  const open = new Promise((resolve, reject) => {
    const req = indexedDB.open("firefonts-preview", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("local");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  async function run(mode, work) {
    const store = (await open).transaction("local", mode).objectStore("local");
    return new Promise((resolve, reject) => {
      const req = work(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function all() {
    const [keys, values] = await Promise.all([run("readonly", (s) => s.getAllKeys()), run("readonly", (s) => s.getAll())]);
    return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  }
  const keyList = (keys) => (keys == null ? null : [].concat(typeof keys === "object" && !Array.isArray(keys) ? Object.keys(keys) : keys));

  const local = {
    async get(keys) {
      const items = await all();
      const wanted = keyList(keys);
      return wanted ? Object.fromEntries(wanted.filter((key) => key in items).map((key) => [key, items[key]])) : items;
    },
    async set(items) {
      for (const [key, value] of Object.entries(items)) await run("readwrite", (s) => s.put(value, key));
    },
    async remove(keys) {
      for (const key of keyList(keys)) await run("readwrite", (s) => s.delete(key));
    },
  };
  const listeners = { addListener() {}, removeListener() {} };
  window.browser = {
    storage: { local, sync: local, onChanged: listeners },
    runtime: { openOptionsPage: async () => { location.href = "/fonts.html"; } },
    tabs: { query: async () => [{ id: 1, url: "https://example.com/" }] },
    permissions: { contains: async () => true, request: async () => true, onAdded: listeners, onRemoved: listeners },
  };

  // Live reload from dev/preview.mjs.
  new EventSource("/__dev/events").onmessage = ({ data }) => {
    if (data !== "css") return location.reload();
    for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
      const url = new URL(link.href);
      url.searchParams.set("v", Date.now());
      link.href = url;
    }
  };
})();
