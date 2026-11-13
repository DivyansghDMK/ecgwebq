import { describe, expect, it } from "vitest";
import { computeSummaryStats, countLast7Days, downloadedEmployees, pageReachesOlderThan7Days } from "../downloadStats";
import type { DownloadLogItem, DownloadSummaryItem } from "../downloadsApi";

const s = (emp_code: string, employee_name: string, is_active: boolean, downloads: number, last = "2026-11-10T05:00:00Z"): DownloadSummaryItem => ({
  emp_code,
  employee_name,
  is_active,
  downloads,
  last_downloaded_at: downloads ? last : null,
  last_version: downloads ? "1.3.10" : null,
});

const summary = [
  s("DM2", "Asha", true, 1, "2026-11-01T05:00:00Z"),
  s("DM1", "Ravi", true, 3),
  s("DM3", "Left Person", false, 2),
  s("DM4", "Neha", true, 0),
  s("DM6", "Left Never", false, 0),
  s("DM5", "Ola", true, 1, "2026-11-12T05:00:00Z"),
  s("DM7", "Tie", true, 1, "2026-11-12T05:00:00Z"),
];

const NOW = Date.parse("2026-11-13T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const row = (id: string, ageMs: number): DownloadLogItem => ({
  id,
  emp_code: "DM1",
  employee_name: "Ravi",
  channel: "beta",
  version: "1.3.10",
  device: "Windows",
  ip: "10.0.0.1",
  downloaded_at: new Date(NOW - ageMs).toISOString(),
});

describe("download stats", () => {
  it("computes total downloads and employees who downloaded", () => {
    expect(computeSummaryStats(summary)).toEqual({ totalDownloads: 8, employeesDownloaded: 5 });
    expect(computeSummaryStats([])).toEqual({ totalDownloads: 0, employeesDownloaded: 0 });
  });

  it("counts log rows within the last 7 days and detects older pages", () => {
    const rows = [row("1", DAY), row("2", 6 * DAY), row("3", 7 * DAY + 1000), row("4", 30 * DAY)];
    expect(countLast7Days(rows, NOW)).toBe(2);
    expect(pageReachesOlderThan7Days(rows, NOW)).toBe(true);
    expect(pageReachesOlderThan7Days(rows.slice(0, 2), NOW)).toBe(false);
  });

  it("lists only employees with downloads (active or left), sorted by downloads, most recent, then code", () => {
    // DM4 (active) and DM6 (left) have 0 downloads and are hidden; DM3 left but downloaded, so shown.
    expect(downloadedEmployees(summary).map((r) => r.emp_code)).toEqual(["DM1", "DM3", "DM5", "DM7", "DM2"]);
  });

  it("searches code or name among downloaded employees only", () => {
    expect(downloadedEmployees(summary, "ola").map((r) => r.emp_code)).toEqual(["DM5"]);
    expect(downloadedEmployees(summary, "dm3").map((r) => r.emp_code)).toEqual(["DM3"]);
    expect(downloadedEmployees(summary, "neha")).toEqual([]);
    expect(downloadedEmployees(summary, "left").map((r) => r.emp_code)).toEqual(["DM3"]);
  });
});
