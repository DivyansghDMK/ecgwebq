/**
 * S3 File Content API
 * Fetches the actual content of a file from S3 by key
 * Used to avoid CORS issues when fetching JSON files directly from S3
 */

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3_CONFIG } from './types/ecg';

// Initialize S3 client
const s3Client = new S3Client({
  region: S3_CONFIG.REGION,
  maxAttempts: 3,
  retryMode: 'adaptive'
});

import { APIGatewayEvent } from './types/ecg';

// Type definitions
interface APIGatewayProxyResult {
  statusCode: number;
  headers?: { [key: string]: string };
  body: string;
}

interface APIResponse {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Lambda handler for fetching S3 file content
 */
export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Get key from query parameters
    const key = event.queryStringParameters?.key;

    if (!key) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Missing required parameter: key',
            code: 'MISSING_KEY',
          },
        } as APIResponse),
      };
    }

    // Decode the key (in case it's URL encoded)
    const decodedKey = decodeURIComponent(key);

    // Fetch the object from S3
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: decodedKey,
    });

    const response = await s3Client.send(command);
    const content = await response.Body?.transformToString();

    if (!content) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: {
            message: 'File content is empty or not found',
            code: 'EMPTY_FILE',
          },
        } as APIResponse),
      };
    }

    // Parse JSON if it's a JSON file
    let parsedContent: any;
    if (decodedKey.endsWith('.json')) {
      try {
        parsedContent = JSON.parse(content);
      } catch (parseError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: {
              message: 'Invalid JSON content',
              code: 'INVALID_JSON',
            },
          } as APIResponse),
        };
      }
    } else {
      // For non-JSON files, return as string
      parsedContent = content;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: parsedContent,
      } as APIResponse),
    };
  } catch (error: any) {
    console.error('Error fetching S3 file content:', error);

    // Handle specific S3 errors
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: {
            message: 'File not found in S3',
            code: 'FILE_NOT_FOUND',
          },
        } as APIResponse),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: {
          message: error.message || 'Failed to fetch file content',
          code: 'S3_FETCH_ERROR',
        },
      } as APIResponse),
    };
  }
};

