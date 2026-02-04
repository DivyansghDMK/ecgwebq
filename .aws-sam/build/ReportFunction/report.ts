/**
 * API Handler: GET /api/report
 * Generates fresh pre-signed URLs for specific ECG report
 * Every request generates new URLs - no caching or storage
 */

import { 
  APIGatewayEvent, 
  ReportUrlsResponse,
  ErrorCodes 
} from './types/ecg';
import { generatePresignedUrls, checkRecordExists } from './services/s3Service';
import { validateRecordId } from './utils/validation';
import { 
  createSuccessResponse, 
  createValidationErrorResponse, 
  createNotFoundResponse,
  withErrorHandler 
} from './utils/response';

/**
 * Main handler function for generating report URLs
 * Always generates fresh URLs - never caches or stores them
 */
export const handler = withErrorHandler(async (event: APIGatewayEvent) => {
  // Validate HTTP method
  if (event.httpMethod !== 'GET') {
    if (event.httpMethod === 'OPTIONS') {
      return createSuccessResponse({ message: 'CORS preflight' }, 200);
    }
    return createSuccessResponse({ message: 'Method not allowed' }, 405);
  }

  try {
    // Extract record ID from query parameters
    const queryParams = event.queryStringParameters || {};
    const recordId = queryParams.id;

    if (!recordId) {
      return createValidationErrorResponse([{
        field: 'id',
        message: 'Record ID is required',
        code: ErrorCodes.MISSING_REQUIRED_FIELD
      }]);
    }

    // Validate record ID format
    const validation = validateRecordId(recordId);
    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors);
    }

    // Check if record exists before generating URLs
    const existence = await checkRecordExists(recordId);
    
    if (!existence.jsonExists) {
      return createNotFoundResponse(`ECG record ${recordId} not found`);
    }

    // Always generate fresh pre-signed URLs on every request
    // No caching, no storage, no dependency on previous URLs
    const urls = await generatePresignedUrls(recordId, 300); // 5 minutes TTL

    // If PDF doesn't exist, log warning
    if (!existence.pdfExists || !urls.pdfUrl) {
      console.warn(`PDF file missing for record ${recordId}, returning JSON URL only`);
    }

    const response: ReportUrlsResponse = {
      success: true,
      data: {
        jsonUrl: urls.jsonUrl,
        pdfUrl: urls.pdfUrl, // Will be null if PDF doesn't exist
        expiresIn: urls.expiresIn,
        generatedAt: new Date().toISOString()
      }
    };

    // Log successful URL generation for monitoring
    console.log(`Generated fresh presigned URLs for record ${recordId}`, {
      expiresIn: urls.expiresIn,
      hasPdf: existence.pdfExists,
      timestamp: response.data.generatedAt
    });

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Report handler error:', error);
    
    // Error handling is already wrapped by withErrorHandler
    throw error;
  }
});
