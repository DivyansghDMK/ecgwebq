# Build Lambda deployment packages from SAM build output
# Run this after: sam build

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Lambda Deployment Packages" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if SAM build output exists
if (-not (Test-Path ".aws-sam\build\DoctorReportsFunction")) {
    Write-Host "❌ Error: SAM build output not found!" -ForegroundColor Red
    Write-Host "Please run 'sam build' first" -ForegroundColor Yellow
    exit 1
}

# Function 1: doctor-reports
Write-Host "[1/2] Building ecg-doctor-reports..." -ForegroundColor Yellow
$dir1 = "lambda-doctor-reports"
if (Test-Path $dir1) { 
    Remove-Item -Recurse -Force $dir1 
    Write-Host "  Cleaned existing directory" -ForegroundColor Gray
}
New-Item -ItemType Directory -Path $dir1 | Out-Null

# Copy all files from SAM build
Copy-Item -Recurse ".aws-sam\build\DoctorReportsFunction\*" "$dir1\" -Force
Write-Host "  Copied files from SAM build" -ForegroundColor Gray

# Create zip file
if (Test-Path "doctor-reports.zip") { Remove-Item "doctor-reports.zip" }
Compress-Archive -Path "$dir1\*" -DestinationPath "doctor-reports.zip" -Force
$size1 = (Get-Item "doctor-reports.zip").Length / 1MB
Write-Host "  ✅ Created: doctor-reports.zip ($([math]::Round($size1, 2)) MB)" -ForegroundColor Green

# Function 2: doctor-upload-reviewed
Write-Host ""
Write-Host "[2/2] Building ecg-doctor-upload-reviewed..." -ForegroundColor Yellow
$dir2 = "lambda-doctor-upload"
if (Test-Path $dir2) { 
    Remove-Item -Recurse -Force $dir2 
    Write-Host "  Cleaned existing directory" -ForegroundColor Gray
}
New-Item -ItemType Directory -Path $dir2 | Out-Null

# Copy all files from SAM build
Copy-Item -Recurse ".aws-sam\build\DoctorUploadReviewedFunction\*" "$dir2\" -Force
Write-Host "  Copied files from SAM build" -ForegroundColor Gray

# Create zip file
if (Test-Path "doctor-upload-reviewed.zip") { Remove-Item "doctor-upload-reviewed.zip" }
Compress-Archive -Path "$dir2\*" -DestinationPath "doctor-upload-reviewed.zip" -Force
$size2 = (Get-Item "doctor-upload-reviewed.zip").Length / 1MB
Write-Host "  ✅ Created: doctor-upload-reviewed.zip ($([math]::Round($size2, 2)) MB)" -ForegroundColor Green

# Cleanup temp directories
Write-Host ""
Write-Host "Cleaning up temporary directories..." -ForegroundColor Gray
Remove-Item -Recurse -Force $dir1
Remove-Item -Recurse -Force $dir2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ All packages built successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to AWS Lambda Console" -ForegroundColor White
Write-Host "2. Create function: ecg-doctor-reports" -ForegroundColor White
Write-Host "   - Upload: doctor-reports.zip" -ForegroundColor Gray
Write-Host "   - Handler: doctor-reports.handler" -ForegroundColor Gray
Write-Host "   - Runtime: Node.js 18.x" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Create function: ecg-doctor-upload-reviewed" -ForegroundColor White
Write-Host "   - Upload: doctor-upload-reviewed.zip" -ForegroundColor Gray
Write-Host "   - Handler: doctor-upload-reviewed.handler" -ForegroundColor Gray
Write-Host "   - Runtime: Node.js 18.x" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Configure API Gateway routes" -ForegroundColor White
Write-Host "5. Update frontend .env with API Gateway URL" -ForegroundColor White
Write-Host ""

