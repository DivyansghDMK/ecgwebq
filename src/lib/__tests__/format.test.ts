import { describe, expect, it } from "vitest";
import { formatDateIST, formatSizeMB } from "../format";

describe("formatSizeMB", () => {
  it("formats bytes as MB with one decimal", () => {
    expect(formatSizeMB(88_000_000)).toBe("83.9 MB");
    expect(formatSizeMB(1024 * 1024)).toBe("1.0 MB");
  });

  it("handles tiny and invalid sizes", () => {
    expect(formatSizeMB(1000)).toBe("< 0.1 MB");
    expect(formatSizeMB(0)).toBe("—");
    expect(formatSizeMB(-5)).toBe("—");
    expect(formatSizeMB(Number.NaN)).toBe("—");
  });
});

describe("formatDateIST", () => {
  it("converts UTC to India time with an IST label", () => {
    expect(formatDateIST("2026-10-13T08:30:00Z")).toBe("13 Oct 2026, 14:00 IST");
  });

  it("rolls over to the next day in IST", () => {
    expect(formatDateIST("2026-03-31T20:15:00Z")).toBe("1 Apr 2026, 01:45 IST");
  });

  it("uses 00 for midnight, not 24", () => {
    expect(formatDateIST("2026-01-01T18:30:00Z")).toBe("2 Jan 2026, 00:00 IST");
  });

  it("returns a fallback for invalid input", () => {
    expect(formatDateIST("")).toBe("Unknown date");
    expect(formatDateIST("not a date")).toBe("Unknown date");
  });
});
