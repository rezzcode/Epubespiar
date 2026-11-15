# Reader themes

Open reader settings to choose **System**, **Light**, **Green**, or **Dark**. System follows the operating system’s light or dark preference. Green has its own palette and uses the dark treatment for EPUB chapters.

## How themes work

The reader imports [the stylesheet entry point](../src/ui/reader/styles/index.css), which loads the palettes and shared styles. The [theme registry](../src/ui/reader/styles/themes/registry.js) supplies each palette’s ID, label, and light or dark appearance. Light provides the default CSS variables that other palettes can override. Shared layout belongs in the base stylesheet or in the relevant Vue component.

[The theme composable](../src/composables/useTheme.js) sets `data-theme` on the document root to the resolved palette and sets `data-appearance` to its light or dark treatment. The selected preference is saved as `reader-theme` in extension storage and mirrored in local storage for startup. Existing preferences can fall back to legacy storage keys. Changes synchronize across reader pages.

Chapter styles run inside the Shadow DOM. Theme variables inherit into that tree, and the chapter host’s appearance controls the light or dark treatment. Theme changes update the styling without rebuilding chapter content.

## Adding a theme

1. Add a CSS file under [`src/ui/reader/styles/themes/`](../src/ui/reader/styles/themes). Use an existing palette as a starting point and scope overrides to `:root[data-theme="<id>"]`. Include any overrides needed for chapter backgrounds, links, syntax highlighting, and reader controls.
2. Import the stylesheet in [`styles/index.css`](../src/ui/reader/styles/index.css) after the light default.
3. Add the theme’s `id`, `label`, and `appearance` to [`registry.js`](../src/ui/reader/styles/themes/registry.js). Use `light` or `dark` for the appearance. The `auto` ID is reserved for System.
4. Build with `pnpm run build:chrome` and `pnpm run build:firefox`. In each browser, switch themes with and without a book open. Check chapter text, links, code blocks, the table of contents, the bookshelf, and settings. Reload to verify the preference persists, and check that System responds to an OS appearance change.
