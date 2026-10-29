const BYTES_PER_MB = 1024 * 1024;

/** Text for an optional value: "—" when null, undefined or blank. */
export function formatOptional(value: string | null | undefined): string {
  return value?.trim() ? value : "—";
}

/** Formats a byte count as megabytes with one decimal, e.g. 88342528 -> "84.2 MB". */
export function formatSizeMB(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "—";
  }

  const mb = bytes / BYTES_PER_MB;
  if (mb < 0.1) {
    return "< 0.1 MB";
  }

  return `${mb.toFixed(1)} MB`;
}

const IST_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * Formats an ISO timestamp in India time, e.g. "2026-10-13T08:30:00Z" -> "13 Oct 2026, 14:00 IST".
 * Always uses Asia/Kolkata so the output does not depend on the viewer's machine.
 */
export function formatDateIST(iso: string): string {
  const timestamp = Date.parse(iso);
  if (!iso || Number.isNaN(timestamp)) {
    return "Unknown date";
  }

  const parts = Object.fromEntries(
    IST_PARTS.formatToParts(new Date(timestamp)).map((part) => [part.type, part.value])
  );

  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} IST`;
}
