---
version: alpha
name: Firefonts
description: Toolbar popup and settings page of a Firefox extension that changes the font of the sites you choose.
colors:
  background: "#ffffff"
  text: "#000000"
  muted: "#5e5e66"
  line: "#92929a"
  accent: "#1a1a1a"
  knob: "#ffffff"
  background-dark: "#1f1f23"
  text-dark: "#ffffff"
  muted-dark: "#a8a8b3"
  line-dark: "#6a6a72"
  accent-dark: "#e6e6e6"
  knob-dark: "#1f1f23"
typography:
  body:
    fontFamily: Allo, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  heading:
    fontFamily: Allo, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0.06em
  title:
    fontFamily: Allo, system-ui, sans-serif
    fontSize: 22px
    fontWeight: 800
    lineHeight: 1.5
rounded:
  md: 8px
  field: 12px
  full: 9999px
spacing:
  line: 24px
  gap: 12px
  page: 24px
  field: 36px
components:
  row:
    typography: "{typography.body}"
    textColor: "{colors.text}"
    height: 36px
  field:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    height: 36px
    padding: 0 6px
  popup-field:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 0 12px
  font-chooser:
    textColor: "{colors.accent}"
    rounded: "{rounded.field}"
    height: 36px
  note:
    textColor: "{colors.muted}"
  switch:
    backgroundColor: "{colors.line}"
    rounded: "{rounded.full}"
    width: 40px
    height: 24px
  switch-on:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.knob}"
    rounded: "{rounded.full}"
  button:
    textColor: "{colors.accent}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 0 12px
  icon-button:
    textColor: "{colors.accent}"
    rounded: "{rounded.full}"
    size: 48px
---

## Overview

Two surfaces. The toolbar popup (`src/popup.html`) is the quick one: a switch to change the font on the open site and the font's name. The settings page (`src/fonts.html`) opens in a tab, because a file picker would close the popup: choose the font, add font files, preview a sentence, and manage the list of websites. Both follow the system theme, or the theme picked with the theme button in either one.

## Colors

Graphite and paper: the accent is graphite (10% brightness) in the light theme and paper (90%) in the dark one, with no blue. Text is pure black, or white in the dark theme; text inside a font selector takes the accent. Field outlines are as light as they can be while keeping 3:1 contrast. Each colour has a `-dark` twin, applied through `color-scheme` and `light-dark()`.

Behind the settings page, Firefox's brand colours glow faintly from the window's edges (yellow and orange at the left, pink at the top right, purple and violet at the bottom), stronger in the dark theme, under a triangular grid of faint dots exactly one line apart (`src/depth.js`).

## Icon

`src/icon.svg`, one SVG for every size, plus `src/icon-64.png` for the settings tab. A flame F wraps a purple globe, after the Firefox symbol without copying it. Colours come from Mozilla's Firefox palette: the globe runs #9059FF to #7543E3 to #3A0F6E, and the F runs #FFBD4F to #FF7139 to #FF3750 to #F5156C. A transparent gap separates the F from the globe, so the icon reads on light and dark toolbars down to 16px.

Interface icons are drawn for Firefonts on a 24px grid: 1.5px round strokes in the current colour, with closed shapes tinted 12%. The GitHub mark is GitHub's own.

## Typography

Allo (Josh Puckett, OFL) with stylistic set 2, in three sizes only: 16px body, 16px bold uppercase headings, and the 22px extra-bold page title. Anything showing a font sample (the font field, the font list, the preview sentence) draws that font as it comes, without Allo's stylistic set.

## Layout

Everything is measured in lines: one line is 24px, the height of a line of body text. Gaps are half a line, the page margin one line, and settings fields a line and a half (36px), with their icons centred in a square of that height. Everything is symmetric.

The popup is a 384px column (16 lines), wider than it is tall: the logo and name centred at the top, the switch and font field, then a centred row of icon buttons for settings (a gear), GitHub and the theme. The settings page is a centred column up to 576px (24 lines) with three numbered sections, Fonts, Preview and Websites, divided by faint rules, and a footer with the GitHub and theme buttons held at the bottom of the window.

Under 840px the settings page keeps one column that fills the window less the one-line margin. Touch screens show the drag handles all the time, since nothing can point at a row.

## Components

- **Switch row:** "Enable Firefonts on this website", with the site on its own line beneath in the muted colour; the whole row is the switch's label. Turning it on asks Firefox for that site only. Dimmed until the popup has read the site's setting.
- **Popup font field:** set in the typed font, starting at the site's font or the chosen one. With "Apply this font to all websites" on, a font saved here becomes the chosen font for every website. A line under it says so. An empty or missing font shows a note and the switch won't turn on.
- **Font chooser:** a field showing the chosen font in itself. A click opens the font list over the page with the current font exactly where the button was; arrow keys, Home, End, Page Up and Down, typing and Enter work from the button, Escape closes it unchanged.
- **Font list:** every bundled and added font, A to Z, eight rows at a time, each drawn in itself and ticked when current. An added font shows a cross in place of the tick while pointed at, and Delete removes it.
- **Apply to all switch:** on by default, giving the chosen font to every website; off, each website gets its own font chooser under its box.
- **Website box:** the site's favicon (or a globe), its short address, and the full address while editing. Enter or leaving the box renames the site; Escape puts it back. Firefox asks for a new site only on a key press, so leaving the box for a site it hasn't allowed keeps the typed address with a dashed outline until Enter. A drag handle in the margin reorders the list, and the arrow keys do the same. A site Firefox hasn't allowed yet is faded, with an Allow button under it, and its icon isn't fetched until then.
- **Icon button:** buttons are icons, never text. 48px round, one 24px icon in the accent colour, named by its aria-label and tooltip, tinted 10% on hover.
- **Blocked page:** pages Firefox protects show one sentence instead of the popup's controls.

## Do's and Don'ts

- Do keep the popup to one switch and one field.
- Do keep every size and space a multiple or simple fraction of a line, and keep the three type sizes.
- Don't use blue or any accent other than graphite and paper.
