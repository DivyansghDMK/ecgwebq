/** UTF-8 byte order mark so Excel opens the file as UTF-8. */
export const CSV_BOM = "﻿";

/** Characters that make spreadsheet apps treat a cell as a formula. */
const FORMULA_START = /^[=+\-@\t\r]/;

/** Neutralises formula injection and quotes the cell. Every cell is quoted. */
export function escapeCsvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (FORMULA_START.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  const lines = [header, ...rows].map((row) => row.map(escapeCsvCell).join(","));
  return `${CSV_BOM}${lines.join("\r\n")}\r\n`;
}

/** Saves text as a .csv file via a temporary object URL (no navigation). */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
