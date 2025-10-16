// Use browser API directly instead of webextension-polyfill
const browser = globalThis.browser || globalThis.chrome;

// Track drag events
let isDraggingEpub = false;

// Maximum file size (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Validate EPUB URL
function isValidEpubUrl(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.toLowerCase().endsWith('.epub') &&
           (urlObj.protocol === 'https:' || urlObj.protocol === 'http:' || urlObj.protocol === 'file:') &&
           urlObj.pathname.length < 2048; // Prevent path traversal
  } catch {
    return false;
  }
}

// Get protocol type
function getUrlProtocol(url) {
  try {
    return new URL(url).protocol;
  } catch {
    return null;
  }
}

// Promisify sendMessage for Chrome compatibility
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    if (typeof browser.runtime.sendMessage === 'function') {
      // Try to detect if sendMessage returns a Promise (Firefox)
      let isPromiseApi = false;
      try {
        const maybePromise = browser.runtime.sendMessage(message);
        if (maybePromise && typeof maybePromise.then === 'function') {
          isPromiseApi = true;
          maybePromise.then(resolve).catch(reject);
        }
      } catch (e) {
        // Ignore, fallback to callback
      }
      if (!isPromiseApi) {
        // Chrome uses callback
        browser.runtime.sendMessage(message, (response) => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      }
    } else {
      reject(new Error('browser.runtime.sendMessage is not available'));
    }
  });
}

// Listen for dragstart events
document.addEventListener('dragstart', async (event) => {
  const url = event.dataTransfer.getData('text/uri-list') || 
             event.dataTransfer.getData('text/plain');
             
  if (url && isValidEpubUrl(url)) {
    try {
      const response = await sendMessage({
        type: 'EPUB_DRAGSTART',
        url: url,
        protocol: getUrlProtocol(url)
      });

      if (response && response.shouldHandle) {
        isDraggingEpub = true;
        event.preventDefault();
      }
    } catch (error) {
      // Log error without exposing sensitive information
      console.error('Error handling dragstart');
    }
  }
});

// Handle drop events securely
document.addEventListener('drop', async (event) => {
  event.preventDefault();
  event.stopPropagation();

  const url = event.dataTransfer.getData('text/uri-list') || 
              event.dataTransfer.getData('text/plain');

  if (isValidEpubUrl(url)) {
    try {
      await sendMessage({
        type: 'EPUB_DROP',
        url: url,
        protocol: getUrlProtocol(url)
      });
    } catch (error) {
      console.error('Error handling drop');
    }
  }
});

// Prevent browser from opening files directly
document.addEventListener('dragover', (event) => {
  if (isDraggingEpub) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }
});

// Reset dragging state when drag ends
document.addEventListener('dragend', () => {
  isDraggingEpub = false;
});