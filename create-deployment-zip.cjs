const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Creating S3 Files Lambda ZIP...');

// Create deployment folder
const deployFolder = 's3-deployment';
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

// Copy node_modules
const copyFolder = (src, dest) => {
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

copyFolder('node_modules/@aws-sdk/client-s3', path.join(deployFolder, 'node_modules/@aws-sdk/client-s3'));
console.log('✅ node_modules/@aws-sdk/client-s3');

copyFolder('node_modules/@aws-sdk/s3-request-presigner', path.join(deployFolder, 'node_modules/@aws-sdk/s3-request-presigner'));
console.log('✅ node_modules/@aws-sdk/s3-request-presigner');

console.log('\n📦 Creating ZIP file...');

// Use PowerShell to create ZIP
const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-lambda.zip" -Force`;

exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  console.log('✅ ZIP file created successfully!');
  console.log('📁 File: s3-files-lambda.zip');
  console.log('📊 Size:', fs.statSync('s3-files-lambda.zip').size, 'bytes');
  
  console.log('\n🎯 Ready for AWS deployment!');
  console.log('1. Upload s3-files-lambda.zip to AWS Lambda');
  console.log('2. Function name: ecg-s3-files');
  console.log('3. Handler: s3-files.handler');
  console.log('4. Runtime: Node.js 18.x');
});
