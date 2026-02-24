/**
 * API Handler: POST /api/doctor/upload
 * Uploads PDF reports to doctor-assigned-reports/{doctorId}/ folder
 * For teammate's Python application to assign reports to doctors
 */

import { APIGatewayEvent, APIGatewayResponse } from "./types/ecg";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createSuccessResponse, withErrorHandler } from "./utils/response";
import { randomUUID } from 'crypto';

interface UploadResponse {
  success: boolean;
  message: string;
  fileName?: string;
  s3Key?: string;
  uploadedAt?: string;
}

// Create S3 client
const s3Client = new S3Client({
  region: 'us-east-1',
});

// Validate API key
const validateApiKey = (apiKey: string | undefined): boolean => {
  // You should set this as an environment variable
  const expectedApiKey = process.env.DOCTOR_UPLOAD_API_KEY;
  return apiKey === expectedApiKey;
};

// Generate unique filename
const generateFileName = (originalName: string, patientName?: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const patientPrefix = patientName ? `${patientName.replace(/[^a-zA-Z0-9]/g, '_')}_` : '';
  const extension = originalName.endsWith('.pdf') ? '.pdf' : '.pdf';
  return `ECG_Report_${patientPrefix}${timestamp}${extension}`;
};

export const handler = withErrorHandler(
  async (event: any): Promise<APIGatewayResponse> => {
    // Support both REST API (v1) and HTTP API (v2) event formats
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod;
    const routeKey = event.routeKey; // HTTP API v2 format: "POST /api/doctor/upload"
    
    // Check method - support both formats
    const method = httpMethod || (routeKey ? routeKey.split(' ')[0] : null);
    
    if (method !== "POST") {
      if (method === "OPTIONS") {
        return createSuccessResponse({ message: "CORS preflight" }, 200);
      }
      return createSuccessResponse({ message: "Method not allowed" }, 405);
    }

    // Validate API key
    const apiKey = event.headers?.['x-api-key'] || event.headers?.['X-API-Key'];
    if (!validateApiKey(apiKey)) {
      return createSuccessResponse(
        {
          success: false,
          message: "Invalid or missing API key"
        },
        401
      );
    }

    try {
      // Parse multipart form data
      const contentType = event.headers?.['content-type'] || event.headers?.['Content-Type'];
      
      if (!contentType || !contentType.includes('multipart/form-data')) {
        return createSuccessResponse(
          {
            success: false,
            message: "Content-Type must be multipart/form-data"
          },
          400
        );
      }

      // Parse the multipart body (simplified approach)
      const body = event.body || event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : '';
      
      // Extract form data (this is a simplified parser - you might need a more robust solution)
      const formData = parseMultipartData(body, contentType);
      
      // Validate required fields
      const doctorId = formData.doctorId;
      const pdfFile = formData.pdfFile;
      
      if (!doctorId) {
        return createSuccessResponse(
          {
            success: false,
            message: "doctorId is required"
          },
          400
        );
      }
      
      if (!pdfFile || !pdfFile.data) {
        return createSuccessResponse(
          {
            success: false,
            message: "PDF file is required"
          },
          400
        );
      }

      // Generate filename and S3 key
      const patientName = formData.patientName || '';
      const fileName = generateFileName(pdfFile.name || 'report.pdf', patientName);
      const s3Key = `doctor-assigned-reports/${doctorId}/${fileName}`;

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: 'deck-backend-demo',
        Key: s3Key,
        Body: Buffer.from(pdfFile.data, 'base64'),
        ContentType: 'application/pdf',
        Metadata: {
          doctorId: doctorId,
          patientName: patientName || '',
          uploadedBy: 'teammate-app',
          uploadedAt: new Date().toISOString()
        }
      });

      await s3Client.send(uploadCommand);

      // Return success response
      const response: UploadResponse = {
        success: true,
        message: "Report uploaded successfully",
        fileName: fileName,
        s3Key: s3Key,
        uploadedAt: new Date().toISOString()
      };

      return createSuccessResponse(response, 200);

    } catch (error: any) {
      console.error("Upload error:", error);
      return createSuccessResponse(
        {
          success: false,
          message: error.message || "Failed to upload report"
        },
        500
      );
    }
  }
);

// Simple multipart parser (you may need to enhance this)
function parseMultipartData(body: string, contentType: string): any {
  const formData: any = {};
  
  try {
    // This is a basic parser - for production, consider using a library like 'multer' or similar
    const boundary = contentType.split('boundary=')[1];
    const parts = body.split(`--${boundary}`);
    
    for (const part of parts) {
      if (part.includes('Content-Disposition')) {
        const nameMatch = part.match(/name="([^"]+)"/);
        const filenameMatch = part.match(/filename="([^"]+)"/);
        
        if (nameMatch) {
          const fieldName = nameMatch[1];
          const dataStart = part.indexOf('\r\n\r\n') + 4;
          const dataEnd = part.lastIndexOf('\r\n');
          const data = part.substring(dataStart, dataEnd);
          
          if (filenameMatch) {
            formData[fieldName] = {
              name: filenameMatch[1],
              data: data.trim()
            };
          } else {
            formData[fieldName] = data.trim();
          }
        }
      }
    }
  } catch (error) {
    console.error("Multipart parsing error:", error);
  }
  
  return formData;
}
