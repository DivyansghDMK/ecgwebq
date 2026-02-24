import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { CreateDoctorPayload, Doctor } from './types/ecg';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET || 'deck-backend-demo';

// FIXED: Explicit CORS headers for Lambda Proxy Integration
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};

export const handler = async (event: any) => {
  try {
    // 1. Handle CORS Preflight and Method Validation
    // Support both REST API (v1) and HTTP API (v2) event formats
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod;
    
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'CORS preflight' })
      };
    }

    if (httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: 'Method not allowed' })
      };
    }

    // 2. Parse Body with Safe Error Handling
    let body: CreateDoctorPayload;
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      if (!body) throw new Error('Empty body');
    } catch (e) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: 'Invalid JSON body' })
      };
    }

    // 3. Validate Required Fields
    const missingFields = [];
    if (!body.name) missingFields.push('name');
    if (!body.email) missingFields.push('email');
    if (!body.specialization) missingFields.push('specialization');

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        })
      };
    }

    // 4. Generate Doctor ID and Object
    const uniquePart = uuidv4().split('-')[0].toUpperCase();
    const doctorId = `DR-${uniquePart}`;
    const now = new Date().toISOString();
    
    const doctor: Doctor = {
      doctorId,
      name: body.name,
      email: body.email,
      specialization: body.specialization,
      hospital: body.hospital || '',
      licenseNumber: body.licenseNumber || '',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    // 5. Save to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `doctors/${doctorId}.json`,
      Body: JSON.stringify(doctor, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'doctor-id': doctorId,
        'email': body.email
      }
    }));

    // 6. Return Success Response
    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        doctorId: doctor.doctorId,
        message: 'Doctor invited successfully',
        doctor
      })
    };

  } catch (error: any) {
    console.error('Handler Error:', error);
    
    // FIX: Return JSON error instead of throwing
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        message: error.message || 'Internal server error'
      })
    };
  }
};
