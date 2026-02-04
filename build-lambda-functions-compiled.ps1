# Build Lambda deployment packages with TypeScript compilation
# This script compiles TypeScript to JavaScript before creating zip files

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Lambda Deployment Packages" -ForegroundColor Cyan
Write-Host "With TypeScript Compilation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if TypeScript compiler is available
$tscPath = Get-Command tsc -ErrorAction SilentlyContinue
if (-not $tscPath) {
    Write-Host "❌ Error: TypeScript compiler (tsc) not found!" -ForegroundColor Red
    Write-Host "Please install TypeScript: npm install -g typescript" -ForegroundColor Yellow
    exit 1
}

# Check if api/tsconfig.build.json exists, if not create it
if (-not (Test-Path "api\tsconfig.build.json")) {
    Write-Host "Creating tsconfig.build.json..." -ForegroundColor Yellow
    # The file should already be created, but check anyway
}

# Function 1: doctor-reports
Write-Host "[1/2] Building ecg-doctor-reports..." -ForegroundColor Yellow

# Create temp directory
$dir1 = "lambda-doctor-reports"
if (Test-Path $dir1) { 
    Remove-Item -Recurse -Force $dir1 
    Write-Host "  Cleaned existing directory" -ForegroundColor Gray
}
New-Item -ItemType Directory -Path $dir1 | Out-Null

# Compile TypeScript to JavaScript
Write-Host "  Compiling TypeScript..." -ForegroundColor Gray
Set-Location api

# Create a temporary tsconfig for compilation
$tempTsConfig = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "../$dir1",
    "rootDir": ".",
    "noEmit": false,
    "declaration": false,
    "sourceMap": false,
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

$tempTsConfig | Out-File -FilePath "tsconfig.temp.json" -Encoding utf8

# Compile
tsc --project tsconfig.temp.json

# Remove temp config
Remove-Item "tsconfig.temp.json"

Set-Location ..

# Copy only the compiled JavaScript files and required structure
Write-Host "  Organizing compiled files..." -ForegroundColor Gray

# Copy compiled JS files maintaining structure
if (Test-Path "$dir1\doctor-reports.js") {
    # Files are already in the right place from compilation
    # Now copy node_modules
    if (Test-Path "api\node_modules") {
        Copy-Item -Recurse "api\node_modules" "$dir1\node_modules" -Force
    } else {
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        Set-Location api
        npm install --production
        Set-Location ..
        Copy-Item -Recurse "api\node_modules" "$dir1\node_modules" -Force
    }
    
    # Copy package.json
    Copy-Item "api\package.json" "$dir1\package.json" -Force
} else {
    Write-Host "  ❌ Compilation failed - no doctor-reports.js found" -ForegroundColor Red
    exit 1
}

# Create zip file
if (Test-Path "doctor-reports.zip") { Remove-Item "doctor-reports.zip" }
Compress-Archive -Path "$dir1\*" -DestinationPath "doctor-reports.zip" -Force
$size1 = (Get-Item "doctor-reports.zip").Length / 1MB
Write-Host "  ✅ Created: doctor-reports.zip ($([math]::Round($size1, 2)) MB)" -ForegroundColor Green

# Function 2: doctor-upload-reviewed
Write-Host ""
Write-Host "[2/2] Building ecg-doctor-upload-reviewed..." -ForegroundColor Yellow

# Create temp directory
$dir2 = "lambda-doctor-upload"
if (Test-Path $dir2) { 
    Remove-Item -Recurse -Force $dir2 
    Write-Host "  Cleaned existing directory" -ForegroundColor Gray
}
New-Item -ItemType Directory -Path $dir2 | Out-Null

# Compile TypeScript to JavaScript
Write-Host "  Compiling TypeScript..." -ForegroundColor Gray
Set-Location api

# Create a temporary tsconfig for compilation
$tempTsConfig2 = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "../$dir2",
    "rootDir": ".",
    "noEmit": false,
    "declaration": false,
    "sourceMap": false,
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

$tempTsConfig2 | Out-File -FilePath "tsconfig.temp.json" -Encoding utf8

# Compile
tsc --project tsconfig.temp.json

# Remove temp config
Remove-Item "tsconfig.temp.json"

Set-Location ..

# Copy node_modules and package.json
if (Test-Path "$dir2\doctor-upload-reviewed.js") {
    if (Test-Path "api\node_modules") {
        Copy-Item -Recurse "api\node_modules" "$dir2\node_modules" -Force
    }
    Copy-Item "api\package.json" "$dir2\package.json" -Force
} else {
    Write-Host "  ❌ Compilation failed - no doctor-upload-reviewed.js found" -ForegroundColor Red
    exit 1
}

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
Write-Host "⚠️  IMPORTANT: Verify zip contents contain .js files, not .ts files!" -ForegroundColor Yellow
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

