/**
 * S3 Files Listing API
 * Lists all files from ecg-reports/ bucket with pagination support
 */

const { listECGObjects, generatePresignedUrls } = require('./services/s3Service');

/**
 * Main handler for listing S3 files
 */
exports.handler = async (event) => {
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
      filteredObjects = allObjects.filter(obj => 
        obj.Key.toLowerCase().includes(searchLower)
      );
    }

    // Sort objects by last modified date (newest first)
    filteredObjects.sort((a, b) => {
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
      paginatedObjects.map(async (obj) => {
        // Extract record ID from key (remove prefix and extension)
        const recordId = obj.Key.replace(/^ecg-reports\//, '').replace(/\.(pdf|json)$/, '');
        
        try {
          // Generate pre-signed URL for PDF files
          if (obj.Key.endsWith('.pdf')) {
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
          if (obj.Key.endsWith('.json')) {
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
            key: obj.Key,
            name: obj.Key.split('/').pop() || obj.Key,
            size: obj.Size || 0,
            lastModified: obj.LastModified,
            type: 'application/octet-stream',
            url: null,
            recordId: recordId
          };
        } catch (error) {
          console.error(`Error generating URL for ${obj.Key}:`, error);
          return {
            key: obj.Key,
            name: obj.Key.split('/').pop() || obj.Key,
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
    const response = {
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
function createErrorResponse(message, statusCode) {
  const response = {
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
