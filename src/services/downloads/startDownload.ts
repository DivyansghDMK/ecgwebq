import { getReleasesCdnBase, isTrustedDownloadUrl } from "@/services/releases/latestJson";

/**
 * Starts the installer download without navigating the page away: a temporary
 * <a href rel="noopener noreferrer"> is created, clicked and removed.
 *
 * The URL must already have passed latestJson validation (https + CDN host + sha256 + size);
 * the host check is repeated here as defence in depth. Returns false if it is not trusted.
 */
export function startInstallerDownload(downloadUrl: string): boolean {
  if (!isTrustedDownloadUrl(downloadUrl, getReleasesCdnBase())) {
    return false;
  }
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.rel = "noopener noreferrer";
  link.style.display = "none";
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
  }
  return true;
}
