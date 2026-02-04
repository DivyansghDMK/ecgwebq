# Tech Stack & Backend Implementation Summary

## 📚 Complete Tech Stack

### Frontend Stack
- **React 19.0.0** - UI library
- **TypeScript 5.6.3** - Type safety
- **Vite 5.4.11** - Build tool and dev server
- **React Router DOM 6.30.2** - Client-side routing
- **Tailwind CSS 3.4.14** - Utility-first CSS framework
- **Framer Motion 11.11.17** - Animation library
- **Lucide React 0.462.0** - Icon library
- **Recharts 3.6.0** - Chart library (for analytics)

### Backend Stack
- **Vercel Serverless Functions** - Serverless API deployment
- **@vercel/node 5.5.16** - Vercel Node.js runtime
- **TypeScript 5.6.3** - Type safety

### AWS Services
- **AWS S3** - Object storage for ECG JSON data
- **AWS SDK v3 (@aws-sdk/client-s3)** - S3 client library
- **AWS Region**: us-east-1

### Authentication & Security
- **JWT (jsonwebtoken 9.0.2)** - Token-based authentication
- **Joi 17.11.0** - Data validation schema library

### Utilities
- **UUID 9.0.1** - Unique identifier generation
- **clsx & tailwind-merge** - CSS class utilities

### Development Tools
- **ESLint** - Code linting
- **PostCSS & Autoprefixer** - CSS processing
- **TypeScript ESLint** - TypeScript linting

---

## 🏗️ Backend Implementation

### Architecture: **MVC (Model-View-Controller) - Serverless Adaptation**

The backend follows an MVC-style architecture adapted for serverless deployment on Vercel.

```
Backend Structure:
├── api/                          # Vercel Serverless Functions
│   ├── ecg/                      # ECG API Endpoints (Controllers)
│   │   ├── upload.ts            # POST /api/ecg/upload
│   │   ├── list.ts              # GET /api/ecg/list
│   │   ├── [id].ts              # GET /api/ecg/:id
│   │   └── [id]/
│   │       └── summary.ts       # GET /api/ecg/:id/summary
│   ├── models/                   # Model Layer
│   │   ├── types/
│   │   │   └── ECGData.ts       # TypeScript interfaces
│   │   ├── schemas/
│   │   │   └── ecgSchema.ts     # Joi validation schemas
│   │   └── s3Storage.ts         # S3 storage abstraction
│   ├── services/                 # Service Layer
│   │   ├── s3Service.ts         # AWS S3 operations
│   │   ├── jwtService.ts        # JWT authentication
│   │   ├── validationService.ts # Data validation
│   │   └── errorService.ts      # Error handling
│   └── utils/
│       └── logger.ts            # Logging utility
```

---

## 📦 Backend Components Breakdown

### 1. **Model Layer** (`api/models/`)

#### **Type Definitions** (`api/models/types/ECGData.ts`)
- `ECGData` - Complete ECG data structure
- `ECGRecord` - ECG record summary for lists
- `ECGListResponse` - API response for list endpoints
- `ECGUploadRequest` - Upload request structure
- `APIResponse<T>` - Standardized API response wrapper

#### **Validation Schemas** (`api/models/schemas/ecgSchema.ts`)
- Joi validation schemas for:
  - Complete ECG data validation
  - Upload request validation
  - List query parameters validation
- Functions:
  - `validateECGData()` - Validates ECG JSON structure
  - `validateUploadRequest()` - Validates upload payload
  - `validateListQuery()` - Validates query parameters

#### **S3 Storage Abstraction** (`api/models/s3Storage.ts`)
- `generateS3Key()` - Generates S3 key from ECG data (date-based path)
- `parseS3Key()` - Parses S3 key to extract metadata
- `s3ObjectToECGRecord()` - Converts S3 object to ECG record
- `getS3Prefix()` - Generates S3 prefix for listing

**S3 Key Structure:**
```
ecg-json/YYYY/MM/DD/recordingId-timestamp.json
Example: ecg-json/2024/01/15/ECG001-2024-01-15T10-30-00Z.json
```

---

### 2. **Service Layer** (`api/services/`)

#### **S3 Service** (`api/services/s3Service.ts`)
**AWS SDK Operations:**
- `uploadECGData()` - Uploads ECG JSON to S3 with metadata tags
- `getECGData()` - Retrieves full ECG data from S3
- `getECGRecordMetadata()` - Gets ECG record metadata (HeadObject)
- `listECGRecords()` - Lists ECG records with filtering and pagination
- `getECGSummary()` - Gets ECG data without waveform arrays

**Features:**
- Automatic retry with exponential backoff (3 attempts)
- Metadata tagging for efficient filtering
- Date-based folder structure
- Client caching for performance

#### **JWT Service** (`api/services/jwtService.ts`)
**Authentication Functions:**
- `extractToken()` - Extracts JWT from Authorization header
- `verifyToken()` - Verifies and decodes JWT token
- `authenticateRequest()` - Authenticates incoming requests
- `hasRole()` - Checks user role (admin/doctor)
- `requireAdmin()` - Enforces admin-only access

**Token Format:**
```json
{
  "userId": "user123",
  "role": "admin" | "doctor",
  "iat": 1703001234,
  "exp": 1703087634
}
```

#### **Validation Service** (`api/services/validationService.ts`)
- Wraps Joi validation schemas
- Provides clean interface for validation
- Returns structured error messages

#### **Error Service** (`api/services/errorService.ts`)
**Error Handling:**
- `createErrorResponse()` - Standardized error response format
- `createSuccessResponse()` - Standardized success response format
- `sendErrorResponse()` - Sends error response with proper status code
- `sendSuccessResponse()` - Sends success response
- `handleError()` - Centralized error handling and logging

**Error Codes:**
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `BAD_REQUEST` - Invalid request
- `VALIDATION_ERROR` - Data validation failed
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error

---

### 3. **Controller Layer** (`api/ecg/`)

Each controller is a Vercel serverless function that handles HTTP requests.

#### **Upload Controller** (`api/ecg/upload.ts`)
**Endpoint:** `POST /api/ecg/upload`

**Flow:**
1. Authenticate request (JWT verification)
2. Validate request body (Joi schema)
3. Upload to S3 with metadata
4. Return success response with S3 key

**Request Body:**
```json
{
  "ecg_data": {
    "device_id": "ECG001",
    "patient_id": "P123",
    "recording_id": "REC001",
    "recording_timestamp": "2024-01-15T10:30:00Z",
    "leads": [...],
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "s3_key": "ecg-json/2024/01/15/REC001-2024-01-15T10-30-00Z.json",
    "recording_id": "REC001",
    "message": "ECG data uploaded successfully"
  }
}
```

#### **List Controller** (`api/ecg/list.ts`)
**Endpoint:** `GET /api/ecg/list`

**Query Parameters:**
- `page` - Page number (default: 1)
- `pageSize` - Records per page (default: 50, max: 1000)
- `device_id` - Filter by device ID
- `patient_id` - Filter by patient ID
- `start_date` - Filter start date (ISO 8601)
- `end_date` - Filter end date (ISO 8601)
- `recording_type` - Filter by type (12-lead, single-lead, rhythm)

**Flow:**
1. Authenticate request
2. Validate query parameters
3. Query S3 with filters
4. Return paginated list of records

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [...],
    "total": 1500,
    "page": 1,
    "pageSize": 50,
    "hasMore": true
  }
}
```

#### **Get Controller** (`api/ecg/[id].ts`)
**Endpoint:** `GET /api/ecg/:id`

**Flow:**
1. Authenticate request
2. Parse ID (supports S3 key or formatted ID)
3. Retrieve full ECG data from S3
4. Return complete ECG JSON

**ID Formats Supported:**
- Full S3 key: `ecg-json/2024/01/15/REC001-timestamp.json`
- Formatted ID: `ecg-json-2024-01-15-REC001-timestamp`
- URL-encoded S3 key

#### **Summary Controller** (`api/ecg/[id]/summary.ts`)
**Endpoint:** `GET /api/ecg/:id/summary`

**Flow:**
1. Authenticate request
2. Parse ID
3. Retrieve ECG data
4. Remove waveform arrays (lead_data)
5. Return summary without large arrays

**Use Case:** Faster loading for list views, reduces payload size

---

### 4. **Utility Layer** (`api/utils/`)

#### **Logger** (`api/utils/logger.ts`)
- Simple logging utility
- Log levels: DEBUG, INFO, WARN, ERROR
- Structured logging for production

---

## 🔐 Security Features

1. **JWT Authentication**
   - Bearer token in Authorization header
   - Token verification on every request
   - Role-based access control (admin/doctor)

2. **Input Validation**
   - Joi schemas validate all incoming data
   - Prevents invalid data from reaching S3
   - Returns clear validation errors

3. **CORS Configuration**
   - Proper CORS headers on all endpoints
   - OPTIONS request handling

4. **Error Handling**
   - No sensitive information in error messages
   - Proper HTTP status codes
   - Structured error responses

---

## 📊 Data Flow

### Upload Flow:
```
ECG Device
  ↓ (POST JSON)
Controller (upload.ts)
  ↓ (Validates & Authenticates)
Service Layer (validationService, jwtService)
  ↓ (Business Logic)
S3 Service (s3Service.ts)
  ↓ (Uploads with metadata)
AWS S3 (us-east-1)
  ↓ (Stores JSON)
Success Response
```

### List/Get Flow:
```
Frontend Request
  ↓ (GET with filters)
Controller (list.ts / [id].ts)
  ↓ (Authenticates)
Service Layer (jwtService)
  ↓ (Validates query)
S3 Service (s3Service.ts)
  ↓ (Queries S3)
AWS S3 (us-east-1)
  ↓ (Returns data)
Service Layer (Transforms data)
  ↓
Controller (Formats response)
  ↓
Frontend (Displays data)
```

---

## 🚀 Deployment

### Vercel Serverless Functions
- Each controller is automatically deployed as a serverless function
- Automatic scaling based on traffic
- Pay-per-execution pricing model
- Cold start optimization with client caching

### Environment Variables Required:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=cardiox-ecg-data
JWT_SECRET=your_strong_jwt_secret_key_here
JWT_EXPIRES_IN=24h
```

---

## 📈 Scalability Features

1. **Date-based S3 Structure**
   - Efficient querying by date range
   - Distributed storage across folders
   - Reduced list operation times

2. **Metadata Tagging**
   - S3 object tags for filtering
   - Faster metadata queries
   - Reduced need for full object retrieval

3. **Pagination**
   - Handles large datasets efficiently
   - Configurable page sizes
   - Cursor-based navigation support

4. **Summary Endpoint**
   - Lightweight responses for list views
   - Full data only when needed
   - Reduced bandwidth usage

5. **Caching Strategy**
   - S3 client reuse across invocations
   - Reduced connection overhead
   - Improved response times

---

## 🧪 Testing Considerations

**Backend Testing Strategy:**
1. Unit tests for services (S3, JWT, validation)
2. Integration tests for API endpoints
3. Mock S3 responses for testing
4. JWT token generation for auth tests

**Performance Testing:**
- Load testing for 100k reports/day
- Concurrent upload handling
- Large file upload testing
- Query performance optimization

---

## 📝 Key Features Implemented

✅ **Complete MVC Architecture**
- Clean separation of concerns
- Maintainable and testable code
- Industry-standard patterns

✅ **Robust Validation**
- Schema-based validation
- Comprehensive error messages
- Type-safe data handling

✅ **Scalable Storage**
- AWS S3 for high-volume storage
- Efficient query patterns
- Metadata-based filtering

✅ **Secure Authentication**
- JWT token-based auth
- Role-based access control
- Request-level security

✅ **Production-Ready**
- Error handling
- Logging
- Standardized responses
- CORS configuration

---

## 🔄 Next Steps for Backend

1. **Add Rate Limiting**
   - Prevent abuse
   - Protect against DDoS

2. **Implement Caching**
   - Redis for frequently accessed data
   - Reduce S3 query costs

3. **Add Monitoring**
   - CloudWatch integration
   - Error tracking
   - Performance metrics

4. **Batch Operations**
   - Bulk upload support
   - Batch processing for high volume

5. **Webhooks**
   - Real-time notifications
   - Event-driven architecture

---

## 📚 API Documentation

All endpoints follow RESTful conventions:
- `POST /api/ecg/upload` - Create new ECG record
- `GET /api/ecg/list` - List ECG records
- `GET /api/ecg/:id` - Get specific ECG record
- `GET /api/ecg/:id/summary` - Get ECG summary

Standard response format:
```json
{
  "success": true | false,
  "data": {...},
  "error": {
    "message": "...",
    "code": "ERROR_CODE",
    "details": {...}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

**Backend Implementation Status: ✅ Complete**

The backend is fully implemented following MVC architecture principles, ready for production deployment with proper security, validation, and scalability features.

