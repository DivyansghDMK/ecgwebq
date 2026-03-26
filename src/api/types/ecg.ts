/**
 * ECG Type Definitions for Frontend
 */

export interface ECGRecord {
  recordId: string;
  deviceId: string;
  patient: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    age?: number;
    gender?: 'M' | 'F' | 'O';
    address?: string;
    medicalHistory?: string[];
    org?: string; // Organization
  };
  metrics: {
    heartRate: number;
    bloodPressure?: { systolic: number; diastolic: number };
    intervals?: { pr: number; qrs: number; qt: number; qtc?: number };
    rhythm?: string;
    interpretation?: string;
    abnormalities?: string[];
    recommendations?: string[];
    observation?: Array<{
    name: string;
    value: string;
    range: string;
  }>; // Doctor's observation
    conclusions?: string[]; // Medical conclusions
    overview?: {
      maxHR?: number;
      minHR?: number;
      avgHR?: number;
    }; // Report overview with heart rate stats
  };
  timestamp: string;
  datetime?: {
    date?: string;
    time?: string;
  }; // Alternative timestamp field
  pdfBase64?: string;
}

export interface ECGUploadPayload {
  recordId: string;
  deviceId: string;
  patient: ECGRecord['patient'];
  metrics: ECGRecord['metrics'];
  timestamp: string;
  pdfBase64: string;
}

export interface ReportUrlsResponse {
  success: boolean;
  data: {
    jsonUrl: string;
    pdfUrl: string | null;
    expiresIn: number;
    generatedAt: string;
  };
}

export interface ReportsResponse {
  success: boolean;
  data: ECGReportMetadata[];
  metadata: {
    total: number;
    filtered: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  recordId?: string;
}

export interface ReportFilters {
  name?: string;
  phone?: string;
  deviceId?: string;
  startDate?: string;
  endDate?: string;
}

export interface S3FilesResponse {
  files: S3File[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface S3File {
  key: string;
  name: string;
  size: number;
  type: string;
  lastModified: string;
  url: string;
  recordId: string;
}

export interface ECGReportMetadata {
  id: string;
  recordId: string;
  patientName: string;
  name?: string; // Alternative name field
  deviceId: string;
  date: string;
  timestamp: string;
  hasPdf: boolean;
  type: string;
  patient: {
    id: string;
    name: string;
    phone?: string;
    phoneNumber?: string; // Alternative phone field
  };
  createdAt: string;
  fileSize: number;
  pdfUrl?: string;
  jsonUrl?: string;
  ecg: ECGRecord | null;
}
