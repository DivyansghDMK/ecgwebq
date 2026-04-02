/**
 * Frontend API Client for ECG Services
 */

import type { 
  ECGUploadPayload, 
  ReportUrlsResponse,
  ReportsResponse,
  UploadResponse,
  ReportFilters,
  S3FilesResponse,
  ECGReportMetadata,
  S3File,
} from './types/ecg';
import { buildAuthHeaders } from '@/lib/auth';
import { getAdminProtectedApiBase, getDoctorApiBase, joinApiUrl } from '@/lib/apiBase';
import { ADMIN_ROUTES, DOCTOR_ROUTES } from '@/lib/apiRoutes';

// API Bases
// Configure these URLs to point to your backend service
const API_BASE_URL = getAdminProtectedApiBase();
const DOCTOR_API_BASE_URL = getDoctorApiBase();
/**
 * Get authentication headers for API requests
 */
function getAdminAuthHeaders(isJson: boolean = true): HeadersInit {
  return buildAuthHeaders("admin", isJson);
}

function getDoctorAuthHeaders(isJson: boolean = true): HeadersInit {
  return buildAuthHeaders("doctor", isJson);
}

/**
 * Doctor login API - uses dedicated API Gateway for login
 */
export async function doctorLogin(doctorName: string, password: string) {
  const url = joinApiUrl(DOCTOR_API_BASE_URL, DOCTOR_ROUTES.login);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      doctor_name: doctorName,
      password: password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data?.success && data?.token && data?.doctor) {
    return {
      success: true,
      data: {
        token: data.token,
        user: {
          userId: data.doctor.id,
          role: "doctor",
          name: data.doctor.doctor_name,
          email: data.doctor.email,
        },
      },
    };
  }

  return data;
}

/**
 * Generic API handler
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = API_BASE_URL.replace(/\/$/, '');
  const url = `${base}${endpoint}`;

  const authHeaders = getAdminAuthHeaders();
  const headers: Record<string, string> = {
    ...(typeof authHeaders === 'object' && authHeaders !== null ? authHeaders as Record<string, string> : {}),
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

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = response.statusText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error?.message || errorMessage;
      } catch (e) {
        // ignore
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const jsonResponse = await response.json();
    
    return jsonResponse;
  } catch (error) {
    throw error;
  }
}

/* ======================= REPORTS ======================= */

export async function fetchReports(filters?: ReportFilters, page: number = 1, limit: number = 20): Promise<ReportsResponse> {
    try {
        // Use S3 Files API instead of doctor reports
        const response = await fetchS3Files(page, limit, filters?.name || '');
        
        // Transform S3 files to report format
        const transformedReports = response.files.map((file: any) => {
            // Extract patient name and device info from file path/name
            const pathParts = file.key.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const patientName = fileName.replace('.pdf', '').replace('.json', '').replace(/_/g, ' ');
            
            // Try to extract device ID from path or filename
            let deviceId = 'Unknown';
            const deviceMatch = file.key.match(/device[_-]?(\w+)/i) || fileName.match(/device[_-]?(\w+)/i);
            if (deviceMatch) {
                deviceId = deviceMatch[1];
            }
            
            return {
                id: file.key,
                recordId: file.key,
                patientName: patientName,
                deviceId: deviceId,
                date: file.lastModified,
                timestamp: file.lastModified,
                hasPdf: file.type === 'application/pdf',
                type: file.type === 'application/pdf' ? 'PDF' : 'JSON',
                // Add ECGReportMetadata fields
                patient: {
                    id: file.key,
                    name: patientName,
                    phone: undefined
                },
                createdAt: file.lastModified,
                fileSize: file.size,
                // Add S3 file data for preview functionality
                pdfUrl: file.url,
                jsonUrl: file.type === 'application/json' ? file.url : undefined,
                ecg: null // Will be loaded when needed
            };
        });
        
        // Apply additional filters if provided
        let filteredReports = transformedReports;
        if (filters) {
            filteredReports = transformedReports.filter((report: any) => {
                if (filters.name && !report.patientName?.toLowerCase().includes(filters.name.toLowerCase())) {
                    return false;
                }
                if (filters.phone && !report.patient?.phone?.includes(filters.phone)) {
                    return false;
                }
                if (filters.deviceId && !report.deviceId?.toLowerCase().includes(filters.deviceId.toLowerCase())) {
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
                return true;
            });
        }
        
        return { 
            success: true, 
            data: filteredReports, 
            metadata: { 
                total: response.pagination?.total || filteredReports.length,
                filtered: filteredReports.length,
                page: page,
                limit: limit,
                totalPages: response.pagination?.totalPages || Math.ceil(filteredReports.length / limit)
            } 
        };
        
    } catch (error) {
        throw error;
    }
}

export async function fetchReport(recordId: string): Promise<ReportUrlsResponse> {
    try {
        // Get the file from S3 files to get the URL
        const s3Files = await fetchS3Files(1, 100, '');
        const file = s3Files.files.find((f: any) => f.key === recordId);
        
        if (!file) {
            throw new Error('File not found');
        }
        
        return {
            success: true,
            data: {
                jsonUrl: file.type === 'application/json' ? (file.url || '') : '',
                pdfUrl: file.type === 'application/pdf' ? (file.url || null) : null,
                expiresIn: 300, // 5 minutes
                generatedAt: new Date().toISOString()
            }
        };
    } catch (error) {
        throw error;
    }
}

/* ======================= S3 FILE BROWSER ======================= */

export async function fetchS3Files(
  page: number = 1,
  limit: number = 50,
  search: string = ''
): Promise<S3FilesResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);

  const response = await apiRequest<{ success: boolean; data: S3FilesResponse } | S3FilesResponse>(`${ADMIN_ROUTES.s3Files}?${params.toString()}`);
  if ('data' in response && response.data) {
    return response.data;
  }
  return response as S3FilesResponse;
}

export async function fetchS3FileContent<T = any>(key: string): Promise<T> {
  const response = await apiRequest<{ success: boolean; data?: T; error?: { message: string; code: string } }>(`${ADMIN_ROUTES.s3FileContent}?key=${encodeURIComponent(key)}`);
  
  // Check if the response indicates an error
  if (response && typeof response === 'object') {
    if ('error' in response && response.error) {
      throw new Error(response.error.message || 'API returned an error');
    }
    if ('success' in response && response.success === false) {
      const errorMsg = response.error?.message || 'Unknown error from API';
      throw new Error(errorMsg);
    }
    // If the API returns { success: true, data: ... }, we return the data
    if ('data' in response && response.data !== undefined) {
      return response.data;
    }
  }
  
  // Fallback if the structure is different (though backend says it returns { success, data })
  return response as unknown as T;
}

/* ======================= DOCTOR API ======================= */

export interface DoctorReportSummary {
  key: string;
  fileName: string;
  url: string;
  uploadedAt?: string; // ISO timestamp
  lastModified?: string; // Keep for backward compatibility
}

export async function fetchDoctorReports(): Promise<DoctorReportSummary[]> {
  const url = `${joinApiUrl(DOCTOR_API_BASE_URL, DOCTOR_ROUTES.reports)}?status=pending`;

  const response = await fetch(url, {
    method: "GET",
    headers: getDoctorAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch doctor reports: ${response.statusText}`);
  }

  const data = await response.json();
  return data.reports || data.data?.reports || [];
}

export async function uploadReviewedReport(formData: FormData): Promise<void> {
  const url = joinApiUrl(DOCTOR_API_BASE_URL, DOCTOR_ROUTES.uploadReviewed);

  const response = await fetch(url, {
    method: "POST",
    headers: getDoctorAuthHeaders(false), // No Content-Type for FormData
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

/* ======================= UTILITIES ======================= */

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

/* ======================= ADMIN / DOCTOR MANAGEMENT ======================= */

export interface CreateDoctorPayload {
  name: string;
  email: string;
  specialization: string;
  hospital?: string;
  licenseNumber?: string;
}

export interface Doctor {
  doctorId: string;
  name: string;
  email: string;
  specialization: string;
  hospital?: string;
  licenseNumber?: string;
  status: 'ACTIVE' | 'INACTIVE'; 
  createdAt: string;
  updatedAt: string;
}

export async function fetchReviewedReports(): Promise<DoctorReportSummary[]> {
  const params = new URLSearchParams({ status: "reviewed" });
  const url = `${joinApiUrl(DOCTOR_API_BASE_URL, DOCTOR_ROUTES.reports)}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getDoctorAuthHeaders(),
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      message = data?.error?.message || data?.message || message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message || "Failed to fetch reviewed reports");
  }

  const data = await response.json();
  return data.reports || data.data?.reports || [];
}

export async function fetchDoctors(): Promise<Doctor[]> {
  const url = joinApiUrl(API_BASE_URL, ADMIN_ROUTES.getDoctors);

  const response = await fetch(url, {
    method: "GET",
    headers: getAdminAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch doctors: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch doctors");
  }

  return data.doctors || data.data?.doctors || [];
}

export async function createDoctor(payload: CreateDoctorPayload): Promise<Doctor> {
  const response = await apiRequest<{success: boolean, data: { doctor: Doctor } } | { success: boolean, doctor: Doctor }>(ADMIN_ROUTES.createDoctor, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  if ('data' in response && response.data && 'doctor' in response.data) {
    return response.data.doctor;
  }
  if ('doctor' in response) {
    return (response as any).doctor;
  }
  
  return response as unknown as Doctor;
}
