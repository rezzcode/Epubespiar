# Epubespiar.
 - EPUB Reader Browser Extension

A powerful browser extension for reading EPUB books directly in your browser with a beautiful library management system.

## Features

### 📖 Enhanced Reader
- **Seamless Reading**: Read EPUB books with a clean, distraction-free interface
- **Smart Navigation**: Easy switching between the library and the reader
- **Table of Contents**: Quick navigation through chapters and sections
- **Zoom Controls**: Adjust view widths for comfortable reading
- **Font Controls**: Adjust text size for comfortable reading
- **Responsive Design**: Works great on desktop and mobile devices

### 🎯 Smart Interactions
- **Drag & Drop**: Drop EPUB files onto the reader to open immediately and add to the library

- To get the most out of Epubespiar on Chromium browsers, ensure you allow the extension to access file urls.

https://github.com/user-attachments/assets/b5099c4d-e9de-438e-8bc3-e55966feba3b


## Architecture

```pgsql
╭────────────────────────────╮
│        USER ACTION         │
│  Click Extension Icon      │
╰────────────┬───────────────╯
             │ Opens reader page.
             │
             ▼
╭────────────────────────────╮
│        USER OPTIONS        │
│  (drag-drop / open EPUB)   │
╰────────────┬───────────────╯
             │
             ▼
╭────────────────────────────╮
│         BROWSER            │
│ Fetch EPUB → detect MIME   │
│ (application/epub+zip)     │
╰────────────┬───────────────╯
             │
             ▼
╭────────────────────────────╮
│  EXT BACKGROUND SCRIPT     │
│ webRequest.onHeadersReceived│
│ → detects EPUB MIME or .epub│
│ → redirects tab             │
│     ↓                       │
│ reader.html?file=<url>      │
╰────────────┬───────────────╯
             │
             ▼
╭────────────────────────────╮
│       READER.HTML          │
│ uses epub.js to render     │
│ fetches the .epub via URL  │
│ displays in tab like PDF   │
│ See reading progress %     │
╰────────────────────────────╯
```

## Technical Stack

- **Vue 3**: Modern reactive framework for UI
- **epub.js**: EPUB parsing and rendering
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

### Instant Reading (EPUB Interception)

The extension automatically intercepts EPUB files anywhere in your browser, just like how browsers handle PDFs:

<br>

> [!NOTE]<br>
> The full functionality is only available on Chromium browsers since firefox based browsers
> does not support drag-and-drop local files with the help of an extension, as it does for
> videos, images, or PDF files

1. **Click EPUB Links**: Click any `.epub` link on a website → Opens immediately in reader
2. **Navigate to EPUB URLs**: Type or paste an EPUB URL → Opens automatically
3. **Drag & Drop**: Drag an EPUB file to any browser tab → Opens and starts reading
4. **Drag & Drop option 2**: Drag drop an EPUB file onto a browser icon → Opens and starts reading

**How it works**: The extension uses `declarativeNetRequest` to detect:
- URLs ending in `.epub`
- Content with MIME type `application/epub+zip` or `application/epub`

When detected, it redirects to the extensions reader page, where you can read the document.

## Features in Detail

### Reader Page
- Header toolbar with navigation controls
- Sidebar with table of contents
- Main reading area with EPUB content
- Zoom controls for text size

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Other Chromium-based browsers: Should work with the Chrome build

## What's not Implemented

- [ ] Epub book library
- [ ] Progress Tracking
- [ ] Url intercepts
- [ ] What you thought was but is not while using the extension




