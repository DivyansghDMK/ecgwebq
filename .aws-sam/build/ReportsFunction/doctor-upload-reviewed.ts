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
    const boundary = "--" + boundaryMatch[1];

    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body, "utf8");

    const parts = bodyBuffer
      .toString("binary")
      .split(boundary)
      .filter((part) => part.includes("Content-Disposition"));

    let originalFileName = "";
    let doctorId = "";
    let pdfBuffer: Buffer | null = null;

    for (const part of parts) {
      const [rawHeaders, rawContent] = part.split("\r\n\r\n");
      if (!rawContent) continue;

      const headersLines = rawHeaders.split("\r\n").filter(Boolean);
      const dispositionLine =
        headersLines.find((h) =>
          h.toLowerCase().startsWith("content-disposition")
        ) || "";

      const nameMatch = /name="([^"]+)"/i.exec(dispositionLine);
      const filenameMatch = /filename="([^"]+)"/i.exec(dispositionLine);
      const fieldName = nameMatch?.[1];

      // Trim trailing boundary markers/newlines
      const cleaned = rawContent.replace(/\r\n--$/g, "");

      if (filenameMatch && fieldName === "reviewedPdf") {
        // File content
        pdfBuffer = Buffer.from(cleaned, "binary");
        if (!originalFileName) {
          originalFileName = filenameMatch[1];
        }
      } else if (fieldName === "originalFileName") {
        originalFileName = cleaned.trim();
      } else if (fieldName === "doctorId") {
        doctorId = cleaned.trim();
      }
    }

    if (!pdfBuffer) {
      return badRequest("Missing reviewedPdf file");
    }
    if (!originalFileName) {
      return badRequest("Missing originalFileName field");
    }
    if (!doctorId) {
      return badRequest("Missing doctorId field");
    }

    const baseName = originalFileName.replace(/^.*[\\/]/, "").replace(/\.pdf$/i, "");
    const uploadResult = await uploadReviewedPDF(baseName, pdfBuffer, doctorId);

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


