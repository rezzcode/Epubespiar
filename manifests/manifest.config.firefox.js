import baseManifest from './manifest.config.js';
import dotenv from 'dotenv';

dotenv.config();


const firefoxManifest = {
  ...baseManifest,
  developer: {
    name: "rezzcode",
    url: "https://github.com/the1Riddle",
  },
  background: {
    scripts: ["src/background.js"],
    type: "module"
  },
  browser_specific_settings: {
    gecko: {
      id: process.env.FIREFOX_MANIFEST_EXT_ID,
      data_collection_permissions: {
        required: ["none"]
      }
    }
  },
};

firefoxManifest.permissions = (firefoxManifest.permissions || []).filter(p => p !== 'background');

export default firefoxManifest;