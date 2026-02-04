const { generatePresignedUrls, checkRecordExists } = require('./services/s3Service');
const { createSuccessResponse, createErrorResponse } = require('./utils/response');
const { sanitizeString } = require('./utils/validation');

exports.handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'
      },
      body: ''
    };
  }

  try {
    const { id } = event.queryStringParameters || {};

    if (!id) {
      return createErrorResponse('Report ID is required', 400);
    }

    const cleanId = sanitizeString(id);

    const reportId = cleanId
      .replace(/^ecg-data\//, '')
      .replace(/\.json$/, '')
      .replace(/\.pdf$/, '');

    const exists = await checkRecordExists(reportId);
    if (!exists) {
      return createErrorResponse('Report not found', 404);
    }

    const urls = await generatePresignedUrls(reportId);

    return createSuccessResponse({
      jsonUrl: urls.jsonUrl,
      pdfUrl: urls.pdfUrl,
      expiresIn: 300,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Report fetch error:', error);
    return createErrorResponse('Failed to fetch report', 500);
  }
};
