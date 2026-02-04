/**
 * API Handler: GET /api/doctor/regenerate-url
 * Regenerates a presigned URL for a specific S3 key when the original URL has expired.
 */

import { APIGatewayEvent, APIGatewayResponse } from "./types/ecg";
import { generatePresignedUrlFromKey } from "./services/s3Service";
import { createSuccessResponse, createErrorResponse, withErrorHandler } from "./utils/response";

export const handler = withErrorHandler(
  async (event: any): Promise<APIGatewayResponse> => {
    // Support both REST API (v1) and HTTP API (v2) event formats
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod;
    const routeKey = event.routeKey; // HTTP API v2 format: "GET /api/doctor/regenerate-url"
    
    // Check method - support both formats
    const method = httpMethod || (routeKey ? routeKey.split(' ')[0] : null);
    
    if (method !== "GET") {
      if (method === "OPTIONS") {
        return createSuccessResponse({ message: "CORS preflight" }, 200);
      }
      return createSuccessResponse({ message: "Method not allowed" }, 405);
    }

    // Get the S3 key from query parameters
    const queryParams = event.queryStringParameters || {};
    const key = queryParams.key;

    if (!key) {
      return createErrorResponse("Missing required parameter: key", 400);
    }

    try {
      // Generate a new presigned URL for the given key
      const presignedUrl = await generatePresignedUrlFromKey(key);
      
      return createSuccessResponse(
        {
          success: true,
          url: presignedUrl,
          key: key
        },
        200
      );
    } catch (error) {
      console.error("Failed to regenerate URL for key", key, error);
      return createErrorResponse(
        `Failed to regenerate URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }
);


