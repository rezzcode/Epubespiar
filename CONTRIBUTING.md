# Contributing to Epubespiar

Thanks for helping make EPUBs easier to read in the browser. You can contribute by reporting bugs, testing across browsers, improving the docs, or changing the extension code.

## Find something to work on

- Browse the [open issues](https://github.com/rezzcode/Epubespiar/issues). If you pick one up, leave a comment with what you plan to tackle so others can coordinate.
- For a new feature or a change that touches several parts of the extension, open an issue first and describe the reader problem you want to solve.
- For a bug, include your OS, browser and version, Epubespiar version, exact steps, and expected and actual behavior. Say whether you opened a local EPUB, dropped a link onto a web page, or started a download. For download issues, include the automatic opening setting. If the bug depends on a particular book, share a redistributable sample or a public link when possible.

## Build the extension locally

Install a supported Node.js LTS release and pnpm. Fork [Epubespiar](https://github.com/rezzcode/Epubespiar), then replace `YOUR_GITHUB_USERNAME` below with your GitHub username.

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/Epubespiar.git
cd Epubespiar
git switch -c fix/short-description
pnpm install
pnpm run build
```

Use the full build to generate both extension packages, including their browser-specific manifests and content scripts. Use `pnpm run dev` for quick reader UI iteration at `http://localhost:8080`. Verify extension behavior in an installed development build. The release command `pnpm run build:prod` increments the version as part of its workflow.

| Browser | Load the extension |
| --- | --- |
| Chrome or Edge | Open `chrome://extensions` or `edge://extensions`. Enable **Developer mode**, click **Load unpacked**, and select `dist/chrome`. |
| Firefox | Open `about:debugging#/runtime/this-firefox`. Click **Load Temporary Add-on** and select `dist/firefox/manifest.json`. |

After editing, rebuild and reload the extension from the same browser page. Reopen the reader or refresh the web page you're testing so it uses the updated code.

## Where to make changes

| Area | Start here |
| --- | --- |
| Reader UI and controls | `src/ui/reader/` |
| Dropping EPUB links onto ordinary web pages | `src/content/epub-handler.js` |
| Opening reader tabs and intercepting browser downloads | `src/background/index.js` |
| Browser-specific permissions and entry points | `manifests/` |
| Packaging and build helpers | `scripts/` and `vite.config.js` |

Follow the conventions of the code you touch. Keep the extension lightweight by checking whether the existing code or dependencies can handle the change. For a new dependency or browser permission, explain what it enables in the pull request.

## Reader development guides

- [Keyboard shortcuts](docs/keyboard_shortcuts.md) explains how bindings map to reader actions, when shortcuts are available, and how to verify changes.
- [Reader themes](docs/THEMES.md) explains theme selection and persistence, where styles live, and how to add and verify a palette.

## Test the paths you changed

Use a public-domain or redistributable EPUB. Run the relevant checks below and record the browser, version, and result in your pull request.

| If you changed… | Check that… |
| --- | --- |
| Reader or EPUB rendering | A local EPUB dropped into the reader opens. Exercise the changed controls, such as the table of contents, text size, or reading progress. For reader-loading changes, also try a local book with the network disconnected. |
| Link drag and drop | Dropping an HTTPS EPUB link onto a regular web page opens the reader. Try an ordinary non-EPUB link and confirm its default behavior still works. |
| Download interception | Start an HTTPS EPUB download with automatic opening enabled and confirm the reader opens. Disable automatic opening and repeat to confirm the browser downloads the file normally. |
| Shared browser code, manifests, or packaging | Load both builds and run the affected checks in Chromium and Firefox. For changes to Chromium's New Tab flow, test it separately from a regular web page because it uses the browser's download path. |

Test local file drops **inside the reader** separately from drops onto browser tabs. The README documents a Firefox limitation for local-file drops at the browser level.

## Open a pull request

1. Review your diff. Include the source and any documentation your change requires. Leave generated builds in `dist/` out of the commit.
2. Commit and push your branch to your fork with `git push -u origin HEAD`.
3. Open a pull request against `rezzcode/Epubespiar:dev`. Explain the problem, what changed, and how you verified it. Link the issue with `Fixes #123` when the PR resolves it. For UI changes, include a screenshot or short recording.
4. Mention any browser or test path you couldn't check. If work is still in progress, open the PR as a draft and describe the feedback you need.
