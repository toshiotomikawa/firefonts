"use strict";
// Pure helpers shared by the popup, the page script and the tests.
(function (root) {
  // Fonts shipped with the extension, always available.
  const BUNDLED = ["Google Sans"];

  // Trims a typed font name and drops characters a family name never needs.
  function cleanName(text) {
    const name = String(text).replace(/[\p{C}"\\;{}<>]/gu, "").replace(/\s+/g, " ").trim();
    const bundled = BUNDLED.find((b) => b.toLowerCase() === name.toLowerCase());
    return bundled || name;
  }

  // CSS font-family value for a cleaned name, with a safe fallback.
  function cssFamily(name) {
    return `"${cleanName(name)}", sans-serif`;
  }

  // Match pattern and permission origin for one site.
  function patternFor(host) {
    return `*://${host}/*`;
  }

  const api = { BUNDLED, cleanName, cssFamily, patternFor };
  root.FF = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
