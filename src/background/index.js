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
const processedDownloads = new Set();

// Function to generate random instance ID
function generateInstanceId() {
  return Math.random().toString(36).substring(2, 15);
}

function isSafeSupportedUrl(url) {
  try {
    const urlObj = new URL(url);
    return (urlObj.protocol === 'https:' || urlObj.protocol === 'file:' || urlObj.protocol === 'epub:') &&
           urlObj.pathname.length < 2048; // Prevent path traversal
  } catch {
    return false;
  }
}

function isLikelyEpubUrl(url) {
  if (!isSafeSupportedUrl(url)) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const combined = `${decodeURIComponent(urlObj.pathname)}${decodeURIComponent(urlObj.search || '')}`.toLowerCase();
    return /\.epub($|[./?&#_-])/i.test(combined);
  } catch {
    return false;
  }
}

function isLikelyEpubFilename(filename = '') {
  if (!filename) {
    return false;
  }
  return /\.epub($|\.)/i.test(filename.toLowerCase());
}

// Validate EPUB URL
function isValidEpubUrl(url) {
  return isLikelyEpubUrl(url);
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
async function openReaderTab(epubUrl = null, isNewInstance = false, options = {}) {
  try {
    const allowSafeNonEpubUrl = options.allowSafeNonEpubUrl === true;

    if (epubUrl && !(isValidEpubUrl(epubUrl) || (allowSafeNonEpubUrl && isSafeSupportedUrl(epubUrl)))) {
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

// Track allowed downloads when user chooses to download instead of preview
const allowedDownloads = new Set();

async function handlePotentialEpubDownload(downloadItem) {
  if (!downloadItem || processedDownloads.has(downloadItem.id)) {
    return;
  }

  try {
    const urlObj = new URL(downloadItem.url);
    const isFileEpub = urlObj.protocol === 'file:' && isLikelyEpubUrl(downloadItem.url);

    if (isFileEpub) {
      processedDownloads.add(downloadItem.id);
      await browser.downloads.cancel(downloadItem.id);
      await browser.downloads.erase({ id: downloadItem.id });
      await openReaderTab(downloadItem.url, false, { allowSafeNonEpubUrl: true });
      return;
    }

    if (urlObj.protocol !== 'https:') {
      return;
    }

    if (allowedDownloads.has(downloadItem.url)) {
      allowedDownloads.delete(downloadItem.url);
      return;
    }

    const result = await browser.storage.local.get('interceptDownloads');
    const interceptEnabled = result.interceptDownloads === true;

    if (!interceptEnabled) {
      return;
    }

    const mimeType = (downloadItem.mime || '').toLowerCase();
    const isEpubByUrl = isLikelyEpubUrl(downloadItem.url);
    const isEpubByFilename = isLikelyEpubFilename(downloadItem.filename);
    const isEpubByMime = mimeType === 'application/epub+zip';

    if (isEpubByUrl || isEpubByFilename || isEpubByMime) {
      processedDownloads.add(downloadItem.id);
      await browser.downloads.cancel(downloadItem.id);
      await browser.downloads.erase({ id: downloadItem.id });
      await openReaderTab(downloadItem.url, false, { allowSafeNonEpubUrl: true });
    }
  } catch (error) {
    console.error('Error processing potential EPUB download:', error);
  }
}

// Intercept downloads with toggle support
browser.downloads.onCreated.addListener(async (downloadItem) => {
  await handlePotentialEpubDownload(downloadItem);
});

browser.downloads.onChanged.addListener(async (delta) => {
  if (processedDownloads.has(delta.id)) {
    return;
  }

  const hasRelevantChange = Boolean(delta.filename || delta.mime || delta.finalUrl || delta.state);
  if (!hasRelevantChange) {
    return;
  }

  try {
    const [downloadItem] = await browser.downloads.search({ id: delta.id });
    if (!downloadItem) {
      return;
    }

    if (downloadItem.state === 'interrupted' || downloadItem.state === 'complete') {
      return;
    }

    await handlePotentialEpubDownload(downloadItem);
  } catch (error) {
    console.error('Error handling download change:', error);
  }
});

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
    } else if (message.type === 'ALLOW_DOWNLOAD' && isValidEpubUrl(message.url)) {
      // Allow manual download of EPUB
      allowedDownloads.add(message.url);
      browser.downloads
        .download({ url: message.url })
        .then((id) => {
          resolve({ success: true, downloadId: id });
        })
        .catch((err) => {
          console.error("Download failed:", err);
          allowedDownloads.delete(message.url);
          reject(new Error('Download failed: ' + err.message));
        });
    } else {
      resolve({ success: false, error: 'Invalid message type' });
    }
  });
});

// use a safe way to get URL parameters
function getFileParameter() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('file');
  } catch (error) {
    console.error('Error parsing URL parameters:', error);
    return null;
  }
}
