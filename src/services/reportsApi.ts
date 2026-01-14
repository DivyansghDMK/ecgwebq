/**
 * Reports API Service
 * Handles all API calls related to reports
 */

import { apiGet } from './apiClient';
import type { Report, ReportFilters, ReportsResponse } from '../types/reports';

/**
 * Mock data for testing when backend is not available
 */
const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    name: 'John Doe',
    phoneNumber: '9876543210',
    deviceId: 'DEV001',
    date: new Date().toISOString(),
    type: 'ECG Report',
    size: '2.5 MB',
    ecg: {
      org: 'DM_YT',
      phone: '1232345',
      patient: { name: 'John Doe', age: 23, gender: 'Male' },
      datetime: { date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 8) },
      overview: { maxHR: '38 bpm', minHR: '38 bpm', avgHR: '38 bpm' },
      observation: [
        { name: 'Heart Rate', value: '40 bpm', range: '60-100' },
        { name: 'PR Interval', value: '150 ms', range: '120 ms - 200 ms' },
        { name: 'QRS Complex', value: '113 ms', range: '70 ms - 120 ms' },
        { name: 'QRS Axis', value: '--', range: 'Normal' },
        { name: 'QT Interval', value: '514 ms', range: '300 ms - 450 ms' },
        { name: 'QTCB (Bazett)', value: '534 ms', range: '300 ms - 450 ms' },
        { name: 'QTCF (Fridericia)', value: '441 ms', range: '300 ms - 450 ms' },
        { name: 'ST Deviation (J+60 ms)', value: '-4.00 mV', range: 'Report in mV' },
      ],
      conclusions: [
        'Measured Values: HR 38 bpm; PR 150 ms; QRS 113 ms; QT 514 ms; QTc 534 ms; Axis --',
        'Sinus bradycardia (HR ≈ 38 bpm)',
        'QTcB (Bazett): 534 ms (Prolonged); QTcF (Fridericia): 441 ms (0.441 s)',
        'ST deviation: -4.00 mV (J+60ms); report only as deviation',
        'Automated interpretation (conservative): Normal unless measurements suggest otherwise',
        'Acquisition: Sampling rate 335 Hz; Gain 5.0 mm/mV; Paper speed 25.0 mm/s',
        'This is an automated ECG analysis and must be reviewed by a qualified physician.'
      ]
    }
  },
  {
    id: '2',
    name: 'Jane Smith',
    phoneNumber: '9876543211',
    deviceId: 'DEV002',
    date: new Date(Date.now() - 86400000).toISOString(),
    type: 'ECG Report',
    size: '3.1 MB',
    ecg: {
      org: 'DM_YT',
      phone: '1232346',
      patient: { name: 'Jane Smith', age: 29, gender: 'Female' },
      datetime: { date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 8) },
      overview: { maxHR: '72 bpm', minHR: '58 bpm', avgHR: '65 bpm' },
      observation: [
        { name: 'Heart Rate', value: '65 bpm', range: '60-100' },
        { name: 'PR Interval', value: '160 ms', range: '120 ms - 200 ms' },
        { name: 'QRS Complex', value: '90 ms', range: '70 ms - 120 ms' },
        { name: 'QRS Axis', value: '0°', range: 'Normal' },
        { name: 'QT Interval', value: '380 ms', range: '300 ms - 450 ms' },
        { name: 'QTCB (Bazett)', value: '400 ms', range: '300 ms - 450 ms' },
        { name: 'QTCF (Fridericia)', value: '392 ms', range: '300 ms - 450 ms' },
        { name: 'ST Deviation (J+60 ms)', value: '0.0 mV', range: 'Report in mV' },
      ],
      conclusions: [
        'Measured Values: HR 65 bpm; PR 160 ms; QRS 90 ms; QT 380 ms; QTc 400 ms; Axis 0°',
        'Normal sinus rhythm',
        'No significant ST-T changes observed'
      ]
    }
  },
  {
    id: '3',
    name: 'Bob Wilson',
    phoneNumber: '9876543212',
    deviceId: 'DEV003',
    date: new Date(Date.now() - 172800000).toISOString(),
    type: 'ECG Report',
    size: '2.8 MB',
    ecg: {
      org: 'DM_YT',
      phone: '1232347',
      patient: { name: 'Bob Wilson', age: 35, gender: 'Male' },
      datetime: { date: new Date(Date.now() - 172800000).toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 8) },
      overview: { maxHR: '88 bpm', minHR: '60 bpm', avgHR: '72 bpm' },
      observation: [
        { name: 'Heart Rate', value: '72 bpm', range: '60-100' },
        { name: 'PR Interval', value: '150 ms', range: '120 ms - 200 ms' },
        { name: 'QRS Complex', value: '100 ms', range: '70 ms - 120 ms' },
        { name: 'QRS Axis', value: '–', range: 'Normal' },
        { name: 'QT Interval', value: '390 ms', range: '300 ms - 450 ms' },
        { name: 'QTCB (Bazett)', value: '420 ms', range: '300 ms - 450 ms' },
        { name: 'QTCF (Fridericia)', value: '410 ms', range: '300 ms - 450 ms' },
        { name: 'ST Deviation (J+60 ms)', value: '–0.5 mV', range: 'Report in mV' },
      ],
      conclusions: [
        'Measured Values: HR 72 bpm; PR 150 ms; QRS 100 ms; QT 390 ms; QTc 420 ms',
        'Automated interpretation: Normal ECG'
      ]
    }
  },
  {
    id: '4',
    name: 'Alice Johnson',
    phoneNumber: '9876543213',
    deviceId: 'DEV001',
    date: new Date(Date.now() - 259200000).toISOString(),
    type: 'ECG Report',
    size: '3.5 MB',
    ecg: {
      org: 'DM_YT',
      phone: '1232348',
      patient: { name: 'Alice Johnson', age: 31, gender: 'Female' },
      datetime: { date: new Date(Date.now() - 259200000).toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 8) },
      overview: { maxHR: '95 bpm', minHR: '55 bpm', avgHR: '68 bpm' },
      observation: [
        { name: 'Heart Rate', value: '68 bpm', range: '60-100' },
        { name: 'PR Interval', value: '170 ms', range: '120 ms - 200 ms' },
        { name: 'QRS Complex', value: '85 ms', range: '70 ms - 120 ms' },
        { name: 'QRS Axis', value: '5°', range: 'Normal' },
        { name: 'QT Interval', value: '370 ms', range: '300 ms - 450 ms' },
        { name: 'QTCB (Bazett)', value: '390 ms', range: '300 ms - 450 ms' },
        { name: 'QTCF (Fridericia)', value: '382 ms', range: '300 ms - 450 ms' },
        { name: 'ST Deviation (J+60 ms)', value: '0.1 mV', range: 'Report in mV' },
      ],
      conclusions: [
        'Measured Values: HR 68 bpm; PR 170 ms; QRS 85 ms; QT 370 ms; QTc 390 ms',
        'Normal sinus rhythm'
      ]
    }
  },
];

/**
 * Use mock data if backend is not available
 * Set to true for testing, false for production
 * Currently defaults to true for testing (change when backend is ready)
 */
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || import.meta.env.VITE_USE_MOCK_DATA === undefined;

/**
 * Filter mock reports based on criteria
 */
function filterMockReports(reports: Report[], filters: ReportFilters): Report[] {
  return reports.filter(report => {
    if (filters.name && !report.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }
    if (filters.phoneNumber && !report.phoneNumber.includes(filters.phoneNumber)) {
      return false;
    }
    if (filters.deviceId && !report.deviceId.includes(filters.deviceId)) {
      return false;
    }
    if (filters.startDate || filters.endDate) {
      const d = new Date(report.date);
      if (filters.startDate) {
        const sd = new Date(`${filters.startDate}T00:00:00`);
        if (d < sd) return false;
      }
      if (filters.endDate) {
        const ed = new Date(`${filters.endDate}T23:59:59`);
        if (d > ed) return false;
      }
    }
    return true;
  });
}

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
  // Use mock data if enabled
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const filteredReports = filterMockReports(MOCK_REPORTS, filters);
    
    return {
      reports: filteredReports,
      total: filteredReports.length,
    };
  }
  
  // Real API call
  const queryString = buildQueryString(filters);
  const endpoint = `/reports${queryString}`;
  
  try {
    const response = await apiGet<ReportsResponse>(endpoint);
    return response;
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
    const response = await apiGet<Report>(`/reports/${id}`);
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch report');
  }
}

