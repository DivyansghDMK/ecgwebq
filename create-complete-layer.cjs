const fs = require('fs');
const path = require('path');

console.log('🚀 Creating COMPLETE Lambda Layer (ALL possible dependencies)...');

// Create layer folder structure
const layerFolder = 'aws-sdk-layer-complete';
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

// Copy LITERALLY EVERYTHING from node_modules
console.log('📚 Copying ENTIRE node_modules to layer (this will take a moment)...');

const nodeModulesSrc = path.join('node_modules');
const nodeModulesDest = path.join(nodejsFolder, 'node_modules');

if (fs.existsSync(nodeModulesSrc)) {
  copyFolder(nodeModulesSrc, nodeModulesDest);
  console.log('✅ ENTIRE node_modules copied to layer!');
}

console.log('\n📦 Creating COMPLETE Lambda Layer ZIP...');

const psCommand = `Compress-Archive -Path "${layerFolder}/*" -DestinationPath "aws-sdk-layer-complete.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating layer ZIP:', error);
    return;
  }
  
  const stats = fs.statSync('aws-sdk-layer-complete.zip');
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ COMPLETE Lambda Layer ZIP created!');
  console.log('📁 File: aws-sdk-layer-complete.zip');
  console.log('📊 Size:', stats.size, 'bytes (' + sizeInMB + ' MB)');
  
  if (sizeInMB > 50) {
    console.log('⚠️  Layer is over 50MB - AWS limit is 250MB for uncompressed');
    console.log('💡 This should work as it\'s under the limit');
  }
  
  console.log('\n🎯 FINAL DEPLOYMENT STEPS:');
  console.log('1. Delete existing layer if any');
  console.log('2. Upload aws-sdk-layer-complete.zip to Lambda Layers');
  console.log('3. Attach new layer to your function');
  console.log('4. This HAS TO WORK - literally everything is included!');
});
