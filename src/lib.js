"use strict";
// Pure helpers shared by the popup, the page script, the background script and the tests.
(function (root) {
  // Fonts shipped with the extension, always available, A to Z.
  const BUNDLED = [
    "Atkinson Hyperlegible Next",
    "Bebas Neue",
    "Caveat",
    "Comic Neue",
    "DM Sans",
    "EB Garamond",
    "Figtree",
    "Fira Code",
    "Google Sans",
    "IBM Plex Mono",
    "Inter",
    "JetBrains Mono",
    "Lato",
    "Lexend",
    "Libre Baskerville",
    "Literata",
    "Lora",
    "Merriweather",
    "Montserrat",
    "Nunito",
    "Open Sans",
    "Oswald",
    "Pacifico",
    "Playfair Display",
    "Poppins",
    "Raleway",
    "Roboto",
    "Roboto Slab",
    "Source Code Pro",
    "Source Sans 3",
    "Source Serif 4",
    "Work Sans",
  ];
  // The font a new site starts with until the user chooses one.
  const DEFAULT = "Google Sans";
  // Fonts earlier versions bundled, and the bundled font that now takes each one's place.
  const REPLACED = { "dancing script": "Caveat", "roboto mono": "JetBrains Mono" };
  // CSS generic families: always available, and written without quotes.
  const GENERIC = [
    "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "math", "emoji", "fangsong",
    "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded",
  ];
  // Mozilla sites Firefox never lets extensions change (extensions.webextensions.restrictedDomains).
  const RESTRICTED = [
    "accounts-static.cdn.mozilla.net", "accounts.firefox.com", "addons.cdn.mozilla.net", "addons.mozilla.org",
    "api.accounts.firefox.com", "content.cdn.mozilla.net", "discovery.addons.mozilla.org",
    "oauth.accounts.firefox.com", "profile.accounts.firefox.com", "support.mozilla.org", "sync.services.mozilla.com",
  ];
  // Each site's font is stored under its own key, so the list can grow past one setting's size limit.
  const PREFIX = "site:";

  // Trims a typed font name and drops characters a family name never needs.
  function cleanName(text) {
    if (text == null || typeof text === "object") return "";
    const name = String(text)
      .replace(/[\t\n\v\f\r]+/g, " ")
      .replace(/[\p{C}"\\;{}<>]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
    const known = [...BUNDLED, ...GENERIC].find((b) => b.toLowerCase() === name.toLowerCase());
    return known || name;
  }

  // CSS font-family value for a name, with a safe fallback; "" when nothing usable is left.
  function cssFamily(name) {
    const clean = cleanName(name);
    if (!clean) return "";
    return GENERIC.includes(clean) ? clean : `"${clean}", sans-serif`;
  }

  // Hostnames a match pattern can name: letters, digits, dots and hyphens.
  function validHost(host) {
    return typeof host === "string" && /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i.test(host);
  }

  // Match pattern and permission origin for one site, or null for a host no pattern can name.
  function patternFor(host) {
    return validHost(host) ? `*://${host}/*` : null;
  }

  const keyFor = (host) => PREFIX + host;
  // Font files the user added are kept in local storage, each under its own key.
  const FILE = "file:";
  const fileKey = (name) => FILE + name;

  // Works across Firefox's script compartments, where instanceof doesn't.
  const isBuffer = (value) => Object.prototype.toString.call(value) === "[object ArrayBuffer]";

  // Reads {name: font data} from local storage, skipping anything malformed.
  function filesFrom(items) {
    const files = {};
    if (!items || typeof items !== "object") return files;
    for (const [key, value] of Object.entries(items)) {
      const name = key.startsWith(FILE) ? cleanName(key.slice(FILE.length)) : "";
      if (name && isBuffer(value)) files[name] = value;
    }
    return files;
  }

  // Reads {host: font} from everything in storage, skipping anything malformed.
  function sitesFrom(items) {
    const sites = {};
    if (!items || typeof items !== "object") return sites;
    for (const [key, value] of Object.entries(items)) {
      if (!key.startsWith(PREFIX)) continue;
      const host = key.slice(PREFIX.length);
      const font = cleanName(value);
      if (validHost(host) && font) sites[host] = font;
    }
    return sites;
  }

  // The font the user chose, and whether it goes to every listed site (the default) or each site keeps its own.
  const CHOSEN = "font";
  const ALL = "all-sites";
  const allSites = (items) => items?.[ALL] !== false;

  // The settings that give the chosen font to every listed site, plus any hosts about to be added.
  function everywhere(items, name, more = []) {
    const hosts = [...Object.keys(sitesFrom(items)), ...more];
    return { [CHOSEN]: name, ...Object.fromEntries(hosts.map((host) => [keyFor(host), name])) };
  }

  // The settings that move the chosen font and every site off a font that is no longer bundled, unless the user
  // added a file of that name.
  function replacements(items, files = {}) {
    const own = Object.keys(files).map((name) => name.toLowerCase());
    const changed = {};
    for (const [key, value] of Object.entries(items || {})) {
      if (key !== CHOSEN && !key.startsWith(PREFIX)) continue;
      const font = cleanName(value).toLowerCase();
      if (Object.hasOwn(REPLACED, font) && !own.includes(font)) changed[key] = REPLACED[font];
    }
    return changed;
  }

  // The settings that keep "one font for all sites" true. Coming from a version without it, sites that all share
  // one font make it the chosen font, and sites with different fonts keep them (all sites off). Otherwise, with all
  // sites on, any site that differs (added on another device, say) takes the chosen font.
  function settle(items) {
    const sites = sitesFrom(items);
    const fonts = [...new Set(Object.values(sites))];
    if (items[ALL] === undefined && items[CHOSEN] === undefined) {
      if (fonts.length === 1) return { [CHOSEN]: fonts[0] };
      return fonts.length ? { [ALL]: false } : {};
    }
    const chosen = cleanName(items[CHOSEN]);
    if (!allSites(items) || !chosen) return {};
    return Object.fromEntries(Object.keys(sites).filter((host) => sites[host] !== chosen).map((host) => [keyFor(host), chosen]));
  }

  const api = { BUNDLED, DEFAULT, REPLACED, CHOSEN, ALL, allSites, everywhere, replacements, settle, GENERIC, RESTRICTED, PREFIX, cleanName, cssFamily, validHost, patternFor, keyFor, sitesFrom, FILE, fileKey, filesFrom, isBuffer };
  root.FF = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
