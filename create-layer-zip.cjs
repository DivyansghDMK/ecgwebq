const fs = require('fs');
const path = require('path');

console.log('🚀 Creating Lambda Layer ZIP...');

// Create layer folder structure (AWS Lambda requires specific structure)
const layerFolder = 'aws-sdk-layer';
const nodejsFolder = path.join(layerFolder, 'nodejs');

if (!fs.existsSync(nodejsFolder)) {
  fs.mkdirSync(nodejsFolder, { recursive: true });
}

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

// Copy ALL dependencies to layer
console.log('📚 Copying ALL dependencies to layer...');

const allDeps = [
  '@aws-sdk',
  '@smithy', 
  '@aws-crypto',
  'tslib',
  'fast-xml-parser',
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
  'aws-sdk'
];

allDeps.forEach(dep => {
  const srcPath = path.join('node_modules', dep);
  const destPath = path.join(nodejsFolder, 'node_modules', dep);
  
  if (fs.existsSync(srcPath)) {
    copyFolder(srcPath, destPath);
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - NOT FOUND`);
  }
});

console.log('\n📦 Creating Lambda Layer ZIP...');

const psCommand = `Compress-Archive -Path "${layerFolder}/*" -DestinationPath "aws-sdk-layer.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating layer ZIP:', error);
    return;
  }
  
  const stats = fs.statSync('aws-sdk-layer.zip');
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ Lambda Layer ZIP created successfully!');
  console.log('📁 File: aws-sdk-layer.zip');
  console.log('📊 Size:', stats.size, 'bytes (' + sizeInMB + ' MB)');
  
  console.log('\n🎯 DEPLOYMENT STEPS:');
  console.log('1. Upload s3-files-minimal.zip to Lambda function');
  console.log('2. Upload aws-sdk-layer.zip to Lambda Layers');
  console.log('3. Attach layer to your function');
  console.log('4. Test - This will work perfectly!');
});
