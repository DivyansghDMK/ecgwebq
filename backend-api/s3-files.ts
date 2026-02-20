/**
 * S3 Files Listing API
 * Lists all files from ecg-reports/ bucket with pagination support
 */

// Import S3 service functions
const { listECGObjects, generatePresignedUrls } = require('../services/s3Service');

// Type definitions
interface APIGatewayProxyEvent {
  queryStringParameters?: { [key: string]: string | null };
}

interface APIGatewayProxyResult {
  statusCode: number;
  headers?: { [key: string]: string };
  body: string;
}

interface S3Object {
  Key?: string;
  Size?: number;
  LastModified?: string;
  ETag?: string;
}

interface FileWithUrl {
  key: string;
  name: string;
  size: number;
  lastModified?: string;
  type: string;
  url?: string | null;
  recordId: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface APIResponse {
  success: boolean;
  data?: {
    files: FileWithUrl[];
    pagination: PaginationInfo;
  };
  metadata?: {
    total: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Main handler for listing S3 files
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('S3 Files List Request:', JSON.stringify(event, null, 2));

  try {
    // Parse query parameters for pagination
    const queryStringParameters = event.queryStringParameters || {};
    const page = parseInt(queryStringParameters.page || '1');
    const limit = parseInt(queryStringParameters.limit || '50');
    const search = queryStringParameters.search || '';

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createErrorResponse('Invalid pagination parameters. Page must be >= 1 and limit must be between 1-100', 400);
    }

    // Get all objects from S3
    const allObjects = await listECGObjects();
    
    // Filter objects if search term is provided
    let filteredObjects = allObjects;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredObjects = allObjects.filter((obj: S3Object) => 
        obj.Key && obj.Key.toLowerCase().includes(searchLower)
      );
    }

    // Sort objects by last modified date (newest first)
    filteredObjects.sort((a: S3Object, b: S3Object) => {
      const dateA = new Date(a.LastModified || '').getTime();
      const dateB = new Date(b.LastModified || '').getTime();
      return dateB - dateA;
    });

    // Calculate pagination
    const total = filteredObjects.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedObjects = filteredObjects.slice(startIndex, endIndex);

    // Generate pre-signed URLs for each file
    const filesWithUrls = await Promise.all(
      paginatedObjects.map(async (obj: S3Object) => {
        // Extract record ID from key (remove prefix and extension)
        const recordId = obj.Key ? obj.Key.replace(/^ecg-reports\//, '').replace(/\.(pdf|json)$/, '') : '';
        
        try {
          // Generate pre-signed URL for PDF files
          if (obj.Key && obj.Key.endsWith('.pdf')) {
            const pdfUrl = await generatePresignedUrls(recordId);
            return {
              key: obj.Key,
              name: obj.Key.split('/').pop() || obj.Key,
              size: obj.Size || 0,
              lastModified: obj.LastModified,
              type: 'application/pdf',
              url: pdfUrl.pdfUrl,
              recordId: recordId
            };
          }
          
          // Handle JSON files
          if (obj.Key && obj.Key.endsWith('.json')) {
            const jsonUrl = await generatePresignedUrls(recordId);
            return {
              key: obj.Key,
              name: obj.Key.split('/').pop() || obj.Key,
              size: obj.Size || 0,
              lastModified: obj.LastModified,
              type: 'application/json',
              url: jsonUrl.jsonUrl,
              recordId: recordId
            };
          }

          // Handle other file types
          return {
            key: obj.Key || '',
            name: obj.Key ? obj.Key.split('/').pop() || obj.Key : '',
            size: obj.Size || 0,
            lastModified: obj.LastModified,
            type: 'application/octet-stream',
            url: null,
            recordId: recordId
          };
        } catch (error) {
          console.error(`Error generating URL for ${obj.Key || 'unknown'}:`, error);
          return {
            key: obj.Key || '',
            name: obj.Key ? obj.Key.split('/').pop() || obj.Key : '',
            size: obj.Size || 0,
            lastModified: obj.LastModified,
            type: 'application/octet-stream',
            url: null,
            recordId: recordId
          };
        }
      })
    );

    // Create response
    const response: APIResponse = {
      success: true,
      data: {
        files: filesWithUrls,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      metadata: {
        total
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('S3 Files List Error:', error);
    
    return createErrorResponse(
      `Failed to list S3 files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
};

/**
 * Creates a standardized error response
 */
function createErrorResponse(message: string, statusCode: number): APIGatewayProxyResult {
  const response: APIResponse = {
    success: false,
    error: {
      message,
      code: `S3_LIST_ERROR_${statusCode}`
    }
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    },
    body: JSON.stringify(response)
  };
}
