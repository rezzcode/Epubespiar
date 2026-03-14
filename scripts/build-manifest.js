import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import chromeManifest from '../manifests/manifest.config.chrome.js';
import firefoxManifest from '../manifests/manifest.config.firefox.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// check directories  = true
const chromeDir = join(__dirname, '../dist/chrome');
const firefoxDir = join(__dirname, '../dist/firefox');

try {
  // if no directorys, we create one
  mkdirSync(chromeDir, { recursive: true });
  mkdirSync(firefoxDir, { recursive: true });

  // Generate Chrome manifest
  writeFileSync(
    join(chromeDir, 'manifest.json'),
    JSON.stringify(chromeManifest, null, 2),
    'utf-8'
  );
  console.log('✓ Chrome manifest generated');

  // Generate Firefox manifest
  writeFileSync(
    join(firefoxDir, 'manifest.json'),
    JSON.stringify(firefoxManifest, null, 2),
    'utf-8'
  );
  console.log('✓ Firefox manifest generated');
} catch (error) {
  console.error('Error generating manifests:', error);
  process.exit(1);
}
