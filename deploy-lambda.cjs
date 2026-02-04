const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });

const lambda = new AWS.Lambda();
const iam = new AWS.IAM();
const apigateway = new AWS.APIGateway();

async function deploy() {
  try {
    console.log('🚀 Starting CardioX ECG API Deployment...');
    
    // 1. Create (or reuse existing) IAM Role for Lambda
    console.log('📋 Creating IAM Role...');
    const roleParams = {
      RoleName: 'CardioXECGLambdaRole',
      AssumeRolePolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: 'sts:AssumeRole'
        }]
      }),
      Description: 'Role for CardioX ECG Lambda functions'
    };
    
    let role;
    try {
      // Try to create the role the first time
      role = await iam.createRole(roleParams).promise();
      console.log('✅ Role created:', role.Role.Arn);
    } catch (error) {
      if (error.code === 'EntityAlreadyExists') {
        // Role already exists – just fetch it and continue
        console.log('ℹ️ IAM role already exists, reusing existing role...');
        role = await iam.getRole({ RoleName: 'CardioXECGLambdaRole' }).promise();
      } else {
        throw error;
      }
    }
    
    // 2. Attach S3/Lambda policies to role (idempotent – safe to call again)
    console.log('🔐 Attaching S3 policies...');
    await iam.attachRolePolicy({
      RoleName: 'CardioXECGLambdaRole',
      PolicyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess'
    }).promise();
    
    await iam.attachRolePolicy({
      RoleName: 'CardioXECGLambdaRole',
      PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    }).promise();
    
    // Wait for role to be ready
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 3. Read deployment package
    // Using s3-files-lambda.zip created by create-zip.cjs
    const zipFile = fs.readFileSync('s3-files-lambda.zip');
    
    // 4. Create Lambda Functions
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
      },
      {
        name: 'ecg-s3-files',
        handler: 's3-files.handler',
        description: 'List all S3 files with pagination'
      }
    ];
    
    for (const func of functions) {
      console.log(`📦 Creating Lambda function: ${func.name}`);
      
      const lambdaParams = {
        FunctionName: func.name,
        Runtime: 'nodejs18.x',
        Role: role.Role.Arn,
        Handler: func.handler,
        Description: func.description,
        Code: { ZipFile: zipFile },
        // Environment variables for the Lambda function.
        // Note: Do NOT set AWS_REGION here – it's a reserved key managed by AWS.
        Environment: {
          Variables: {
            NODE_ENV: 'production',
            S3_BUCKET: 'deck-backend-demo'
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
          throw error;
        }
      }
    }
    
    // 5. Create API Gateway
    console.log('🌐 Creating API Gateway...');
    
    const apiParams = {
      name: 'CardioX ECG API',
      description: 'API for CardioX ECG system',
      version: '1.0'
    };
    
    const api = await apigateway.createRestApi(apiParams).promise();
    console.log('✅ API Gateway created:', api.id);
    
    // Get root resource
    const resources = await apigateway.getResources({
      restApiId: api.id
    }).promise();
    
    const rootResourceId = resources.items[0].id;
    
    // Create resources and methods
    const endpoints = [
      { path: 'api', resource: null },
      { path: 'upload', resource: 'api', method: 'POST', function: 'ecg-upload' },
      { path: 'reports', resource: 'api', method: 'GET', function: 'ecg-reports' },
      { path: 'report', resource: 'api', method: 'GET', function: 'ecg-report' },
      { path: 's3-files', resource: 'api', method: 'GET', function: 'ecg-s3-files' }
    ];
    
    let apiResourceId = rootResourceId;
    
    for (const endpoint of endpoints) {
      if (endpoint.path === 'api') {
        // Create /api resource
        const apiResource = await apigateway.createResource({
          restApiId: api.id,
          parentId: rootResourceId,
          pathPart: 'api'
        }).promise();
        apiResourceId = apiResource.id;
        console.log('✅ Created /api resource');
      } else {
        // Create sub-resource
        const resource = await apigateway.createResource({
          restApiId: api.id,
          parentId: apiResourceId,
          pathPart: endpoint.path
        }).promise();
        
        console.log(`✅ Created /api/${endpoint.path} resource`);
        
        // Add method
        await apigateway.putMethod({
          restApiId: api.id,
          resourceId: resource.id,
          httpMethod: endpoint.method,
          authorizationType: 'NONE'
        }).promise();
        
        // Add integration
        const lambdaFunction = await lambda.getFunction({
          FunctionName: endpoint.function
        }).promise();
        
        await apigateway.putIntegration({
          restApiId: api.id,
          resourceId: resource.id,
          httpMethod: endpoint.method,
          type: 'AWS_PROXY',
          integrationHttpMethod: 'POST',
          uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaFunction.Configuration.FunctionArn}/invocations`
        }).promise();
        
        // Add permission
        await lambda.addPermission({
          FunctionName: endpoint.function,
          StatementId: `apigateway-${endpoint.function}-${Date.now()}`,
          Action: 'lambda:InvokeFunction',
          Principal: 'apigateway.amazonaws.com',
          SourceArn: `arn:aws:execute-api:us-east-1:*:${api.id}/*/${endpoint.method}/api/${endpoint.path}`
        }).promise();
        
        console.log(`✅ Added ${endpoint.method} method for /api/${endpoint.path}`);
      }
    }
    
    // Deploy API
    await apigateway.createDeployment({
      restApiId: api.id,
      stageName: 'prod'
    }).promise();
    
    const apiUrl = `https://${api.id}.execute-api.us-east-1.amazonaws.com/prod`;
    
    console.log('🎉 Deployment Complete!');
    console.log('🔗 API URL:', apiUrl);
    console.log('📋 Endpoints:');
    console.log(`  POST ${apiUrl}/api/upload`);
    console.log(`  GET  ${apiUrl}/api/reports`);
    console.log(`  GET  ${apiUrl}/api/report?id={reportId}`);
    console.log(`  GET  ${apiUrl}/api/s3-files?page={page}&limit={limit}&search={search}`);
    
    // Update frontend .env
    const envContent = `VITE_API_BASE_URL=${apiUrl}/api\n`;
    fs.writeFileSync('.env', envContent);
    console.log('✅ Updated .env file with API URL');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

// Run deployment
deploy();
