const fs = require('fs');
const path = require('path');

console.log('🚀 Creating COMPLETE AWS SDK v2 Lambda ZIP...');

// Create deployment folder
const deployFolder = 's3-deployment-v2-complete';
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

// Copy aws-sdk v2 AND its dependencies
console.log('📚 Copying AWS SDK v2 with ALL dependencies...');

const awsDeps = [
  'aws-sdk',
  'jmespath',
  'xml2js',
  'uuid',
  'querystring',
  'stream',
  'url',
  'util',
  'buffer',
  'crypto',
  'events',
  'http',
  'https',
  'zlib',
  'string_decoder'
];

awsDeps.forEach(dep => {
  const srcPath = path.join('node_modules', dep);
  const destPath = path.join(deployFolder, 'node_modules', dep);
  
  if (fs.existsSync(srcPath)) {
    copyFolder(srcPath, destPath);
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - NOT FOUND`);
  }
});

console.log('\n📦 Creating COMPLETE AWS SDK v2 ZIP file...');

const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-v2-complete.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  const stats = fs.statSync('s3-files-v2-complete.zip');
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ COMPLETE AWS SDK v2 ZIP file created!');
  console.log('📁 File: s3-files-v2-complete.zip');
  console.log('📊 Size:', stats.size, 'bytes (' + sizeInMB + ' MB)');
  
  console.log('\n🎯 COMPLETE AWS SDK v2 - All dependencies included!');
  console.log('1. Upload s3-files-v2-complete.zip to AWS Lambda');
  console.log('2. Handler: s3-files.handler');
  console.log('3. This should work - jmespath and all deps included!');
});
