import { describe, expect, it } from "vitest";
import { computeSummaryStats, countLast7Days, filterSummary, pageReachesOlderThan7Days } from "../downloadStats";
import type { DownloadLogItem, DownloadSummaryItem } from "../downloadsApi";

const s = (emp_code: string, employee_name: string, is_active: boolean, downloads: number): DownloadSummaryItem => ({
  emp_code,
  employee_name,
  is_active,
  downloads,
  last_downloaded_at: downloads ? "2026-11-10T05:00:00Z" : null,
  last_version: downloads ? "1.3.10" : null,
});

const summary = [s("DM2", "Asha", true, 1), s("DM1", "Ravi", true, 3), s("DM3", "Left Person", false, 2), s("DM4", "Neha", true, 0), s("DM5", "Ola", true, 1)];

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
  it("computes the four cards from the summary", () => {
    expect(computeSummaryStats(summary)).toEqual({
      totalDownloads: 7,
      employeesDownloaded: 4,
      activeEmployees: 4,
      activeNeverDownloaded: 1,
    });
  });

  it("counts log rows within the last 7 days and detects older pages", () => {
    const rows = [row("1", DAY), row("2", 6 * DAY), row("3", 7 * DAY + 1000), row("4", 30 * DAY)];
    expect(countLast7Days(rows, NOW)).toBe(2);
    expect(pageReachesOlderThan7Days(rows, NOW)).toBe(true);
    expect(pageReachesOlderThan7Days(rows.slice(0, 2), NOW)).toBe(false);
  });

  it("sorts by downloads desc then code, searches code or name, applies Show filter", () => {
    expect(filterSummary(summary, "", "all").map((r) => r.emp_code)).toEqual(["DM1", "DM3", "DM2", "DM5", "DM4"]);
    expect(filterSummary(summary, "neha", "all").map((r) => r.emp_code)).toEqual(["DM4"]);
    expect(filterSummary(summary, "dm3", "all").map((r) => r.emp_code)).toEqual(["DM3"]);
    expect(filterSummary(summary, "", "never").map((r) => r.emp_code)).toEqual(["DM4"]);
    expect(filterSummary(summary, "", "downloaded")).toHaveLength(4);
  });
});
