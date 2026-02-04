const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createZipFile() {
  console.log('📦 Creating S3 Files Lambda deployment package...');
  
  const output = fs.createWriteStream('s3-files-lambda.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.pipe(output);
  
  // Add main handler
  archive.file('s3-files.js', { name: 's3-files.js' });
  
  // Add S3 service
  archive.file('services/s3Service.js', { name: 'services/s3Service.js' });
  
  // Add required AWS SDK modules
  const awsSdkPath = 'node_modules/@aws-sdk/';
  
  // Add client-s3
  archive.directory(awsSdkPath + 'client-s3', 'node_modules/@aws-sdk/client-s3');
  
  // Add s3-request-presigner
  archive.directory(awsSdkPath + 's3-request-presigner', 'node_modules/@aws-sdk/s3-request-presigner');
  
  // Add other required dependencies
  archive.directory(awsSdkPath + 'util-stream', 'node_modules/@aws-sdk/util-stream');
  archive.directory(awsSdkPath + 'util-utf8', 'node_modules/@aws-sdk/util-utf8');
  archive.directory(awsSdkPath + 'util-buffer-from', 'node_modules/@aws-sdk/util-buffer-from');
  archive.directory(awsSdkPath + 'protocol-http', 'node_modules/@aws-sdk/protocol-http');
  archive.directory(awsSdkPath + 'querystring-builder', 'node_modules/@aws-sdk/querystring-builder');
  archive.directory(awsSdkPath + 'config-resolver', 'node_modules/@aws-sdk/config-resolver');
  archive.directory(awsSdkPath + 'middleware-serde', 'node_modules/@aws-sdk/middleware-serde');
  archive.directory(awsSdkPath + 'signature-v4', 'node_modules/@aws-sdk/signature-v4');
  archive.directory(awsSdkPath + 'smithy-client', 'node_modules/@aws-sdk/smithy-client');
  archive.directory(awsSdkPath + 'middleware-retry', 'node_modules/@aws-sdk/middleware-retry');
  archive.directory(awsSdkPath + 'middleware-content-length', 'node_modules/@aws-sdk/middleware-content-length');
  
  await archive.finalize();
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log('✅ Zip file created: s3-files-lambda.zip');
      console.log(`📊 File size: ${archive.pointer()} bytes`);
      resolve();
    });
    
    archive.on('error', reject);
  });
}

createZipFile().catch(console.error);
