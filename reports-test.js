const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

exports.handler = async (event) => {
  console.log('=== SIMPLE TEST START ===');
  
  try {
    // Handle CORS
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

    console.log('Environment variables:', {
      S3_BUCKET: process.env.S3_BUCKET,
      AWS_REGION: process.env.AWS_REGION
    });

    if (!process.env.S3_BUCKET) {
      console.error('S3_BUCKET not set');
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'S3_BUCKET environment variable not set' })
      };
    }

    // Simple S3 test
    const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    
    const listParams = {
      Bucket: process.env.S3_BUCKET,
      Prefix: 'ecg-data/'
    };

    console.log('Testing S3 connection with params:', listParams);
    
    const command = new ListObjectsV2Command(listParams);
    const result = await s3Client.send(command);
    
    console.log('S3 Success! Objects found:', result.Contents?.length || 0);
    
    const mockReports = result.Contents?.map(obj => ({
      id: obj.Key.replace('ecg-data/', '').replace('.json', ''),
      name: 'Test Patient',
      date: obj.LastModified.toISOString(),
      size: obj.Size
    })) || [];

    console.log('Returning mock reports:', mockReports.length);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: {
          total: mockReports.length,
          reports: mockReports
        }
      })
    };

  } catch (error) {
    console.error('=== SIMPLE TEST ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      })
    };
  }
};
