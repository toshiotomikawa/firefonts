# Accessibility

Firefonts changes the font on the websites you choose. This page covers its popup, its Settings page, and the websites it changes, in Firefox 142 and newer on desktop and Android.

## What was tested

The popup, the Settings page, and a sample web page were checked in Chromium on 23 and 24 November 2026. The changes made since version 0.3.0 were checked on 25 November 2026 in Chromium and a test build of Firefox, as ordinary web pages:

- Everything can be done with a keyboard, and the control in focus shows a clear outline.
- Text, field borders, and switches meet the WCAG AA contrast levels in the light and dark themes.
- The popup and the Settings page follow Firefox's font size, up to at least twice the default.
- With reduced motion on, nothing slides, fades, turns, or grows.
- Screen readers are sent a message when you change the theme, move a website, add or remove a font, or type an address that can't be used.
- The popup and the Settings page fit a 320-pixel screen without sideways scrolling.

Not tested: Firefonts installed in Firefox, on desktop or Android; live websites; screen readers; touch; and Windows High Contrast. Firefonts makes no claim of WCAG conformance.

## Known barriers

- **Adding and removing fonts.** A font you added with the same name as a built-in one looks the same in the font list. The remove button can't be reached with a keyboard: press Delete on the font in the list.
- **Icons on websites.** Some websites draw icons with a font, and an uncommon one may be replaced, showing the wrong symbol or plain text. Turn Firefonts off on that website in the popup.
- **Parts that keep their font.** Some parts of a website set their own font where Firefonts can't reach, and those keep it.
- **Protected pages.** Firefox doesn't let extensions change its own pages and some Mozilla websites.

## Reporting a barrier

Open a [GitHub issue](https://github.com/toshiotomikawa/firefonts/issues) and say what you were trying to do and what happened. Your Firefox version, operating system, and any assistive technology help too. You don't need to mention a disability or send a screenshot.
