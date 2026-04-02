export function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getAdminApiBase(): string {
  if (import.meta.env.DEV) {
    return "/__admin_auth";
  }

  return trimTrailingSlashes(
    import.meta.env.VITE_ADMIN_AUTH_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://6jhix49qt6.execute-api.us-east-1.amazonaws.com"
  );
}

export function getAdminProtectedApiBase(): string {
  if (import.meta.env.DEV) {
    return "/__admin_api";
  }

  return trimTrailingSlashes(
    import.meta.env.VITE_ADMIN_PROTECTED_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://8m9fgt2fz1.execute-api.us-east-1.amazonaws.com"
  );
}

export function getDoctorApiBase(): string {
  if (import.meta.env.DEV) {
    return "/__doctor_api";
  }

  return trimTrailingSlashes(
    import.meta.env.VITE_DOCTOR_API_BASE_URL || "https://6jhix49qt6.execute-api.us-east-1.amazonaws.com"
  );
}

export function joinApiUrl(base: string, path: string): string {
  return `${trimTrailingSlashes(base)}${normalizePath(path)}`;
}
