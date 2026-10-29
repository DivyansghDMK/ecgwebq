/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ADMIN_AUTH_BASE_URL?: string;
  readonly VITE_ADMIN_PROTECTED_API_BASE_URL?: string;
  readonly VITE_DOCTOR_API_BASE_URL?: string;
  readonly VITE_CREATE_DOCTOR_PATH?: string;
  readonly VITE_ADMIN_LOGIN_PATH?: string;
  readonly VITE_ADMIN_UPLOAD_PATH?: string;
  readonly VITE_ADMIN_REPORT_PATH?: string;
  readonly VITE_ADMIN_REPORTS_PATH?: string;
  readonly VITE_ADMIN_S3_FILES_PATH?: string;
  readonly VITE_ADMIN_S3_FILE_CONTENT_PATH?: string;
  readonly VITE_ADMIN_GET_DOCTORS_PATH?: string;
  readonly VITE_DOCTOR_LOGIN_PATH?: string;
  readonly VITE_DOCTOR_REPORTS_PATH?: string;
  readonly VITE_DOCTOR_VALIDATE_INVITE_PATH?: string;
  readonly VITE_DOCTOR_SET_PASSWORD_PATH?: string;
  readonly VITE_DOCTOR_UPLOAD_REVIEWED_PATH?: string;
  readonly VITE_RELEASES_CDN_BASE?: string;
  readonly VITE_RELEASE_API_BASE?: string;
  readonly VITE_USE_MOCK_RELEASE_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
