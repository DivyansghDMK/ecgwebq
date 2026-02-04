/**
 * Reports API Service
 * Handles all API calls related to reports
 */

import { apiGet, apiPost } from './apiClient';
import type { Report, ReportFilters, ReportsResponse } from '../types/reports';




/**
 * Build query string from filters
 */
function buildQueryString(filters: ReportFilters): string {
  const params = new URLSearchParams();
  
  if (filters.name) {
    params.append('name', filters.name.trim());
  }
  if (filters.phoneNumber) {
    params.append('phoneNumber', filters.phoneNumber.trim());
  }
  if (filters.deviceId) {
    params.append('deviceId', filters.deviceId.trim());
  }
  if (filters.startDate) {
    params.append('startDate', filters.startDate.trim());
  }
  if (filters.endDate) {
    params.append('endDate', filters.endDate.trim());
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch reports with optional filters
 * @param filters - Search/filter criteria
 * @returns Promise with reports data
 */
export async function fetchReports(filters: ReportFilters = {}): Promise<ReportsResponse> {
  // Real API call
  const queryString = buildQueryString(filters);
  const endpoint = `/reports${queryString}`;
  
  try {
    const response = await apiGet<{ success: boolean; total: number; reports: Report[] }>(endpoint);
    
    // Handle the actual backend response structure
    if (response.success && response.reports) {
      return {
        reports: response.reports,
        total: response.total || response.reports.length
      };
    }
    
    // Fallback for unexpected response format
    return {
      reports: [],
      total: 0
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch reports');
  }
}

/**
 * Fetch a single report by ID
 * @param id - Report ID
 * @returns Promise with report data
 */
export async function fetchReportById(id: string): Promise<Report> {
  try {
    const response = await apiGet<{ success: boolean; data: Report }>(`/report?id=${id}`);
    
    // Handle the actual backend response structure
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Report not found');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch report');
  }
}

/**
 * Upload ECG data
 * @param data - ECG upload data
 * @returns Promise with upload response
 */
export async function uploadECGData(data: any): Promise<any> {
  try {
    const response = await apiPost<any>('/upload', data);
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to upload ECG data');
  }
}

