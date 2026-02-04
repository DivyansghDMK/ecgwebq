const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Helper function to extract date from recordId and build date folder path
 * Format: ECG_Report_YYYYMMDD_HHMMSS -> YYYY/MM/DD/
 */
function getDateFolderFromRecordId(recordId) {
  // Try to extract date from recordId format: ECG_Report_YYYYMMDD_HHMMSS
  const dateMatch = recordId.match(/(\d{4})(\d{2})(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${year}/${month}/${day}/`;
  }
  
  // If no date found, use current date as fallback
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}/`;
}

/**
 * Searches for a file in S3 by trying multiple date folders
 * Returns the full S3 key if found, null otherwise
 * JSON files are in ecg-data/, PDF files are in ecg-reports/
 */
async function findFileInS3(recordId, extension) {
  // Determine the prefix based on file type
  const prefix = extension === 'json' ? 'ecg-data/' : 'ecg-reports/';
  
  // First, try the date extracted from recordId
  const dateFolder = getDateFolderFromRecordId(recordId);
  let key = `${prefix}${dateFolder}${recordId}.${extension}`;
  
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key
    });
    await s3Client.send(headCommand);
    return key; // Found it!
  } catch (error) {
    if (error.name !== 'NotFound' && error.name !== 'NoSuchKey' && error.$metadata?.httpStatusCode !== 404) {
      throw error; // Re-throw non-404 errors
    }
  }
  
  // If not found, search in recent date folders (last 7 days)
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const searchDate = new Date(now);
    searchDate.setDate(now.getDate() - i);
    const year = searchDate.getFullYear();
    const month = String(searchDate.getMonth() + 1).padStart(2, '0');
    const day = String(searchDate.getDate()).padStart(2, '0');
    const searchKey = `${prefix}${year}/${month}/${day}/${recordId}.${extension}`;
    
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: searchKey
      });
      await s3Client.send(headCommand);
      return searchKey; // Found it!
    } catch (error) {
      if (error.name !== 'NotFound' && error.name !== 'NoSuchKey' && error.$metadata?.httpStatusCode !== 404) {
        throw error; // Re-throw non-404 errors
      }
    }
  }
  
  return null; // Not found in any date folder
}

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

    const allObjects = [];

    // List files from ecg-reports/ prefix (PDFs and other files)
    console.log('Listing objects from ecg-reports/ prefix...');
    let continuationToken = undefined;
    do {
      const listParamsReports = {
        Bucket: process.env.S3_BUCKET,
        Prefix: 'ecg-reports/',
        ContinuationToken: continuationToken
      };
      
      const commandReports = new ListObjectsV2Command(listParamsReports);
      const resultReports = await s3Client.send(commandReports);
      
      if (resultReports.Contents) {
        allObjects.push(...resultReports.Contents);
      }
      
      continuationToken = resultReports.NextContinuationToken;
    } while (continuationToken);

    // List files from ecg-data/ prefix (JSON files)
    console.log('Listing objects from ecg-data/ prefix...');
    continuationToken = undefined;
    do {
      const listParamsData = {
        Bucket: process.env.S3_BUCKET,
        Prefix: 'ecg-data/',
        ContinuationToken: continuationToken
      };
      
      const commandData = new ListObjectsV2Command(listParamsData);
      const resultData = await s3Client.send(commandData);
      
      if (resultData.Contents) {
        allObjects.push(...resultData.Contents);
      }
      
      continuationToken = resultData.NextContinuationToken;
    } while (continuationToken);

    console.log('Total objects found:', {
      TotalCount: allObjects.length,
      SampleKeys: allObjects.slice(0, 5).map(obj => obj.Key)
    });
    
    return allObjects;
    
  } catch (error) {
    console.error('Error listing ECG objects from S3:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Check if record exists
async function checkRecordExists(recordId) {
  try {
    // Find files in date folders
    const jsonKey = await findFileInS3(recordId, 'json');
    const pdfKey = await findFileInS3(recordId, 'pdf');
    
    return {
      jsonExists: jsonKey !== null,
      pdfExists: pdfKey !== null
    };
  } catch (error) {
    console.error('Error checking record existence:', error);
    throw error;
  }
}

// Generate pre-signed URLs for record access
async function generatePresignedUrls(recordId) {
  try {
    // Find JSON file in date folders
    const jsonKey = await findFileInS3(recordId, 'json');
    if (!jsonKey) {
      throw new Error(`JSON file not found for record ${recordId}`);
    }
    
    // Generate JSON URL
    const jsonCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: jsonKey
    });
    
    const jsonUrl = await getSignedUrl(s3Client, jsonCommand, { expiresIn: 300 });
    
    // Find PDF file in date folders
    let pdfUrl = null;
    const pdfKey = await findFileInS3(recordId, 'pdf');
    
    if (pdfKey) {
      try {
        // PDF exists, generate pre-signed URL
        const pdfCommand = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: pdfKey
        });
        pdfUrl = await getSignedUrl(s3Client, pdfCommand, { expiresIn: 300 });
      } catch (error) {
        console.error(`Error generating PDF URL for record ${recordId}:`, error);
      }
    } else {
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

// Generate presigned URL directly from S3 key (for use with full paths)
async function generatePresignedUrlFromKey(s3Key, expiresIn = 300) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      ResponseContentType: s3Key.endsWith('.pdf') ? 'application/pdf' : 'application/json'
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error(`Presigned URL generation error for key ${s3Key}:`, error);
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  generatePresignedUrlFromKey,
  getECGRecord
};
