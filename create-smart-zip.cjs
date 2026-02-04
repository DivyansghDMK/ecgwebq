const fs = require('fs');
const path = require('path');

console.log('🚀 Creating SMART S3 Files Lambda ZIP (under 15MB)...');

// Create deployment folder
const deployFolder = 's3-deployment-smart';
if (!fs.existsSync(deployFolder)) {
  fs.mkdirSync(deployFolder, { recursive: true });
}

// Copy required files
console.log('📁 Copying files...');

// Copy main handler
fs.copyFileSync('s3-files.js', path.join(deployFolder, 's3-files.js'));
console.log('✅ s3-files.js');

// Copy services folder
if (!fs.existsSync(path.join(deployFolder, 'services'))) {
  fs.mkdirSync(path.join(deployFolder, 'services'));
}
fs.copyFileSync('services/s3Service.js', path.join(deployFolder, 'services', 's3Service.js'));
console.log('✅ services/s3Service.js');

const copyFolder = (src, dest) => {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  ${src} not found, skipping...`);
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolder(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
};

// Copy ONLY essential modules (not entire folders)
console.log('📚 Copying SMART dependencies...');

const essentialModules = [
  // AWS SDK v3 essentials
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner',
  // Smithy essentials
  '@smithy/config-resolver',
  '@smithy/util-config-provider',
  '@smithy/fetch-http-handler',
  '@smithy/hash-node',
  '@smithy/md5-js',
  '@smithy/protocol-http',
  '@smithy/querystring-builder',
  '@smithy/signature-v4',
  '@smithy/smithy-client',
  '@smithy/util-stream',
  '@smithy/util-utf8',
  '@smithy/util-waiter',
  '@smithy/uuid',
  '@smithy/core',
  '@smithy/node-http-handler',
  '@smithy/abort-controller',
  // Essential runtime dependencies
  'tslib',
  'buffer',
  'crypto',
  'stream',
  'url',
  'util',
  'querystring',
  'http',
  'https',
  'zlib',
  'events',
  'string_decoder'
];

essentialModules.forEach(module => {
  const srcPath = path.join('node_modules', module);
  const destPath = path.join(deployFolder, 'node_modules', module);
  
  if (fs.existsSync(srcPath)) {
    copyFolder(srcPath, destPath);
    console.log(`✅ ${module}`);
  } else {
    console.log(`❌ ${module} - NOT FOUND`);
  }
});

console.log('\n📦 Creating SMART ZIP file...');

// Use PowerShell to create ZIP
const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-smart.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  const stats = fs.statSync('s3-files-smart.zip');
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ SMART ZIP file created successfully!');
  console.log('📁 File: s3-files-smart.zip');
  console.log('📊 Size:', stats.size, 'bytes (' + sizeInMB + ' MB)');
  
  if (sizeInMB > 15) {
    console.log('⚠️  File is still over 15MB. We may need to use AWS Lambda Layers.');
  } else {
    console.log('✅ Perfect size for AWS Lambda!');
  }
  
  console.log('\n🎯 Ready for AWS deployment!');
  console.log('1. Upload s3-files-smart.zip to AWS Lambda');
  console.log('2. Test with the same event');
});
