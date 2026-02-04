const { listECGObjects, getECGRecord } = require('./services/s3Service');
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
    console.log('=== REPORTS HANDLER START ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Get query parameters for filtering
    const { name, phoneNumber, deviceId } = event.queryStringParameters || {};
    console.log('Query parameters:', { name, phoneNumber, deviceId });
    
    console.log('Fetching S3 objects...');
    const s3Objects = await listECGObjects();
    console.log('S3 objects count:', s3Objects.length);

    let reports = [];

    for (const obj of s3Objects) {
      if (obj.Key && obj.Key.endsWith('.json')) {
        try {
          const recordId = obj.Key.replace(/^ecg-data\//, '').replace(/\.json$/, '');
          console.log(`Processing record: ${recordId}`);
          
          const recordData = await getECGRecord(recordId);
          console.log(`Record data for ${recordId}:`, JSON.stringify(recordData, null, 2));
          
          // Map actual S3 data structure to expected format
          const report = {
            id: recordId,
            name: recordData.patient?.name || 'Unknown',
            phoneNumber: '', // Phone not in current data structure
            deviceId: '', // Device ID not in current data structure
            date: recordData.timestamp || recordData.patient?.date_time || obj.LastModified.toISOString(),
            type: 'ECG Report',
            size: `${(obj.Size / 1024 / 1024).toFixed(2)} MB`,
            s3Key: obj.Key,
            recordId: recordId,
            // Include additional data from S3
            age: recordData.patient?.age || '',
            gender: recordData.patient?.gender || '',
            file: recordData.file || '',
            metrics: recordData.metrics || {},
            timestamp: recordData.timestamp || ''
          };
          
          reports.push(report);
          
        } catch (error) {
          console.error(`Error processing object ${obj.Key}:`, error);
          console.error('Error details:', error.message);
          // Continue processing other objects even if one fails
        }
      }
    }

    console.log('Reports before filtering:', reports.length);

    // Apply filters if provided
    if (name) {
      const beforeCount = reports.length;
      reports = reports.filter(report => 
        report.name.toLowerCase().includes(name.toLowerCase())
      );
      console.log(`Filtered by name "${name}": ${beforeCount} -> ${reports.length}`);
    }
    
    if (phoneNumber) {
      const beforeCount = reports.length;
      reports = reports.filter(report => 
        report.phoneNumber.includes(phoneNumber)
      );
      console.log(`Filtered by phoneNumber "${phoneNumber}": ${beforeCount} -> ${reports.length}`);
    }
    
    if (deviceId) {
      const beforeCount = reports.length;
      reports = reports.filter(report => 
        report.deviceId.toLowerCase().includes(deviceId.toLowerCase())
      );
      console.log(`Filtered by deviceId "${deviceId}": ${beforeCount} -> ${reports.length}`);
    }

    console.log('Final reports count:', reports.length);
    console.log('=== REPORTS HANDLER END ===');

    return createSuccessResponse({
      total: reports.length,
      reports
    });

  } catch (error) {
    console.error('=== REPORTS HANDLER ERROR ===');
    console.error('Reports fetch error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('=== END ERROR ===');
    
    return createErrorResponse(`Failed to fetch reports: ${error.message}`, 500);
  }
};
