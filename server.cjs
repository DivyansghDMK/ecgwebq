const express = require('express');
const cors = require('cors');
const path = require('path');

// Import our S3 service
const { listECGObjects, generatePresignedUrls } = require('./services/s3Service.cjs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// S3 Files endpoint
app.get('/api/s3-files', async (req, res) => {
  try {
    console.log('S3 Files List Request:', JSON.stringify(req.query, null, 2));

    // Parse query parameters for pagination
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '50');
    const search = req.query.search || '';

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1-100',
          code: 'S3_LIST_ERROR_400'
        }
      });
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

    res.json(response);

  } catch (error) {
    console.error('S3 Files List Error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: `Failed to list S3 files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'S3_LIST_ERROR_500'
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  GET  http://localhost:${PORT}/api/s3-files?page={page}&limit={limit}&search={search}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔸 Shutting down server...');
  process.exit(0);
});
