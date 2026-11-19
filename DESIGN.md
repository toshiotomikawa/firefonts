---
version: alpha
name: Firefonts
description: Toolbar popup of a Firefox extension that changes the font of the sites you choose.
colors:
  background: "#ffffff"
  text: "#1b1b1f"
  muted: "#5e5e66"
  line: "#74747e"
  primary: "#0b57d0"
  knob: "#ffffff"
  background-dark: "#1f1f23"
  text-dark: "#ececf1"
  muted-dark: "#a8a8b3"
  line-dark: "#8e8e99"
  primary-dark: "#a8c7fa"
  knob-dark: "#1f1f23"
typography:
  body:
    fontFamily: Google Sans, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  md: 8px
  full: 16px
spacing:
  gap: 12px
  page: 16px
components:
  row:
    typography: "{typography.body}"
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    height: 48px
  font-field:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 0 12px
  note:
    textColor: "{colors.muted}"
  switch:
    backgroundColor: "{colors.line}"
    rounded: "{rounded.full}"
    width: 52px
    height: 32px
  button:
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 0 12px
  icon-button:
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    size: 48px
  switch-on:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.knob}"
    rounded: "{rounded.full}"
---

## Overview

One toolbar popup (`src/popup.html`), the simple mode: a switch to change the font on the open site, and the font's name. A second page, Your fonts (`src/fonts.html`), opens in a tab to add font files, since a file picker would close the popup. It follows the system light or dark theme.

## Colors

A neutral surface with one blue accent for the switch when on and for focus rings. The off track and the field border share one line colour with 3:1 contrast against the surface. Dark mode uses each `-dark` twin through `color-scheme: light dark` and `light-dark()`.

## Icon

`src/icon.svg`, one SVG for every size. A flame F wraps a purple globe, after the Firefox symbol without copying it. Colours come from Mozilla's Firefox palette: the globe runs #9059FF to #7543E3 to #3A0F6E, and the F runs #FFBD4F to #FF7139 to #FF3750 to #F5156C. A transparent gap separates the F from the globe, so the icon reads on light and dark toolbars down to 16px.

## Typography

Google Sans at one size, 16px, weight 400; the Your fonts heading uses weight 700 at the same size. The font field previews what is typed in that font.

## Layout

A 280px column with 16px padding and 12px between items: the switch row, the font field, a note that only takes space when it has something to say, and the Your fonts button. Every control is 48px tall. The Your fonts page uses the same tokens in a centred column up to 560px: the heading with its add icon on the right, "Choose your font:", and one 48px row per font.

## Components

- **Switch row:** "Change font on <site>"; the whole row is the switch's label. Turning it on asks Firefox for access to that site only. The switch is dimmed to half opacity until the popup has read the site's setting.
- **Font field:** a text field set in the typed font. An empty or missing font shows "Type a font name" or "Not found on this computer"; the switch won't turn on, and if it is already on the note adds which font is still in use.
- **Suggestions:** the field offers the user's own fonts first, then the 34 bundled ones.
- **Button:** text in the accent colour on a clear background, tinted 10% on hover; used for Your fonts, Add font files and Remove.
- **Icon button:** a 48px round button with one 24px icon in the accent colour, named by its aria-label and tooltip; tinted 10% on hover, where the icon turns a quarter (no motion with reduced motion). Icon buttons are preferred over text buttons. The plus beside the Your fonts heading adds font files.
- **Font row:** each added font's name, drawn in that font, with a Remove button.
- **Blocked page:** pages Firefox protects show one sentence instead of the controls.

## Do's and Don'ts

- Do keep the simple mode to one switch and one field.
- Don't add per-element choices here; they belong in the advanced mode.
