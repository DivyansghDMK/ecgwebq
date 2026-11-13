import type { DownloadLogItem, DownloadSummaryItem } from "./downloadsApi";

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface DownloadStats {
  totalDownloads: number;
  employeesDownloaded: number;
  activeEmployees: number;
  activeNeverDownloaded: number;
}

export function computeSummaryStats(items: DownloadSummaryItem[]): DownloadStats {
  let totalDownloads = 0;
  let employeesDownloaded = 0;
  let activeEmployees = 0;
  let activeNeverDownloaded = 0;
  for (const item of items) {
    totalDownloads += item.downloads;
    if (item.downloads > 0) employeesDownloaded += 1;
    if (item.is_active) {
      activeEmployees += 1;
      if (item.downloads === 0) activeNeverDownloaded += 1;
    }
  }
  return { totalDownloads, employeesDownloaded, activeEmployees, activeNeverDownloaded };
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

export type ShowFilter = "all" | "downloaded" | "never";

/** Client-side search (code or name), Show filter, and default sort (downloads desc, then code). */
export function filterSummary(items: DownloadSummaryItem[], search: string, show: ShowFilter): DownloadSummaryItem[] {
  const needle = search.trim().toLowerCase();
  return items
    .filter((item) => {
      if (show === "downloaded" && item.downloads === 0) return false;
      if (show === "never" && item.downloads > 0) return false;
      if (!needle) return true;
      return item.emp_code.toLowerCase().includes(needle) || item.employee_name.toLowerCase().includes(needle);
    })
    .sort((a, b) => b.downloads - a.downloads || a.emp_code.localeCompare(b.emp_code));
}
