import browser from "webextension-polyfill";
import { validateURL, secureStorageSet, secureStorageGet } from '../utils/security';

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

// Message rate limiting
const messageRateLimit = new Map();

// Track open reader tabs with their instance IDs
const readerTabs = new Map();

// Function to generate random instance ID
function generateInstanceId() {
  return Math.random().toString(36).substring(2, 15);
}

// Validate EPUB URL
function isValidEpubUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.toLowerCase().endsWith('.epub') &&
           (urlObj.protocol === 'https:' || urlObj.protocol === 'http:' || urlObj.protocol === 'file:' || urlObj.protocol === 'epub:') &&
           urlObj.pathname.length < 2048;
  } catch {
    return false;
  }
}

// Check rate limit
function checkRateLimit(senderId) {
  const now = Date.now();
  const userLimit = messageRateLimit.get(senderId) || { count: 0, resetTime: now + RATE_LIMIT.windowMs };
  
  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + RATE_LIMIT.windowMs;
  }
  
  if (userLimit.count >= RATE_LIMIT.max) {
    return false;
  }
  
  userLimit.count++;
  messageRateLimit.set(senderId, userLimit);
  return true;
}

// Function to download and open EPUB
async function downloadAndOpenEpub(epubUrl) {
  try {
    // Create a unique filename
    const filename = `epub_${Date.now()}.epub`;
    
    // Start the download
    const downloadId = await browser.downloads.download({
      url: epubUrl,
      filename: filename,
      saveAs: false
    });

    // Wait for download to complete
    return new Promise((resolve, reject) => {
      const listener = (downloadDelta) => {
        if (downloadDelta.id === downloadId) {
          if (downloadDelta.state && downloadDelta.state.current === 'complete') {
            browser.downloads.onChanged.removeListener(listener);
            // Query the download item to get the final filename
            browser.downloads.search({ id: downloadId }).then((items) => {
              if (items && items.length > 0 && items[0].filename) {
                const p = items[0].filename;
                const fileUrl = p.startsWith('file://') ? p : 'file://' + (p[0] === '/' ? '' : '/') + p.replace(/\\/g, '/');
                resolve(fileUrl);
              } else {
                reject(new Error('Failed to get download filename'));
              }
            }).catch(reject);
          } else if (downloadDelta.error) {
            browser.downloads.onChanged.removeListener(listener);
            reject(new Error(downloadDelta.error.current));
          }
        }
      };
      browser.downloads.onChanged.addListener(listener);
    });
  } catch (error) {
    throw new Error('Failed to download EPUB: ' + error.message);
  }
}

// Function to open or focus the reader tab
async function openReaderTab(epubUrl = null, isNewInstance = false) {
  try {
    if (epubUrl && !isValidEpubUrl(epubUrl)) {
      throw new Error('Invalid EPUB file URL');
    }

    const readerURL = browser.runtime.getURL("src/ui/reader/index.html");
    const instanceId = generateInstanceId();
    
    // Handle different protocols
    let finalUrl = epubUrl;
    if (epubUrl) {
      const urlObj = new URL(epubUrl);
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        // Download first for HTTP/HTTPS URLs
        finalUrl = await downloadAndOpenEpub(epubUrl);
      }
    }

    const finalURL = finalUrl 
      ? `${readerURL}?file=${encodeURIComponent(finalUrl)}&instance=${instanceId}`
      : `${readerURL}?instance=${instanceId}`;
    
    const tab = await browser.tabs.create({ url: finalURL });
    readerTabs.set(tab.id, instanceId);
    return tab;
  } catch (error) {
    console.error('Error opening reader tab:', error);
    browser.runtime.sendMessage({
      type: 'SHOW_NOTIFICATION',
      notification: {
        type: 'error',
        message: 'Failed to open reader: ' + error.message
      }
    }).catch(console.error);
    throw error;
  }
}

// Handle extension installation
browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

// Listen for browser action (toolbar icon) clicks
browser.action.onClicked.addListener((tab) => {
  openReaderTab(null, true).catch((error) => {
    console.error('Error handling browser action click:', error);
  });
});

// Handle tab removal
browser.tabs.onRemoved.addListener((tabId) => {
  readerTabs.delete(tabId);
});

// Handle protocol registration
browser.runtime.onMessage.addListener((message, sender) => {
  return new Promise((resolve, reject) => {
    if (!checkRateLimit(sender.id)) {
      reject(new Error('Rate limit exceeded'));
      return;
    }

    if (message.type === 'OPEN_READER' && message.epubUrl) {
      openReaderTab(message.epubUrl)
        .then(() => resolve({ success: true }))
        .catch(error => reject(error));
    } else if (message.type === 'EPUB_DRAGSTART') {
      resolve({ shouldHandle: isValidEpubUrl(message.url) });
    } else if (message.type === 'EPUB_DROP') {
      if (isValidEpubUrl(message.url)) {
        openReaderTab(message.url)
          .then(() => resolve({ success: true }))
          .catch(error => reject(error));
      } else {
        reject(new Error('Invalid EPUB URL'));
      }
    } else {
      resolve({ success: false, error: 'Invalid message type' });
    }
  });
});

// Safe way to get URL parameters
function getFileParameter() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('file');
  } catch (error) {
    console.error('Error parsing URL parameters:', error);
    return null;
  }
}