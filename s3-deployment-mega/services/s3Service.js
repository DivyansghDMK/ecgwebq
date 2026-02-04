const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Upload ECG record to S3
async function uploadECGRecord(recordId, record) {
  try {
    const s3Key = `ecg-data/${recordId}.json`;
    const uploadParams = {
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Body: JSON.stringify(record, null, 2),
      ContentType: 'application/json'
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    
    console.log(`Successfully uploaded record ${recordId} to S3: ${s3Key}`);
    return s3Key;
  } catch (error) {
    console.error('Error uploading ECG record to S3:', error);
    throw error;
  }
}

// List all ECG objects from S3
async function listECGObjects() {
  try {
    console.log('Environment variables:', {
      S3_BUCKET: process.env.S3_BUCKET,
      AWS_REGION: process.env.AWS_REGION
    });
    
    if (!process.env.S3_BUCKET) {
      throw new Error('S3_BUCKET environment variable not set');
    }

    // First, try without prefix to see all files
    console.log('Testing without prefix...');
    const listParamsNoPrefix = {
      Bucket: process.env.S3_BUCKET
    };
    
    const commandNoPrefix = new ListObjectsV2Command(listParamsNoPrefix);
    const resultNoPrefix = await s3Client.send(commandNoPrefix);
    
    console.log('All objects in bucket:', {
      ObjectCount: resultNoPrefix.Contents?.length || 0,
      Objects: resultNoPrefix.Contents?.map(obj => ({ Key: obj.Key, Size: obj.Size }))
    });

    // Now try with ecg-data prefix
    const listParams = {
      Bucket: process.env.S3_BUCKET,
      Prefix: 'ecg-data/'
    };

    console.log('List params:', listParams);
    const command = new ListObjectsV2Command(listParams);
    const result = await s3Client.send(command);
    
    console.log('S3 List Result with prefix:', {
      Bucket: process.env.S3_BUCKET,
      Prefix: 'ecg-data/',
      ObjectCount: result.Contents?.length || 0,
      Objects: result.Contents?.map(obj => ({ Key: obj.Key, Size: obj.Size }))
    });
    
    // Return the objects with ecg-data prefix
    return result.Contents || [];
    
  } catch (error) {
    console.error('Error listing ECG objects from S3:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Check if record exists
async function checkRecordExists(recordId) {
  try {
    const s3Key = `ecg-data/${recordId}.json`;
    const getParams = {
      Bucket: process.env.S3_BUCKET,
      Key: s3Key
    };
    
    const command = new GetObjectCommand(getParams);
    await s3Client.send(command);
    
    return { jsonExists: true, pdfExists: false };
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return { jsonExists: false, pdfExists: false };
    }
    console.error('Error checking record existence:', error);
    throw error;
  }
}

// Generate pre-signed URLs for record access
async function generatePresignedUrls(recordId) {
  try {
    const jsonKey = `ecg-data/${recordId}.json`;
    const pdfKey = `ecg-reports/${recordId}.pdf`;
    
    // Generate JSON URL
    const jsonCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: jsonKey
    });
    
    const jsonUrl = await getSignedUrl(s3Client, jsonCommand, { expiresIn: 300 });
    
    // Generate PDF URL (may not exist)
    const pdfCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: pdfKey
    });
    
    let pdfUrl = null;
    try {
      pdfUrl = await getSignedUrl(s3Client, pdfCommand, { expiresIn: 300 });
    } catch (error) {
      console.log(`PDF not found for record ${recordId}, only providing JSON URL`);
    }
    
    return {
      jsonUrl,
      pdfUrl,
      expiresIn: 300
    };
    
  } catch (error) {
    console.error('Error generating pre-signed URLs:', error);
    throw error;
  }
}

// Get ECG record data from S3
async function getECGRecord(recordId) {
  try {
    const s3Key = `ecg-data/${recordId}.json`;
    const getParams = {
      Bucket: process.env.S3_BUCKET,
      Key: s3Key
    };
    
    const command = new GetObjectCommand(getParams);
    const result = await s3Client.send(command);
    
    const record = JSON.parse(await result.Body.transformToString());
    return record;
    
  } catch (error) {
    console.error('Error getting ECG record:', error);
    throw error;
  }
}

module.exports = {
  uploadECGRecord,
  listECGObjects,
  checkRecordExists,
  generatePresignedUrls,
  getECGRecord
};
