const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Main handler for listing S3 files
 */
exports.handler = async (event) => {
  try {
    console.log('S3 Files List Request:', JSON.stringify(event, null, 2));

    // Parse query parameters for pagination
    const queryStringParameters = event.queryStringParameters || {};
    const page = parseInt(queryStringParameters.page || '1');
    const limit = parseInt(queryStringParameters.limit || '50');
    const search = queryStringParameters.search || '';

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1-100',
            code: 'S3_LIST_ERROR_400'
          }
        })
      };
    }

    // Get all objects from S3
    const allObjects = [];
    let continuationToken = null;

    do {
      const params = {
        Bucket: process.env.S3_BUCKET || 'deck-backend-demo',
        Prefix: 'ecg-reports/',
        MaxKeys: 1000
      };

      if (continuationToken) {
        params.ContinuationToken = continuationToken;
      }

      const response = await s3.listObjectsV2(params).promise();

      if (response.Contents) {
        const objects = response.Contents.map((obj) => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified.toISOString(),
          eTag: obj.ETag
        }));
        allObjects.push(...objects);
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // Filter objects if search term is provided
    let filteredObjects = allObjects;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredObjects = allObjects.filter(obj => 
        obj.key && obj.key.toLowerCase().includes(searchLower)
      );
    }

    // Sort objects by last modified date (newest first)
    filteredObjects.sort((a, b) => {
      const dateA = new Date(a.lastModified || '').getTime();
      const dateB = new Date(b.lastModified || '').getTime();
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
        const recordId = obj.key ? obj.key.replace(/^ecg-reports\//, '').replace(/\.(pdf|json)$/, '') : '';
        
        try {
          // Generate pre-signed URL for PDF files
          if (obj.key && obj.key.endsWith('.pdf')) {
            const pdfUrl = s3.getSignedUrl('getObject', {
              Bucket: process.env.S3_BUCKET || 'deck-backend-demo',
              Key: obj.key,
              Expires: 300 // 5 minutes
            });
            
            return {
              key: obj.key,
              name: obj.key.split('/').pop() || obj.key,
              size: obj.size || 0,
              lastModified: obj.lastModified,
              type: 'application/pdf',
              url: pdfUrl,
              recordId: recordId
            };
          }
          
          // Handle JSON files
          if (obj.key && obj.key.endsWith('.json')) {
            const jsonUrl = s3.getSignedUrl('getObject', {
              Bucket: process.env.S3_BUCKET || 'deck-backend-demo',
              Key: obj.key,
              Expires: 300 // 5 minutes
            });
            
            return {
              key: obj.key,
              name: obj.key.split('/').pop() || obj.key,
              size: obj.size || 0,
              lastModified: obj.lastModified,
              type: 'application/json',
              url: jsonUrl,
              recordId: recordId
            };
          }

          // Handle other file types
          return {
            key: obj.key || '',
            name: obj.key ? obj.key.split('/').pop() || obj.key : '',
            size: obj.size || 0,
            lastModified: obj.lastModified,
            type: 'application/octet-stream',
            url: null,
            recordId: recordId
          };
        } catch (error) {
          console.error(`Error generating URL for ${obj.key || 'unknown'}:`, error);
          return {
            key: obj.key || '',
            name: obj.key ? obj.key.split('/').pop() || obj.key : '',
            size: obj.size || 0,
            lastModified: obj.lastModified,
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
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('S3 Files List Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: false,
        error: {
          message: `Failed to list S3 files: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'S3_LIST_ERROR_500'
        }
      })
    };
  }
};
