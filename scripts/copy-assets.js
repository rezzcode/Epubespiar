import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const browsers = ['chrome', 'firefox'];
const iconSizes = ['16', '32', '48', '96', '128'];

// Create dist directories if none exist
browsers.forEach(browser => {
  const distPath = join(__dirname, `../dist/${browser}`);
  const iconPath = join(distPath, 'icon');
  
  if (!existsSync(distPath)) {
    mkdirSync(distPath, { recursive: true });
  }
  
  if (!existsSync(iconPath)) {
    mkdirSync(iconPath, { recursive: true });
  }
  
  // for the icons
  iconSizes.forEach(size => {
    const sourceIcon = join(__dirname, `../public/icon/${size}.png`);
    const targetIcon = join(iconPath, `${size}.png`);
    
    if (existsSync(sourceIcon)) {
      copyFileSync(sourceIcon, targetIcon);
    } else {
      console.warn(`Warning: Icon ${size}.png not found in public/icon directory`);
    }
  });
});
