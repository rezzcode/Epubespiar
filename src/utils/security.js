/**
 * Security utility functions for the extension
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML content
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate file type and size
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum file size in bytes
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} Whether the file is valid
 */
export function validateFile(file, maxSize, allowedTypes) {
  if (!file) return false;
  if (file.size > maxSize) return false;
  if (!allowedTypes.includes(file.type)) return false;
  return true;
}

/**
 * Secure storage wrapper with encryption
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {Promise<void>}
 */
export async function secureStorageSet(key, value) {
  try {
    const encryptedValue = await encryptData(value);
    await chrome.storage.local.set({ [key]: encryptedValue });
  } catch (error) {
    console.error('Storage error:', error);
    throw new Error('Failed to store data securely');
  }
}

/**
 * Secure storage retrieval with decryption
 * @param {string} key - Storage key
 * @returns {Promise<any>} Decrypted value
 */
export async function secureStorageGet(key) {
  try {
    const result = await chrome.storage.local.get(key);
    if (!result[key]) return null;
    return await decryptData(result[key]);
  } catch (error) {
    console.error('Storage error:', error);
    throw new Error('Failed to retrieve data securely');
  }
}

/**
 * Validate URL for security
 * @param {string} url - URL to validate
 * @returns {boolean} Whether the URL is secure
 */
export function validateURL(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'file:';
  } catch {
    return false;
  }
}

/**
 * Simple encryption function (replace with proper encryption in production)
 * @param {any} data - Data to encrypt
 * @returns {Promise<string>} Encrypted data
 */
async function encryptData(data) {
  // This is a placeholder. In production, use proper encryption
  return btoa(JSON.stringify(data));
}

/**
 * Simple decryption function (replace with proper decryption in production)
 * @param {string} encryptedData - Encrypted data to decrypt
 * @returns {Promise<any>} Decrypted data
 */
async function decryptData(encryptedData) {
  // This is a placeholder. In production, use proper decryption
  return JSON.parse(atob(encryptedData));
} 