import type { ECGReportMetadata } from '../../api/types/ecg';

export const mockReports: ECGReportMetadata[] = [
  {
    recordId: 'rec_001',
    deviceId: 'device_001',
    patient: {
      id: 'pat_001',
      name: 'divyansh',
      phone: '9876543210'
    },
    timestamp: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-15T10:30:00Z',
    fileSize: 1024000,
    hasPdf: true,
    // Compatibility fields
    id: 'rec_001',
    name: 'divyansh',
    phoneNumber: '9876543210',
    date: '2024-01-15T10:30:00Z',
    type: 'ECG'
  },
  {
    recordId: 'rec_002',
    deviceId: 'device_002',
    patient: {
      id: 'pat_002',
      name: 'john doe',
      phone: '9876543211'
    },
    timestamp: '2024-01-16T14:45:00Z',
    createdAt: '2024-01-16T14:45:00Z',
    fileSize: 2048000,
    hasPdf: true,
    // Compatibility fields
    id: 'rec_002',
    name: 'john doe',
    phoneNumber: '9876543211',
    date: '2024-01-16T14:45:00Z',
    type: 'ECG'
  },
  {
    recordId: 'rec_003',
    deviceId: 'device_003',
    patient: {
      id: 'pat_003',
      name: 'jane smith',
      phone: '9876543212'
    },
    timestamp: '2024-01-17T09:15:00Z',
    createdAt: '2024-01-17T09:15:00Z',
    fileSize: 1536000,
    hasPdf: true,
    // Compatibility fields
    id: 'rec_003',
    name: 'jane smith',
    phoneNumber: '9876543212',
    date: '2024-01-17T09:15:00Z',
    type: 'ECG'
  }
];

export function filterReports(reports: ECGReportMetadata[], filters: any): ECGReportMetadata[] {
  return reports.filter(report => {
    if (filters.name && !report.name?.toLowerCase().includes(filters.name.toLowerCase())) {
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
