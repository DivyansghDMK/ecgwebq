// Helper script: builds s3-files-deployment.zip WITHOUT touching AWS
// Run with: node create-s3-files-zip.cjs

const fs = require('fs');
const archiver = require('archiver');

async function buildZip() {
  console.log('📦 Building s3-files-deployment.zip (local only)...');

  const output = fs.createWriteStream('s3-files-deployment.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);

  // Lambda entry + service
  archive.file('s3-files.js', { name: 's3-files.js' });
  archive.file('services/s3Service.js', { name: 'services/s3Service.js' });

  // Bundle only the dependencies needed by services/s3Service.js
  // Keep it relatively small but include all required AWS SDK v3 deps
  // Bundle all AWS SDK dependencies and their transitive dependencies
  archive.directory('node_modules/@aws-sdk/', 'node_modules/@aws-sdk/');
  archive.directory('node_modules/@aws-crypto/', 'node_modules/@aws-crypto/');
  archive.directory('node_modules/@smithy/', 'node_modules/@smithy/');
  archive.directory('node_modules/@aws/lambda-invoke-store/', 'node_modules/@aws/lambda-invoke-store/');
  archive.directory('node_modules/tslib/', 'node_modules/tslib/');
  archive.directory('node_modules/fast-xml-parser/', 'node_modules/fast-xml-parser/');

  await archive.finalize();

  await new Promise((resolve) => {
    output.on('close', resolve);
  });

  console.log('✅ Created s3-files-deployment.zip');
}

buildZip().catch((err) => {
  console.error('❌ Failed to build zip:', err);
  process.exit(1);
});


