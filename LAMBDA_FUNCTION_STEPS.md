# Lambda Function Creation - Step-by-Step Guide

## Prerequisites
- ✅ Zip files ready: `doctor-reports.zip` and `doctor-upload-reviewed.zip`
- ✅ AWS account access
- ✅ IAM role with S3 permissions (or create one)

---

## Step 1: Create IAM Role (If You Don't Have One)

### Option A: Use Existing Role
If you already have a role like `CardioXECGLambdaRole`, skip to Step 2.

### Option B: Create New Role

1. **Go to IAM Console**
   - Navigate to: https://console.aws.amazon.com/iam/
   - Click **Roles** in left sidebar
   - Click **Create role**

2. **Select Trusted Entity**
   - Select **AWS service**
   - Select **Lambda**
   - Click **Next**

3. **Add Permissions**
   - Search and attach: `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
   - Click **Next**

4. **Create Custom S3 Policy** (if needed)
   - Click **Create policy**
   - Switch to **JSON** tab
   - Paste this policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::deck-backend-demo",
           "arn:aws:s3:::deck-backend-demo/*"
         ]
       }
     ]
   }
   ```
   - Name: `CardioXECGS3Access`
   - Click **Create policy**
   - Go back to role creation
   - Refresh and attach `CardioXECGS3Access`

5. **Name the Role**
   - Role name: `CardioXECGLambdaRole`
   - Description: `Role for CardioX ECG Lambda functions`
   - Click **Create role**

6. **Note the Role ARN** (you'll need it)
   - Format: `arn:aws:iam::YOUR_ACCOUNT_ID:role/CardioXECGLambdaRole`

---

## Step 2: Create Lambda Function 1 - ecg-doctor-reports

### 2.1 Create Function

1. **Go to Lambda Console**
   - Navigate to: https://console.aws.amazon.com/lambda/
   - Click **Functions** in left sidebar
   - Click **Create function**

2. **Choose Creation Method**
   - Select **Author from scratch**
   - Function name: `ecg-doctor-reports`
   - Runtime: `Node.js 18.x`
   - Architecture: `x86_64`
   - Execution role: **Use an existing role**
   - Existing role: Select `CardioXECGLambdaRole` (or your role name)
   - Click **Create function**

### 2.2 Upload Code

1. **Upload Deployment Package**
   - Scroll down to **Code source** section
   - Click **Upload from** dropdown
   - Select **.zip file**
   - Click **Upload**
   - Browse and select: `doctor-reports.zip`
   - Wait for upload to complete (shows "Upload successful")

### 2.3 Configure Handler

1. **Set Handler**
   - Scroll to **Runtime settings** section
   - Click **Edit**
   - Handler: `doctor-reports.handler`
   - Click **Save**

### 2.4 Set Environment Variables

1. **Add Environment Variables**
   - Click **Configuration** tab
   - Click **Environment variables** in left sidebar
   - Click **Edit**
   - Click **Add environment variable** for each:
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `S3_BUCKET` | `deck-backend-demo` |
   | `AWS_REGION` | `us-east-1` |
   
   - Click **Save**

### 2.5 Configure Timeout and Memory

1. **Set Timeout**
   - Click **Configuration** tab
   - Click **General configuration**
   - Click **Edit**
   - Timeout: `30 seconds`
   - Memory: `512 MB`
   - Click **Save**

### 2.6 Test Function (Optional)

1. **Create Test Event**
   - Click **Test** tab
   - Click **Create new event**
   - Event name: `test-doctor-reports`
   - Event JSON:
   ```json
   {
     "httpMethod": "GET",
     "path": "/api/doctor/reports",
     "headers": {},
     "queryStringParameters": null
   }
   ```
   - Click **Save**
   - Click **Test**
   - Check response (should return list of reports or empty array)

---

## Step 3: Create Lambda Function 2 - ecg-doctor-upload-reviewed

### 3.1 Create Function

1. **Create New Function**
   - In Lambda Console, click **Functions**
   - Click **Create function**
   - Select **Author from scratch**
   - Function name: `ecg-doctor-upload-reviewed`
   - Runtime: `Node.js 18.x`
   - Architecture: `x86_64`
   - Execution role: **Use an existing role**
   - Existing role: Select `CardioXECGLambdaRole`
   - Click **Create function**

### 3.2 Upload Code

1. **Upload Deployment Package**
   - Scroll to **Code source** section
   - Click **Upload from** → **.zip file**
   - Upload: `doctor-upload-reviewed.zip`
   - Wait for upload to complete

### 3.3 Configure Handler

1. **Set Handler**
   - Scroll to **Runtime settings**
   - Click **Edit**
   - Handler: `doctor-upload-reviewed.handler`
   - Click **Save**

### 3.4 Set Environment Variables

1. **Add Environment Variables**
   - Click **Configuration** → **Environment variables** → **Edit**
   - Add same variables as Function 1:
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `S3_BUCKET` | `deck-backend-demo` |
   | `AWS_REGION` | `us-east-1` |
   
   - Click **Save**

### 3.5 Configure Timeout and Memory

1. **Set Timeout**
   - Click **Configuration** → **General configuration** → **Edit**
   - Timeout: `30 seconds`
   - Memory: `512 MB`
   - Click **Save**

---

## Step 4: Configure API Gateway

### 4.1 Find Your API Gateway

1. **Go to API Gateway Console**
   - Navigate to: https://console.aws.amazon.com/apigateway/
   - Find your existing API (or create new REST API)
   - Note the API ID

### 4.2 Add GET /api/doctor/reports Route

1. **Create Resource**
   - In your API, find `/api` resource (or create it)
   - Select `/api` resource
   - Click **Actions** → **Create Resource**
   - Resource Path: `doctor`
   - Click **Create Resource**

2. **Create Reports Resource**
   - Select `/api/doctor` resource
   - Click **Actions** → **Create Resource**
   - Resource Path: `reports`
   - Click **Create Resource**

3. **Create GET Method**
   - Select `/api/doctor/reports` resource
   - Click **Actions** → **Create Method**
   - Select **GET** from dropdown
   - Click checkmark ✓
   - Integration type: **Lambda Function**
   - ✅ Check **Use Lambda Proxy integration**
   - Lambda Function: `ecg-doctor-reports`
   - Click **Save**
   - Click **OK** when prompted to add permissions

### 4.3 Add POST /api/doctor/upload-reviewed Route

1. **Create Resource**
   - Select `/api/doctor` resource
   - Click **Actions** → **Create Resource**
   - Resource Path: `upload-reviewed`
   - Click **Create Resource**

2. **Create POST Method**
   - Select `/api/doctor/upload-reviewed` resource
   - Click **Actions** → **Create Method**
   - Select **POST** from dropdown
   - Click checkmark ✓
   - Integration type: **Lambda Function**
   - ✅ Check **Use Lambda Proxy integration**
   - Lambda Function: `ecg-doctor-upload-reviewed`
   - Click **Save**
   - Click **OK** when prompted

### 4.4 Enable CORS (If Needed)

1. **Enable CORS**
   - Select `/api/doctor/reports` resource
   - Click **Actions** → **Enable CORS**
   - Accept default settings
   - Click **Enable CORS and replace existing CORS headers**
   - Repeat for `/api/doctor/upload-reviewed`

### 4.5 Deploy API

1. **Deploy to Stage**
   - Click **Actions** → **Deploy API**
   - Deployment stage: Select `prod` (or create new)
   - Deployment description: `Deploy doctor endpoints`
   - Click **Deploy**

2. **Note the API URL**
   - After deployment, you'll see the Invoke URL
   - Format: `https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod`
   - **Save this URL** - you'll need it for frontend `.env`

---

## Step 5: Test the Endpoints

### Test GET /api/doctor/reports

```bash
# Using curl
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/api/doctor/reports

# Or use browser
# Navigate to: https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/api/doctor/reports
```

**Expected Response:**
```json
{
  "success": true,
  "reports": [
    {
      "key": "ecg-reports/...",
      "fileName": "...",
      "url": "https://...",
      "uploadedAt": "..."
    }
  ]
}
```

### Test POST /api/doctor/upload-reviewed

```bash
# Using curl (with multipart/form-data)
curl -X POST \
  https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/api/doctor/upload-reviewed \
  -F "reviewedPdf=@reviewed.pdf" \
  -F "originalFileName=test.pdf" \
  -F "doctorId=doctor123"
```

---

## Step 6: Update Frontend Configuration

1. **Create/Update `.env` file** in project root:
   ```env
   VITE_API_BASE_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
   ```

2. **Restart Frontend Dev Server**
   ```powershell
   npm run dev
   ```

---

## Troubleshooting

### Issue: "Cannot find module"
- **Solution:** Verify zip file contains `node_modules` folder
- Rebuild zip using `build-lambda-functions-compiled.ps1`

### Issue: "Handler not found"
- **Solution:** Check handler name matches:
  - Function 1: `doctor-reports.handler`
  - Function 2: `doctor-upload-reviewed.handler`
- Verify `.js` files exist in zip (not `.ts` files)

### Issue: "Access Denied" to S3
- **Solution:** Check IAM role has S3 permissions
- Verify bucket name in environment variables: `deck-backend-demo`

### Issue: API Gateway returns 500
- **Solution:** 
  - Check CloudWatch Logs for Lambda function
  - Verify Lambda proxy integration is enabled
  - Check CORS headers if calling from browser

### Issue: "Timeout" error
- **Solution:** Increase timeout to 30+ seconds
  - Configuration → General configuration → Edit → Timeout

---

## Quick Checklist

- [ ] IAM role created with S3 permissions
- [ ] Function `ecg-doctor-reports` created
- [ ] `doctor-reports.zip` uploaded
- [ ] Handler set to `doctor-reports.handler`
- [ ] Environment variables configured
- [ ] Timeout set to 30 seconds
- [ ] Function `ecg-doctor-upload-reviewed` created
- [ ] `doctor-upload-reviewed.zip` uploaded
- [ ] Handler set to `doctor-upload-reviewed.handler`
- [ ] Environment variables configured
- [ ] Timeout set to 30 seconds
- [ ] API Gateway routes configured
- [ ] API deployed to `prod` stage
- [ ] API URL noted and added to frontend `.env`
- [ ] Endpoints tested successfully

---

## Summary

**Function 1:**
- Name: `ecg-doctor-reports`
- Handler: `doctor-reports.handler`
- Zip: `doctor-reports.zip`
- Route: `GET /api/doctor/reports`

**Function 2:**
- Name: `ecg-doctor-upload-reviewed`
- Handler: `doctor-upload-reviewed.handler`
- Zip: `doctor-upload-reviewed.zip`
- Route: `POST /api/doctor/upload-reviewed`

**Both Functions:**
- Runtime: Node.js 18.x
- Timeout: 30 seconds
- Memory: 512 MB
- Environment: `NODE_ENV=production`, `S3_BUCKET=deck-backend-demo`, `AWS_REGION=us-east-1`

---

**Need Help?** Check AWS CloudWatch Logs for detailed error messages from your Lambda functions.

