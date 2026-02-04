const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });

const apigateway = new AWS.APIGateway();
const lambda = new AWS.Lambda();

async function createAPIGateway() {
  try {
    console.log('🌐 Creating API Gateway...');
    
    // Create API
    const api = await apigateway.createRestApi({
      name: 'CardioX ECG API',
      description: 'API for CardioX ECG system',
      version: '1.0'
    }).promise();
    
    console.log('✅ API Gateway created:', api.id);
    
    // Get root resource
    const resources = await apigateway.getResources({
      restApiId: api.id
    }).promise();
    
    const rootResourceId = resources.items[0].id;
    
    // Create /api resource
    const apiResource = await apigateway.createResource({
      restApiId: api.id,
      parentId: rootResourceId,
      pathPart: 'api'
    }).promise();
    
    console.log('✅ Created /api resource');
    
    // Create endpoints
    const endpoints = [
      { path: 'upload', method: 'POST', function: 'ecg-upload' },
      { path: 'reports', method: 'GET', function: 'ecg-reports' },
      { path: 'report', method: 'GET', function: 'ecg-report' }
    ];
    
    for (const endpoint of endpoints) {
      // Create resource
      const resource = await apigateway.createResource({
        restApiId: api.id,
        parentId: apiResource.id,
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
      
      // Get Lambda function ARN
      const lambdaFunction = await lambda.getFunction({
        FunctionName: endpoint.function
      }).promise();
      
      // Add integration
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
    
    // Deploy API
    await apigateway.createDeployment({
      restApiId: api.id,
      stageName: 'prod'
    }).promise();
    
    const apiUrl = `https://${api.id}.execute-api.us-east-1.amazonaws.com/prod`;
    
    console.log('\n🎉 API Gateway deployment complete!');
    console.log('🔗 API URL:', apiUrl);
    console.log('📋 Endpoints:');
    console.log(`  POST ${apiUrl}/api/upload`);
    console.log(`  GET  ${apiUrl}/api/reports`);
    console.log(`  GET  ${apiUrl}/api/report?id={reportId}`);
    
    // Update frontend .env
    const envContent = `VITE_API_BASE_URL=${apiUrl}/api\n`;
    fs.writeFileSync('.env', envContent);
    console.log('✅ Updated .env file with API URL');
    
    return apiUrl;
    
  } catch (error) {
    console.error('❌ API Gateway creation failed:', error);
  }
}

createAPIGateway();
