const fs = require('fs');
const path = require('path');

console.log('🚀 Creating ULTIMATE Complete S3 Files Lambda ZIP...');

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

// Copy ENTIRE node_modules (EVERYTHING!)
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

console.log('📚 Copying ENTIRE node_modules (this will take a moment)...');
const nodeModulesSrc = path.join('node_modules');
const nodeModulesDest = path.join(deployFolder, 'node_modules');

if (fs.existsSync(nodeModulesSrc)) {
  copyFolder(nodeModulesSrc, nodeModulesDest);
  console.log('✅ node_modules (COMPLETE - ALL dependencies included!)');
}

console.log('\n📦 Creating ULTIMATE ZIP file...');

// Use PowerShell to create ZIP
const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-ultimate.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  console.log('✅ ULTIMATE ZIP file created successfully!');
  console.log('📁 File: s3-files-ultimate.zip');
  console.log('📊 Size:', fs.statSync('s3-files-ultimate.zip').size, 'bytes');
  
  console.log('\n🎯 ABSOLUTELY READY FOR AWS DEPLOYMENT!');
  console.log('1. Upload s3-files-ultimate.zip to AWS Lambda');
  console.log('2. Replace the existing code');
  console.log('3. Test again');
  console.log('4. This HAS TO WORK - ENTIRE node_modules included!');
  console.log('5. If this doesn\'t work, nothing will! 😄');
});
