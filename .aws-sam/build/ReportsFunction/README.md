# ECG Serverless API

Production-grade, AWS Lambda-compatible serverless backend for ECG data management using AWS S3 as the storage layer.

## Architecture

- **Runtime**: Node.js with TypeScript
- **Deployment**: AWS Lambda + API Gateway
- **Storage**: AWS S3 (private bucket)
- **Authentication**: IAM role-based (no credentials in code)
- **SDK**: AWS SDK v3

## API Endpoints

### POST /api/upload
Uploads ECG record (JSON + PDF) to S3.

**Request Body:**
```json
{
  "deviceId": "string",
  "patient": {
    "name": "string",
    "phone": "string",
    "email": "string",
    "age": "number",
    "gender": "M|F|O",
    "address": "string",
    "medicalHistory": ["string"]
  },
  "metrics": {
    "heartRate": "number",
    "bloodPressure": {
      "systolic": "number",
      "diastolic": "number"
    },
    "intervals": {
      "pr": "number",
      "qrs": "number",
      "qt": "number",
      "qtc": "number"
    },
    "rhythm": "string",
    "interpretation": "string",
    "abnormalities": ["string"],
    "recommendations": ["string"]
  },
  "timestamp": "string (ISO 8601)",
  "pdfBase64": "string (base64 encoded PDF)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "recordId": "32-character-string"
  }
}
```

### GET /api/reports
Lists all ECG reports with optional filtering.

**Query Parameters:**
- `name` - Filter by patient name (partial match)
- `phone` - Filter by phone number (partial match)
- `deviceId` - Filter by device ID (partial match)
- `startDate` - Filter by start date (ISO 8601)
- `endDate` - Filter by end date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "data": [
      {
        "recordId": "string",
        "deviceId": "string",
        "patient": {
          "id": "string",
          "name": "string",
          "phone": "string"
        },
        "timestamp": "string",
        "createdAt": "string",
        "fileSize": "number",
        "hasPdf": "boolean"
      }
    ],
    "metadata": {
      "total": "number",
      "filtered": "number"
    }
  }
}
```

### GET /api/report?id={recordId}
Generates pre-signed URLs for specific ECG report.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "data": {
      "jsonUrl": "string",
      "pdfUrl": "string",
      "expiresIn": "number"
    }
  }
}
```

## File Structure

```
api/
├── types/
│   └── ecg.ts              # TypeScript type definitions
├── services/
│   └── s3Service.ts        # S3 operations layer
├── utils/
│   ├── base64.ts           # Base64 utilities
│   ├── crypto.ts           # Cryptographic utilities
│   ├── validation.ts       # Input validation
│   └── response.ts         # HTTP response formatting
├── upload.ts               # POST /api/upload handler
├── reports.ts              # GET /api/reports handler
└── report.ts               # GET /api/report handler
```

## Security Features

- **IAM Role Authentication**: No hardcoded AWS credentials
- **Private S3 Bucket**: Direct S3 access blocked
- **Pre-signed URLs**: Temporary access (60s TTL)
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses
- **CORS Support**: Proper CORS headers

## Deployment

### Prerequisites
- AWS CLI configured
- Node.js 18+
- AWS SAM or Serverless Framework (optional)

### Environment Variables
```bash
# AWS credentials (automatically picked up from IAM role)
# No explicit credentials required when deployed to Lambda

# S3 Configuration (hardcoded in types/ecg.ts)
BUCKET_NAME=deck-backend-demo
REGION=us-east-1
PREFIX=ecg-data/
```

### IAM Permissions Required
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      "Resource": [
        "arn:aws:s3:::deck-backend-demo",
        "arn:aws:s3:::deck-backend-demo/ecg-data/*"
      ]
    }
  ]
}
```

### Local Development
```bash
# Install dependencies
npm install

# Run locally (requires AWS credentials in environment)
npm run dev

# Test endpoints
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test","patient":{"name":"Test Patient"},"metrics":{"heartRate":72},"timestamp":"2025-01-01T00:00:00Z","pdfBase64":"base64data"}'
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `S3_UPLOAD_ERROR` - S3 upload failed
- `S3_LIST_ERROR` - S3 list operation failed
- `S3_GET_ERROR` - S3 get operation failed
- `RECORD_NOT_FOUND` - Record not found
- `INVALID_BASE64` - Invalid base64 format
- `INVALID_TIMESTAMP` - Invalid timestamp format
- `MISSING_REQUIRED_FIELD` - Required field missing
- `INTERNAL_ERROR` - Internal server error
- `UNAUTHORIZED` - Unauthorized access

## Monitoring & Logging

- CloudWatch Logs for Lambda functions
- Structured logging with correlation IDs
- Error tracking and alerting
- Performance metrics

## Frontend Integration

Use the provided frontend API client at `src/api/ecgApi.ts`:

```typescript
import { uploadECG, fetchReports, fetchReport } from './api/ecgApi';

// Upload ECG record
const result = await uploadECG(payload);

// Fetch reports list
const reports = await fetchReports({ name: "John" });

// Fetch specific report URLs
const urls = await fetchReport(recordId);
```

## Performance Considerations

- **Batch Operations**: Efficient batch S3 operations
- **Pagination**: Support for large datasets
- **Caching**: Browser caching for static assets
- **Compression**: Gzip compression for responses
- **Timeouts**: Appropriate timeout configurations

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## Contributing

1. Follow TypeScript strict mode
2. Add comprehensive error handling
3. Include input validation
4. Write unit tests for new features
5. Update documentation

## License

MIT License - see LICENSE file for details.
