const AWS = require('aws-sdk');
const fs = require('fs');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });

const lambda = new AWS.Lambda();

async function createLambdaFunctions() {
  try {
    console.log('🚀 Creating Lambda Functions...');
    
    // Read deployment package
    const zipFile = fs.readFileSync('ecg-api.zip');
    
    // Role ARN (you'll get this after creating IAM role)
    const roleArn = 'arn:aws:iam::373962339435:role/CardioXECGLambdaRole';
    
    const functions = [
      {
        name: 'ecg-upload',
        handler: 'upload.handler',
        description: 'Upload ECG data to S3'
      },
      {
        name: 'ecg-reports',
        handler: 'reports.handler',
        description: 'List ECG reports from S3'
      },
      {
        name: 'ecg-report',
        handler: 'report.handler',
        description: 'Get specific ECG report'
      }
    ];
    
    for (const func of functions) {
      console.log(`📦 Creating Lambda function: ${func.name}`);
      
      const lambdaParams = {
        FunctionName: func.name,
        Runtime: 'nodejs18.x',
        Role: roleArn,
        Handler: func.handler,
        Description: func.description,
        Code: { ZipFile: zipFile },
        Environment: {
          Variables: {
            NODE_ENV: 'production',
            S3_BUCKET: 'deck-backend-demo',
            AWS_REGION: 'us-east-1'
          }
        },
        Timeout: 30,
        MemorySize: 512
      };
      
      try {
        const lambdaFunction = await lambda.createFunction(lambdaParams).promise();
        console.log(`✅ Lambda function created: ${lambdaFunction.FunctionArn}`);
      } catch (error) {
        if (error.code === 'ResourceConflictException') {
          console.log(`⚠️ Function ${func.name} already exists, updating...`);
          await lambda.updateFunctionCode({
            FunctionName: func.name,
            ZipFile: zipFile
          }).promise();
          console.log(`✅ Function ${func.name} updated`);
        } else {
          console.error(`❌ Failed to create ${func.name}:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 Lambda functions deployment complete!');
    console.log('📋 Next steps:');
    console.log('1. Create API Gateway in AWS Console');
    console.log('2. Add routes to Lambda functions');
    console.log('3. Deploy API Gateway');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

createLambdaFunctions();
