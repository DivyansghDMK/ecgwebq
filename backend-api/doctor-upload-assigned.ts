import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayEvent, APIGatewayResponse } from "./types/ecg";
import { createSuccessResponse, withErrorHandler } from "./utils/response";

// Initialize S3 Client
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET || 'deck-backend-demo';

// Helper to return bad request
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
    // 1. HTTP Method Check
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod;
    const routeKey = event.routeKey;
    const method = httpMethod || (routeKey ? routeKey.split(' ')[0] : null);

    if (method !== "POST") {
      if (method === "OPTIONS") {
        return createSuccessResponse({ message: "CORS preflight" }, 200);
      }
      return createSuccessResponse({ message: "Method not allowed" }, 405);
    }

    // 2. Content-Type Check
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

    // 3. Parse Multipart Body
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

    let fileName = "";
    let doctorId = "";
    let fileBuffer: Buffer | null = null;

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

      if (filenameMatch && fieldName === "file") {
        fileBuffer = Buffer.from(cleaned, "binary");
        if (!fileName) {
          fileName = filenameMatch[1];
        }
      } else if (fieldName === "doctorId") {
        doctorId = cleaned.trim();
      }
    }

    // 4. Validate Fields
    if (!fileBuffer) return badRequest("Missing file");
    if (!doctorId) return badRequest("Missing doctorId");
    if (!fileName) fileName = "uploaded-report.pdf"; // Fallback

    // 5. Generate S3 Key
    // Structure: doctor-assigned-reports/{doctorId}/{YYYY}/{MM}/{DD}/{fileName}
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    
    // Sanitize filename
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `doctor-assigned-reports/${doctorId}/${yyyy}/${mm}/${dd}/${safeFileName}`;

    // 6. Upload to S3
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: "application/pdf",
        Metadata: {
          doctorId,
          uploadedAt: now.toISOString(),
          originalName: fileName
        }
      });

      await s3Client.send(command);

      return createSuccessResponse(
        {
          success: true,
          message: "File uploaded successfully",
          key,
          location: `s3://${BUCKET_NAME}/${key}`
        },
        201
      );

    } catch (error: any) {
      console.error("S3 Upload Error:", error);
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          error: { message: "Failed to upload file to storage" }
        })
      };
    }
  }
);
