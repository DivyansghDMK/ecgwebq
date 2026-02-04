const { 
  S3Client, 
  HeadObjectCommand, 
  GetObjectCommand, 
  PutObjectCommand,
  ListObjectsV2Command
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const BUCKET = "deck-backend-demo";
const PREFIX = "ecg-reports/";

const s3 = new S3Client({ region: "us-east-1" });

// Check if both JSON and PDF exist
async function checkRecordExists(recordId) {
  try {
    await s3.send(new HeadObjectCommand({
      Bucket: BUCKET,
      Key: PREFIX + recordId + ".json"
    }));

    await s3.send(new HeadObjectCommand({
      Bucket: BUCKET,
      Key: PREFIX + recordId + ".pdf"
    }));

    return true;
  } catch {
    return false;
  }
}

// Generate pre-signed URLs for a recordId (JSON + PDF)
async function generatePresignedUrls(recordId) {
  const jsonUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: PREFIX + recordId + ".json"
    }),
    { expiresIn: 300 }
  );

  const pdfUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: PREFIX + recordId + ".pdf"
    }),
    { expiresIn: 300 }
  );

  return { jsonUrl, pdfUrl };
}

// Generate a pre‑signed URL directly from an S3 key.
// This is what the s3-files.js Lambda expects via generatePresignedUrlFromKey.
async function generatePresignedUrlFromKey(s3Key, expiresIn = 300) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: s3Key
    });

    const url = await getSignedUrl(s3, command, { expiresIn });
    return url;
  } catch (error) {
    console.error(`Presigned URL generation error for key ${s3Key}:`, error);
    throw error;
  }
}

// Upload JSON + PDF to S3 
async function uploadECGRecord(recordId, record) {
  const jsonKey = PREFIX + recordId + ".json";
  const pdfKey = PREFIX + recordId + ".pdf";

  const jsonBody = JSON.stringify(record, null, 2);
  const pdfBuffer = Buffer.from(record.pdfReport, "base64");

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: jsonKey,
    Body: jsonBody,
    ContentType: "application/json"
  }));

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: pdfKey,
    Body: pdfBuffer,
    ContentType: "application/pdf"
  }));

  return { jsonKey, pdfKey };
}

// List all objects in the ECG data prefix
async function listECGObjects() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: PREFIX,
      MaxKeys: 1000
    });

    let allObjects = [];
    let continuationToken;

    do {
      if (continuationToken) {
        command.input.ContinuationToken = continuationToken;
      }

      const response = await s3.send(command);

      if (response.Contents) {
        const objects = response.Contents.map((obj) => ({
          Key: obj.Key,
          Size: obj.Size,
          LastModified: obj.LastModified.toISOString(),
          ETag: obj.ETag
        }));
        allObjects = allObjects.concat(objects);
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return allObjects;

  } catch (error) {
    console.error('S3 list error:', error);
    throw new Error(`Failed to list S3 objects: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

module.exports = {
  checkRecordExists,
  generatePresignedUrls,
  generatePresignedUrlFromKey,
  uploadECGRecord,
  listECGObjects
};
