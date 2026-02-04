# Frontend API Integration Guide

## Overview
This guide explains how the frontend will connect to your separate backend project using GET and POST API calls.

## Architecture

```
Frontend (This Project)          Backend (Separate Project)
     │                                    │
     │  ┌──────────────────┐              │
     │  │  API Service     │              │
     │  │  (apiClient.ts)  │              │
     │  └────────┬─────────┘              │
     │           │                         │
     ├───────────┼── HTTP Requests ───────┼──> API Endpoints
     │           │  (GET/POST)             │    (Backend Server)
     │           │                         │
     │  ┌────────┴─────────┐              │
     │  │  React           │              │
     │  │  Components      │              │
     │  └──────────────────┘              │
     │                                    │
```

---

## Step 1: Environment Configuration

### Create `.env` file in frontend root:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:3000/api

# For production:
# VITE_API_BASE_URL=https://your-backend-api.com/api
```

**Important:** Vite requires the `VITE_` prefix for environment variables to be accessible in the browser.

---

## Step 2: API Service Layer

Create a generic API client that all components will use.

### `src/services/apiClient.ts`

```typescript
/**
 * Generic API Client
 * Handles all HTTP requests to the backend
 */

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * API Response wrapper
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Get authentication token from storage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

/**
 * Generic API request function
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const token = getAuthToken();

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data: APIResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `API request failed: ${response.statusText}`);
    }

    if (!data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data;
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server');
    }
    throw error;
  }
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await apiRequest<T>(endpoint, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('No data returned from API');
  }

  return response.data;
}

/**
 * POST request
 */
export async function apiPost<T>(
  endpoint: string,
  body: any
): Promise<T> {
  const response = await apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.data) {
    throw new Error('No data returned from API');
  }

  return response.data;
}

/**
 * PUT request
 */
export async function apiPut<T>(
  endpoint: string,
  body: any
): Promise<T> {
  const response = await apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  if (!response.data) {
    throw new Error('No data returned from API');
  }

  return response.data;
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await apiRequest<T>(endpoint, {
    method: 'DELETE',
  });

  if (!response.data) {
    throw new Error('No data returned from API');
  }

  return response.data;
}
```

---

## Step 3: Specific API Services

Create specific service files for different API endpoints.

### Example: `src/services/reportsApi.ts`

```typescript
/**
 * Reports API Service
 * Handles all report-related API calls
 */
import { apiGet, apiPost } from './apiClient';

// Types
export interface Report {
  id: string;
  name: string;
  type: string;
  date: string;
  size: number;
  key: string;
}

export interface ReportListResponse {
  reports: Report[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ReportListQuery {
  page?: number;
  pageSize?: number;
  deviceId?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get list of reports
 */
export async function getReports(query?: ReportListQuery): Promise<ReportListResponse> {
  const params = new URLSearchParams();
  
  if (query?.page) params.append('page', query.page.toString());
  if (query?.pageSize) params.append('pageSize', query.pageSize.toString());
  if (query?.deviceId) params.append('deviceId', query.deviceId);
  if (query?.patientId) params.append('patientId', query.patientId);
  if (query?.startDate) params.append('startDate', query.startDate);
  if (query?.endDate) params.append('endDate', query.endDate);

  const queryString = params.toString();
  const endpoint = `/reports${queryString ? `?${queryString}` : ''}`;

  return apiGet<ReportListResponse>(endpoint);
}

/**
 * Get a specific report by ID
 */
export async function getReportById(id: string): Promise<Report> {
  return apiGet<Report>(`/reports/${id}`);
}

/**
 * Upload a new report
 */
export async function uploadReport(reportData: FormData | object): Promise<{ id: string; message: string }> {
  return apiPost<{ id: string; message: string }>('/reports/upload', reportData);
}

/**
 * Delete a report
 */
export async function deleteReport(id: string): Promise<{ message: string }> {
  return apiGet<{ message: string }>(`/reports/${id}/delete`);
}
```

---

## Step 4: React Hooks for Data Fetching

Create custom hooks to manage API calls and state.

### `src/hooks/useReports.ts`

```typescript
/**
 * Custom hook for fetching reports
 */
import { useState, useEffect, useCallback } from 'react';
import { getReports, type ReportListResponse, type ReportListQuery } from '../services/reportsApi';

interface UseReportsOptions {
  autoFetch?: boolean;
  initialQuery?: ReportListQuery;
}

interface UseReportsReturn {
  reports: ReportListResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateQuery: (query: Partial<ReportListQuery>) => void;
}

export function useReports(options: UseReportsOptions = {}): UseReportsReturn {
  const { autoFetch = true, initialQuery = {} } = options;

  const [reports, setReports] = useState<ReportListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ReportListQuery>(initialQuery);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getReports(query);
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reports');
      setReports(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const refetch = useCallback(() => {
    return fetchReports();
  }, [fetchReports]);

  const updateQuery = useCallback((newQuery: Partial<ReportListQuery>) => {
    setQuery((prev) => ({ ...prev, ...newQuery }));
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchReports();
    }
  }, [autoFetch, fetchReports]);

  return {
    reports,
    loading,
    error,
    refetch,
    updateQuery,
  };
}
```

---

## Step 5: Using API in Components

### Example: Updated `ReportsPage.tsx`

```typescript
import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Eye, Filter, Calendar } from "lucide-react";
import SearchBar from "../common/SearchBar";
import SummaryCard from "../common/SummaryCard";
import { useReports } from "../../hooks/useReports";
import type { Report } from "../../services/reportsApi";

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  // Fetch reports from API
  const { reports, loading, error, refetch, updateQuery } = useReports({
    autoFetch: true,
    initialQuery: { pageSize: 50 },
  });

  // Filter reports locally by search term
  const filteredReports = reports?.reports.filter((report) => {
    const matchesSearch =
      searchTerm === "" ||
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDevice = !selectedDevice || report.key.includes(selectedDevice);

    return matchesSearch && matchesDevice;
  }) || [];

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Calculate total size
  const totalSize = filteredReports.reduce((sum, report) => sum + report.size, 0);

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={refetch}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Search bar + Actions */}
      <div className="col-span-12 flex gap-4 items-center">
        <div className="flex-1">
          <SearchBar
            placeholder="Search filename..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={refetch}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </motion.button>
      </div>

      {/* Summary cards */}
      <div className="col-span-6">
        <SummaryCard
          title="Total Files"
          value={reports?.total || filteredReports.length}
          color="green"
        />
      </div>

      <div className="col-span-6">
        <SummaryCard
          title="Total Size"
          value={formatSize(totalSize)}
          color="red"
        />
      </div>

      {/* Reports table */}
      <div className="col-span-12 bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-4" />
            <p className="text-gray-500">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            {searchTerm || selectedDevice
              ? "No reports match your filters"
              : "No reports uploaded yet"}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-orange-500 text-white">
                <tr>
                  <th className="p-2 text-left">File</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Size</th>
                  <th className="p-2 text-left">S3 Key</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, idx) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-100"
                  >
                    <td className="p-2">{report.name}</td>
                    <td className="p-2">{report.type}</td>
                    <td className="p-2">{report.date}</td>
                    <td className="p-2">{formatSize(report.size)}</td>
                    <td className="p-2 text-xs font-mono">{report.key}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {reports && reports.hasMore && (
              <div className="p-4 border-t flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Showing {filteredReports.length} of {reports.total} reports
                </span>
                <button
                  onClick={() => updateQuery({ page: (reports.page || 1) + 1 })}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Step 6: POST Request Example

### Example: Upload Component

```typescript
import { useState } from "react";
import { uploadReport } from "../services/reportsApi";

export function UploadReportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setMessage("Please select a file");
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'ecg'); // Example metadata

      const result = await uploadReport(formData);
      setMessage(`Upload successful! Report ID: ${result.id}`);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      setMessage(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Select File</label>
        <input
          id="file-input"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border rounded-lg px-3 py-2 w-full"
        />
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || !file}
        className="bg-orange-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Report"}
      </button>
    </form>
  );
}
```

---

## CORS Configuration (Backend Required)

Your backend must allow requests from the frontend origin.

### Backend CORS setup (example for Express):

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## Authentication Flow

### Login Example:

```typescript
// src/services/authApi.ts
import { apiPost } from './apiClient';

export async function login(username: string, password: string) {
  const response = await apiPost<{ token: string; user: any }>('/auth/login', {
    username,
    password,
  });

  // Store token
  if (response.token) {
    localStorage.setItem('authToken', response.token);
  }

  return response;
}

export function logout() {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
}
```

---

## Error Handling Best Practices

1. **Network Errors**: Show user-friendly messages
2. **401 Unauthorized**: Redirect to login
3. **404 Not Found**: Show "Resource not found"
4. **500 Server Error**: Show "Server error, please try again"

### Enhanced Error Handling:

```typescript
try {
  const data = await getReports();
  // Handle success
} catch (error: any) {
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.message.includes('Network error')) {
    // Show network error message
    alert('Unable to connect to server. Please check your internet connection.');
  } else {
    // Show generic error
    alert(`Error: ${error.message}`);
  }
}
```

---

## Summary

1. **Configure Environment**: Set `VITE_API_BASE_URL` in `.env`
2. **Create API Client**: Generic `apiClient.ts` for all HTTP requests
3. **Create Service Files**: Specific services like `reportsApi.ts` for each API endpoint
4. **Create Hooks**: Custom React hooks like `useReports()` for data fetching
5. **Use in Components**: Import hooks and use them in your components
6. **Handle Errors**: Proper error handling and user feedback
7. **Configure CORS**: Backend must allow frontend origin

---

## File Structure

```
src/
├── services/
│   ├── apiClient.ts          # Generic API client
│   ├── reportsApi.ts         # Reports API service
│   ├── authApi.ts            # Auth API service
│   └── ...                   # Other API services
├── hooks/
│   ├── useReports.ts         # Reports data hook
│   ├── useAuth.ts            # Auth hook
│   └── ...                   # Other hooks
└── components/
    └── admin/
        └── reports/
            └── ReportsPage.tsx   # Component using API
```

---

## Quick Start Checklist

- [ ] Create `.env` file with `VITE_API_BASE_URL`
- [ ] Create `src/services/apiClient.ts`
- [ ] Create specific API service files
- [ ] Create custom React hooks for data fetching
- [ ] Update components to use hooks
- [ ] Configure CORS on backend
- [ ] Test API connection
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add authentication flow

This setup allows your frontend to seamlessly communicate with your separate backend project!

