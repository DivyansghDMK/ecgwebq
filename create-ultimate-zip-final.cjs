const fs = require('fs');
const path = require('path');

console.log('🚀 Creating ULTIMATE S3 Files Lambda ZIP (ALL dependencies)...');

// Create deployment folder
const deployFolder = 's3-deployment-ultimate';
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

// Copy ALL @aws-sdk, @smithy, and @aws-crypto modules
console.log('📚 Copying ALL AWS-related modules...');

const awsRelatedModules = [
  '@aws-sdk',
  '@smithy',
  '@aws-crypto'
];

awsRelatedModules.forEach(module => {
  const srcPath = path.join('node_modules', module);
  const destPath = path.join(deployFolder, 'node_modules', module);
  
  if (fs.existsSync(srcPath)) {
    copyFolder(srcPath, destPath);
    console.log(`✅ ${module} (ALL modules)`);
  } else {
    console.log(`❌ ${module} - NOT FOUND`);
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
  'string_decoder',
  'aws-sdk' // v2 for compatibility
];

runtimeDeps.forEach(dep => {
  const srcPath = path.join('node_modules', dep);
  const destPath = path.join(deployFolder, 'node_modules', dep);
  
  if (fs.existsSync(srcPath)) {
    copyFolder(srcPath, destPath);
    console.log(`✅ ${dep}`);
  }
});

console.log('\n📦 Creating ULTIMATE ZIP file...');

// Use PowerShell to create ZIP
const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-ultimate.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  const stats = fs.statSync('s3-files-ultimate.zip');
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ ULTIMATE ZIP file created successfully!');
  console.log('📁 File: s3-files-ultimate.zip');
  console.log('📊 Size:', stats.size, 'bytes (' + sizeInMB + ' MB)');
  
  if (sizeInMB > 15) {
    console.log('⚠️  File is over 15MB. You may need AWS Lambda Layers or increase memory.');
    console.log('💡 Alternative: Use AWS Lambda Layers for dependencies');
  } else {
    console.log('✅ Perfect size for AWS Lambda!');
  }
  
  console.log('\n🎯 ULTIMATE VERSION - This HAS TO WORK!');
  console.log('1. Upload s3-files-ultimate.zip to AWS Lambda');
  console.log('2. If still over 15MB, consider Lambda Layers');
  console.log('3. This includes ALL possible dependencies!');
});
