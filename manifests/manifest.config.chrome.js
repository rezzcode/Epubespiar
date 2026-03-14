import baseManifest from './manifest.config.js';

// Add background permissions
const permissions = [...(baseManifest.permissions || [])];
if (!permissions.includes('background')) {
  permissions.push('background');
}

const chromeManifest = {
  ...baseManifest,
  permissions,
  offline_enabled: true,
  author: {
    name: "rezzcode",
    url: "https://github.com/the1Riddle",
  },
  side_panel: {
    default_path: "./side_panel.html"
  },
  background: {
    service_worker: "src/background.js",
    type: "module"
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline'",
    sandbox: "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self' 'unsafe-inline' 'unsafe-eval'; child-src 'self';"
  },
};

export default chromeManifest;