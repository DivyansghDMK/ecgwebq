/**
 * Frontend API Client for ECG Services
 */

import { 
  ECGUploadPayload, 
  ReportUrlsResponse,
  ReportsResponse,
  UploadResponse,
  ReportFilters,
  S3FilesResponse,
  ECGReportMetadata
} from '../../api/types/ecg';
import { mockReports, filterReports } from './mockData';

// API Bases
// For reliability we hard‑code the current production REST API base.
// This avoids issues with stale local .env values pointing at old gateways.
// Main API (used by dashboard, reports, S3 browser) – must end with /api
const API_BASE_URL = 'https://8m9fgt2fz1.execute-api.us-east-1.amazonaws.com/prod/api';

// Doctor API (used by doctor dashboard & upload). Same API, but without /api suffix.
const DOCTOR_API_BASE_URL = 'https://8m9fgt2fz1.execute-api.us-east-1.amazonaws.com/prod';

/**
 * Generic API handler
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = API_BASE_URL.replace(/\/$/, '');
  const url = `${base}${endpoint}`;

  // Only send JSON content-type when we actually send a JSON body.
  // For simple GETs (like /s3-files) we avoid setting this header so the browser
  // does not send a CORS preflight OPTIONS request that our API may not handle.
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  const method = (options.method || 'GET').toUpperCase();
  if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || response.statusText);
    }

    if (data?.success === false) {
      throw new Error(data?.error?.message || 'API error');
    }

    // IMPORTANT FIX: always return usable data
    return data.data ?? data;

  } catch (err: any) {
    throw new Error(err.message || 'API failed');
  }
}

export async function fetchS3FileContent(fileKey: string): Promise<any> {
  try {
    const response = await apiRequest(`/s3-file-content?key=${encodeURIComponent(fileKey)}`);
    return response;
  } catch (error) {
    console.error(`Error fetching content for ${fileKey}:`, error);
    return null;
  }
}

/* ======================= API FUNCTIONS ======================= */

export async function uploadECG(payload: ECGUploadPayload): Promise<UploadResponse> {
  return apiRequest('/upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchReports(filters?: ReportFilters): Promise<ReportsResponse> {
  console.log('Fetching S3 files with filters:', filters);
  
  try {
    // Fetch S3 files
    const s3Data = await fetchS3Files(1, 20, ''); // Reduced to avoid Lambda timeout
    console.log('S3 files received:', s3Data.files.length);
    
    // Group files by their "folder" or timestamp to find related files
    const fileGroups = new Map<string, typeof s3Data.files>();
    
    s3Data.files.forEach(file => {
      const fullPath = file.fullPath || file.key || '';
      const pathParts = fullPath.split('/');
      
      // Extract timestamp from filename or use folder structure
      const timestampMatch = file.name.match(/\d{8}_\d{6}/);
      const timestamp = timestampMatch ? timestampMatch[0] : pathParts[pathParts.length - 2] || 'unknown';
      
      console.log('FILE:', file.name, 'PATH:', fullPath, 'TIMESTAMP:', timestamp);
      
      if (!fileGroups.has(timestamp)) {
        fileGroups.set(timestamp, []);
      }
      fileGroups.get(timestamp)!.push(file);
    });
    
    console.log('File groups created:', fileGroups.size);
    
    // Process each group to create reports with patient data extracted from filenames
    const reports: ECGReportMetadata[] = [];
    
    for (const [timestamp, files] of fileGroups) {
      console.log(`Processing group ${timestamp} with ${files.length} files`);
      
      // Find all files in this group
      const allFiles = files;
      
      let extractedPatientData: {
        name: string;
        phone?: string;
        deviceId?: string;
      } | null = null;
      
      // First, try to extract patient data from user_signup filenames
      for (const userFile of allFiles.filter(f => f.name.includes('user_signup_'))) {
        const match = userFile.name.match(/user_signup_([a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*)_\d{8}_\d{6}\.json/i);
        if (match && match[1]) {
          const patientName = match[1].replace(/[-_]/g, ' ').trim();
          extractedPatientData = {
            name: patientName,
            phone: undefined,
            deviceId: undefined
          };
          console.log('Extracted patient data from user_signup file:', extractedPatientData);
          break;
        }
      }
      
      // If no patient data found, try to extract from PDF filenames and paths
      if (!extractedPatientData) {
        const pdfFiles = allFiles.filter(f => f.type === 'application/pdf');
        for (const pdfFile of pdfFiles) {
          console.log('Attempting to extract patient data from PDF filename/path:', pdfFile.name);
          
          // Try to extract patient name from PDF filename
          const pdfNameMatch = pdfFile.name.match(/ECG_Report_(.*)_\d{8}_\d{6}\.pdf/i);
          if (pdfNameMatch && pdfNameMatch[1]) {
            let patientName = pdfNameMatch[1];
            
            // Clean up the extracted name
            patientName = patientName
              .replace(/\d{8}_\d{6}/g, '')
              .replace(/[-_]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (patientName && patientName.length > 0 && !/^\d+$/.test(patientName) && !patientName.includes('ECG Report')) {
              extractedPatientData = {
                name: patientName,
                phone: undefined,
                deviceId: undefined
              };
              console.log('Extracted patient data from PDF filename:', extractedPatientData);
              break;
            }
          }
          
          // Additional fallback: check if patient name is in the folder path
          const pathParts = (pdfFile.fullPath || pdfFile.key || '').split('/');
          for (const part of pathParts) {
            if (part && !/^\d{4}$/.test(part) && !/^\d{2}$/.test(part) && part !== 'ecg-reports' && !/^\d{8}_\d{6}$/.test(part)) {
              const cleanName = part.replace(/[-_]/g, ' ').trim();
              if (cleanName && cleanName.length > 2 && !/^\d+$/.test(cleanName) && !cleanName.includes('ECG Report')) {
                extractedPatientData = {
                  name: cleanName,
                  phone: undefined,
                  deviceId: undefined
                };
                console.log('Extracted patient data from folder path:', extractedPatientData);
                break;
              }
            }
            if (extractedPatientData) break;
          }
          
          if (extractedPatientData) break;
        }
      }
      
      // Create report objects for each PDF in this group
      const pdfFiles = allFiles.filter(f => f.type === 'application/pdf');
      for (const pdfFile of pdfFiles) {
        const report: ECGReportMetadata = {
          recordId: pdfFile.key || pdfFile.recordId || '',
          deviceId: extractedPatientData?.deviceId || 'unknown',
          patient: {
            id: pdfFile.key || pdfFile.recordId || '',
            name: extractedPatientData?.name || 'Unknown Patient',
            phone: extractedPatientData?.phone || undefined
          },
          timestamp: pdfFile.lastModified,
          createdAt: pdfFile.lastModified,
          fileSize: pdfFile.size,
          hasPdf: true,
          // Compatibility fields
          id: pdfFile.key || pdfFile.recordId || '',
          name: extractedPatientData?.name || 'Unknown Patient',
          phoneNumber: extractedPatientData?.phone || undefined,
          date: pdfFile.lastModified,
          type: 'PDF',
          ecg: null
        };
        
        console.log('Created PDF report:', report);
        reports.push(report);
      }
      
      // Create reports for user_signup files (these are the primary patient records)
      const userSignupFiles = allFiles.filter(f => f.name.includes('user_signup_'));
      for (const userFile of userSignupFiles) {
        const match = userFile.name.match(/user_signup_([a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*)_\d{8}_\d{6}\.json/i);
        if (match && match[1]) {
          const patientName = match[1].replace(/[-_]/g, ' ').trim();
          
          const report: ECGReportMetadata = {
            recordId: userFile.key || userFile.recordId || '',
            deviceId: 'unknown',
            patient: {
              id: userFile.key || userFile.recordId || '',
              name: patientName,
              phone: undefined
            },
            timestamp: userFile.lastModified,
            createdAt: userFile.lastModified,
            fileSize: userFile.size,
            hasPdf: false,
            // Compatibility fields
            id: userFile.key || userFile.recordId || '',
            name: patientName,
            phoneNumber: undefined,
            date: userFile.lastModified,
            type: 'JSON',
            ecg: null
          };
          
          console.log('Created user signup report:', report);
          reports.push(report);
        }
      }
      
      // Create reports for other JSON files with extracted patient data
      const otherJsonFiles = allFiles.filter(f => f.type === 'application/json' && !f.name.includes('user_signup_'));
      for (const jsonFile of otherJsonFiles) {
        const report: ECGReportMetadata = {
          recordId: jsonFile.key || jsonFile.recordId || '',
          deviceId: extractedPatientData?.deviceId || 'unknown',
          patient: {
            id: jsonFile.key || jsonFile.recordId || '',
            name: extractedPatientData?.name || 'Unknown Patient',
            phone: extractedPatientData?.phone || undefined
          },
          timestamp: jsonFile.lastModified,
          createdAt: jsonFile.lastModified,
          fileSize: jsonFile.size,
          hasPdf: false,
          // Compatibility fields
          id: jsonFile.key || jsonFile.recordId || '',
          name: extractedPatientData?.name || 'Unknown Patient',
          phoneNumber: extractedPatientData?.phone || undefined,
          date: jsonFile.lastModified,
          type: 'JSON',
          ecg: null
        };
        
        console.log('Created other JSON report:', report);
        reports.push(report);
      }
    }
    
    console.log('Total reports created:', reports.length);
    
    // Apply filters if provided
    if (filters) {
      console.log('Applying filters:', filters);
      console.log('Reports before filtering:', reports.map(r => ({ name: r.name, id: r.id })));
      
      const filteredReports = reports.filter(report => {
        console.log('Checking report:', report.name, 'against filter:', filters.name);
        
        if (filters.name && !report.name?.toLowerCase().includes(filters.name.toLowerCase())) {
          console.log('Filtering out report - name mismatch:', report.name, '!=', filters.name);
          return false;
        }
        if (filters.phone && !report.patient?.phone?.includes(filters.phone)) {
          console.log('Filtering out report - phone mismatch');
          return false;
        }
        if (filters.deviceId && !report.deviceId?.toLowerCase().includes(filters.deviceId.toLowerCase())) {
          console.log('Filtering out report - deviceId mismatch');
          return false;
        }
        if (filters.startDate && report.timestamp) {
          const reportDate = new Date(report.timestamp);
          const startDate = new Date(filters.startDate);
          if (reportDate < startDate) return false;
        }
        if (filters.endDate && report.timestamp) {
          const reportDate = new Date(report.timestamp);
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (reportDate > endDate) return false;
        }
        
        console.log('Report passed all filters:', report.name);
        return true;
      });
      
      console.log('Reports after filtering:', filteredReports.map(r => ({ name: r.name, id: r.id })));
      console.log('Reports after filtering:', filteredReports.length);
      
      return {
        success: true,
        data: filteredReports,
        metadata: {
          total: reports.length,
          filtered: filteredReports.length
        }
      };
    }
    
    return {
      success: true,
      data: reports,
      metadata: {
        total: reports.length,
        filtered: undefined
      }
    };
    
  } catch (error) {
    console.error('Error fetching S3 files for reports:', error);
    throw error;
  }
}

export async function fetchReport(recordId: string): Promise<ReportUrlsResponse> {
  return apiRequest(`/report?id=${encodeURIComponent(recordId)}`);
}

/* ======================= S3 FILE BROWSER ======================= */

export async function fetchS3Files(
  page: number = 1,
  limit: number = 20, // Reduced default to avoid Lambda timeout
  search: string = ''
): Promise<S3FilesResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);

  return apiRequest(`/s3-files?${params.toString()}`);
}

/* ======================= UTILITIES ======================= */

// Doctor reports API types
export interface DoctorReportSummary {
  key: string;
  fileName: string;
  url: string;
  uploadedAt?: string; // ISO timestamp
  lastModified?: string; // Keep for backward compatibility
}

export async function fetchDoctorReports(): Promise<DoctorReportSummary[]> {
  const base = DOCTOR_API_BASE_URL.replace(/\/$/, '');
  const url = `${base}/api/doctor/reports`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      message = data?.error?.message || data?.message || message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message || "Failed to fetch doctor reports");
  }

  const data = await response.json();

  // Handle response structure: { success: true, data: { success: true, reports: [...] } }
  if (Array.isArray(data?.data?.reports)) {
    return data.data.reports as DoctorReportSummary[];
  }
  // Fallback: direct reports array
  if (Array.isArray(data?.reports)) {
    return data.reports as DoctorReportSummary[];
  }
  // Fallback: data itself is the array
  if (Array.isArray(data)) {
    return data as DoctorReportSummary[];
  }
  // Fallback: data.data is the array
  if (Array.isArray(data?.data)) {
    return data.data as DoctorReportSummary[];
  }
  return [];
}

export async function uploadReviewedReport(formData: FormData): Promise<void> {
  const base = DOCTOR_API_BASE_URL.replace(/\/$/, '');
  const url = `${base}/api/doctor/upload-reviewed`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      message = data?.error?.message || data?.message || message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message || "Failed to upload reviewed report");
  }
}

export async function downloadPDF(url: string, filename?: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename || 'report.pdf';
  link.click();
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString();
}

export function handleApiError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}