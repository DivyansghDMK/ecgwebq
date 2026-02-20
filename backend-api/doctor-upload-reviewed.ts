/**
 * API Handler: POST /api/doctor/upload-reviewed
 * Accepts multipart/form-data with reviewedPdf, originalFileName, doctorId
 * and uploads the reviewed PDF to S3 using the shared S3 service.
 */

import { APIGatewayEvent, APIGatewayResponse } from "./types/ecg";
import { uploadReviewedPDF } from "./services/s3Service";
import { createSuccessResponse, withErrorHandler } from "./utils/response";

function badRequest(message: string): APIGatewayResponse {
  return {
    statusCode: 400,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      success: false,
      error: { message },
    }),
  };
}

export const handler = withErrorHandler(
  async (event: any): Promise<APIGatewayResponse> => {
    // Support both REST API (v1) and HTTP API (v2) event formats
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod;
    const routeKey = event.routeKey; // HTTP API v2 format: "POST /api/doctor/upload-reviewed"
    
    // Check method - support both formats
    const method = httpMethod || (routeKey ? routeKey.split(' ')[0] : null);
    
    if (method !== "POST") {
      if (method === "OPTIONS") {
        return createSuccessResponse({ message: "CORS preflight" }, 200);
      }
      return createSuccessResponse({ message: "Method not allowed" }, 405);
    }

    // Support both REST API and HTTP API v2 header formats
    const headers = event.headers || {};
    const contentType =
      headers["content-type"] ||
      headers["Content-Type"] ||
      headers["content-type".toLowerCase()] ||
      headers["Content-Type".toLowerCase()];

    if (!contentType || !contentType.includes("multipart/form-data")) {
      return badRequest("Content-Type must be multipart/form-data");
    }

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const boundaryMatch = /boundary=([^;]+)/i.exec(contentType);
    if (!boundaryMatch) {
      return badRequest("Invalid multipart boundary");
    }
    
    // 1. Get the raw body buffer
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body, "utf8");

    // 2. Define the boundary marker (e.g., --boundary)
    const boundary = boundaryMatch[1];
    const boundaryMarker = Buffer.from(`--${boundary}`);

    let originalFileName = "";
    let doctorId = "";
    let pdfBuffer: Buffer | null = null;

    // 3. Robust Buffer-based parsing
    let currentPos = bodyBuffer.indexOf(boundaryMarker);
    if (currentPos === -1) {
        return badRequest("No multipart parts found");
    }
    
    // Move past the first boundary
    currentPos += boundaryMarker.length;

    while (true) {
        // Find the next boundary
        const nextBoundary = bodyBuffer.indexOf(boundaryMarker, currentPos);
        if (nextBoundary === -1) break;

        // Extract the chunk between boundaries
        // Typically: \r\n(Headers)\r\n\r\n(Body)\r\n
        let chunk = bodyBuffer.subarray(currentPos, nextBoundary);
        
        // Update currentPos for next iteration
        currentPos = nextBoundary + boundaryMarker.length;

        // Remove leading CRLF if present
        if (chunk.length >= 2 && chunk[0] === 13 && chunk[1] === 10) {
            chunk = chunk.subarray(2);
        }
        
        // Remove trailing CRLF if present
        if (chunk.length >= 2 && chunk[chunk.length - 2] === 13 && chunk[chunk.length - 1] === 10) {
            chunk = chunk.subarray(0, chunk.length - 2);
        }

        // Find the separator between headers and body
        const sep = Buffer.from("\r\n\r\n");
        const sepIndex = chunk.indexOf(sep);
        
        if (sepIndex === -1) continue; // Malformed part

        const headersRaw = chunk.subarray(0, sepIndex).toString("utf8");
        const content = chunk.subarray(sepIndex + 4);

        // Parse headers to find Content-Disposition
        const headersLines = headersRaw.split("\r\n");
        const dispositionLine = headersLines.find(h => h.toLowerCase().startsWith("content-disposition")) || "";
        
        const nameMatch = /name="([^"]+)"/i.exec(dispositionLine);
        const filenameMatch = /filename="([^"]+)"/i.exec(dispositionLine);
        
        const fieldName = nameMatch?.[1];

        if (filenameMatch && fieldName === "reviewedPdf") {
             // It's the file
             pdfBuffer = content;
             if (!originalFileName) {
                 originalFileName = filenameMatch[1];
             }
        } else if (fieldName === "originalFileName") {
             originalFileName = content.toString("utf8").trim();
        } else if (fieldName === "doctorId") {
             doctorId = content.toString("utf8").trim();
        }
    }

    if (!pdfBuffer) {
      return badRequest("No reviewedPdf file uploaded");
    }
    if (!originalFileName) {
      return badRequest("originalFileName is required");
    }
    if (!doctorId) {
      return badRequest("doctorId is required");
    }

    const uploadResult = await uploadReviewedPDF(
      originalFileName,
      pdfBuffer,
      doctorId
    );

    return createSuccessResponse(
      {
        success: true,
        data: {
          key: uploadResult.Key,
          etag: uploadResult.ETag,
        },
      },
      200
    );
  }
);


