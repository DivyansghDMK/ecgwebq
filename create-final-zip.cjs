const fs = require('fs');
const path = require('path');

console.log('🚀 Creating FINAL S3 Files Lambda ZIP (ALL @smithy modules)...');

// Create deployment folder
const deployFolder = 's3-deployment-final';
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

// Copy ALL @smithy modules (entire folder)
console.log('📚 Copying ALL @smithy modules...');
const smithySrc = path.join('node_modules', '@smithy');
const smithyDest = path.join(deployFolder, 'node_modules', '@smithy');

if (fs.existsSync(smithySrc)) {
  copyFolder(smithySrc, smithyDest);
  console.log('✅ @smithy (ALL modules included!)');
}

// Copy essential AWS SDK modules
const awsModules = [
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner'
];

awsModules.forEach(module => {
  const srcPath = path.join('node_modules', module);
  const destPath = path.join(deployFolder, 'node_modules', module);
  
  if (fs.existsSync(srcPath)) {
    copyFolder(srcPath, destPath);
    console.log(`✅ ${module}`);
  }
});

// Copy essential runtime dependencies
const runtimeDeps = [
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

runtimeDeps.forEach(dep => {
  const srcPath = path.join('node_modules', dep);
  const destPath = path.join(deployFolder, 'node_modules', dep);
  
  if (fs.existsSync(srcPath)) {
    copyFolder(srcPath, destPath);
    console.log(`✅ ${dep}`);
  }
});

console.log('\n📦 Creating FINAL ZIP file...');

// Use PowerShell to create ZIP
const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-final.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  const stats = fs.statSync('s3-files-final.zip');
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ FINAL ZIP file created successfully!');
  console.log('📁 File: s3-files-final.zip');
  console.log('📊 Size:', stats.size, 'bytes (' + sizeInMB + ' MB)');
  
  if (sizeInMB > 15) {
    console.log('⚠️  File is over 15MB. We may need AWS Lambda Layers.');
  } else {
    console.log('✅ Perfect size for AWS Lambda!');
  }
  
  console.log('\n🎯 FINAL VERSION - Ready for AWS deployment!');
  console.log('1. Upload s3-files-final.zip to AWS Lambda');
  console.log('2. This has ALL @smithy modules - should work!');
});
