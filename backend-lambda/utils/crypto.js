// Crypto utilities for generating unique IDs

const { v4: uuidv4 } = require('uuid');

function generateRecordId() {
  return uuidv4();
}

function generateShortId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

function generateTimestampId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${timestamp}-${random}`;
}

module.exports = {
  generateRecordId,
  generateShortId,
  generateTimestampId
};
