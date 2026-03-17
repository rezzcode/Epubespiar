import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

// Base configuration shared between the browsers
const baseManifest = {
  name: "Epubespiar",
  version,
  manifest_version: 3,
  description: "A browser extension that allows you to read EPUB books right in your browser",
  action: {
    default_title: "Epubespiar"
  },
  content_scripts: [
    {
      matches: ["file://*/*", "https://*/*"],
      js: ["src/epub-handler.js"],
      run_at: "document_start",
      all_frames: false
    }
  ],
  permissions: [
    "storage",
    "activeTab",
    "downloads",
  ],
  host_permissions: [
    "file://*/*",
    "https://*/*"
  ],
  icons: {
    "16": "icon/16.png",
    "32": "icon/32.png",
    "48": "icon/48.png",
    "96": "icon/96.png",
    "128": "icon/128.png"
  },
  web_accessible_resources: [
    {
      resources: [
        "reader.html",
        "side_panel.html",
        "assets/*"
      ],
      matches: [
        "file://*/*",
        "https://*/*"
      ]
    }
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';"
  }
};

export default baseManifest;
