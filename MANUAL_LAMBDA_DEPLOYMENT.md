# Manual Lambda Function Deployment Guide

## Overview
This guide helps you manually create and deploy the two doctor-related Lambda functions when SAM deploy fails.

## Functions to Create

1. **ecg-doctor-reports** - GET /api/doctor/reports
2. **ecg-doctor-upload-reviewed** - POST /api/doctor/upload-reviewed

---

## Step 1: Prepare the Build Environment

### Install Dependencies
```powershell
cd api
npm install
cd ..
```

This installs:
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `uuid`

---

## Step 2: Build Function 1 - ecg-doctor-reports

### Required Files for `ecg-doctor-reports`:

```
doctor-reports.zip
├── doctor-reports.js (compiled from doctor-reports.ts)
├── types/
│   └── ecg.js (compiled)
├── services/
│   └── s3Service.js (compiled)
├── utils/
│   └── response.js (compiled)
├── node_modules/
│   ├── @aws-sdk/
│   └── uuid/
└── package.json
```

### ⚠️ IMPORTANT: Use Compiled Version

**Lambda requires JavaScript (.js) files, not TypeScript (.ts) files!**

Use the provided script `build-lambda-functions-compiled.ps1` which compiles TypeScript to JavaScript before creating the zip files.

### Build Script (PowerShell)

**Use the compiled build script:**
```powershell
.\build-lambda-functions-compiled.ps1
```

This script:
1. Compiles TypeScript to JavaScript
2. Includes only `.js` files in the zip
3. Includes `node_modules` with dependencies
4. Creates ready-to-upload zip files

**Old build script (DO NOT USE - contains .ts files):**

```powershell
# Build doctor-reports Lambda function
Write-Host "Building ecg-doctor-reports Lambda function..." -ForegroundColor Green

# Create temp directory
$tempDir = "lambda-doctor-reports"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy handler file
Copy-Item "api\doctor-reports.ts" "$tempDir\doctor-reports.ts"

# Copy required directories
Copy-Item -Recurse "api\types" "$tempDir\types"
Copy-Item -Recurse "api\services" "$tempDir\services"
Copy-Item -Recurse "api\utils" "$tempDir\utils"

# Copy package.json
Copy-Item "api\package.json" "$tempDir\package.json"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Set-Location $tempDir
npm install --production
Set-Location ..

# Compile TypeScript (if you have tsc installed globally)
# Or use the JavaScript files from .aws-sam/build if available
Write-Host "Note: You need to compile TypeScript to JavaScript" -ForegroundColor Yellow
Write-Host "Or copy from .aws-sam\build\DoctorReportsFunction\" -ForegroundColor Yellow

# Create zip file
Write-Host "Creating zip file..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir\*" -DestinationPath "doctor-reports.zip" -Force

Write-Host "✅ doctor-reports.zip created!" -ForegroundColor Green
Write-Host "Location: $(Get-Location)\doctor-reports.zip"
```

### ⚠️ DO NOT USE SAM Build Output Directly

**The SAM build output contains `.ts` files which Lambda cannot run!**

You must compile TypeScript to JavaScript first. Use the `build-lambda-functions-compiled.ps1` script instead.

**Old method (DO NOT USE):**

```powershell
# Copy from SAM build output
$tempDir = "lambda-doctor-reports"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy all files from SAM build
Copy-Item -Recurse ".aws-sam\build\DoctorReportsFunction\*" "$tempDir\"

# Create zip
Compress-Archive -Path "$tempDir\*" -DestinationPath "doctor-reports.zip" -Force
```

---

## Step 3: Build Function 2 - ecg-doctor-upload-reviewed

### Required Files for `ecg-doctor-upload-reviewed`:

```
doctor-upload-reviewed.zip
├── doctor-upload-reviewed.js (compiled)
├── types/
│   └── ecg.js
├── services/
│   └── s3Service.js
├── utils/
│   └── response.js
├── node_modules/
│   ├── @aws-sdk/
│   └── uuid/
└── package.json
```

### Build Script (PowerShell)

Create `build-doctor-upload.ps1`:

```powershell
# Build doctor-upload-reviewed Lambda function
Write-Host "Building ecg-doctor-upload-reviewed Lambda function..." -ForegroundColor Green

# Create temp directory
$tempDir = "lambda-doctor-upload"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy from SAM build output (recommended)
Copy-Item -Recurse ".aws-sam\build\DoctorUploadReviewedFunction\*" "$tempDir\"

# Create zip file
Write-Host "Creating zip file..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir\*" -DestinationPath "doctor-upload-reviewed.zip" -Force

Write-Host "✅ doctor-upload-reviewed.zip created!" -ForegroundColor Green
Write-Host "Location: $(Get-Location)\doctor-upload-reviewed.zip"
```

---

## Step 4: Create IAM Role for Lambda Functions

### Option A: Use Existing Role (if you have one)
Note the role ARN (e.g., `arn:aws:iam::373962339435:role/CardioXECGLambdaRole`)

### Option B: Create New Role via AWS Console

1. Go to **IAM Console** → **Roles** → **Create Role**
2. Select **AWS Service** → **Lambda**
3. Attach these policies:
   - `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
   - Custom policy for S3 access (see below)

4. **Custom S3 Policy JSON:**
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

5. Name the role: `CardioXECGLambdaRole`
6. Note the **Role ARN** (you'll need it in Step 5)

---

## Step 5: Create Lambda Functions via AWS Console

### Function 1: ecg-doctor-reports

1. Go to **Lambda Console** → **Functions** → **Create function**
2. **Configuration:**
   - **Function name:** `ecg-doctor-reports`
   - **Runtime:** `Node.js 18.x`
   - **Architecture:** `x86_64`
   - **Execution role:** Use existing role → Select `CardioXECGLambdaRole`
3. Click **Create function**
4. **Upload code:**
   - Scroll to **Code source**
   - Click **Upload from** → **.zip file**
   - Select `doctor-reports.zip`
   - Click **Save**
5. **Configure handler:**
   - **Handler:** `doctor-reports.handler`
   - **Runtime settings** → Edit → Handler: `doctor-reports.handler`
6. **Environment variables:**
   - Click **Configuration** → **Environment variables**
   - Add:
     - `NODE_ENV` = `production`
     - `S3_BUCKET` = `deck-backend-demo`
     - `AWS_REGION` = `us-east-1`
7. **Timeout:**
   - **Configuration** → **General configuration** → **Edit**
   - **Timeout:** `30 seconds`
   - **Memory:** `512 MB`
8. Click **Save**

### Function 2: ecg-doctor-upload-reviewed

1. Go to **Lambda Console** → **Functions** → **Create function**
2. **Configuration:**
   - **Function name:** `ecg-doctor-upload-reviewed`
   - **Runtime:** `Node.js 18.x`
   - **Architecture:** `x86_64`
   - **Execution role:** Use existing role → Select `CardioXECGLambdaRole`
3. Click **Create function**
4. **Upload code:**
   - Scroll to **Code source**
   - Click **Upload from** → **.zip file**
   - Select `doctor-upload-reviewed.zip`
   - Click **Save**
5. **Configure handler:**
   - **Handler:** `doctor-upload-reviewed.handler`
6. **Environment variables:**
   - Add:
     - `NODE_ENV` = `production`
     - `S3_BUCKET` = `deck-backend-demo`
     - `AWS_REGION` = `us-east-1`
7. **Timeout:**
   - **Timeout:** `30 seconds`
   - **Memory:** `512 MB`
8. Click **Save**

---

## Step 6: Configure API Gateway

### Option A: Add to Existing API Gateway

1. Go to **API Gateway Console** → Your API
2. **Add GET /api/doctor/reports:**
   - Click **Actions** → **Create Resource**
   - **Resource Path:** `doctor`
   - Click **Create Resource**
   - Select `/doctor` → **Actions** → **Create Resource**
   - **Resource Path:** `reports`
   - Click **Create Resource**
   - Select `/doctor/reports` → **Actions** → **Create Method** → **GET**
   - **Integration type:** Lambda Function
   - **Lambda Function:** `ecg-doctor-reports`
   - **Use Lambda Proxy integration:** ✅ Checked
   - Click **Save** → **OK** (for permission)
3. **Add POST /api/doctor/upload-reviewed:**
   - Select `/doctor` → **Actions** → **Create Resource**
   - **Resource Path:** `upload-reviewed`
   - Click **Create Resource**
   - Select `/doctor/upload-reviewed` → **Actions** → **Create Method** → **POST**
   - **Integration type:** Lambda Function
   - **Lambda Function:** `ecg-doctor-upload-reviewed`
   - **Use Lambda Proxy integration:** ✅ Checked
   - Click **Save** → **OK**
4. **Deploy API:**
   - **Actions** → **Deploy API**
   - **Deployment stage:** `prod` (or create new)
   - Click **Deploy**
5. **Note the API URL** (e.g., `https://xxxxx.execute-api.us-east-1.amazonaws.com/prod`)

### Option B: Use AWS CLI

```powershell
# Get your API Gateway ID (from existing API or create new)
$apiId = "YOUR_API_ID"

# Add GET /api/doctor/reports
aws apigateway put-method --rest-api-id $apiId --resource-id <resource-id> --http-method GET --authorization-type NONE

# Add POST /api/doctor/upload-reviewed
aws apigateway put-method --rest-api-id $apiId --resource-id <resource-id> --http-method POST --authorization-type NONE
```

---

## Step 7: Test the Functions

### Test Function 1 (doctor-reports)

```powershell
# Test via AWS CLI
aws lambda invoke --function-name ecg-doctor-reports --payload '{"httpMethod":"GET","path":"/api/doctor/reports"}' response.json
cat response.json
```

### Test Function 2 (doctor-upload-reviewed)

```powershell
# Create test payload
$testPayload = @{
    httpMethod = "POST"
    path = "/api/doctor/upload-reviewed"
    headers = @{
        "Content-Type" = "multipart/form-data"
    }
    body = "test"
} | ConvertTo-Json -Depth 10

$testPayload | Out-File -FilePath test-payload.json -Encoding utf8

aws lambda invoke --function-name ecg-doctor-upload-reviewed --payload file://test-payload.json response.json
cat response.json
```

---

## Step 8: Update Frontend .env

After deployment, update your `.env` file:

```env
VITE_API_BASE_URL=https://YOUR_API_GATEWAY_ID.execute-api.us-east-1.amazonaws.com/prod
```

---

## Quick Build Script (All-in-One)

Create `build-lambda-functions.ps1`:

```powershell
# Build both Lambda functions from SAM build output
Write-Host "Building Lambda deployment packages..." -ForegroundColor Green

# Function 1: doctor-reports
Write-Host "`n[1/2] Building ecg-doctor-reports..." -ForegroundColor Cyan
$dir1 = "lambda-doctor-reports"
if (Test-Path $dir1) { Remove-Item -Recurse -Force $dir1 }
New-Item -ItemType Directory -Path $dir1 | Out-Null
Copy-Item -Recurse ".aws-sam\build\DoctorReportsFunction\*" "$dir1\"
Compress-Archive -Path "$dir1\*" -DestinationPath "doctor-reports.zip" -Force
Write-Host "✅ Created: doctor-reports.zip" -ForegroundColor Green

# Function 2: doctor-upload-reviewed
Write-Host "`n[2/2] Building ecg-doctor-upload-reviewed..." -ForegroundColor Cyan
$dir2 = "lambda-doctor-upload"
if (Test-Path $dir2) { Remove-Item -Recurse -Force $dir2 }
New-Item -ItemType Directory -Path $dir2 | Out-Null
Copy-Item -Recurse ".aws-sam\build\DoctorUploadReviewedFunction\*" "$dir2\"
Compress-Archive -Path "$dir2\*" -DestinationPath "doctor-upload-reviewed.zip" -Force
Write-Host "✅ Created: doctor-upload-reviewed.zip" -ForegroundColor Green

Write-Host "`n✅ All packages built successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Upload doctor-reports.zip to Lambda function: ecg-doctor-reports"
Write-Host "2. Upload doctor-upload-reviewed.zip to Lambda function: ecg-doctor-upload-reviewed"
Write-Host "3. Configure API Gateway routes"
```

Run it:
```powershell
.\build-lambda-functions.ps1
```

---

## Troubleshooting

### Issue: "Cannot find module"
- **Solution:** Ensure `node_modules` is included in the zip
- Check that dependencies are installed: `cd api && npm install`

### Issue: "Handler not found"
- **Solution:** Verify handler path is correct:
  - `doctor-reports.handler` (not `doctor-reports.js.handler`)
  - Handler file must be at root of zip

### Issue: "Access Denied" to S3
- **Solution:** Check IAM role has S3 permissions
- Verify bucket name in environment variables matches actual bucket

### Issue: API Gateway returns 500
- **Solution:** Check CloudWatch logs for Lambda function
- Verify Lambda proxy integration is enabled
- Check CORS headers in response

---

## File Structure Reference

Each zip should contain:

```
function-name.zip
├── handler.js (or handler.ts if using TypeScript runtime)
├── types/
│   └── ecg.js
├── services/
│   └── s3Service.js
├── utils/
│   ├── response.js
│   ├── validation.js
│   └── crypto.js
├── node_modules/
│   ├── @aws-sdk/
│   │   ├── client-s3/
│   │   └── s3-request-presigner/
│   └── uuid/
└── package.json
```

---

## Summary Checklist

- [ ] Run `sam build` (to get compiled files)
- [ ] Run build script to create zip files
- [ ] Create/verify IAM role with S3 permissions
- [ ] Create Lambda function: `ecg-doctor-reports`
- [ ] Upload `doctor-reports.zip`
- [ ] Configure handler: `doctor-reports.handler`
- [ ] Set environment variables
- [ ] Create Lambda function: `ecg-doctor-upload-reviewed`
- [ ] Upload `doctor-upload-reviewed.zip`
- [ ] Configure handler: `doctor-upload-reviewed.handler`
- [ ] Set environment variables
- [ ] Configure API Gateway routes
- [ ] Deploy API Gateway
- [ ] Test functions
- [ ] Update frontend `.env` with API Gateway URL

---

**Need Help?** Check AWS CloudWatch Logs for detailed error messages.

