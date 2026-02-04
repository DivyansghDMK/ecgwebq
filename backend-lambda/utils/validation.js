// Validation utilities for ECG data

function sanitizeString(str) {
  return typeof str === 'string' ? str.trim().replace(/[<>]/g, '') : '';
}

function validateECGPayload(payload) {
  const errors = [];
  
  if (!payload) {
    errors.push('Payload is required');
    return errors;
  }
  
  const { deviceId, patient, ecgData, pdfReport } = payload;
  
  if (!deviceId) {
    errors.push('Device ID is required');
  }
  
  if (!patient) {
    errors.push('Patient information is required');
  } else {
    if (!patient.name) {
      errors.push('Patient name is required');
    }
    if (!patient.phone) {
      errors.push('Patient phone is required');
    }
    if (!patient.age) {
      errors.push('Patient age is required');
    }
    if (!patient.gender) {
      errors.push('Patient gender is required');
    }
  }
  
  if (!ecgData) {
    errors.push('ECG data is required');
  } else {
    if (!ecgData.duration) {
      errors.push('ECG duration is required');
    }
    if (!ecgData.leads) {
      errors.push('ECG leads is required');
    }
    if (!ecgData.sampleRate) {
      errors.push('ECG sample rate is required');
    }
    if (!ecgData.waveform) {
      errors.push('ECG waveform is required');
    }
  }
  
  if (!pdfReport) {
    errors.push('PDF report is required');
  }
  
  return errors;
}

function validateRecordId(recordId) {
  const errors = [];
  
  if (!recordId) {
    errors.push('Record ID is required');
  } else if (typeof recordId !== 'string') {
    errors.push('Record ID must be a string');
  } else if (recordId.length < 1) {
    errors.push('Record ID cannot be empty');
  }
  
  return errors;
}

function createValidationErrorResponse(errors, statusCode = 400) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      error: 'Validation failed',
      details: errors
    })
  };
}

module.exports = {
  sanitizeString,
  validateECGPayload,
  validateRecordId,
  createValidationErrorResponse
};
