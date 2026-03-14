import browser from 'webextension-polyfill';
import { validateURL, sanitizeHTML } from '../utils/security';

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
           (urlObj.protocol === 'https:' || urlObj.protocol === 'file:') &&
           urlObj.pathname.length < 2048; // Prevent path traversal
  } catch {
    return false;
  }
}

// Listen for dragstart events
document.addEventListener('dragstart', async (event) => {
  const url = event.dataTransfer.getData('text/uri-list') || 
             event.dataTransfer.getData('text/plain');
             
  if (url && isValidEpubUrl(url)) {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'EPUB_DRAGSTART',
        url: url
      });

      if (response.shouldHandle) {
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
  const url = event.dataTransfer.getData('text/uri-list') || 
              event.dataTransfer.getData('text/plain');

  if (isValidEpubUrl(url)) {
    event.preventDefault();
    event.stopPropagation();

    try {
      await browser.runtime.sendMessage({
        type: 'EPUB_DROP',
        url: url
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
