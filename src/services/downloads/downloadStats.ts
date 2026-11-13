import type { DownloadLogItem, DownloadSummaryItem } from "./downloadsApi";

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface DownloadStats {
  totalDownloads: number;
  employeesDownloaded: number;
}

export function computeSummaryStats(items: DownloadSummaryItem[]): DownloadStats {
  let totalDownloads = 0;
  let employeesDownloaded = 0;
  for (const item of items) {
    totalDownloads += item.downloads;
    if (item.downloads > 0) employeesDownloaded += 1;
  }
  return { totalDownloads, employeesDownloaded };
}

/** True when the timestamp is within the 7 days before `now` (inclusive). */
export function isWithinLast7Days(iso: string, now: number): boolean {
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= now - SEVEN_DAYS_MS && t <= now + 60_000;
}

export function countLast7Days(rows: DownloadLogItem[], now: number): number {
  return rows.filter((row) => isWithinLast7Days(row.downloaded_at, now)).length;
}

/** True once a newest-first page reaches rows older than 7 days (no need to fetch more). */
export function pageReachesOlderThan7Days(rows: DownloadLogItem[], now: number): boolean {
  return rows.some((row) => {
    const t = Date.parse(row.downloaded_at);
    return Number.isFinite(t) && t < now - SEVEN_DAYS_MS;
  });
}

const lastDownloadedMs = (item: DownloadSummaryItem): number => {
  const t = item.last_downloaded_at ? Date.parse(item.last_downloaded_at) : NaN;
  return Number.isFinite(t) ? t : -Infinity;
};

/**
 * Employees who downloaded at least once (active or left), matching the search (code or name),
 * sorted by downloads desc, then most recent download, then code.
 */
export function downloadedEmployees(items: DownloadSummaryItem[], search = ""): DownloadSummaryItem[] {
  const needle = search.trim().toLowerCase();
  return items
    .filter(
      (item) =>
        item.downloads > 0 &&
        (!needle || item.emp_code.toLowerCase().includes(needle) || item.employee_name.toLowerCase().includes(needle))
    )
    .sort(
      (a, b) =>
        b.downloads - a.downloads ||
        lastDownloadedMs(b) - lastDownloadedMs(a) ||
        a.emp_code.localeCompare(b.emp_code)
    );
}
