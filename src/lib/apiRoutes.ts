function normalizeRoutePath(value: string | undefined, fallback: string): string {
  const route = (value || fallback).trim();
  if (!route) {
    return fallback;
  }

  return route.startsWith("/") ? route : `/${route}`;
}

export const ADMIN_ROUTES = {
  login: normalizeRoutePath(import.meta.env.VITE_ADMIN_LOGIN_PATH, "/admin/login"),
  upload: normalizeRoutePath(import.meta.env.VITE_ADMIN_UPLOAD_PATH, "/api/upload"),
  report: normalizeRoutePath(import.meta.env.VITE_ADMIN_REPORT_PATH, "/api/report"),
  reports: normalizeRoutePath(import.meta.env.VITE_ADMIN_REPORTS_PATH, "/api/reports"),
  s3Files: "/s3-files",                    // hardcode karo - env var ignore
  s3FileContent: "/s3-file-content",       // hardcode karo - env var ignore
  createDoctor: normalizeRoutePath(import.meta.env.VITE_CREATE_DOCTOR_PATH, "/api/admin/create-doctor"),
  getDoctors: normalizeRoutePath(import.meta.env.VITE_ADMIN_GET_DOCTORS_PATH, "/api/admin/doctor"),
} as const;

export const DOCTOR_ROUTES = {
  login: normalizeRoutePath(import.meta.env.VITE_DOCTOR_LOGIN_PATH, "/admin/doctor/login"),
  reports: normalizeRoutePath(import.meta.env.VITE_DOCTOR_REPORTS_PATH, "/api/doctor/reports"),
  validateInvite: normalizeRoutePath(
    import.meta.env.VITE_DOCTOR_VALIDATE_INVITE_PATH,
    "/doctor/validate-invite"
  ),
  setPassword: normalizeRoutePath(
    import.meta.env.VITE_DOCTOR_SET_PASSWORD_PATH,
    "/doctor/set-password"
  ),
  uploadReviewed: normalizeRoutePath(import.meta.env.VITE_DOCTOR_UPLOAD_REVIEWED_PATH, "/api/doctor/upload-reviewed"),
} as const;
