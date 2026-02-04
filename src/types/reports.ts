/**
 * Report types and interfaces
 * These match the API response structure
 */

export interface Report {
  id: string;
  recordId: string;
  patientName: string;
  deviceId: string;
  date: string;
  timestamp: string;
  fileSize?: number;
  hasPdf: boolean;
}

export interface ReportFilters {
  name?: string;
  phoneNumber?: string;
  deviceId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReportsResponse {
  reports: Report[];
  total: number;
}