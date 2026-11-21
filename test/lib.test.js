"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanName, cssFamily, validHost, patternFor, keyFor, sitesFrom, everywhere, replacements, allSites, BUNDLED, DEFAULT } = require("../src/lib.js");

test("trims and collapses spaces", () => {
  assert.equal(cleanName("  Times   New Roman "), "Times New Roman");
});

test("keeps words apart when tabs or line breaks separate them", () => {
  assert.equal(cleanName("Times\tNew\nRoman"), "Times New Roman");
});

test("maps any casing of a bundled font or generic family to its real name", () => {
  assert.equal(cleanName("google sans"), "Google Sans");
  assert.equal(cleanName("MONOSPACE"), "monospace");
});

test("drops characters that could break out of the CSS value", () => {
  assert.equal(cleanName('Arial"; } body { color: red'), "Arial body color: red");
  assert.equal(cleanName("Ari\\al<b>"), "Arialb");
});

test("returns nothing for missing or non-text input", () => {
  for (const value of [null, undefined, {}, []]) assert.equal(cleanName(value), "");
});

test("builds a quoted family with a fallback", () => {
  assert.equal(cssFamily("Inter"), '"Inter", sans-serif');
});

test("leaves generic families unquoted and gives nothing for an empty name", () => {
  assert.equal(cssFamily("serif"), "serif");
  assert.equal(cssFamily(";;;"), "");
});

test("builds the site pattern only for hosts a pattern can name", () => {
  assert.equal(patternFor("www.youtube.com"), "*://www.youtube.com/*");
  for (const host of ["", "[::1]", "a b.com", "-x.com", null]) {
    assert.equal(validHost(host), false);
    assert.equal(patternFor(host), null);
  }
});

test("reads each site's font from its own key and skips anything malformed", () => {
  const items = {
    [keyFor("a.com")]: "Inter",
    [keyFor("b.com")]: "",
    [keyFor("[::1]")]: "Inter",
    [keyFor("c.com")]: { font: "Inter" },
    other: "Arial",
  };
  assert.deepEqual(sitesFrom(items), { "a.com": "Inter" });
  assert.deepEqual(sitesFrom(null), {});
});

test("gives the chosen font to every listed site and to sites about to be added", () => {
  const items = { "site:a.com": "Lora", "site:b.com": "Inter", other: 1 };
  assert.deepEqual(everywhere(items, "Caveat", ["c.com"]), { font: "Caveat", "site:a.com": "Caveat", "site:b.com": "Caveat", "site:c.com": "Caveat" });
});

test("applies to all sites unless the user turned it off", () => {
  assert.equal(allSites({}), true);
  assert.equal(allSites({ "all-sites": false }), false);
});

test("moves sites off fonts no longer bundled, unless the user added that font", () => {
  const items = { font: "Roboto Mono", "site:a.com": "dancing script", "site:b.com": "Lora", "site:c.com": "Roboto Mono" };
  assert.deepEqual(replacements(items), { font: "JetBrains Mono", "site:a.com": "Caveat", "site:c.com": "JetBrains Mono" });
  assert.deepEqual(replacements(items, { "Roboto Mono": new ArrayBuffer(1) }), { "site:a.com": "Caveat" });
});

test("bundles the default font and lists the bundled fonts A to Z", () => {
  assert.ok(BUNDLED.includes(DEFAULT));
  assert.deepEqual(BUNDLED, [...BUNDLED].sort((a, b) => a.localeCompare(b)));
});
