import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Version sequence pattern:
 * 0.0.1 -> 0.1.0 -> 0.1.1 -> 0.2.0 -> 0.2.1 -> 0.2.2 -> 0.3.0 -> 0.3.1 -> 0.3.2 -> 0.3.3 -> 0.4.0...
 * 
 * Stable versions: 0.0.1, 0.1.1, 0.2.2, 0.3.3, 0.4.4, etc. (minor == patch)
 * 
 * Logic:
 * - If patch < minor: increment patch
 * - If patch == minor: increment minor, set patch to 0
 * 
 * Edits by: rezzcode/the1Riddle
 */
function getNextVersion(currentVersion) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  if (patch < minor) {
    // Increment patch
    return `${major}.${minor}.${patch + 1}`;
  } else {
    // patch == minor, so increment minor and reset patch to 0
    return `${major}.${minor + 1}.0`;
  }
}

// Read package.json
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const currentVersion = packageJson.version;
const nextVersion = getNextVersion(currentVersion);

// Update package.json
packageJson.version = nextVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

console.log(`✓ Version updated: ${currentVersion} → ${nextVersion}`);
