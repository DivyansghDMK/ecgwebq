const fs = require('fs');
const path = require('path');

console.log('🚀 Creating COMPLETE S3 Files Lambda ZIP...');

// Create deployment folder
const deployFolder = 's3-deployment-complete';
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

// Copy ALL required @smithy and @aws-sdk modules
const requiredModules = [
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner',
  '@smithy/config-resolver',
  '@smithy/fetch-http-handler',
  '@smithy/hash-node',
  '@smithy/invalid-dependency',
  '@smithy/md5-js',
  '@smithy/middleware-content-length',
  '@smithy/middleware-endpoint',
  '@smithy/middleware-retry',
  '@smithy/middleware-serde',
  '@smithy/protocol-http',
  '@smithy/querystring-builder',
  '@smithy/querystring-parser',
  '@smithy/signature-v4',
  '@smithy/smithy-client',
  '@smithy/types',
  '@smithy/util-base64',
  '@smithy/util-body-length-browser',
  '@smithy/util-body-length-node',
  '@smithy/util-defaults-mode-node',
  '@smithy/util-stream',
  '@smithy/util-utf8',
  '@smithy/util-waiter'
];

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

requiredModules.forEach(module => {
  const srcPath = path.join('node_modules', module);
  const destPath = path.join(deployFolder, 'node_modules', module);
  
  if (fs.existsSync(srcPath)) {
    copyFolder(srcPath, destPath);
    console.log(`✅ ${module}`);
  } else {
    console.log(`❌ ${module} - NOT FOUND`);
  }
});

console.log('\n📦 Creating complete ZIP file...');

// Use PowerShell to create ZIP
const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-complete.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  console.log('✅ COMPLETE ZIP file created successfully!');
  console.log('📁 File: s3-files-complete.zip');
  console.log('📊 Size:', fs.statSync('s3-files-complete.zip').size, 'bytes');
  
  console.log('\n🎯 Ready for AWS deployment!');
  console.log('1. Upload s3-files-complete.zip to AWS Lambda');
  console.log('2. Replace the existing code');
  console.log('3. Test again');
});
