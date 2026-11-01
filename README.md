# Epubespiar - EPUB Reader

A powerful browser extension for reading EPUB books directly in your browser with a beautiful library management system.

## Features

### 📖 Enhanced Reader
- **Seamless Reading**: Read EPUB books with a clean, distraction-free interface
- **Smart Navigation**: Easy switching between the library and the reader
- **Table of Contents**: Quick navigation through chapters and sections
- **Zoom Controls**: Adjust view widths for comfortable reading
- **Font Controls**: Adjust text size for comfortable reading
- **Responsive Design**: Works great on desktop and mobile devices
- **Epub URL Intercepts**: toggle on and off to open epub books automatically from URLs
- **Progress Tracking**: Through percentage

### 🎯 Smart Interactions
- **Drag & Drop**: Drop EPUB files onto the reader to open immediately and add to the library

### Get the extension

| Firefox | Edge | Chrome |
|-|-|-|
|<a href="https://addons.mozilla.org/en-GB/firefox/addon/epubespiar/"><img width="172" height="60" alt="firefox_badge" src="https://github.com/user-attachments/assets/c2a7391f-eaf0-4507-b8bc-c331647116b1" /></a> |<a href="https://microsoftedge.microsoft.com/addons/detail/mnlangghpjdaaecdfagjleijiahpaaei?hl=vi"><img width="172" height="46" alt="edge_badge" src="https://github.com/user-attachments/assets/ecc90e27-1092-4c3e-9b04-31895b2dc137" /></a> |<a href="https://chromewebstore.google.com/detail/epubespiar/jpebliijmpohifmgjcpfmhfjjeingoho"><img width="172" height="52" alt="chrome_badge" src="https://github.com/user-attachments/assets/76294ed1-9228-4de7-8d31-41675d838a88" /></a> |

### Getting Started

https://github.com/user-attachments/assets/ca7e83c9-84d9-4d01-ac6f-1a946fbaeda7

## Architecture

EPUB opening currently follows two real paths:

1. **Normal-page drag/drop path (content script available)**  
   Drag an EPUB URL onto a regular web page where `src/content/epub-handler.js` runs.
2. **Browser download path (content script unavailable, e.g. `chrome://newtab`)**  
   In built-in pages like New Tab, content scripts cannot run, so Chrome's normal navigation/download flow happens and the extension reacts through Downloads API listeners in `src/background/index.js`.

## Technical Stack

- **Vue 3**: Modern reactive framework for UI
- **jszip.js**: EPUB parsing and rendering
- **CSS3 & SCSS**: For great styling
- **Vite**: Fast build tool and development server
- **Manifest V3**: Latest Chrome extension API

## Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm run dev

# Build for Chrome
pnpm run build:chrome

# Build for Firefox
pnpm run build:firefox

# Build all
pnpm run build
```

## Usage

### Instant Reading (EPUB Opening Flows)

The extension automatically intercepts EPUB files anywhere in your browser, just like how browsers handle PDFs:

<br>

> [!NOTE]<br>
> The full functionality is only available on Chromium browsers since firefox based browsers
> does not support drag-and-drop local files with the help of an extension, as it does for
> videos, images, or PDF files

#### 1) Normal-page drag/drop flow

When drag/drop happens on a normal page where the content script runs:

- `src/content/epub-handler.js` reads dragged data from `text/uri-list` or `text/plain`.
- It validates only `https:` and `file:` URLs that end in `.epub`.
- On a valid drop, it prevents default browser drop behavior and sends `EPUB_DROP` to the background script.
- `src/background/index.js` validates again, then opens:
  - `reader.html?file=<encoded-epub-url>&instance=<id>`

#### 2) Download interception flow

When content scripts cannot run (for example `chrome://newtab`) or when browser download behavior is used:

- `src/background/index.js` listens on `browser.downloads.onCreated` and `browser.downloads.onChanged`.
- It detects EPUB candidates using URL, filename, or MIME type (`application/epub+zip`).
- **Local file EPUBs (`file://...`)**: it cancels and erases the download, then opens the reader with the original `file://` URL.
- **HTTPS downloads**: interception is only enabled when `storage.local.interceptDownloads === true`.

This is **not** a hidden `chrome://newtab` file-drop API. It relies on normal Chrome navigation/download behavior plus the extension's Downloads API listeners.

#### 3) Reader flow

Both paths end by opening the extension reader with:

- `reader.html?file=<encoded-epub-url>`

### Use cases?

- **Use Entry Point 2** when:
  - You find an EPUB on a website and want to read it immediately
  - You're continuing a book you've already started
  - You receive an EPUB file and want quick access
  - You want the book to open automatically (like PDFs)

## Features in Detail

### Reader Page
- Header toolbar with navigation controls
- Sidebar with table of contents
- Main reading area with EPUB content
- Zoom controls for text size

## Browser Compatibility

- [Chrome](https://chromewebstore.google.com/detail/epubespiar/jpebliijmpohifmgjcpfmhfjjeingoho)/[Edge](https://microsoftedge.microsoft.com/addons/detail/mnlangghpjdaaecdfagjleijiahpaaei?hl=vi): Full support
- [Firefox](https://addons.mozilla.org/en-GB/firefox/addon/epubespiar/): Full support
- Other Chromium-based browsers: Should work with the Chrome build

## What's not implemented

- [ ] Epub book library
- [ ] Download status: This shows the progress of your download
- [x] What you thought was, but is not, while using the extension
