---
version: alpha
name: firefonts
description: Toolbar popup of a Firefox extension that shows YouTube in Google Sans.
colors:
  background: "#ffffff"
  text: "#1b1b1f"
  track: "#74747e"
  primary: "#0b57d0"
  knob: "#ffffff"
  background-dark: "#1f1f23"
  text-dark: "#ececf1"
  track-dark: "#8e8e99"
  primary-dark: "#a8c7fa"
  knob-dark: "#1f1f23"
typography:
  body:
    fontFamily: Google Sans, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
rounded:
  full: 16px
spacing:
  gap: 16px
  row-y: 8px
components:
  row:
    typography: "{typography.body}"
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    padding: 8px 16px
    height: 48px
  switch:
    backgroundColor: "{colors.track}"
    rounded: "{rounded.full}"
    width: 52px
    height: 32px
  switch-on:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.knob}"
    rounded: "{rounded.full}"
---

## Overview

One toolbar popup (`src/popup.html`) with a single row: what the extension does, and a switch to turn it off. Nothing else to learn. It follows the system light or dark theme.

## Colors

A neutral surface with one blue accent for the switch when on and for the focus ring. The off track keeps 3:1 contrast against the surface. Dark mode uses each `-dark` twin through `color-scheme: light dark` and `light-dark()`.

## Typography

Google Sans at one size, 16px, weight 500: the popup is set in the font it applies.

## Layout

A single 48px row, 16px side padding, at least 240px wide. The whole row is the switch's label, so any tap on it toggles.

## Components

- **Switch:** a native checkbox with `role="switch"`, 52 by 32px, knob slides 20px; motion is off under reduced motion.

## Do's and Don'ts

- Do keep the simple mode to one decision per screen.
- Don't add settings, fonts or sites until a request needs them.
