# Keyboard shortcuts

These shortcuts work when the Epubespiar reader page has keyboard focus.

## Available shortcuts

| Shortcut | Action | Availability |
| --- | --- | --- |
| Ctrl + F9 | Open reader settings | Book open, library closed |
| Ctrl + Home | Open the library | Including when no book is open |
| Ctrl + End | Close the current book and show the library | Book open |
| Ctrl + Insert | Open the EPUB file picker | Including when a book is already open |
| Ctrl + [ or Ctrl + ] | Open the table of contents, closing the library if open | Book open |
| Alt + , | Decrease reader zoom by 10 percentage points | Book open, library closed |
| Alt + . | Increase reader zoom by 10 percentage points | Book open, library closed |
| Alt + / | Reset reader zoom to 100% | Book open, library closed |
| Alt + - | Decrease font size by 2px | Book open, library closed |
| Alt + = | Increase font size by 2px | Book open, library closed |
| Alt + 0 | Reset font size to 16px | Book open, library closed |
| Esc | Close the table of contents | TOC open, library closed |

Closing a book does **not** close the browser tab or delete the book from the
library. Opening the library with Ctrl + Home never toggles it closed. Both TOC
shortcuts open it rather than toggle it; pressing either again leaves it open.

## Zoom and font size

The comma and period keys are a left/right pair: think **< smaller / > larger**.
Press **Alt + comma/period without Shift**, not Alt + < or Alt + >.
Likewise, increasing font size uses Alt + =, not Alt + Shift + =.

These zoom shortcuts use the reader's existing Zoom feature, not browser zoom
or an independent text-column width setting. Zoom scales book content, including
text, from **50% to 200%**. The existing mobile layout can suppress visual scaling.
Font size ranges from **14px to 30px**. Holding an increase/decrease shortcut
repeats the adjustment; opening, closing, and reset actions run once per press.
At a limit, further adjustments leave the value unchanged.

Changes use the same saved preferences as the toolbar and settings dialog, even
when inline toolbar controls are hidden. Resetting zoom does not reset font size,
and resetting font size does not reset zoom, font family, or font weight.

## Focus and conflicts

- Reader shortcuts pause while a book is loading or a settings or library dialog is
  displayed. Dialogs keep their own keyboard behavior, including native Esc handling.
- Shortcuts do not run in inputs, selects, text areas, or editable content, or
  during input-method composition. AltGraph combinations are left alone.
- Ctrl + Insert keeps its normal **Copy** behavior when text is selected.
- Browser zoom shortcuts, including Ctrl + 0, Ctrl + - and Ctrl + +, are unchanged.
- Open the TOC using Ctrl + [ / Ctrl + ] or its existing toolbar control;
  Esc closes it. The library retains its own Esc behavior for its nested
  collections panel and library sidebar.
- Existing unmodified left/right arrow navigation remains available while reading.
- Bindings use the key reported by your keyboard layout, with the exact modifiers
  listed above. Ctrl is not automatically replaced with Command on macOS.
- A browser, operating system, desktop environment, or another extension may
  intercept a combination before the reader receives it. For example, Ctrl + F9
  may require Fn on some keyboards. Use the existing mouse controls in that case.

## Maintaining the shortcuts

- [Shortcut bindings](../src/composables/reader/useReaderShortcuts.js) map keys and exact modifiers to named actions. Set `repeat` for held-key adjustments and `preserveSelection` to let Copy take precedence when text is selected.
- [Reader actions](../src/ui/reader/App.vue) define what each shortcut does and when it is available. The dispatcher leaves the event alone when the action is missing or disabled. It attaches the listener when the reader mounts and removes it when the reader unmounts.
- [Reader settings](../src/composables/reader/useReaderSettings.js) define the defaults and limits for zoom and font size. Check the toolbar and settings controls when changing those ranges.

To add a shortcut, update its binding and reader action, then add it to the table above. Build and load the extension in Chrome and Firefox. Check the shortcut with a book open, with the bookshelf open, and with focus in a search field or dialog. For adjustment shortcuts, check held keys, limits, and whether the preference persists after reloading.

Note: The Keyboard combination might not work while testing the Extension over `localhost:port-number`
      Thus building it and testing it on the browser is recommended

