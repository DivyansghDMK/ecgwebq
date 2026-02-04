// Base64 utilities for ECG data processing

function isValidBase64(str) {
  if (typeof str !== 'string') return false;
  
  // Remove data URL prefix if present
  const base64Data = str.replace(/^data:.*?base64,/, '');
  
  // Check if the string is empty
  if (!base64Data.trim()) return false;
  
  try {
    // Try to decode and re-encode to verify validity
    const decoded = Buffer.from(base64Data, 'base64').toString('utf8');
    const reencoded = Buffer.from(decoded, 'utf8').toString('base64');
    return base64Data === reencoded;
  } catch (error) {
    return false;
  }
}

function extractBase64Data(base64String) {
  if (typeof base64String !== 'string') return '';
  
  // Remove data URL prefix if present
  return base64String.replace(/^data:.*?base64,/, '');
}

function base64ToBuffer(base64String) {
  if (typeof base64String !== 'string') return Buffer.alloc(0);
  
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:.*?base64,/, '');
  
  try {
    return Buffer.from(base64Data, 'base64');
  } catch (error) {
    console.error('Error converting base64 to buffer:', error);
    return Buffer.alloc(0);
  }
}

function bufferToBase64(buffer) {
  if (!Buffer.isBuffer(buffer)) return '';
  
  try {
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error converting buffer to base64:', error);
    return '';
  }
}

module.exports = {
  isValidBase64,
  extractBase64Data,
  base64ToBuffer,
  bufferToBase64
};
