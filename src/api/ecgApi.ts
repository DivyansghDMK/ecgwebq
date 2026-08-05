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
  RhythmUltraMaxReportsResponse,
  AndroidS3FilesResponse,
} from './types/ecg';
import type {
  AnalyticsSummaryResponse,
  DeviceLookupAPIResponse,
  RhythmUltraDeviceLookupAPIResponse,
  CardioXDeviceLookupAPIResponse,
  RhythmUsersLookupAPIResponse,
} from '@/components/admin/devices/types';
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
          licenseNumber: data.doctor.license_number,
          hospital: data.doctor.hospital_affiliation,
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
  const method = (options.method || 'GET').toUpperCase();
  const hasJsonBody = Boolean(options.body) && !(options.body instanceof FormData);

  const authHeaders = getAdminAuthHeaders(hasJsonBody);
  const headers: Record<string, string> = {
    ...(typeof authHeaders === 'object' && authHeaders !== null ? authHeaders as Record<string, string> : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && hasJsonBody && !headers['Content-Type']) {
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

export async function fetchReports(
  filters?: ReportFilters,
  page: number = 1,
  limit: number = 20,
  signal?: AbortSignal
): Promise<ReportsResponse> {
  const hasFilters = Boolean(
    filters?.name?.trim() ||
    filters?.phone?.trim() ||
    filters?.deviceId?.trim() ||
    filters?.startDate?.trim() ||
    filters?.endDate?.trim()
  );

  if (!hasFilters) {
    const response = await fetchS3Files(page, limit, '', signal);
    const reports = response.files.map(normalizeReportMetadata);
    const total = response.pagination?.total ?? reports.length;
    const currentLimit = response.pagination?.limit ?? limit;

    return {
      success: true,
      data: reports,
      metadata: {
        total,
        filtered: reports.length,
        page: response.pagination?.page ?? page,
        limit: currentLimit,
        totalPages: response.pagination?.totalPages ?? Math.max(1, Math.ceil(total / currentLimit)),
      },
    };
  }

  const searchTerm = (filters?.name?.trim() || filters?.phone?.trim() || filters?.deviceId?.trim() || '').toLowerCase();
  const allFiles = await fetchAllS3Files(searchTerm, signal);
  const filteredReports = applyReportFilters(allFiles.map(normalizeReportMetadata), filters);
  const currentLimit = limit;
  const total = filteredReports.length;
  const paginatedReports = filteredReports.slice((page - 1) * currentLimit, page * currentLimit);

  return {
    success: true,
    data: paginatedReports,
    metadata: {
      total,
      filtered: total,
      page,
      limit: currentLimit,
      totalPages: Math.max(1, Math.ceil(total / currentLimit)),
    },
  };
}

export async function fetchReport(recordId: string): Promise<ReportUrlsResponse> {
  const s3Files = await fetchAllS3Files(recordId);
  const file = s3Files.find((item) => item.key === recordId || item.recordId === recordId || item.name === recordId);

  if (!file) {
    throw new Error('File not found');
  }

  const normalized = normalizeReportMetadata(file);

  return {
    success: true,
    data: {
      jsonUrl: normalized.jsonUrl || '',
      pdfUrl: normalized.pdfUrl || null,
      expiresIn: 300,
      generatedAt: new Date().toISOString(),
    },
  };
}

async function fetchAllS3Files(searchTerm: string = '', signal?: AbortSignal): Promise<S3File[]> {
  const pageLimit = 100;
  const firstPage = await fetchS3Files(1, pageLimit, searchTerm, signal);
  const allFiles = [...(firstPage.files || [])];

  // Cap to maximum 10 pages (1000 items) to prevent huge delays, fire all concurrently
  const totalPages = Math.min(firstPage.pagination?.totalPages || 1, 10);
  const resolvedLimit = firstPage.pagination?.limit || pageLimit;

  if (totalPages > 1) {
    const promises = [];
    for (let p = 2; p <= totalPages; p++) {
      promises.push(fetchS3Files(p, resolvedLimit, searchTerm, signal));
    }

    const results = await Promise.all(promises);
    results.forEach((res) => {
      allFiles.push(...(res.files || []));
    });
  }

  return allFiles;
}

function normalizeReportMetadata(raw: any): ECGReportMetadata {
  const ecg = raw?.ecg ?? raw?.report?.ecg ?? raw?.data?.ecg ?? null;
  const patient = raw?.patient ?? ecg?.patient ?? {};
  const recordId = String(raw?.recordId ?? raw?.record_id ?? raw?.recordID ?? ecg?.recordId ?? raw?.id ?? raw?.key ?? '');
  const key = String(raw?.key ?? raw?.fileKey ?? raw?.file_key ?? recordId);
  const fileName = String(raw?.fileName ?? raw?.filename ?? raw?.name ?? key.split('/').pop() ?? '');
  const fileType = raw?.type ?? raw?.contentType ?? raw?.content_type ?? '';
  const rawType = fileType || raw?.reportType || raw?.report_type || '';
  const type = normalizeReportType(rawType);
  const rawPdfUrl = raw?.pdfUrl ?? raw?.pdf_url ?? raw?.presignedPdfUrl ?? raw?.pdf?.url ?? (type === 'PDF' ? raw?.url : undefined);
  const rawJsonUrl = raw?.jsonUrl ?? raw?.json_url ?? raw?.presignedJsonUrl ?? raw?.json?.url ?? (type === 'JSON' ? raw?.url : undefined);
  const pdfUrl = rawPdfUrl ? String(rawPdfUrl) : undefined;
  const jsonUrl = rawJsonUrl ? String(rawJsonUrl) : undefined;
  const timestamp = raw?.timestamp ?? raw?.lastModified ?? raw?.last_modified ?? raw?.createdAt ?? raw?.created_at ?? raw?.date ?? ecg?.timestamp ?? '';
  const patientName =
    raw?.patientName ??
    raw?.patient_name ??
    raw?.reportName ??
    raw?.report_name ??
    raw?.displayName ??
    raw?.display_name ??
    raw?.title ??
    patient?.name ??
    ecg?.patient?.name ??
    fileName;

  return {
    id: String(raw?.id ?? recordId),
    recordId,
    patientName: String(patientName || ''),
    name: String(patientName || ''),
    deviceId: String(raw?.deviceId ?? raw?.device_id ?? raw?.device ?? ecg?.deviceId ?? ''),
    date: String(raw?.date ?? timestamp),
    timestamp: String(timestamp),
    hasPdf: Boolean(raw?.hasPdf ?? raw?.has_pdf ?? pdfUrl),
    type: type || String(fileType || ''),
    patient: {
      id: String(patient?.id ?? recordId),
      name: String(patientName || ''),
      phone: patient?.phone ?? raw?.phone ?? raw?.phoneNumber ?? raw?.phone_number,
      phoneNumber: patient?.phoneNumber ?? patient?.phone_number ?? raw?.phoneNumber ?? raw?.phone_number,
    },
    createdAt: String(raw?.createdAt ?? raw?.created_at ?? timestamp),
    fileSize: Number(raw?.fileSize ?? raw?.file_size ?? raw?.size ?? 0),
    pdfUrl,
    jsonUrl,
    ecg,
  };
}

function normalizeReportType(value: string): string {
  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('pdf')) return 'PDF';
  if (normalized.includes('json')) return 'JSON';

  return value ? String(value).toUpperCase() : '';
}

function applyReportFilters(reports: ECGReportMetadata[], filters?: ReportFilters): ECGReportMetadata[] {
  if (!filters) return reports;

  const name = filters.name?.trim().toLowerCase();
  const phone = filters.phone?.trim().toLowerCase();
  const deviceId = filters.deviceId?.trim().toLowerCase();
  const startDate = parseFilterDate(filters.startDate, false);
  const endDate = parseFilterDate(filters.endDate, true);

  return reports.filter((report) => {
    const searchableName = [
      report.patientName,
      report.name,
      report.patient?.name,
      report.recordId,
      report.id,
    ].filter(Boolean).join(' ').toLowerCase();

    const searchablePhone = [
      report.patient?.phone,
      report.patient?.phoneNumber,
      (report as any).phoneNumber,
    ].filter(Boolean).join(' ').toLowerCase();

    const searchableDevice = [
      report.deviceId,
      report.recordId,
      report.id,
    ].filter(Boolean).join(' ').toLowerCase();

    const reportDateValue = report.timestamp || report.date || report.createdAt;
    const reportDate = reportDateValue ? new Date(reportDateValue) : null;

    if (name && !searchableName.includes(name)) return false;
    if (phone && !searchablePhone.includes(phone)) return false;
    if (deviceId && !searchableDevice.includes(deviceId)) return false;
    if (startDate && (!reportDate || reportDate < startDate)) return false;
    if (endDate && (!reportDate || reportDate > endDate)) return false;

    return true;
  });
}

function parseFilterDate(value: string | undefined, endOfDay: boolean): Date | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();
  const isoDate = new Date(`${trimmed}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  const localParts = trimmed.match(/^(\d{1,2})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{4})$/);
  if (!localParts) return null;

  const [, day, month, year] = localParts;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
}

/* ======================= S3 FILE BROWSER ======================= */

type S3FilesApiResponse = {
  success?: boolean;
  data?: { files?: S3File[]; pagination?: S3FilesResponse['pagination'] } | S3File[];
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  files?: S3File[];
  pagination?: S3FilesResponse['pagination'];
};

function normalizeS3FilesResponse(
  response: S3FilesApiResponse,
  page: number,
  limit: number
): S3FilesResponse {
  let files: S3File[] = [];

  console.log('[normalizeS3FilesResponse] Input response:', response);
  console.log('[normalizeS3FilesResponse] Has data property:', 'data' in response);
  console.log('[normalizeS3FilesResponse] Has files property:', 'files' in response);
  console.log('[normalizeS3FilesResponse] Has metadata property:', 'metadata' in response);

  if ('data' in response && response.data) {
    console.log('[normalizeS3FilesResponse] response.data:', response.data);
    console.log('[normalizeS3FilesResponse] Is data array:', Array.isArray(response.data));
    if (Array.isArray(response.data)) {
      files = response.data;
      console.log('[normalizeS3FilesResponse] Using data as array, files length:', files.length);
    } else {
      files = response.data.files ?? [];
      console.log('[normalizeS3FilesResponse] Using data.files, files length:', files.length);
      console.log('[normalizeS3FilesResponse] data.files sample:', files.slice(0, 2).map((f: any) => ({
        key: f?.key,
        recordId: f?.recordId,
        hasPatient: f && 'patient' in f,
        patientName: f?.patient?.name
      })));
    }
  } else if (response.files) {
    files = response.files;
    console.log('[normalizeS3FilesResponse] Using response.files, files length:', files.length);
    console.log('[normalizeS3FilesResponse] response.files sample:', files.slice(0, 2).map((f: any) => ({
      key: f?.key,
      recordId: f?.recordId,
      hasPatient: f && 'patient' in f,
      patientName: f?.patient?.name
    })));
  }

  const nestedPagination =
    response.data && !Array.isArray(response.data) ? response.data.pagination : undefined;
  const meta = response.metadata;
  const existingPagination = nestedPagination ?? response.pagination;

  console.log('[normalizeS3FilesResponse] nestedPagination:', nestedPagination);
  console.log('[normalizeS3FilesResponse] meta:', meta);
  console.log('[normalizeS3FilesResponse] existingPagination:', existingPagination);

  const resolvedPage = meta?.page ?? existingPagination?.page ?? page;
  const resolvedLimit = meta?.limit ?? existingPagination?.limit ?? limit;
  const total = meta?.total ?? existingPagination?.total ?? files.length;
  const totalPages =
    meta?.totalPages ??
    existingPagination?.totalPages ??
    Math.max(1, Math.ceil(total / resolvedLimit));

  console.log('[normalizeS3FilesResponse] Resolved values:', {
    resolvedPage,
    resolvedLimit,
    total,
    totalPages,
    filesLength: files.length
  });

  // Count files with patient data
  const filesWithPatient = files.filter((f: any) => f && 'patient' in f);
  const filesWithPatientName = files.filter((f: any) => f?.patient?.name);
  console.log('[normalizeS3FilesResponse] Patient data analysis:', {
    totalFiles: files.length,
    filesWithPatientKey: filesWithPatient.length,
    filesWithPatientName: filesWithPatientName.length,
    patientPercentage: files.length > 0 ? (filesWithPatientName.length / files.length * 100).toFixed(1) + '%' : '0%'
  });

  const result = {
    files,
    pagination: {
      total,
      page: resolvedPage,
      limit: resolvedLimit,
      totalPages,
      hasNext: meta?.hasNext ?? existingPagination?.hasNext ?? resolvedPage < totalPages,
      hasPrev: meta?.hasPrev ?? existingPagination?.hasPrev ?? resolvedPage > 1,
    },
  };

  console.log('[normalizeS3FilesResponse] Final result:', result);
  console.log('[normalizeS3FilesResponse] ===== END NORMALIZATION =====');
  return result;
}

export async function fetchS3Files(
  page: number = 1,
  limit: number = 50,
  search: string = '',
  signal?: AbortSignal,
  source?: string
): Promise<S3FilesResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);
  // Only send source parameter if it's not the default 'cardiox' and backend supports it
  if (source && source !== 'cardiox') params.append('source', source);

  const response = await apiRequest<S3FilesApiResponse | S3FilesResponse>(
    `${ADMIN_ROUTES.s3Files}?${params.toString()}`,
    { signal }
  );

  console.log('[fetchS3Files] ===== RAW API RESPONSE =====');
  console.log('[fetchS3Files] full response:', response);
  console.log('[fetchS3Files] response keys:', Object.keys(response));
  console.log('[fetchS3Files] has data:', 'data' in response);
  console.log('[fetchS3Files] has metadata:', 'metadata' in response);
  console.log('[fetchS3Files] has files:', 'files' in response);
  
  // Check if response has data property and what it contains
  if ('data' in response && response.data) {
    console.log('[fetchS3Files] response.data exists:', response.data);
    console.log('[fetchS3Files] response.data is array:', Array.isArray(response.data));
    if (!Array.isArray(response.data)) {
      console.log('[fetchS3Files] response.data keys:', Object.keys(response.data));
      console.log('[fetchS3Files] response.data.files:', response.data.files);
      console.log('[fetchS3Files] response.data.pagination:', response.data.pagination);
    }
  }
  
  // Check for patient data in response
  if ('data' in response && response.data && !Array.isArray(response.data) && response.data.files) {
    const sampleFiles = response.data.files.slice(0, 3);
    console.log('[fetchS3Files] sample files from response.data.files:', sampleFiles.map((f: any) => ({
      key: f?.key,
      recordId: f?.recordId,
      hasPatient: f && 'patient' in f,
      patientName: f?.patient?.name
    })));
  } else if ('files' in response && response.files) {
    const sampleFiles = response.files.slice(0, 3);
    console.log('[fetchS3Files] sample files from response.files:', sampleFiles.map((f: any) => ({
      key: f?.key,
      recordId: f?.recordId,
      hasPatient: f && 'patient' in f,
      patientName: f?.patient?.name
    })));
  }

  if ('data' in response || 'metadata' in response) {
    const normalized = normalizeS3FilesResponse(response as S3FilesApiResponse, page, limit);
    console.log('[fetchS3Files] normalized response:', normalized);
    return normalized;
  }

  const legacyResponse = response as S3FilesResponse;
  if (legacyResponse.pagination) {
    console.log('[fetchS3Files] using legacy response with pagination');
    return legacyResponse;
  }

  const normalizedLegacy = normalizeS3FilesResponse(legacyResponse, page, limit);
  console.log('[fetchS3Files] normalized legacy response:', normalizedLegacy);
  return normalizedLegacy;
}

/* ======================= ANDROID REPORTS SEARCH (RHYTHM ULTRA MAX) ======================= */

export async function fetchRhythmUltraMaxReports(
  mobileNumber?: string,
  deviceId?: string,
  startDate?: string,
  endDate?: string,
  nextToken?: string
): Promise<RhythmUltraMaxReportsResponse> {
  const params = new URLSearchParams();
  if (deviceId) {
    params.append('device_id', deviceId);
  } else if (mobileNumber) {
    params.append('mobile_no', mobileNumber);
  }
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (nextToken) params.append('nextToken', nextToken);

  const response = await apiRequest<RhythmUltraMaxReportsResponse>(
    `/android/reports/search?${params.toString()}`
  );
  return response;
}

export async function fetchReportPdf(s3Key: string): Promise<{ url: string; cached: boolean }> {
  const params = new URLSearchParams();
  params.append('key', s3Key);

  const response = await apiRequest<{ url: string; cached: boolean }>(
    `/android/reports/pdf?${params.toString()}`
  );
  return response;
}

export async function fetchReportRawJsonUrl(s3Key: string): Promise<{ success: boolean; data: { url: string } }> {
  const params = new URLSearchParams();
  params.append('key', s3Key);

  const response = await apiRequest<{ success: boolean; data: { url: string } }>(
    `/android/s3-files/file-url?${params.toString()}`
  );
  return response;
}

/* ======================= ANDROID S3 FILES (RHYTHM ULTRA) ======================= */

export async function fetchAndroidS3Files(
  page: number = 1,
  limit: number = 50,
  search: string = '',
  signal?: AbortSignal
): Promise<S3FilesResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);

  const response = await apiRequest<{ success: boolean; data: S3FilesResponse } | S3FilesResponse>(
    `/android/s3-files?${params.toString()}`,
    { signal }
  );
  if ('data' in response && response.data) {
    return response.data;
  }
  return response as S3FilesResponse;
}

export async function fetchAndroidS3FilesList(
  page: number = 1,
  limit: number = 1000,
  search: string = '',
  signal?: AbortSignal
): Promise<AndroidS3FilesResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);

  const response = await apiRequest<AndroidS3FilesResponse>(
    `/android/s3-files?${params.toString()}`,
    { signal }
  );
  return response;
}

export async function fetchAndroidS3FileUrl(
  key: string,
  download: boolean = false
): Promise<{ url: string }> {
  const params = new URLSearchParams();
  params.append('key', key);
  if (download) params.append('download', 'true');

  const response = await apiRequest<{ success: boolean; data: { url: string } } | { url: string }>(
    `/android/s3-files/file-url?${params.toString()}`
  );
  if ('data' in response && response.data) {
    return response.data;
  }
  return response as { url: string };
}

function getS3FileContentUrl(key: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${ADMIN_ROUTES.s3FileContent}?key=${encodeURIComponent(key)}`;
}

function unwrapS3FileContent<T>(response: { success?: boolean; data?: T; content?: T; body?: T; error?: { message?: string; code?: string } } | T): T {
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
    if ('content' in response && response.content !== undefined) {
      return response.content;
    }
    if ('body' in response && response.body !== undefined) {
      return response.body;
    }
  }

  // Fallback if the structure is different (though backend says it returns { success, data })
  return response as unknown as T;
}

async function fetchS3ContentResponse(url: string, headers: Record<string, string>): Promise<Response> {
  // Always include auth headers from the start to avoid 403 errors
  const authHeaders = getAdminAuthHeaders(false);
  const requestHeaders: Record<string, string> = {
    ...(typeof authHeaders === 'object' && authHeaders !== null ? authHeaders as Record<string, string> : {}),
    ...headers,
  };

  const response = await fetch(url, { headers: requestHeaders });
  return response;
}

// export async function fetchS3FileContent<T = any>(key: string): Promise<T> {
//   const response = await fetchS3ContentResponse(getS3FileContentUrl(key), {
//     Accept: 'application/json, text/plain, */*',
//   });

//   if (!response.ok) {
//     throw new Error(`Preview request failed: ${response.statusText}`);
//   }

//   const contentType = response.headers.get('content-type') || '';

//   if (contentType.includes('application/json')) {
//     return unwrapS3FileContent<T>(await response.json());
//   }

//   return unwrapS3FileContent<T>(await response.text() as T);
// }
export async function fetchS3FileContent<T = any>(key: string): Promise<T> {
  const response = await apiRequest<any>(
    `${ADMIN_ROUTES.s3FileContent}?key=${encodeURIComponent(key)}`
  );
  return unwrapS3FileContent<T>(response);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const normalized = base64.includes(',') ? base64.split(',').pop() || '' : base64;
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

async function fetchBlobFromUrl(url: string, mimeType: string): Promise<Blob> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Preview request failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  return blob.type ? blob : new Blob([blob], { type: mimeType });
}

// export async function fetchS3FileBlob(key: string, mimeType: string, fallbackUrl?: string): Promise<Blob> {
//   const url = getS3FileContentUrl(key);
//   const headers: Record<string, string> = {
//     Accept: `${mimeType}, application/octet-stream, application/json, */*`,
//   };

//   try {
//     const response = await fetchS3ContentResponse(url, headers);

//     if (!response.ok) {
//       throw new Error(`Preview request failed: ${response.statusText}`);
//     }

//     const contentType = response.headers.get('content-type') || '';

//     if (contentType.includes('application/json')) {
//       const payload = await response.json();

//       if (payload?.error) {
//         throw new Error(payload.error.message || 'API returned an error');
//       }

//       const data = payload?.data ?? payload;
//       const base64 = typeof data === 'string'
//         ? data
//         : data?.base64 ?? data?.pdfBase64 ?? data?.contentBase64 ?? data?.body;
//       const rawUrl = data?.url ?? data?.fileUrl ?? data?.presignedUrl ?? data?.downloadUrl;

//       if (typeof base64 === 'string') {
//         return base64ToBlob(base64, mimeType);
//       }

//       if (typeof rawUrl === 'string') {
//         return fetchBlobFromUrl(rawUrl, mimeType);
//       }

//       throw new Error('Preview API did not return file content');
//     }

//     const blob = await response.blob();
//     return blob.type ? blob : new Blob([blob], { type: mimeType });
//   } catch (error) {
//     if (fallbackUrl) {
//       return fetchBlobFromUrl(fallbackUrl, mimeType);
//     }
//     throw error;
//   }
// }
export async function fetchS3FileBlob(key: string, mimeType: string, fallbackUrl?: string): Promise<Blob> {
  // If a presigned URL is available, use it directly — avoids CORS entirely
  if (fallbackUrl) {
    const response = await fetch(fallbackUrl);
    if (!response.ok) throw new Error(`Preview request failed: ${response.statusText}`);
    const blob = await response.blob();
    return blob.type ? blob : new Blob([blob], { type: mimeType });
  }

  // Fallback: route through backend proxy
  const response = await apiRequest<any>(
    `${ADMIN_ROUTES.s3FileContent}?key=${encodeURIComponent(key)}`
  );

  const data = response?.data ?? response;
  const base64 = typeof data === 'string'
    ? data
    : data?.base64 ?? data?.pdfBase64 ?? data?.contentBase64 ?? data?.body;
  const rawUrl = data?.url ?? data?.fileUrl ?? data?.presignedUrl ?? data?.downloadUrl;

  if (typeof base64 === 'string') return base64ToBlob(base64, mimeType);
  if (typeof rawUrl === 'string') return fetchBlobFromUrl(rawUrl, mimeType);

  throw new Error('Preview API did not return file content');
}

/* ======================= DOCTOR API ======================= */

export interface DoctorReportSummary {
  id: string;
  assignmentId: string;
  doctorId: string;
  deviceId: string;
  status: string;
  key: string;
  fileName: string;
  url: string;
  uploadedAt?: string; // ISO timestamp
  lastModified?: string; // Keep for backward compatibility
  assignedAt?: string;
  reviewedAt?: string;
  patientName?: string;
  reportType?: string;

}

function deriveFileName(key: string | undefined, fallback: string = "Report"): string {
  if (!key) {
    return fallback;
  }

  const parts = key.split("/");
  return parts[parts.length - 1] || fallback;
}

function normalizeDoctorReportSummary(raw: any, fallbackStatus: "pending" | "reviewed"): DoctorReportSummary {
  const key = raw?.key || raw?.fileKey || raw?.file_path || raw?.fileName || raw?.filename || raw?.id || "";
  const fileName =
    raw?.fileName ||
    raw?.filename ||
    raw?.originalFileName ||
    raw?.reportName ||
    deriveFileName(key, "Report");

  return {
    id: String(raw?.id || raw?.reportId || key || fileName),
    assignmentId: String(raw?.assignmentId || raw?.assignment_id || ""),
    doctorId: String(raw?.doctorId || raw?.doctor_id || ""),
    deviceId: String(raw?.deviceId || raw?.device_id || ""),
    key: String(key || fileName),
    fileName: String(fileName),
    url: String(raw?.url || raw?.fileUrl || raw?.presignedUrl || raw?.downloadUrl || ""),
    uploadedAt: raw?.uploadedAt || raw?.uploaded_at,
    lastModified: raw?.lastModified || raw?.last_modified,
    assignedAt: raw?.assignedAt || raw?.assigned_at || raw?.uploadedAt || raw?.lastModified,
    reviewedAt: raw?.reviewedAt || raw?.reviewed_at || raw?.uploadedAt || raw?.lastModified,
    patientName: raw?.patientName || raw?.patient_name,
    reportType: raw?.reportType || raw?.report_type || raw?.type,
    status: String(raw?.status || fallbackStatus),
  };
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
  const reports = data.reports || data.data?.reports || [];

  return reports.map((report: any) => normalizeDoctorReportSummary(report, "pending"));
}

/**
 * Fetch a fresh presigned URL for a reviewed report with retry logic
 * This avoids SignatureDoesNotMatch errors from using stale presigned URLs
 */
export async function fetchReviewedReportUrl(s3Key: string, maxRetries: number = 3): Promise<{ url: string }> {
  const params = new URLSearchParams();
  params.append('key', s3Key);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiRequest<{ url: string }>(`/android/reports/pdf?${params.toString()}`);

      if (response?.url) {
        return response;
      }

      throw new Error('No URL returned from server');
    } catch (err) {
      console.warn(`Attempt ${attempt}/${maxRetries} failed to fetch reviewed report URL:`, err);

      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch reviewed report URL after ${maxRetries} attempts`);
      }

      // Wait before retrying (exponential backoff: 500ms, 1000ms, 2000ms)
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
    }
  }

  throw new Error('Failed to fetch reviewed report URL');
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

export interface DoctorInviteInfo {
  doctorId?: string;
  name: string;
  email: string;
  specialization?: string;
  hospital?: string;
  expiresAt?: string;
}

function extractApiMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const data = payload as Record<string, any>;
  return data.message || data.error?.message || data.error || fallback;
}

function normalizeInviteDoctor(payload: any): DoctorInviteInfo {
  const source =
    payload?.doctor ||
    payload?.data?.doctor ||
    payload?.invite ||
    payload?.data?.invite ||
    payload?.data ||
    payload;

  return {
    doctorId: source?.doctorId || source?.id,
    name: source?.name || source?.doctor_name || 'Doctor',
    email: source?.email || '',
    specialization: source?.specialization,
    hospital: source?.hospital,
    expiresAt: source?.expiresAt || source?.expires_at,
  };
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
  const reports = data.reports || data.data?.reports || [];
  return reports.map((report: any) => normalizeDoctorReportSummary(report, "reviewed"));
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
  const base = import.meta.env.VITE_ADMIN_NEW_API_BASE_URL || API_BASE_URL;
  const url = joinApiUrl(base, ADMIN_ROUTES.createDoctor);
  const response = await fetch(url, {
    method: "POST",
    headers: getAdminAuthHeaders(true),
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      specialization: payload.specialization,
      license_number: payload.licenseNumber,
      hospital_affiliation: payload.hospital,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = response.statusText;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error?.message || errorMessage;
    } catch {
      if (errorText) {
        errorMessage = errorText;
      }
    }
    throw new Error(errorMessage);
  }

  const responseData = await response.json() as { success: boolean, data: { doctor: Doctor } } | { success: boolean, doctor: Doctor };

  if ('data' in responseData && responseData.data && 'doctor' in responseData.data) {
    return responseData.data.doctor;
  }
  if ('doctor' in responseData) {
    return (responseData as any).doctor;
  }

  return responseData as unknown as Doctor;
}

export async function validateDoctorInvite(token: string): Promise<DoctorInviteInfo> {
  const url = joinApiUrl(DOCTOR_API_BASE_URL, DOCTOR_ROUTES.validateInvite);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  const responseText = await response.text();
  const responseData = responseText ? JSON.parse(responseText) : null;

  if (!response.ok || responseData?.success === false) {
    throw new Error(extractApiMessage(responseData, 'This invitation link is invalid or expired.'));
  }

  return normalizeInviteDoctor(responseData);
}

export interface SetDoctorPasswordPayload {
  token: string;
  email: string;
  temporaryPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function setDoctorPassword(payload: SetDoctorPasswordPayload): Promise<void> {
  const url = joinApiUrl(DOCTOR_API_BASE_URL, DOCTOR_ROUTES.setPassword);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  const responseData = responseText ? JSON.parse(responseText) : null;

  if (!response.ok || responseData?.success === false) {
    throw new Error(
      extractApiMessage(
        responseData,
        'Unable to set your password. The invitation may no longer be valid.'
      )
    );
  }
}

/* ======================= SUPPORT API ======================= */

export interface SupportComplaint {
  id: string;
  complaint_id: string;
  name: string;
  machine_id: string;
  complaint: string;
  source: string;
  status: 'pending' | 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  notes?: string;
}

export interface CreateComplaintPayload {
  name: string;
  machine_id: string;
  complaint: string;
  source: string;
}

export interface UpdateComplaintPayload {
  status?: string;
  notes?: string;
}

// export async function fetchSupportComplaints(): Promise<{ success: boolean; complaints: SupportComplaint[] }> {
//   const baseUrl = import.meta.env.VITE_SUPPORT_API_BASE_URL || 'https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/prod';
//   const path = import.meta.env.VITE_SUPPORT_COMPLAINTS_PATH || '/support/complaints';
//   const response = await fetch(`${baseUrl}${path}`);

//   if (!response.ok) {
//     throw new Error(`Failed to fetch complaints: ${response.statusText}`);
//   }

//   return await response.json();
// }
export async function fetchSupportComplaints(): Promise<{ success: boolean; complaints: SupportComplaint[] }> {
  const baseUrl = import.meta.env.VITE_SUPPORT_API_BASE_URL || 'https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/prod';
  const path = import.meta.env.VITE_SUPPORT_COMPLAINTS_PATH || '/support/complaints';

  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: buildAuthHeaders("admin"), // ✅ FIX
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch complaints: ${response.statusText}`);
  }

  return await response.json();
}

export async function updateSupportComplaint(id: string, payload: UpdateComplaintPayload): Promise<{ success: boolean }> {
  const baseUrl = import.meta.env.VITE_SUPPORT_API_BASE_URL || 'https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/prod';
  const path = import.meta.env.VITE_SUPPORT_UPDATE_COMPLAINT_PATH || '/support/complaint';

  const response = await fetch(
    `${baseUrl}${path}/${id}`,
    {
      method: 'PATCH',
      headers: buildAuthHeaders("admin", true),
      body: JSON.stringify({
        complaint_id: id,
        status: payload.status,
        admin_notes: payload.notes || ""
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.log("ERROR RESPONSE:", errText);

    let message = response.statusText;
    try {
      const errJson = JSON.parse(errText);
      message = errJson.message || errJson.error?.message || errText;
    } catch { }

    throw new Error(`Failed to update complaint: ${message}`);
  }

  return await response.json();
}

export async function createSupportComplaint(payload: CreateComplaintPayload): Promise<{ success: boolean; id: string }> {
  const baseUrl = import.meta.env.VITE_SUPPORT_API_BASE_URL || 'https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/prod';
  const path = import.meta.env.VITE_SUPPORT_COMPLAINT_PATH || '/support/complaint';
  const response = await fetch(
    `${baseUrl}${path}`,
    {
      method: 'POST',
      headers: buildAuthHeaders("admin", true),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create complaint: ${response.statusText}`);
  }

  return await response.json();
}

/* ======================= DEVICE ANALYTICS API ======================= */

const DEVICE_ANALYTICS_BASE_URL = 'https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/prod';

export async function fetchDeviceAnalyticsSummary(): Promise<AnalyticsSummaryResponse> {
  const url = `${DEVICE_ANALYTICS_BASE_URL}/admin/analytics/summary`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAdminAuthHeaders(true),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch device analytics summary: ${response.statusText}`);
  }

  return await response.json();
}

export async function searchDeviceBySerial(
  deviceId: string,
  source: 'cardiox' | 'rhythm' = 'cardiox',
  filter?: 'active',
  list?: 'users'
): Promise<DeviceLookupAPIResponse | RhythmUltraDeviceLookupAPIResponse | CardioXDeviceLookupAPIResponse | RhythmUsersLookupAPIResponse> {
  const params = new URLSearchParams();
  params.append('device_id', deviceId);
  params.append('source', source);
  if (filter) params.append('filter', filter);
  if (list) params.append('list', list);

  const url = `${DEVICE_ANALYTICS_BASE_URL}/admin/analytics/summary?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAdminAuthHeaders(true),
  });

  if (!response.ok) {
    throw new Error(`Failed to search device: ${response.statusText}`);
  }

  return await response.json();
}
