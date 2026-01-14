/**
 * Report types and interfaces
 * These match the API response structure
 */

export interface Report {
  id: string;
  name: string;
  phoneNumber: string;
  deviceId: string;
  date: string;
  type?: string;
  size?: string;
  s3Key?: string;
  [key: string]: any; // Allow additional fields from API
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
  page?: number;
  limit?: number;
}

