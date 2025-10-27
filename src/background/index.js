import browser from "webextension-polyfill";
import { validateURL, secureStorageSet, secureStorageGet } from '../utils/security';

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  max: 50
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
           (urlObj.protocol === 'https:' || urlObj.protocol === 'file:' || urlObj.protocol === 'epub:') &&
           urlObj.pathname.length < 2048; // Prevent path traversal
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

// Function to open or focus the reader tab
async function openReaderTab(epubUrl = null, isNewInstance = false) {
  try {
    if (epubUrl && !isValidEpubUrl(epubUrl)) {
      throw new Error('Invalid EPUB file URL');
    }

    const readerURL = browser.runtime.getURL("reader.html");
    const instanceId = generateInstanceId();
    const finalURL = epubUrl 
      ? `${readerURL}?file=${encodeURIComponent(epubUrl)}&instance=${instanceId}`
      : `${readerURL}?instance=${instanceId}`;
    
    // Always create a new tab with a unique instance ID
    const tab = await browser.tabs.create({ url: finalURL });
    readerTabs.set(tab.id, instanceId);
    return tab;
  } catch (error) {
    console.error('Error opening reader tab:', error);
    browser.runtime.sendMessage({
      type: 'SHOW_NOTIFICATION',
      notification: {
        type: 'error',
        message: 'Failed to open reader'
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

// Intercept downloads
browser.downloads.onCreated.addListener(async (downloadItem) => {
  try {
    const urlObj = new URL(downloadItem.url);

    // Handle local EPUBs dragged into new tab
    if (urlObj.protocol === "file:" && isValidEpubUrl(downloadItem.url)) {
      await browser.downloads.cancel(downloadItem.id);
      await browser.downloads.erase({ id: downloadItem.id });
      await openReaderTab(downloadItem.url);
      return;
    }

    // Allow HTTPS EPUBs (for now)
    if (urlObj.protocol === "https:" && isValidEpubUrl(downloadItem.url)) {
      return;
    }
  } catch (error) {
    console.error("Error processing download:", error);
  }
});

// ==========================================
// 🔮 FUTURE FEATURE: HTTPS EPUB Preview
// I'll uncomment this section when ready to implement
// ==========================================

/*
const allowedDownloads = new Set();

browser.downloads.onCreated.addListener(async (downloadItem) => {
  if (isValidEpubUrl(downloadItem.url)) {
    if (allowedDownloads.has(downloadItem.url)) {
      allowedDownloads.delete(downloadItem.url);
      console.log("Allowing direct download for:", downloadItem.url);
      return;
    }

    try {
      await browser.downloads.cancel(downloadItem.id);
      await browser.downloads.erase({ id: downloadItem.id });
      await openReaderTab(downloadItem.url);
    } catch (error) {
      console.error("Error intercepting HTTPS EPUB:", error);
      allowedDownloads.add(downloadItem.url);
    }
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "ALLOW_DOWNLOAD" && isValidEpubUrl(message.url)) {
    allowedDownloads.add(message.url);
    browser.downloads
      .download({ url: message.url })
      .then((id) => console.log("Manual download started:", id))
      .catch((err) => {
        console.error("Download failed:", err);
        allowedDownloads.delete(message.url);
      });
  }
});
*/

// Handle tab removal
browser.tabs.onRemoved.addListener((tabId) => {
  readerTabs.delete(tabId);
});

// Handle protocol registration
browser.runtime.onMessage.addListener((message, sender) => {
  // Return a promise for proper async handling
  return new Promise((resolve, reject) => {
    // Check rate limit
    if (!checkRateLimit(sender.id)) {
      reject(new Error('Rate limit exceeded'));
      return;
    }

    if (message.type === 'OPEN_READER' && message.epubUrl) {
      openReaderTab(message.epubUrl)
        .then(() => resolve({ success: true }))
        .catch(() => {
          console.error('Error handling message');
          reject(new Error('Failed to open reader'));
        });
    } else if (message.type === 'EPUB_DRAGSTART') {
      // Tell content script it's okay to handle this drag
      resolve({ shouldHandle: isValidEpubUrl(message.url) });
    } else if (message.type === 'EPUB_DROP') {
      if (isValidEpubUrl(message.url)) {
        openReaderTab(message.url)
          .then(() => resolve({ success: true }))
          .catch(() => {
            console.error('Error handling message');
            reject(new Error('Failed to open reader'));
          });
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