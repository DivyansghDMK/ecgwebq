/**
 * API Handler: GET /api/reports
 * Lists all ECG reports with optional filtering
 */

import { 
  APIGatewayEvent, 
  ECGReportMetadata, 
  ReportFilters, 
  ReportsResponse,
  ErrorCodes 
} from './types/ecg';
import { listECGObjects, getECGRecord, batchGetECGRecords } from './services/s3Service';
import { validateReportFilters } from './utils/validation';
import { 
  createSuccessResponse, 
  createValidationErrorResponse, 
  withErrorHandler 
} from './utils/response';

/**
 * Filters ECG reports based on query parameters
 */
function filterReports(
  reports: ECGReportMetadata[], 
  filters: ReportFilters
): ECGReportMetadata[] {
  return reports.filter(report => {
    // Filter by patient name
    if (filters.name) {
      const searchName = filters.name.toLowerCase();
      const patientName = (report.patient?.name || "").toLowerCase();
      if (!patientName.includes(searchName)) {
        return false;  
      }
    }

    // Filter by phone number
    if (filters.phone) {
      const searchPhone = filters.phone.toLowerCase();
      const patientPhone = report.patient.phone?.toLowerCase() || '';
      if (!patientPhone.includes(searchPhone)) {
        return false;
      }
    }

    // Filter by device ID
    if (filters.deviceId) {
      const searchDeviceId = filters.deviceId.toLowerCase();
      const deviceId = (report.deviceId || "").toLowerCase();
      if (!deviceId.includes(searchDeviceId)) {
        return false;
      }
    }

    // Filter by start date
    if (filters.startDate) {
      const reportDate = new Date(report.timestamp);
      const startDate = new Date(filters.startDate);
      if (reportDate < startDate) {
        return false;
      }
    }

    // Filter by end date
    if (filters.endDate) {
      const reportDate = new Date(report.timestamp);
      const endDate = new Date(filters.endDate);
      if (reportDate > endDate) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Main handler function for reports listing
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
    // Parse and validate query parameters
    const queryParams = event.queryStringParameters || {};
    
    const filters: ReportFilters = {
      name: queryParams.name,
      phone: queryParams.phone,
      deviceId: queryParams.deviceId,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate
    };

    const validation = validateReportFilters(filters);
    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors);
    }

    // List all objects in S3
    const objects = await listECGObjects();
    
    // Filter only JSON files
    const jsonObjects = objects.filter(obj => obj.Key && obj.Key.endsWith('.json'));
    
    if (jsonObjects.length === 0) {
      const response: ReportsResponse = {
        success: true,
        data: [],
        metadata: {
          total: 0,
          filtered: 0
        }
      };
      return createSuccessResponse(response);
    }

    // Extract record IDs from JSON object keys
    const recordIds = jsonObjects
      .map(obj => {
        const key = obj.Key!;
        const filename = key.split('/').pop() || '';
        return filename.replace('.json', '');
      })
      .filter(recordId => recordId.length > 0);

    // Batch fetch all ECG records
    const records = await batchGetECGRecords(recordIds);

    // Transform records to metadata format
    const reports: ECGReportMetadata[] = records.map(record => {
      const jsonKey = `${record.recordId}.json`;
      const pdfKey = `${record.recordId}.pdf`;
      
      // Find corresponding S3 objects for metadata
      const jsonObj = jsonObjects.find(obj => obj.Key?.endsWith(jsonKey));
      const pdfObj = objects.find(obj => obj.Key?.endsWith(pdfKey));

      return {
        recordId: record.recordId,
        deviceId: record.deviceId || "",
        patient: {
          id: record.patient.id,
          name: record.patient.name,
          phone: record.patient.phone|| ""
        },
        timestamp: record.timestamp,
      createdAt: record.timestamp || new Date().toISOString(),
        fileSize: jsonObj?.Size,
        hasPdf: !!pdfObj
      };
    });

    // Apply filters
    const filteredReports = filterReports(reports, filters);

    // Sort by timestamp (newest first)
    filteredReports.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const response: ReportsResponse = {
      success: true,
      data: filteredReports,
      metadata: {
        total: reports.length,
        filtered: filteredReports.length
      }
    };

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Reports handler error:', error);
    
    // Error handling is already wrapped by withErrorHandler
    throw error;
  }
});
