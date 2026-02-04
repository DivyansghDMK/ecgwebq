const fs = require('fs');
const path = require('path');

console.log('📦 Creating S3 Files deployment package...');

// Check if required files exist
const requiredFiles = [
  's3-files.js',
  'services/s3Service.js',
  'node_modules/@aws-sdk/client-s3',
  'node_modules/@aws-sdk/s3-request-presigner'
];

console.log('🔍 Checking required files...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NOT FOUND`);
  }
}

console.log('\n📋 Instructions to create ZIP manually:');
console.log('1. Create a new folder called "s3-deployment"');
console.log('2. Copy these files/folders into it:');
console.log('   - s3-files.js');
console.log('   - services/ (entire folder)');
console.log('   - node_modules/@aws-sdk/client-s3/ (entire folder)');
console.log('   - node_modules/@aws-sdk/s3-request-presigner/ (entire folder)');
console.log('3. Right-click on "s3-deployment" folder');
console.log('4. Select "Send to" → "Compressed (zipped) folder"');
console.log('5. Rename the zip to "s3-files-lambda.zip"');

console.log('\n🎯 Your ZIP structure should look like:');
console.log('s3-deployment/');
console.log('├── s3-files.js');
console.log('├── services/');
console.log('│   └── s3Service.js');
console.log('└── node_modules/');
console.log('    └── @aws-sdk/');
console.log('        ├── client-s3/');
console.log('        └── s3-request-presigner/');

console.log('\n🚀 After creating ZIP:');
console.log('1. Go to AWS Lambda Console');
console.log('2. Create function: ecg-s3-files');
console.log('3. Upload your ZIP file');
console.log('4. Set handler: s3-files.handler');
console.log('5. Test with the event JSON I provided earlier');
