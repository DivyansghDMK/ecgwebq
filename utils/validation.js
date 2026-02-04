/**
 * Lightweight validation & sanitization helpers
 * Compatible with AWS Lambda (Node.js)
 */

/**
 * Sanitizes any user input (query params, body fields etc.)
 * Removes risky characters but keeps filename/path safe
 */
function sanitizeString(input) {
    if (!input || typeof input !== 'string') return '';
  
    return input
      .trim()
      .replace(/[<>\"']/g, '')     // prevent XSS injection
      .replace(/\\/g, '')          // remove backslashes
      .replace(/\.\./g, '')        // prevent path traversal
  }
  
  /**
   * Checks if value is a non-empty string
   */
  function isValidString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }
  
  /**
   * Simple recordId validation
   * Allows: letters, numbers, dash, underscore, slash, dot
   * Example allowed: ecg-data/1769072752521_ECG123.json
   */
  function isValidRecordId(recordId) {
    if (!isValidString(recordId)) return false;
  
    const safePattern = /^[a-zA-Z0-9_\-\/\.]+$/;
    return safePattern.test(recordId);
  }
  
  module.exports = {
    sanitizeString,
    isValidString,
    isValidRecordId
  };
  