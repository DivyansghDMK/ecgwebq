import { describe, expect, it } from "vitest";
import { CSV_BOM, escapeCsvCell, toCsv } from "../csv";

describe("CSV export escaping", () => {
  it("prefixes formula-like cells with a single quote and quotes every cell", () => {
    expect(escapeCsvCell("=HYPERLINK(\"http://x\")")).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(escapeCsvCell("+1+1")).toBe(`"'+1+1"`);
    expect(escapeCsvCell("-2")).toBe(`"'-2"`);
    expect(escapeCsvCell("@SUM(A1)")).toBe(`"'@SUM(A1)"`);
    expect(escapeCsvCell("\tcmd")).toBe(`"'\tcmd"`);
    expect(escapeCsvCell("\rcmd")).toBe(`"'\rcmd"`);
    expect(escapeCsvCell("DM485")).toBe(`"DM485"`);
    expect(escapeCsvCell(3)).toBe(`"3"`);
    expect(escapeCsvCell(null)).toBe(`""`);
    expect(escapeCsvCell("a,b\nc")).toBe(`"a,b\nc"`);
  });

  it("starts with the UTF-8 BOM and uses CRLF rows", () => {
    const csv = toCsv(["E-Code", "Name"], [["DM1", "=cmd|' /C calc'!A0"], ["DM2", "Asha Rao"]]);
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1).split("\r\n")).toEqual([`"E-Code","Name"`, `"DM1","'=cmd|' /C calc'!A0"`, `"DM2","Asha Rao"`, ""]);
  });
});
