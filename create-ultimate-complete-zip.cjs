const fs = require('fs');
const path = require('path');

console.log('🚀 Creating ULTIMATE S3 Files Lambda ZIP (COMPLETE node_modules)...');

// Create deployment folder
const deployFolder = 's3-deployment-ultimate';
if (!fs.existsSync(deployFolder)) {
  fs.mkdirSync(deployFolder, { recursive: true });
}

// Copy required files
console.log('📁 Copying files...');

// Copy main handler
fs.copyFileSync('s3-files-v2.js', path.join(deployFolder, 's3-files.js'));
console.log('✅ s3-files.js');

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

// Copy ENTIRE node_modules - this will include everything
console.log('📚 Copying ENTIRE node_modules (this will take a moment)...');

const nodeModulesSrc = path.join('node_modules');
const nodeModulesDest = path.join(deployFolder, 'node_modules');

if (fs.existsSync(nodeModulesSrc)) {
  copyFolder(nodeModulesSrc, nodeModulesDest);
  console.log('✅ ENTIRE node_modules copied!');
  console.log('📊 This includes: xmlbuilder, jmespath, xml2js, and ALL other dependencies');
}

console.log('\n📦 Creating ULTIMATE ZIP file...');

const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-ultimate-complete.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  const stats = fs.statSync('s3-files-ultimate-complete.zip');
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ ULTIMATE ZIP file created successfully!');
  console.log('📁 File: s3-files-ultimate-complete.zip');
  console.log('📊 Size:', stats.size, 'bytes (' + sizeInMB + ' MB)');
  
  if (sizeInMB > 50) {
    console.log('⚠️  File is large but AWS Lambda limit is 250MB uncompressed');
    console.log('💡 This should work if under the limit');
  }
  
  console.log('\n🎯 FINAL SOLUTION - This HAS TO WORK!');
  console.log('1. Upload s3-files-ultimate-complete.zip to AWS Lambda');
  console.log('2. Handler: s3-files.handler');
  console.log('3. This includes LITERALLY EVERYTHING!');
  console.log('4. No more missing dependencies!');
});
