"use strict";
// Pure helpers shared by the popup, the page script, the background script and the tests.
(function (root) {
  // Fonts shipped with the extension, always available.
  const BUNDLED = ["Google Sans"];
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

  const api = { BUNDLED, GENERIC, RESTRICTED, PREFIX, cleanName, cssFamily, validHost, patternFor, keyFor, sitesFrom };
  root.FF = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
