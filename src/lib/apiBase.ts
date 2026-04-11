export function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function ensureProdStage(baseUrl: string): string {
  const normalizedBase = trimTrailingSlashes(baseUrl.trim());

  if (!normalizedBase) {
    return normalizedBase;
  }

  if (normalizedBase.startsWith("/")) {
    return normalizedBase;
  }

  try {
    const parsedUrl = new URL(normalizedBase);
    if (!parsedUrl.pathname || parsedUrl.pathname === "/") {
      parsedUrl.pathname = "/prod";
      return trimTrailingSlashes(parsedUrl.toString());
    }
  } catch {
    // If parsing fails, keep the original base and let fetch surface the issue.
  }

  return normalizedBase;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getAdminApiBase(): string {
  if (import.meta.env.DEV) {
    return "/__admin_auth";
  }

  return ensureProdStage(
    import.meta.env.VITE_ADMIN_AUTH_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/prod"
  );
}

export function getAdminProtectedApiBase(): string {
  if (import.meta.env.DEV) {
    return "/__admin_api";
  }

  return trimTrailingSlashes(
    import.meta.env.VITE_ADMIN_PROTECTED_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/prod"
  );
}

export function getDoctorApiBase(): string {
  if (import.meta.env.DEV) {
    return "/__doctor_api";
  }

  return ensureProdStage(
    import.meta.env.VITE_DOCTOR_API_BASE_URL ||
    "https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/prod"
  );
}

export function joinApiUrl(base: string, path: string): string {
  return `${trimTrailingSlashes(base)}${normalizePath(path)}`;
}
