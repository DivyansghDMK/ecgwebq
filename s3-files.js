/**
 * S3 Files Listing API
 * Lists all files from ecg-reports/ bucket with pagination support
 */

const { listECGObjects, generatePresignedUrlFromKey } = require('./services/s3Service');

/**
 * Main handler for listing S3 files
 */
exports.handler = async (event) => {
  console.log('S3 Files List Request:', JSON.stringify(event, null, 2));
  console.log('Event type:', typeof event);
  console.log('Event keys:', Object.keys(event));

  // Handle CORS preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  try {
    // Support both HTTP API v2.0 and REST API event formats
    let queryStringParameters = {};
    if (event.queryStringParameters) {
      queryStringParameters = event.queryStringParameters;
    } else if (event.queryStringParameters === null) {
      queryStringParameters = {};
    }

    const page = parseInt(queryStringParameters.page || '1', 10);
    const limit = parseInt(queryStringParameters.limit || '20', 10);
    const search = queryStringParameters.search || '';

    console.log('Parsed parameters:', { page, limit, search });

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createErrorResponse('Invalid pagination parameters. Page must be >= 1 and limit must be between 1-100', 400);
    }
    
    console.log('Starting to list S3 objects...');
    // Get all objects from S3
    const allObjects = await listECGObjects();
    console.log(`Retrieved ${allObjects.length} objects from S3`);
    
    // Filter objects if search term is provided
    let filteredObjects = allObjects.filter(obj => obj && obj.Key); // Safety: filter out invalid objects
    if (search) {
      const searchLower = search.toLowerCase();
      filteredObjects = filteredObjects.filter(obj => 
        obj.Key && obj.Key.toLowerCase().includes(searchLower)
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

    // Generate file metadata (without URLs first to be faster)
    // URLs will be generated on-demand or in smaller batches
    const filesWithUrls = [];
    const BATCH_SIZE = 10; // Smaller batches for URL generation
    
    // First pass: create file metadata without URLs (fast)
    const fileMetadata = paginatedObjects
      .filter(obj => obj && obj.Key) // Safety check
      .map((obj) => {
        const keyParts = obj.Key.split('/');
        const filename = keyParts[keyParts.length - 1];
        const recordId = filename.replace(/\.(pdf|json)$/, '');
        
        let fileType = 'application/octet-stream';
        if (obj.Key.endsWith('.pdf')) {
          fileType = 'application/pdf';
        } else if (obj.Key.endsWith('.json')) {
          fileType = 'application/json';
        }
        
        return {
          key: obj.Key,
          name: filename,
          size: obj.Size || 0,
          lastModified: obj.LastModified,
          type: fileType,
          url: null, // Will be generated below
          recordId: recordId
        };
      });
    
    // Second pass: generate URLs in small batches (only for files that need them)
    // Prioritize PDFs since they're most commonly accessed
    const pdfFiles = fileMetadata.filter(f => f.type === 'application/pdf');
    const jsonFiles = fileMetadata.filter(f => f.type === 'application/json');
    const otherFiles = fileMetadata.filter(f => f.type === 'application/octet-stream');
    
    // Generate URLs for PDFs first (most important) - limit to avoid timeout
    const maxFilesToProcess = Math.min(pdfFiles.length, limit); // Only process files we'll return
    for (let i = 0; i < maxFilesToProcess; i += BATCH_SIZE) {
      const batch = pdfFiles.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (file) => {
          try {
            file.url = await generatePresignedUrlFromKey(file.key);
          } catch (error) {
            console.error(`Error generating URL for ${file.key}:`, error);
            file.url = null;
          }
        })
      );
    }
    
    // Generate URLs for JSON files (if time permits) - limit to avoid timeout
    const maxJsonFiles = Math.min(jsonFiles.length, Math.max(0, limit - maxFilesToProcess));
    for (let i = 0; i < maxJsonFiles; i += BATCH_SIZE) {
      const batch = jsonFiles.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (file) => {
          try {
            file.url = await generatePresignedUrlFromKey(file.key);
          } catch (error) {
            console.error(`Error generating URL for ${file.key}:`, error);
            file.url = null;
          }
        })
      );
    }
    
    // Combine all files back in original order (preserve paginatedObjects order)
    const fileMap = new Map();
    pdfFiles.forEach(f => fileMap.set(f.key, f));
    jsonFiles.forEach(f => fileMap.set(f.key, f));
    otherFiles.forEach(f => fileMap.set(f.key, f));
    
    // Reconstruct in original order from paginatedObjects
     // Ensure all files are included, even if URL generation failed
    paginatedObjects.forEach(obj => {
      if (obj && obj.Key) {
        if (fileMap.has(obj.Key)) {
          filesWithUrls.push(fileMap.get(obj.Key));
        } else {
          // Fallback: create file entry if not in map (shouldn't happen, but safety check)
          const keyParts = obj.Key.split('/');
          const filename = keyParts[keyParts.length - 1];
          const recordId = filename.replace(/\.(pdf|json)$/, '');
          let fileType = 'application/octet-stream';
          if (obj.Key.endsWith('.pdf')) {
            fileType = 'application/pdf';
          } else if (obj.Key.endsWith('.json')) {
            fileType = 'application/json';
          }
          filesWithUrls.push({
            key: obj.Key,
            name: filename,
            size: obj.Size || 0,
            lastModified: obj.LastModified,
            type: fileType,
            url: null,
            recordId: recordId
          });
        }
      }
    });

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

    const apiResponse = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      },
      body: JSON.stringify(response)
    };

    console.log('S3 Files List Response:', JSON.stringify({
      statusCode: apiResponse.statusCode,
      filesCount: filesWithUrls.length,
      total: total
    }));

    return apiResponse;

  } catch (error) {
    console.error('S3 Files List Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify({
      name: error.name,
      message: error.message,
      code: error.code
    }));
    
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
