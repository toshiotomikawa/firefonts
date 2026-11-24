# Accessibility

Firefonts changes the font on the websites you choose. This page covers its popup, its Settings page, and the websites it changes, in Firefox 142 and newer on desktop and Android.

## What was tested

The popup, the Settings page, and a sample web page were checked in Chromium on 23 and 24 November 2026, using the code of version 0.3.0:

- Everything can be done with a keyboard, and the control in focus shows a clear outline.
- Text meets the WCAG AA contrast levels in the light and dark themes, except for the faded websites listed below.
- The Settings page fits a 320-pixel screen without sideways scrolling.

Not tested: Firefox itself, on desktop or Android; live websites; screen readers; touch; and Windows High Contrast. Firefonts makes no claim of WCAG conformance.

## Known barriers

- **Larger text.** Raising your default font size does not enlarge the popup or the Settings page. On the Settings page, use page zoom instead.
- **Narrow screens.** The popup is 384 pixels wide and scrolls sideways on narrower screens. The Settings page fits them: adding a website there turns its font on, and removing it turns it off.
- **Invalid websites.** When an address can't be added, the field's border becomes dashed, but no message says why. When you edit a listed website, the reason shows only on hover. Type only the domain, such as `example.com`, and press Enter; Firefox may then ask for permission.
- **Moving websites.** The move button doesn't say that the Up and Down arrow keys move a website, and the move isn't announced.
- **Faint outlines.** On the Settings page, field borders, and the switch when off, have slightly less than the 3:1 contrast WCAG AA asks for.
- **Adding and removing fonts.** Success isn't announced; only failures are. Open the font list to check, though a font you added with the same name as a built-in one looks the same there. The remove button can't be reached with a keyboard: press Delete on the font in the list.
- **Theme button.** The button's name changes to the new theme, and your screen reader may not announce it. Move away and back to hear it.
- **Section names.** A screen reader may read a dot before "Fonts", "Preview", and "Websites". The field for adding a website has the same name as the list above it.
- **Faded websites.** A website that Firefox hasn't allowed yet is faded, and its border has low contrast (under 2:1). Choose Allow under it and accept Firefox's request to remove the fading.
- **Reduced motion.** With reduced motion on, sliding rows stop, but short colour fades remain. The Add button's icon turns, and some icons grow, instantly when you point at them.
- **Icons on websites.** Some websites draw icons with a font, and an uncommon one may be replaced, showing the wrong symbol or plain text. Turn Firefonts off on that website in the popup.
- **Parts that keep their font.** Some parts of a website set their own font where Firefonts can't reach, and those keep it.
- **Protected pages.** Firefox doesn't let extensions change its own pages and some Mozilla websites.

## Reporting a barrier

Open a [GitHub issue](https://github.com/toshiotomikawa/firefonts/issues) and say what you were trying to do and what happened. Your Firefox version, operating system, and any assistive technology help too. You don't need to mention a disability or send a screenshot.
