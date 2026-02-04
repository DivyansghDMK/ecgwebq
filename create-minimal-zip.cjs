const fs = require('fs');
const path = require('path');

console.log('🚀 Creating S3 Files Lambda with MINIMAL code (Layer approach)...');

// Create deployment folder
const deployFolder = 's3-deployment-minimal';
if (!fs.existsSync(deployFolder)) {
  fs.mkdirSync(deployFolder, { recursive: true });
}

// Copy ONLY your code files (no dependencies)
console.log('📁 Copying ONLY code files...');

// Copy main handler
fs.copyFileSync('s3-files.js', path.join(deployFolder, 's3-files.js'));
console.log('✅ s3-files.js');

// Copy services folder
if (!fs.existsSync(path.join(deployFolder, 'services'))) {
  fs.mkdirSync(path.join(deployFolder, 'services'));
}
fs.copyFileSync('services/s3Service.js', path.join(deployFolder, 'services', 's3Service.js'));
console.log('✅ services/s3Service.js');

console.log('\n📦 Creating MINIMAL ZIP file...');

// Use PowerShell to create ZIP
const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-minimal.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  const stats = fs.statSync('s3-files-minimal.zip');
  const sizeInKB = (stats.size / 1024).toFixed(2);
  
  console.log('✅ MINIMAL ZIP file created successfully!');
  console.log('📁 File: s3-files-minimal.zip');
  console.log('📊 Size:', stats.size, 'bytes (' + sizeInKB + ' KB)');
  
  console.log('\n🎯 LAMBDA LAYERS APPROACH:');
  console.log('1. Upload s3-files-minimal.zip to AWS Lambda (tiny file!)');
  console.log('2. Create AWS Lambda Layer for dependencies');
  console.log('3. Attach layer to your function');
  console.log('4. This will work perfectly!');
  
  console.log('\n📋 How to create Lambda Layer:');
  console.log('1. AWS Lambda → Layers → Create layer');
  console.log('2. Upload node_modules as layer');
  console.log('3. Select compatible runtimes: Node.js 18.x');
  console.log('4. Attach layer to your function');
});
