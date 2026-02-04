const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const lambda = new AWS.Lambda();

async function updateLambdaConfig() {
  try {
    console.log('🔧 Updating Lambda function configuration...');
    
    await lambda.updateFunctionConfiguration({
      FunctionName: 'ecg-s3-files',
      Timeout: 120, // 2 minutes
      MemorySize: 512, // 512 MB
      Environment: {
        Variables: {
          NODE_ENV: 'production',
          S3_BUCKET: 'deck-backend-demo'
        }
      }
    }).promise();
    
    console.log('✅ Lambda configuration updated successfully!');
    console.log('   - Timeout: 120 seconds (2 minutes)');
    console.log('   - Memory: 512 MB');
    
  } catch (error) {
    if (error.code === 'ResourceConflictException') {
      console.log('⚠️ Update in progress. Please wait a moment and try again.');
      console.log('   Or update manually in AWS Console:');
      console.log('   Lambda → ecg-s3-files → Configuration → General → Edit');
    } else {
      console.error('❌ Failed to update configuration:', error.message);
    }
  }
}

updateLambdaConfig();

