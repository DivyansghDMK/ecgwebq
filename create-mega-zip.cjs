const fs = require('fs');
const path = require('path');

console.log('🚀 Creating MEGA Complete S3 Files Lambda ZIP...');

// Create deployment folder
const deployFolder = 's3-deployment-mega';
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

// Copy ENTIRE @aws-sdk and @smithy folders
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

// Copy ALL @aws-sdk modules
console.log('📚 Copying ALL @aws-sdk modules...');
const awsSdkSrc = path.join('node_modules', '@aws-sdk');
const awsSdkDest = path.join(deployFolder, 'node_modules', '@aws-sdk');
if (fs.existsSync(awsSdkSrc)) {
  copyFolder(awsSdkSrc, awsSdkDest);
  console.log('✅ @aws-sdk (ALL modules)');
}

// Copy ALL @smithy modules
console.log('🔧 Copying ALL @smithy modules...');
const smithySrc = path.join('node_modules', '@smithy');
const smithyDest = path.join(deployFolder, 'node_modules', '@smithy');
if (fs.existsSync(smithySrc)) {
  copyFolder(smithySrc, smithyDest);
  console.log('✅ @smithy (ALL modules)');
}

// Copy other essential dependencies
const otherDeps = [
  '@aws-crypto',
  '@aws-sdk',
  '@babel',
  '@bufbuild',
  '@jest',
  '@types',
  'abort-controller',
  'async',
  'aws-sdk',
  'base64-js',
  'buffer',
  'crypto',
  'events',
  'http',
  'https',
  'querystring',
  'stream',
  'url',
  'util',
  'zlib'
];

otherDeps.forEach(dep => {
  const srcPath = path.join('node_modules', dep);
  const destPath = path.join(deployFolder, 'node_modules', dep);
  
  if (fs.existsSync(srcPath)) {
    copyFolder(srcPath, destPath);
    console.log(`✅ ${dep}`);
  }
});

console.log('\n📦 Creating MEGA ZIP file...');

// Use PowerShell to create ZIP
const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-mega.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  console.log('✅ MEGA ZIP file created successfully!');
  console.log('📁 File: s3-files-mega.zip');
  console.log('📊 Size:', fs.statSync('s3-files-mega.zip').size, 'bytes');
  
  console.log('\n🎯 READY FOR AWS DEPLOYMENT!');
  console.log('1. Upload s3-files-mega.zip to AWS Lambda');
  console.log('2. Replace the existing code');
  console.log('3. Test again');
  console.log('4. This should work now - ALL dependencies included!');
});
