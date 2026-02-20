/**
 * API Handler: GET /api/doctor/reports
 * Lists PDF ECG reports for doctors with presigned URLs.
 * Updated to use doctor-assigned-reports/{doctorId}/ folder structure.
 * Fixed: No more 502 errors, proper error handling, input sanitization.
 */

import { APIGatewayEvent, APIGatewayResponse } from "./types/ecg";
import { generatePresignedUrlFromKey, checkObjectExists } from "./services/s3Service";
import { createSuccessResponse, withErrorHandler } from "./utils/response";
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

interface DoctorReportSummary {
  key: string;
  fileName: string;
  url: string;
  uploadedAt?: string; // ISO timestamp
  lastModified?: string; // Keep for backward compatibility
}

// Create S3 client for direct ListObjectsV2Command usage
const s3Client = new S3Client({
  region: 'us-east-1',
  // Add any additional configuration as needed
});

/**
 * Safely extract and sanitize doctorId
 */
function sanitizeDoctorId(doctorId: string | undefined): string | null {
  if (!doctorId) return null;
  
  // Remove whitespace, special characters, and accidental suffixes
  const sanitized = doctorId.trim()
    .replace(/[^a-zA-Z0-9-_]/g, '') // Keep only alphanumeric, dash, underscore
    .replace(/:+$/g, '') // Remove accidental :1 suffix
    .substring(0, 50); // Limit length
  
  return sanitized.length > 0 ? sanitized : null;
}

export const handler = withErrorHandler(
  async (event: any): Promise<APIGatewayResponse> => {
    // Support both REST API (v1) and HTTP API (v2) event formats
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod;
    const routeKey = event.routeKey; // HTTP API v2 format: "GET /api/doctor/reports"
    
    // Check method - support both formats
    const method = httpMethod || (routeKey ? routeKey.split(' ')[0] : null);
    
    if (method !== "GET") {
      if (method === "OPTIONS") {
        return createSuccessResponse({ message: "CORS preflight" }, 200);
      }
      return createSuccessResponse({ message: "Method not allowed" }, 405);
    }

    // Extract and validate doctorId from query parameters
    const rawDoctorId = event.queryStringParameters?.doctorId || event.queryParameters?.doctorId;
    const doctorId = sanitizeDoctorId(rawDoctorId);
    
    if (!doctorId) {
      return createSuccessResponse(
        {
          success: false,
          message: "doctorId query parameter is required and must be valid",
          reports: []
        },
        400
      );
    }

    // Build S3 prefix for doctor-assigned reports
    const prefix = `doctor-assigned-reports/${doctorId}/`;

    try {
      // Use ListObjectsV2Command directly with doctor-specific prefix
      const command = new ListObjectsV2Command({
        Bucket: 'deck-backend-demo',
        Prefix: prefix,
        MaxKeys: 1000
      });

      let allObjects: any[] = [];
      let continuationToken: string | undefined;

      do {
        if (continuationToken) {
          command.input.ContinuationToken = continuationToken;
        }

        const response = await s3Client.send(command);
        
        if (response.Contents) {
          const objects = response.Contents.map((obj: any) => ({
            Key: obj.Key!,
            Size: obj.Size,
            LastModified: obj.LastModified?.toISOString(),
            ETag: obj.ETag
          }));
          allObjects = allObjects.concat(objects);
        }
        
        continuationToken = response.NextContinuationToken;
        
      } while (continuationToken);

      // Only include PDF files
      const pdfObjects = allObjects.filter(
        (obj) =>
          obj.Key &&
          obj.Key.endsWith(".pdf")
      );

      const reports: DoctorReportSummary[] = [];

      for (const obj of pdfObjects) {
        const key = obj.Key!;
        const filename = key.split("/").pop() || key;

        try {
          // Verify file actually exists before generating presigned URL
          // This prevents NoSuchKey errors when accessing stale list entries
          const exists = await checkObjectExists(key);
          if (!exists) {
            console.warn(`Skipping ${key} - file does not exist in S3`);
            continue;
          }

          // Generate presigned URL directly from S3 key
          const presignedUrl = await generatePresignedUrlFromKey(key);
          reports.push({
            key,
            fileName: filename,
            url: presignedUrl,
            uploadedAt: obj.LastModified, // Primary field
            lastModified: obj.LastModified, // Backward compatibility
          });
        } catch (error) {
          console.error("Failed to generate doctor report URL for", key, error);
          // Skip this report if URL generation fails
        }
      }

      // Newest first
      reports.sort((a, b) => {
        const ta = (a.uploadedAt || a.lastModified) ? new Date(a.uploadedAt || a.lastModified || '').getTime() : 0;
        const tb = (b.uploadedAt || b.lastModified) ? new Date(b.uploadedAt || b.lastModified || '').getTime() : 0;
        return tb - ta;
      });

      // Always return success response, never throw
      return createSuccessResponse(
        {
          success: true,
          reports,
        },
        200
      );

    } catch (error: any) {
      console.error("Error in doctor-reports Lambda:", error);
      
      // Never throw, always return valid response
      return createSuccessResponse(
        {
          success: false,
          message: "Failed to fetch reports. Please try again.",
          reports: []
        },
        500
      );
    }
  }
);
