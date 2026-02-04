# ECG Data Ingestion & Display Implementation Plan

## Overview
This document outlines the implementation strategy for receiving JSON ECG data from devices, storing it in AWS S3, and creating APIs to fetch and display the exact data in the admin dashboard UI.

**Core Flow:**
```
ECG Device → POST JSON Data to Server → Store in AWS S3 → Fetch from S3 → Display on Admin Dashboard (Exact Data)
```

---

## Requirements Summary

- **Authentication:** JWT Tokens
- **AWS Region:** us-east-1
- **Storage:** AWS S3 (direct queries, no MongoDB metadata)
- **Expected Volume:** 
  - 10,000 users/day
  - 100,000 reports/day (~115 reports/minute average, ~2 reports/second peak)
- **Data Format:** JSON string containing all ECG data
- **Scope:** Data ingestion and display only

---

## Architecture Decision

### Recommended: Vercel Serverless Functions for ECG Endpoints

**Rationale:**
- **Existing Setup:** Already using Vercel serverless functions (`api/analytics.ts`)
- **Simplified Deployment:** No separate server to manage
- **Auto-Scaling:** Vercel automatically scales based on traffic
- **Cost-Effective:** Pay only for execution time
- **AWS Integration:** Can directly integrate with AWS S3 from serverless functions
- **Fast Development:** Quick to implement and deploy

**Note for High Volume:**
- For 100,000 reports/day, monitor execution times and costs
- Vercel Pro plan recommended (60s timeout limit)
- If volume exceeds serverless capabilities, can migrate to Express backend later

**Architecture:**
```
Frontend (Vercel) → Vercel Serverless Functions (ECG API) → AWS S3 (us-east-1)
```

---

## Implementation Plan

### Phase 1: AWS S3 Setup

#### 1.1 S3 Bucket Configuration

**Bucket Name:** `cardiox-ecg-data` (must be globally unique)

**AWS Region:** us-east-1

**Folder Structure (Optimized for High Volume & Query Performance):**
```
cardiox-ecg-data/
  └── ecg-json/
      └── {year}/
          └── {month}/
              └── {day}/
                  └── {device_id}/
                      ├── {timestamp}-{uuid}.json
                      ├── {timestamp}-{uuid}.json
                      └── ...
```

**Example:**
```
cardiox-ecg-data/
  └── ecg-json/
      └── 2025/
          └── 01/
              └── 20/
                  ├── ECG001/
                  │   ├── 20250120-100000-abc123.json
                  │   ├── 20250120-103000-def456.json
                  │   └── ...
                  ├── ECG002/
                  │   ├── 20250120-100500-ghi789.json
                  │   └── ...
                  └── ...
```

**Naming Convention:**
- Format: `{YYYYMMDD}-{HHMMSS}-{uuid}.json`
- Example: `20250120-100000-abc123def456.json`
- Benefits:
  - Sorted by timestamp naturally
  - Easy date-based filtering via S3 prefix
  - Device-based prefix for faster device-specific queries
  - UUID ensures uniqueness

#### 1.2 S3 Bucket Settings

**Versioning:** Enabled (for data recovery)

**Encryption:**
- SSE-S3 (Server-Side Encryption with Amazon S3 managed keys)
- Or SSE-KMS for additional security

**Lifecycle Policies:**
- Transition to Glacier after 90 days (optional, for cost optimization)
- Delete old versions after 30 days

**CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT"],
    "AllowedOrigins": ["https://your-frontend-domain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

#### 1.3 S3 Permissions (IAM Policy)

**IAM User/Role Required Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      "Resource": [
        "arn:aws:s3:::cardiox-ecg-data",
        "arn:aws:s3:::cardiox-ecg-data/*"
      ]
    }
  ]
}
```

**S3 Bucket Policy (Additional Security):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:user/cardiox-api-user"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::cardiox-ecg-data",
        "arn:aws:s3:::cardiox-ecg-data/*"
      ]
    }
  ]
}
```

#### 1.4 Environment Variables

**Vercel Environment Variables (Set in Vercel Dashboard):**

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=cardiox-ecg-data

# JWT Configuration
JWT_SECRET=your_strong_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# CORS Configuration (optional, can handle in code)
CORS_ORIGIN=https://your-frontend-domain.com
```

**Important:**
- Set these in Vercel Dashboard for Production, Preview, and Development environments
- Never commit secrets to Git
- Use Vercel's environment variable management for secure storage

---

### Phase 2: ECG Data Model & Structure

#### 2.1 Expected ECG JSON Data Format

**Complete JSON Structure (what devices will send):**
```json
{
  "device_id": "ECG001",
  "device_serial": "ECG-2024-001234",
  "patient_id": "PAT001",
  "patient": {
    "name": "John Doe",
    "age": "45",
    "gender": "M",
    "dob": "1978-05-15",
    "contact": "+1234567890"
  },
  "recording_metadata": {
    "recording_date": "2025-01-20T10:00:00Z",
    "duration_seconds": 300,
    "sample_rate": 500,
    "leads": ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"],
    "paper_speed": "25mm/s",
    "amplitude": "10mm/mV"
  },
  "metrics": {
    "HR_bpm": 75,
    "PR_interval_ms": 160,
    "QRS_duration_ms": 90,
    "QT_interval_ms": 400,
    "QTc_interval_ms": 415,
    "RR_interval_ms": 800,
    "axis": "+60",
    "ST_elevation_mv": 0,
    "ST_depression_mv": 0
  },
  "waveform_data": {
    "lead_I": [0.1, 0.15, 0.12, ...],
    "lead_II": [0.2, 0.25, 0.22, ...],
    "lead_III": [0.1, 0.1, 0.08, ...],
    "lead_aVR": [...],
    "lead_aVL": [...],
    "lead_aVF": [...],
    "lead_V1": [...],
    "lead_V2": [...],
    "lead_V3": [...],
    "lead_V4": [...],
    "lead_V5": [...],
    "lead_V6": [...]
  },
  "analysis": {
    "rhythm": "Normal Sinus Rhythm",
    "findings": [],
    "quality": "Good",
    "artifacts": []
  },
  "upload_metadata": {
    "uploaded_at": "2025-01-20T10:05:00Z",
    "uploaded_by": "mobile_app",
    "app_version": "1.2.3",
    "file_size_bytes": 1024000
  }
}
```

**Note:** The exact structure may vary. The system should accept the JSON as-is and store it exactly as received.

#### 2.2 S3 Object Metadata (for efficient queries)

**S3 Object Tags (Optional, for filtering):**
```
device_id=ECG001
patient_id=PAT001
recording_date=2025-01-20
patient_name=John_Doe
```

**S3 Object User Metadata:**
```
x-amz-meta-device-id: ECG001
x-amz-meta-patient-id: PAT001
x-amz-meta-recording-date: 2025-01-20T10:00:00Z
x-amz-meta-patient-name: John Doe
```

---

### Phase 3: Backend API Endpoints Design

#### 3.1 POST `/api/ecg/upload` - Store ECG Data

**Purpose:** Receive JSON ECG data from devices and store in S3

**Authentication:** JWT Token required

**Request:**
```http
POST /api/ecg/upload
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "ecg_data": {
    // Full ECG JSON object (as described in section 2.1)
  }
}
```

**Validation:**
- Verify JWT token
- Validate JSON structure (basic checks)
- Check required fields: `device_id`, `recording_metadata.recording_date`
- Validate date format
- Check file size limits (e.g., max 50MB)

**Processing:**
1. Generate unique ECG ID: `{YYYYMMDD}-{HHMMSS}-{uuid}`
2. Construct S3 key: `ecg-json/{year}/{month}/{day}/{device_id}/{ecg_id}.json`
3. Upload JSON to S3 with metadata
4. Return success response with S3 information

**Response (Success - 201 Created):**
```json
{
  "success": true,
  "message": "ECG data uploaded successfully",
  "data": {
    "ecg_id": "20250120-100000-abc123def456",
    "s3_key": "ecg-json/2025/01/20/ECG001/20250120-100000-abc123def456.json",
    "s3_url": "s3://cardiox-ecg-data/ecg-json/2025/01/20/ECG001/20250120-100000-abc123def456.json",
    "public_url": "https://cardiox-ecg-data.s3.us-east-1.amazonaws.com/ecg-json/2025/01/20/ECG001/20250120-100000-abc123def456.json",
    "uploaded_at": "2025-01-20T10:05:00Z",
    "file_size_bytes": 1024000,
    "device_id": "ECG001",
    "patient_id": "PAT001"
  }
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid ECG data",
  "details": {
    "device_id": "Required field missing",
    "recording_metadata.recording_date": "Invalid date format"
  }
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Invalid or expired JWT token"
}
```

**Response (Error - 500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Upload failed",
  "message": "Failed to upload to S3. Please try again."
}
```

#### 3.2 GET `/api/ecg/list` - List ECG Records

**Purpose:** Fetch list of ECG records with filtering and pagination

**Authentication:** JWT Token required

**Query Parameters:**
- `device_id` (optional) - Filter by device ID
- `patient_id` (optional) - Filter by patient ID
- `from` (optional) - Start date (ISO 8601: `2025-01-20` or `2025-01-20T00:00:00Z`)
- `to` (optional) - End date (ISO 8601: `2025-01-21` or `2025-01-21T23:59:59Z`)
- `limit` (optional, default: 50, max: 500) - Number of records per page
- `offset` (optional, default: 0) - Pagination offset
- `sort` (optional, default: "desc") - Sort order ("asc" or "desc")

**Request:**
```http
GET /api/ecg/list?device_id=ECG001&from=2025-01-20&to=2025-01-21&limit=50&offset=0&sort=desc
Authorization: Bearer <jwt_token>
```

**Processing:**
1. Verify JWT token
2. Parse query parameters
3. Construct S3 prefix based on filters (e.g., `ecg-json/2025/01/20/ECG001/`)
4. List objects from S3 using `ListObjectsV2Command`
5. Parse each object to extract metadata
6. Return paginated list

**Note:** For high volume, consider:
- Limiting date range queries (max 30 days)
- Using S3 prefixes efficiently
- Caching frequent queries

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "data": {
    "ecg_records": [
      {
        "ecg_id": "20250120-100000-abc123def456",
        "device_id": "ECG001",
        "patient_id": "PAT001",
        "patient": {
          "name": "John Doe",
          "age": "45"
        },
        "recording_date": "2025-01-20T10:00:00Z",
        "metrics": {
          "HR_bpm": 75,
          "PR_interval_ms": 160,
          "QRS_duration_ms": 90,
          "QTc_interval_ms": 415
        },
        "s3_key": "ecg-json/2025/01/20/ECG001/20250120-100000-abc123def456.json",
        "public_url": "https://cardiox-ecg-data.s3.us-east-1.amazonaws.com/ecg-json/2025/01/20/ECG001/20250120-100000-abc123def456.json",
        "uploaded_at": "2025-01-20T10:05:00Z",
        "file_size_bytes": 1024000
      }
      // ... more records
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "has_more": true,
      "next_offset": 50
    },
    "filters_applied": {
      "device_id": "ECG001",
      "from": "2025-01-20",
      "to": "2025-01-21"
    }
  }
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid parameters",
  "message": "Date range cannot exceed 30 days"
}
```

#### 3.3 GET `/api/ecg/:id` - Get Specific ECG Record (Full Data)

**Purpose:** Fetch complete ECG data for a specific record

**Authentication:** JWT Token required

**URL Parameters:**
- `id` - ECG ID (format: `{timestamp}-{uuid}`)

**Request:**
```http
GET /api/ecg/20250120-100000-abc123def456
Authorization: Bearer <jwt_token>
```

**Processing:**
1. Verify JWT token
2. Extract ECG ID from URL
3. Search for the file in S3 (may need to try multiple date prefixes if not provided)
4. Fetch full JSON from S3
5. Return exact data as stored

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "data": {
    // Complete ECG JSON object exactly as stored in S3
    "device_id": "ECG001",
    "device_serial": "ECG-2024-001234",
    "patient_id": "PAT001",
    "patient": {
      "name": "John Doe",
      "age": "45",
      "gender": "M",
      "dob": "1978-05-15",
      "contact": "+1234567890"
    },
    "recording_metadata": {
      "recording_date": "2025-01-20T10:00:00Z",
      "duration_seconds": 300,
      "sample_rate": 500,
      "leads": ["I", "II", "III", ...],
      "paper_speed": "25mm/s",
      "amplitude": "10mm/mV"
    },
    "metrics": {
      "HR_bpm": 75,
      "PR_interval_ms": 160,
      "QRS_duration_ms": 90,
      "QT_interval_ms": 400,
      "QTc_interval_ms": 415,
      "RR_interval_ms": 800,
      "axis": "+60",
      "ST_elevation_mv": 0,
      "ST_depression_mv": 0
    },
    "waveform_data": {
      "lead_I": [0.1, 0.15, 0.12, ...],
      "lead_II": [0.2, 0.25, 0.22, ...],
      // ... all 12 leads
    },
    "analysis": {
      "rhythm": "Normal Sinus Rhythm",
      "findings": [],
      "quality": "Good",
      "artifacts": []
    },
    "upload_metadata": {
      "uploaded_at": "2025-01-20T10:05:00Z",
      "uploaded_by": "mobile_app",
      "app_version": "1.2.3",
      "file_size_bytes": 1024000
    }
  },
  "s3_info": {
    "s3_key": "ecg-json/2025/01/20/ECG001/20250120-100000-abc123def456.json",
    "last_modified": "2025-01-20T10:05:00Z",
    "file_size_bytes": 1024000
  }
}
```

**Response (Error - 404 Not Found):**
```json
{
  "success": false,
  "error": "Not found",
  "message": "ECG record not found"
}
```

#### 3.4 GET `/api/ecg/:id/summary` - Get ECG Summary (Lightweight)

**Purpose:** Fetch summary/metadata only (no waveform data) for faster list loading

**Authentication:** JWT Token required

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "data": {
    "ecg_id": "20250120-100000-abc123def456",
    "device_id": "ECG001",
    "device_serial": "ECG-2024-001234",
    "patient_id": "PAT001",
    "patient": {
      "name": "John Doe",
      "age": "45",
      "gender": "M"
    },
    "recording_date": "2025-01-20T10:00:00Z",
    "recording_metadata": {
      "duration_seconds": 300,
      "sample_rate": 500,
      "leads": ["I", "II", "III", ...]
    },
    "metrics": {
      "HR_bpm": 75,
      "PR_interval_ms": 160,
      "QRS_duration_ms": 90,
      "QTc_interval_ms": 415
    },
    "analysis": {
      "rhythm": "Normal Sinus Rhythm",
      "quality": "Good"
    },
    "s3_key": "ecg-json/2025/01/20/ECG001/20250120-100000-abc123def456.json",
    "uploaded_at": "2025-01-20T10:05:00Z",
    "file_size_bytes": 1024000
  }
}
```

**Note:** This endpoint extracts summary from full JSON, excluding `waveform_data` for faster response.

---

### Phase 4: Backend Implementation Structure

#### 4.1 Vercel Serverless Functions Structure

```
api/
  ├── ecg/
  │   ├── upload.ts            # POST /api/ecg/upload
  │   ├── list.ts              # GET /api/ecg/list
  │   ├── [id].ts              # GET /api/ecg/:id
  │   └── [id]/
  │       └── summary.ts       # GET /api/ecg/:id/summary
  ├── utils/
  │   ├── s3Service.ts         # S3 upload/download operations
  │   ├── jwtService.ts        # JWT token verification
  │   ├── ecgValidator.ts      # ECG data validation
  │   └── errorHandler.ts      # Error handling utilities
  └── types/
      └── ecg.ts               # TypeScript types
```

**File Structure:**
```
api/
  ├── ecg/
  │   ├── upload.ts            # POST endpoint - Store ECG data
  │   ├── list.ts              # GET endpoint - List ECG records
  │   └── [id].ts              # GET endpoint - Get specific ECG
  │       └── summary.ts       # GET endpoint - Get ECG summary
  ├── utils/
  │   ├── s3.ts                # S3 client and operations
  │   ├── jwt.ts               # JWT verification
  │   ├── validator.ts         # Validation schemas
  │   └── errors.ts            # Error response helpers
```

#### 4.2 Required NPM Packages

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.x.x",
    "@aws-sdk/s3-request-presigner": "^3.x.x",
    "@vercel/node": "^5.x.x",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.11.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.x.x",
    "@types/jsonwebtoken": "^9.0.x",
    "typescript": "^5.x.x"
  }
}
```

**Note:** Vercel automatically handles TypeScript compilation, so no separate build step needed.

#### 4.3 Vercel Function Example Structure

**Example: `api/ecg/upload.ts`**
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from '../../utils/jwt';
import { validateECGData } from '../../utils/validator';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST method is allowed'
    });
  }

  try {
    // 1. Verify JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_REQUIRED',
        message: 'Authentication required'
      });
    }

    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_INVALID',
        message: 'Invalid or expired token'
      });
    }

    // 2. Validate ECG data
    const { ecg_data } = req.body;
    if (!ecg_data) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'ecg_data is required'
      });
    }

    const validationResult = validateECGData(ecg_data);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid ECG data',
        details: validationResult.errors
      });
    }

    // 3. Generate unique ECG ID and S3 key
    const { v4: uuidv4 } = require('uuid');
    const recordingDate = new Date(ecg_data.recording_metadata?.recording_date || Date.now());
    const year = recordingDate.getFullYear();
    const month = String(recordingDate.getMonth() + 1).padStart(2, '0');
    const day = String(recordingDate.getDate()).padStart(2, '0');
    const timestamp = `${year}${month}${day}-${String(recordingDate.getHours()).padStart(2, '0')}${String(recordingDate.getMinutes()).padStart(2, '0')}${String(recordingDate.getSeconds()).padStart(2, '0')}`;
    const uuid = uuidv4().replace(/-/g, '').substring(0, 12);
    const ecgId = `${timestamp}-${uuid}`;
    const deviceId = ecg_data.device_id || 'UNKNOWN';
    const s3Key = `ecg-json/${year}/${month}/${day}/${deviceId}/${ecgId}.json`;

    // 4. Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: s3Key,
      Body: JSON.stringify(ecg_data),
      ContentType: 'application/json',
      Metadata: {
        'device-id': deviceId,
        'patient-id': ecg_data.patient_id || '',
        'recording-date': recordingDate.toISOString(),
        'patient-name': ecg_data.patient?.name || '',
      },
    });

    await s3Client.send(uploadCommand);

    // 5. Return success response
    return res.status(201).json({
      success: true,
      message: 'ECG data uploaded successfully',
      data: {
        ecg_id: ecgId,
        s3_key: s3Key,
        s3_url: `s3://${process.env.AWS_S3_BUCKET_NAME}/${s3Key}`,
        public_url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.us-east-1.amazonaws.com/${s3Key}`,
        uploaded_at: new Date().toISOString(),
        file_size_bytes: JSON.stringify(ecg_data).length,
        device_id: deviceId,
        patient_id: ecg_data.patient_id,
      }
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to upload ECG data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
```

**Note:** This is pseudo-code structure. Actual implementation will have separate utility files for S3 operations, JWT verification, and validation.

#### 4.4 Validation Schema (Joi)

```javascript
const ecgDataSchema = Joi.object({
  device_id: Joi.string().required(),
  device_serial: Joi.string().optional(),
  patient_id: Joi.string().optional(),
  patient: Joi.object({
    name: Joi.string().optional(),
    age: Joi.string().optional(),
    gender: Joi.string().valid('M', 'F', 'Other').optional(),
    dob: Joi.string().optional(),
    contact: Joi.string().optional()
  }).optional(),
  recording_metadata: Joi.object({
    recording_date: Joi.string().isoDate().required(),
    duration_seconds: Joi.number().optional(),
    sample_rate: Joi.number().optional(),
    leads: Joi.array().items(Joi.string()).optional(),
    paper_speed: Joi.string().optional(),
    amplitude: Joi.string().optional()
  }).required(),
  metrics: Joi.object({
    HR_bpm: Joi.number().min(30).max(200).optional()
  }).optional(),
  waveform_data: Joi.object().optional(),
  analysis: Joi.object().optional(),
  upload_metadata: Joi.object().optional()
}).unknown(true); // Allow additional fields
```

---

### Phase 5: Frontend Integration

#### 5.1 API Service Layer

**File: `src/services/ecgApi.ts`**

```typescript
// Service functions for ECG API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Helper to get auth token
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

export const ecgApi = {
  // Upload ECG data
  uploadECG: async (ecgData: object) => {
    const token = getAuthToken();
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${API_BASE_URL}/ecg/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ecg_data: ecgData })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  // List ECG records
  listECG: async (filters: {
    device_id?: string;
    patient_id?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
    sort?: 'asc' | 'desc';
  }) => {
    const token = getAuthToken();
    if (!token) throw new Error('No auth token');

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/ecg/list?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Fetch failed');
    }

    return response.json();
  },

  // Get specific ECG record (full data)
  getECG: async (ecgId: string) => {
    const token = getAuthToken();
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${API_BASE_URL}/ecg/${ecgId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Fetch failed');
    }

    return response.json();
  },

  // Get ECG summary (lightweight)
  getECGSummary: async (ecgId: string) => {
    const token = getAuthToken();
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${API_BASE_URL}/ecg/${ecgId}/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Fetch failed');
    }

    return response.json();
  }
};
```

#### 5.2 TypeScript Types

**File: `src/types/ecg.ts`**

```typescript
export interface ECGData {
  device_id: string;
  device_serial?: string;
  patient_id?: string;
  patient?: {
    name?: string;
    age?: string;
    gender?: 'M' | 'F' | 'Other';
    dob?: string;
    contact?: string;
  };
  recording_metadata: {
    recording_date: string;
    duration_seconds?: number;
    sample_rate?: number;
    leads?: string[];
    paper_speed?: string;
    amplitude?: string;
  };
  metrics?: {
    HR_bpm?: number;
    PR_interval_ms?: number;
    QRS_duration_ms?: number;
    QT_interval_ms?: number;
    QTc_interval_ms?: number;
    RR_interval_ms?: number;
    axis?: string;
    ST_elevation_mv?: number;
    ST_depression_mv?: number;
  };
  waveform_data?: Record<string, number[]>;
  analysis?: {
    rhythm?: string;
    findings?: string[];
    quality?: string;
    artifacts?: string[];
  };
  upload_metadata?: {
    uploaded_at?: string;
    uploaded_by?: string;
    app_version?: string;
    file_size_bytes?: number;
  };
}

export interface ECGRecord {
  ecg_id: string;
  device_id: string;
  patient_id?: string;
  patient?: {
    name?: string;
    age?: string;
  };
  recording_date: string;
  metrics?: ECGData['metrics'];
  s3_key: string;
  public_url: string;
  uploaded_at: string;
  file_size_bytes: number;
}

export interface ECGListResponse {
  success: boolean;
  data: {
    ecg_records: ECGRecord[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
      next_offset?: number;
    };
    filters_applied: Record<string, any>;
  };
}
```

#### 5.3 Dashboard Integration

**Update `DashboardOverview.tsx`:**
- Replace mock `reportsThisMonth` with real API call
- Fetch latest ECG records count
- Display real-time stats

**Update `ReportsPage.tsx`:**
- Fetch ECG records list using `ecgApi.listECG()`
- Display ECG records in table/cards
- Add filtering UI (device, patient, date range)
- Implement pagination
- Show ECG detail modal on click

**New Component: `ECGRecordDetail.tsx`:**
- Display full ECG data
- Show all metrics
- Display waveform data (if charts available)
- Show patient information

---

### Phase 6: Performance Optimization (High Volume Handling)

#### 6.1 Vercel Serverless Function Limitations & Solutions

**Vercel Function Limits (Pro Plan):**
- Execution Time: 60 seconds maximum
- Memory: 1GB (default), up to 3GB
- Cold Starts: ~100-500ms (first request)
- Concurrent Executions: Auto-scaled

**Solutions for High Volume:**

1. **Efficient S3 Prefix Filtering**
   - Use date-based prefixes: `ecg-json/2025/01/20/`
   - Use device-based prefixes: `ecg-json/2025/01/20/ECG001/`
   - Limit date range queries (max 30 days)
   - Keep list queries under 5 seconds

2. **Pagination Implementation**
   - Use S3 `ContinuationToken` for pagination
   - Limit default page size (50 records)
   - Implement cursor-based pagination
   - Return pagination tokens for next page

3. **Optimize Function Execution**
   - Keep functions warm (Vercel Edge Config caching)
   - Minimize cold starts (reuse S3 client)
   - Stream large responses
   - Use HTTP/2 for better performance

4. **Caching Strategy (If Needed)**
   - Vercel Edge Config for metadata caching
   - Cache recent queries (5-10 minutes)
   - Use Cache-Control headers
   - Consider Vercel KV (Redis) for frequent queries

5. **Async Processing (Future)**
   - For heavy operations, return job ID immediately
   - Process in background worker
   - Use polling or WebSocket for results

#### 6.2 Rate Limiting (Vercel)

**Vercel Rate Limiting:**
- Built-in rate limiting via Vercel Edge Middleware
- Or implement custom rate limiting in functions
- Per IP: 100 requests/minute (adjustable)
- Per user: Use JWT-based rate limiting

**Implementation in Function:**
```typescript
// Simple in-memory rate limiting (per function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}
```

**Note:** For production, use Vercel Edge Middleware or external rate limiting service.

#### 6.3 Large File Handling (Vercel Serverless)

**Challenge:** ECG JSON files can be large (1-10 MB), Vercel has payload limits

**Vercel Payload Limits:**
- Request Body: 4.5 MB (Hobby), 50 MB (Pro)
- Response Body: No hard limit, but keep under 6 MB for optimal performance

**Solutions:**
1. **Optimize JSON Size**
   - Remove unnecessary whitespace
   - Consider compression before upload
   - Stream large waveform data separately

2. **Direct S3 Upload (Future Enhancement)**
   - Use presigned URLs for direct S3 upload from devices
   - Serverless function only generates presigned URL
   - Device uploads directly to S3
   - Reduces serverless function execution time

3. **Chunked Processing**
   - For very large files, split into chunks
   - Process chunks in separate function calls
   - Reassemble on S3

4. **Summary Endpoint**
   - Always provide summary endpoint without waveform data
   - Load full data only when needed
   - Reduces response size for list queries

#### 6.4 S3 Client Configuration & Retry Logic

**S3 SDK Configuration (Optimized for Serverless):**
```typescript
import { S3Client } from '@aws-sdk/client-s3';

// Reuse S3 client across function invocations (Vercel caches)
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      maxAttempts: 3,
      requestHandler: {
        requestTimeout: 25000, // 25 seconds (less than function timeout)
      },
    });
  }
  return s3Client;
}
```

**Retry Strategy:**
- AWS SDK handles automatic retries with exponential backoff
- Max 3 attempts by default
- Log retry attempts for monitoring

---

### Phase 7: Security & Authentication

#### 7.1 JWT Authentication Flow

1. **User Login** → Get JWT token
2. **Store Token** → localStorage or sessionStorage
3. **API Requests** → Include token in Authorization header
4. **Backend Verification** → Verify token on each request
5. **Token Refresh** → Refresh token before expiry

#### 7.2 JWT Token Structure

```javascript
{
  "userId": "user123",
  "role": "admin", // or "doctor"
  "iat": 1703001234,
  "exp": 1703087634
}
```

#### 7.3 Authentication Utility (Serverless Function)

**File: `api/utils/jwt.ts`**
```typescript
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface JWTPayload {
  userId: string;
  role: 'admin' | 'doctor';
  iat?: number;
  exp?: number;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function requireAuth(req: VercelRequest): { user: JWTPayload } | null {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return null;
  }
  
  const user = verifyToken(token);
  return user ? { user } : null;
}
```

**Usage in Function:**
```typescript
const auth = requireAuth(req);
if (!auth) {
  return res.status(401).json({
    success: false,
    error: 'AUTH_REQUIRED',
    message: 'Authentication required'
  });
}
// Use auth.user in function
```

#### 7.4 Data Validation

- Validate all incoming ECG data
- Sanitize user inputs
- Check file size limits (max 50MB)
- Validate JSON structure
- Rate limit uploads

#### 7.5 S3 Security

- Use IAM roles with least privilege
- Enable S3 bucket encryption (SSE-S3 or SSE-KMS)
- Use presigned URLs for temporary access (if needed)
- Enable S3 access logging
- Enable CloudTrail for audit trail
- Block public access to bucket

---

### Phase 8: Error Handling & Logging

#### 8.1 Standard Error Response Format

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    // Additional error details (optional)
  },
  "code": "ERROR_CODE",
  "timestamp": "2025-01-20T10:05:00Z"
}
```

#### 8.2 Error Codes

- `AUTH_REQUIRED` - Authentication required
- `AUTH_INVALID` - Invalid token
- `VALIDATION_ERROR` - Data validation failed
- `S3_UPLOAD_FAILED` - S3 upload error
- `S3_NOT_FOUND` - File not found in S3
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INVALID_DATE_RANGE` - Date range too large
- `INTERNAL_ERROR` - Server error

#### 8.3 Logging Strategy

**Log Levels:**
- `ERROR` - Errors that need attention
- `WARN` - Warnings (e.g., rate limit exceeded)
- `INFO` - Important events (uploads, API calls)
- `DEBUG` - Debug information (development only)

**Log What:**
- All API requests (method, path, user, timestamp)
- Upload attempts (success/failure, file size, device_id)
- S3 operations (operations, errors, timing)
- Authentication failures
- Rate limit violations

**Logging Service:**
- Use Winston or Pino for structured logging
- Send logs to CloudWatch (AWS) or similar
- Set up alerts for errors

---

## Implementation Checklist

### Backend Setup (Vercel Serverless)
- [ ] Set up AWS S3 bucket in us-east-1
- [ ] Configure IAM user and permissions
- [ ] Install required NPM packages (`@aws-sdk/client-s3`, `jsonwebtoken`, `joi`, `uuid`)
- [ ] Configure Vercel environment variables
- [ ] Set up S3 client utility (`api/utils/s3.ts`)
- [ ] Create TypeScript types (`api/types/ecg.ts`)

### API Implementation (Vercel Functions)
- [ ] Create JWT authentication utility (`api/utils/jwt.ts`)
- [ ] Create validation utility (`api/utils/validator.ts`)
- [ ] Create error handler utility (`api/utils/errors.ts`)
- [ ] Create `api/ecg/upload.ts` (POST endpoint)
- [ ] Create `api/ecg/list.ts` (GET endpoint)
- [ ] Create `api/ecg/[id].ts` (GET endpoint)
- [ ] Create `api/ecg/[id]/summary.ts` (GET endpoint)
- [ ] Implement validation schema
- [ ] Implement error handling
- [ ] Add CORS headers to all functions
- [ ] Add request logging

### Frontend Integration
- [ ] Create `src/services/ecgApi.ts` service layer
- [ ] Create `src/types/ecg.ts` TypeScript types
- [ ] Update `DashboardOverview.tsx` with real data
- [ ] Update `ReportsPage.tsx` with real data
- [ ] Create `ECGRecordDetail.tsx` component
- [ ] Add loading states
- [ ] Add error handling UI
- [ ] Implement pagination UI
- [ ] Add filtering UI (device, patient, date range)

### Testing
- [ ] Test ECG data upload (single record)
- [ ] Test ECG data upload (bulk - 100 records)
- [ ] Test ECG list retrieval
- [ ] Test filtering (device, patient, date)
- [ ] Test pagination
- [ ] Test error scenarios (invalid token, validation errors)
- [ ] Test authentication
- [ ] Load testing (simulate 100k reports/day)

### Deployment (Vercel)
- [ ] Deploy to Vercel (automatically on Git push)
- [ ] Configure production environment variables in Vercel Dashboard
- [ ] Configure CORS for production domain
- [ ] Set up Vercel Analytics (optional)
- [ ] Set up error monitoring (Vercel Logs or Sentry)
- [ ] Set up error alerting (Vercel Notifications)
- [ ] Test in production
- [ ] Monitor API performance (Vercel Dashboard)
- [ ] Monitor function execution times and costs

---

## Performance Targets (Vercel Serverless)

- **Upload Response Time:** < 5 seconds (including S3 upload, within 60s limit)
- **List Query Response Time:** < 5 seconds (50 records, within 60s limit)
- **Get Single Record:** < 2 seconds
- **Cold Start:** < 500ms (first request after inactivity)
- **Concurrent Requests:** Auto-scaled by Vercel
- **Uptime:** 99.9% availability (Vercel SLA)
- **Error Rate:** < 0.1%

**Note:** For 100k reports/day, monitor Vercel function execution times and costs. If approaching limits, consider:
- Upgrading to Vercel Enterprise for higher limits
- Migrating to Express backend for dedicated resources
- Using presigned URLs for direct S3 uploads

---

## Future Enhancements (Post-MVP)

1. **Presigned URLs** - Direct S3 upload from devices (reduces serverless execution time)
2. **Metadata Index** - Store metadata in MongoDB/DynamoDB for faster queries (if S3 list becomes bottleneck)
3. **Vercel KV Caching** - Cache frequently accessed metadata
4. **Real-time Updates** - WebSocket or Server-Sent Events for new ECG data notifications
5. **Batch Upload** - Upload multiple ECGs in one request
6. **Data Export** - Export ECG data as CSV/Excel
7. **Data Backup** - Automated S3 backup to Glacier
8. **CDN Integration** - CloudFront for faster data access
9. **Search Functionality** - Full-text search across ECG records
10. **Data Compression** - Compress stored JSON files
11. **Express Backend Migration** - If volume exceeds serverless capabilities

---

## Questions Answered

✅ **Authentication Method:** JWT Tokens  
✅ **AWS Region:** us-east-1  
✅ **Storage Method:** Direct S3 queries (no MongoDB metadata)  
✅ **Data Volume:** Optimized for 100k reports/day  
✅ **AI Processing:** Excluded (data ingestion and display only)

---

*This plan provides a comprehensive roadmap for implementing ECG data ingestion and display. Ready for implementation when approved.*
