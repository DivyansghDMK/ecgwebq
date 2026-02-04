const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });

const lambda = new AWS.Lambda();
const apigateway = new AWS.APIGateway();

async function deployS3FilesEndpoint() {
  try {
    console.log('🚀 Deploying S3 Files Endpoint to AWS...');
    
    // 1. Check if zip file exists, if not create it
    console.log('📦 Checking for deployment package...');
    
    if (!fs.existsSync('s3-files-deployment.zip')) {
      console.log('⚠️ s3-files-deployment.zip not found. Please run: node create-s3-files-zip.cjs');
      throw new Error('s3-files-deployment.zip not found. Run: node create-s3-files-zip.cjs first');
    }
    
    console.log('✅ Using existing s3-files-deployment.zip');
    
    // 2. Read deployment package
    const zipFile = fs.readFileSync('s3-files-deployment.zip');
    
    // 3. Create Lambda function
    console.log('🔧 Creating Lambda function...');
    
    const lambdaParams = {
      FunctionName: 'ecg-s3-files',
      Runtime: 'nodejs18.x',
      Role: 'arn:aws:iam::373962339435:role/CardioXECGLambdaRole', // Use existing role
      Handler: 's3-files.handler',
      Description: 'List all S3 files with pagination',
      Code: { ZipFile: zipFile },
      Environment: {
        Variables: {
          NODE_ENV: 'production',
          S3_BUCKET: 'deck-backend-demo'
        }
      },
      Timeout: 120, // 2 minutes
      MemorySize: 512
    };
    
    try {
      const lambdaFunction = await lambda.createFunction(lambdaParams).promise();
      console.log('✅ Lambda function created:', lambdaFunction.FunctionArn);
    } catch (error) {
      if (error.code === 'ResourceConflictException') {
        console.log('⚠️ Function already exists, updating code and configuration...');
        // Update function code
        await lambda.updateFunctionCode({
          FunctionName: 'ecg-s3-files',
          ZipFile: zipFile
        }).promise();
        console.log('✅ Function code updated');
        
        // Wait a moment for code update to complete
        console.log('⏳ Waiting for code update to complete...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Update function configuration (timeout, memory, environment)
        try {
          await lambda.updateFunctionConfiguration({
            FunctionName: 'ecg-s3-files',
            Timeout: 120, // 2 minutes
            MemorySize: 512,
            Environment: {
              Variables: {
                NODE_ENV: 'production',
                S3_BUCKET: 'deck-backend-demo'
              }
            }
          }).promise();
          console.log('✅ Function configuration updated (timeout: 120s, memory: 512MB)');
        } catch (configError) {
          if (configError.code === 'ResourceConflictException') {
            console.log('⚠️ Configuration update in progress. Please update timeout manually in AWS Console:');
            console.log('   Lambda → ecg-s3-files → Configuration → General → Edit → Timeout: 2 minutes');
          } else {
            throw configError;
          }
        }
      } else {
        throw error;
      }
    }
    
    // 4. Get existing API Gateway info
    console.log('🌐 Updating API Gateway...');
    
    // List APIs to find existing one
    const apis = await apigateway.getRestApis().promise();
    const existingApi = apis.items.find(api => api.name === 'CardioX ECG API');
    
    if (!existingApi) {
      throw new Error('CardioX ECG API not found. Please run the main deployment first.');
    }
    
    console.log('✅ Found existing API:', existingApi.id);
    
    // Get resources
    const resources = await apigateway.getResources({
      restApiId: existingApi.id
    }).promise();
    
    const apiResource = resources.items.find(r => r.pathPart === 'api');
    if (!apiResource) {
      throw new Error('/api resource not found');
    }
    
    // Create s3-files resource
    const resource = await apigateway.createResource({
      restApiId: existingApi.id,
      parentId: apiResource.id,
      pathPart: 's3-files'
    }).promise();
    
    console.log('✅ Created /api/s3-files resource');
    
    // Add GET method
    await apigateway.putMethod({
      restApiId: existingApi.id,
      resourceId: resource.id,
      httpMethod: 'GET',
      authorizationType: 'NONE'
    }).promise();
    
    // Add integration
    const lambdaFunction = await lambda.getFunction({
      FunctionName: 'ecg-s3-files'
    }).promise();
    
    await apigateway.putIntegration({
      restApiId: existingApi.id,
      resourceId: resource.id,
      httpMethod: 'GET',
      type: 'AWS_PROXY',
      integrationHttpMethod: 'POST',
      uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaFunction.Configuration.FunctionArn}/invocations`
    }).promise();
    
    // Add permission
    await lambda.addPermission({
      FunctionName: 'ecg-s3-files',
      StatementId: `apigateway-ecg-s3-files-${Date.now()}`,
      Action: 'lambda:InvokeFunction',
      Principal: 'apigateway.amazonaws.com',
      SourceArn: `arn:aws:execute-api:us-east-1:*:${existingApi.id}/*/GET/api/s3-files`
    }).promise();
    
    // Deploy API
    await apigateway.createDeployment({
      restApiId: existingApi.id,
      stageName: 'prod'
    }).promise();
    
    const apiUrl = `https://${existingApi.id}.execute-api.us-east-1.amazonaws.com/prod`;
    
    console.log('🎉 Deployment Complete!');
    console.log('🔗 API URL:', apiUrl);
    console.log('📋 New endpoint:');
    console.log(`  GET  ${apiUrl}/api/s3-files?page={page}&limit={limit}&search={search}`);
    
    // Update frontend .env
    const envContent = `VITE_API_BASE_URL=${apiUrl}/api\n`;
    fs.writeFileSync('.env', envContent);
    console.log('✅ Updated .env file with API URL');
    
    // Clean up
    fs.unlinkSync('s3-files-deployment.zip');
    console.log('🧹 Cleaned up deployment files');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    if (error.code === 'AccessDenied') {
      console.log('\n💡 Solution: You need AWS permissions for:');
      console.log('   - lambda:CreateFunction');
      console.log('   - lambda:UpdateFunctionCode');
      console.log('   - apigateway:GET, POST, PUT');
      console.log('   - lambda:AddPermission');
    }
  }
}

// Run deployment
deployS3FilesEndpoint();
