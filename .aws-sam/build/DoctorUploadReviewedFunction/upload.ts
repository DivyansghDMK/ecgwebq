/**
 * API Handler: POST /api/upload
 * Uploads ECG record (JSON + PDF) to S3
 */

import { 
  APIGatewayEvent, 
  ECGUploadPayload, 
  ECGRecord, 
  UploadResponse,
  ErrorCodes 
} from './types/ecg';
import { uploadECGRecord } from './services/s3Service';
import { validateECGUploadPayload } from './utils/validation';
import { generateRecordId, generatePatientId } from './utils/crypto';
import { 
  createSuccessResponse, 
  createValidationErrorResponse, 
  withErrorHandler 
} from './utils/response';

/**
 * Main handler function for ECG upload
 */
export const handler = withErrorHandler(async (event: APIGatewayEvent) => {
  // Validate HTTP method
  if (event.httpMethod !== 'POST') {
    if (event.httpMethod === 'OPTIONS') {
      return createSuccessResponse({ message: 'CORS preflight' }, 200);
    }
    return createSuccessResponse({ message: 'Method not allowed' }, 405);
  }

  try {
    // Parse request body
    if (!event.body) {
      return createValidationErrorResponse([{
        field: 'body',
        message: 'Request body is required',
        code: ErrorCodes.MISSING_REQUIRED_FIELD
      }]);
    }

    let payload: ECGUploadPayload;
    
    try {
      payload = JSON.parse(event.body);
    } catch (error) {
      return createValidationErrorResponse([{
        field: 'body',
        message: 'Invalid JSON format',
        code: ErrorCodes.VALIDATION_ERROR
      }]);
    }

    // Validate payload
    const validation = validateECGUploadPayload(payload);
    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors);
    }

    // Generate unique IDs
    const recordId = generateRecordId();
    const patientId = generatePatientId();

    // Create complete ECG record
    const ecgRecord: ECGRecord = {
      recordId,
      deviceId: payload.deviceId,
      patient: {
        id: patientId,
        name: payload.patient.name,
        phone: payload.patient.phone,
        email: payload.patient.email,
        age: payload.patient.age,
        gender: payload.patient.gender,
        address: payload.patient.address,
        medicalHistory: payload.patient.medicalHistory
      },
      metrics: payload.metrics,
      timestamp: payload.timestamp,
      pdfBase64: payload.pdfBase64,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Upload to S3
    const uploadResult = await uploadECGRecord(recordId, ecgRecord);

    // Log successful upload
    console.log(`Successfully uploaded ECG record ${recordId}`, {
      deviceId: payload.deviceId,
      patientId,
      timestamp: payload.timestamp,
      jsonKey: uploadResult.jsonUpload.Key,
      pdfKey: uploadResult.pdfUpload.Key
    });

    // Return success response
    const response: UploadResponse = {
      success: true,
      recordId
    };

    return createSuccessResponse(response, 201);

  } catch (error) {
    console.error('Upload handler error:', error);
    
    // Error handling is already wrapped by withErrorHandler
    throw error;
  }
});
