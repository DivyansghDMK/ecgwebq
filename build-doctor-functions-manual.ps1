# Manual build script for doctor Lambda functions
# Compiles TypeScript and creates zip files

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Doctor Lambda Functions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check TypeScript compiler
$tscPath = Get-Command tsc -ErrorAction SilentlyContinue
if (-not $tscPath) {
    Write-Host "❌ TypeScript compiler not found!" -ForegroundColor Red
    Write-Host "Installing TypeScript globally..." -ForegroundColor Yellow
    npm install -g typescript
}

# Function 1: doctor-reports
Write-Host "[1/2] Building ecg-doctor-reports..." -ForegroundColor Yellow

$dir1 = "lambda-doctor-reports"
if (Test-Path $dir1) { Remove-Item -Recurse -Force $dir1 }
New-Item -ItemType Directory -Path $dir1 | Out-Null

Write-Host "  Compiling TypeScript..." -ForegroundColor Gray
Set-Location api

# Create temp tsconfig for doctor-reports
$tsConfig1 = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "../$dir1",
    "rootDir": ".",
    "noEmit": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true
  },
  "include": [
    "doctor-reports.ts",
    "types/**/*.ts",
    "services/**/*.ts",
    "utils/**/*.ts"
  ]
}
"@

$tsConfig1 | Out-File -FilePath "tsconfig.temp.json" -Encoding utf8
tsc --project tsconfig.temp.json
Remove-Item "tsconfig.temp.json"

Set-Location ..

# Copy node_modules and package.json
Write-Host "  Copying dependencies..." -ForegroundColor Gray
if (Test-Path "api\node_modules") {
    Copy-Item -Recurse "api\node_modules" "$dir1\node_modules" -Force
} else {
    Write-Host "  Installing dependencies..." -ForegroundColor Gray
    Set-Location api
    npm install --production
    Set-Location ..
    Copy-Item -Recurse "api\node_modules" "$dir1\node_modules" -Force
}

Copy-Item "api\package.json" "$dir1\package.json" -Force

# Create zip
if (Test-Path "doctor-reports.zip") { Remove-Item "doctor-reports.zip" }
Compress-Archive -Path "$dir1\*" -DestinationPath "doctor-reports.zip" -Force
$size1 = (Get-Item "doctor-reports.zip").Length / 1MB
Write-Host "  ✅ Created: doctor-reports.zip ($([math]::Round($size1, 2)) MB)" -ForegroundColor Green

# Function 2: doctor-upload-reviewed
Write-Host ""
Write-Host "[2/2] Building ecg-doctor-upload-reviewed..." -ForegroundColor Yellow

$dir2 = "lambda-doctor-upload"
if (Test-Path $dir2) { Remove-Item -Recurse -Force $dir2 }
New-Item -ItemType Directory -Path $dir2 | Out-Null

Write-Host "  Compiling TypeScript..." -ForegroundColor Gray
Set-Location api

# Create temp tsconfig for doctor-upload-reviewed
$tsConfig2 = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "../$dir2",
    "rootDir": ".",
    "noEmit": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true
  },
  "include": [
    "doctor-upload-reviewed.ts",
    "types/**/*.ts",
    "services/**/*.ts",
    "utils/**/*.ts"
  ]
}
"@

$tsConfig2 | Out-File -FilePath "tsconfig.temp.json" -Encoding utf8
tsc --project tsconfig.temp.json
Remove-Item "tsconfig.temp.json"

Set-Location ..

# Copy node_modules and package.json
Write-Host "  Copying dependencies..." -ForegroundColor Gray
Copy-Item -Recurse "api\node_modules" "$dir2\node_modules" -Force
Copy-Item "api\package.json" "$dir2\package.json" -Force

# Create zip
if (Test-Path "doctor-upload-reviewed.zip") { Remove-Item "doctor-upload-reviewed.zip" }
Compress-Archive -Path "$dir2\*" -DestinationPath "doctor-upload-reviewed.zip" -Force
$size2 = (Get-Item "doctor-upload-reviewed.zip").Length / 1MB
Write-Host "  ✅ Created: doctor-upload-reviewed.zip ($([math]::Round($size2, 2)) MB)" -ForegroundColor Green

# Cleanup
Write-Host ""
Write-Host "Cleaning up..." -ForegroundColor Gray
Remove-Item -Recurse -Force $dir1
Remove-Item -Recurse -Force $dir2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Upload zip files to Lambda functions" -ForegroundColor Yellow
Write-Host ""




