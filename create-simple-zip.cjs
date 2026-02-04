const fs = require('fs');
const path = require('path');

console.log('🚀 Creating Simple Lambda Handler ZIP...');

// Create deployment folder
const deployFolder = 's3-deployment-simple';
if (!fs.existsSync(deployFolder)) {
  fs.mkdirSync(deployFolder, { recursive: true });
}

// Copy required files
console.log('📁 Copying files...');

// Copy simple handler
fs.copyFileSync('s3-files-simple.js', path.join(deployFolder, 's3-files.js'));
console.log('✅ s3-files.js (simple handler)');

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

// Copy AWS SDK dependencies
console.log('📚 Copying AWS SDK dependencies...');

const awsDeps = [
  'aws-sdk',
  'xmlbuilder',
  'xml2js',
  'jmespath',
  'sax',
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

console.log('\n📦 Creating Simple Lambda ZIP file...');

const psCommand = `Compress-Archive -Path "${deployFolder}/*" -DestinationPath "s3-files-simple.zip" -Force`;

const { exec } = require('child_process');
exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error creating ZIP:', error);
    return;
  }
  
  const stats = fs.statSync('s3-files-simple.zip');
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ Simple Lambda ZIP file created!');
  console.log('📁 File: s3-files-simple.zip');
  console.log('📊 Size:', stats.size, 'bytes (' + sizeInMB + ' MB)');
  
  console.log('\n🎯 Ready for AWS Deployment!');
  console.log('1. Upload s3-files-simple.zip to AWS Lambda');
  console.log('2. Replace existing code');
  console.log('3. Test - Simple handler should work!');
});
