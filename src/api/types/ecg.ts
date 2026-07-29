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

export interface AndroidS3FilesResponse {
  success: boolean;
  data: {
    reports: S3File[];
    total_count: number;
  };
}

export interface S3File {
  key: string;
  name: string;
  size: number;
  type: string;
  lastModified: string;
  url: string;
  recordId?: string;
  mobileNumber?: string; // Android-specific field
  reportType?: string; // Android-specific field: "12-lead ECG" or "HRV"
  // Rhythm Ultra specific fields from /android/s3-files
  mobile_number?: string;
  patient_name?: string;
  machine_serial?: string;
  report_date?: string;
  report_type?: string;
  report_layout?: string;
  s3_key?: string;
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

export interface RhythmUltraMaxReport {
  report_id: string;
  patient_name: string;
  report_date: string;
  report_type: string;
  mobile_number: string;
  hr: number;
  machine_serial: string;
  timestamp: number;
  generated_at: string;
  s3_key: string;
}

export interface RhythmUltraMaxReportsResponse {
  success: boolean;
  data: {
    reports: RhythmUltraMaxReport[];
    next_token: string | null;
    has_more: boolean;
    total_count: number;
  };
}
