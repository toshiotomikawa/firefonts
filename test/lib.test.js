"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanName, cssFamily, patternFor } = require("../src/lib.js");

test("trims and collapses spaces", () => {
  assert.equal(cleanName("  Times   New Roman "), "Times New Roman");
});

test("maps any casing of a bundled font to its real name", () => {
  assert.equal(cleanName("google sans"), "Google Sans");
});

test("drops characters that could break out of the CSS value", () => {
  assert.equal(cleanName('Arial"; } body { color: red'), "Arial body color: red");
  assert.equal(cleanName("Ari\\al\n<b>"), "Arialb");
});

test("builds a quoted family with a fallback", () => {
  assert.equal(cssFamily("Inter"), '"Inter", sans-serif');
});

test("builds the site pattern", () => {
  assert.equal(patternFor("www.youtube.com"), "*://www.youtube.com/*");
});
