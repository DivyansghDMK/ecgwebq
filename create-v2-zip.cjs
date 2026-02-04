const fs = require('fs');
const path = require('path');

console.log('🚀 Creating AWS SDK v2 Lambda ZIP (Simple & Reliable)...');

// Create deployment folder
const deployFolder = 's3-deployment-v2';
if (!fs.existsSync(deployFolder)) {
  fs.mkdirSync(deployFolder, { recursive: true });
}

// Copy required files
console.log('📁 Copying AWS SDK v2 files...');

// Copy main handler (v2 version)
fs.copyFileSync('s3-files-v2.js', path.join(deployFolder, 's3-files.js'));
console.log('✅ s3-files.js (AWS SDK v2 version)');

// Copy only aws-sdk v2 (much simpler!)
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

// Copy ONLY aws-sdk v2 (no complex dependencies)
console.log('📚 Copying AWS SDK v2 (simple and reliable)...');
const awsSdkSrc = path.join('node_modules', 'aws-sdk');
const awsSdkDest = path.join(deployFolder, 'node_modules', 'aws-sdk');

if (fs.existsSync(awsSdkSrc)) {
  copyFolder(awsSdkSrc, awsSdkDest);
  console.log('✅ aws-sdk (v2 - much simpler!)');
}

console.log('\n📦 Creating AWS SDK v2 ZIP file...');

const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-v2.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  const stats = fs.statSync('s3-files-v2.zip');
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ AWS SDK v2 ZIP file created successfully!');
  console.log('📁 File: s3-files-v2.zip');
  console.log('📊 Size:', stats.size, 'bytes (' + sizeInMB + ' MB)');
  
  console.log('\n🎯 AWS SDK v2 - Simple & Reliable!');
  console.log('1. Upload s3-files-v2.zip to AWS Lambda');
  console.log('2. Handler: s3-files.handler');
  console.log('3. No complex dependencies!');
  console.log('4. This should work perfectly!');
});
