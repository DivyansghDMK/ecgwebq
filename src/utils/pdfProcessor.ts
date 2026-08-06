import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import { fetchS3FileContent } from "@/api/ecgApi";
import { ECGRecord } from "@/api/types/ecg";
import * as pdfjsLib from "pdfjs-dist";

// Set up pdf.js worker. cdnjs's "pdf.js" mirror doesn't carry every pdfjs-dist release
// (verified: it 404s for the version currently installed here), which was silently
// degrading every text-extraction call below (RR/QTcF/RV5 parsing, and the "Doctor
// Sign:" position lookup) to their no-worker-available fallback. jsdelivr mirrors the
// exact npm-published build, including the ESM worker file this version ships.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

function base64ToUint8Array(base64Data: string): Uint8Array {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Strips a leading "{deviceId}-" from a report/record ID for display, since IDs
// are formatted as deviceId-timestamp and the device code isn't meaningful to the reader.
function stripDeviceIdPrefix(reportId: string, deviceId?: string | null): string {
  if (!deviceId) return reportId;
  const prefix = `${deviceId}-`;
  return reportId.startsWith(prefix) ? reportId.slice(prefix.length) : reportId;
}

// Derives the display Report ID from the original (pre-review) file name, e.g.
// "ECG_Report_12_1_DM ECG V1.0 A997_20260803_162640_reviewed.pdf" -> "A997_20260803_162640".
// The trailing "_{date}_{time}" tokens are kept as-is, and the device code is taken as the
// last whitespace-separated word before them — generic to the naming template rather than
// hardcoded to any one device string.
function extractReportIdFromFileName(fileName: string): string | null {
  let base = fileName.trim().replace(/\.pdf$/i, "").replace(/_reviewed$/i, "");
  base = base.replace(/^ECG_Report_/i, "");
  if (!base) return null;

  const tokens = base.split("_");
  if (tokens.length < 2) return base;

  const time = tokens[tokens.length - 1];
  const date = tokens[tokens.length - 2];
  if (!/^\d{8}$/.test(date) || !/^\d{6}$/.test(time)) {
    // Doesn't match the expected "..._{date}_{time}" shape — return the stripped
    // base rather than guessing further at a naming pattern we don't recognize.
    return base;
  }

  const prefixWords = tokens.slice(0, -2).join("_").trim().split(/\s+/).filter(Boolean);
  const code = prefixWords[prefixWords.length - 1];
  return code ? `${code}_${date}_${time}` : `${date}_${time}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Extracts "Label: value" text from a device report's page-1 text content. The value
// stops at the next KNOWN field label (not at incidental whitespace) — different PDF
// exports vary in whether fields are joined by one space or several, so anchoring on
// "the next recognized label" is the only boundary that holds across devices/exports.
function extractLabeledText(fullText: string, label: string, otherLabels: string[]): string | null {
  const stopPattern = otherLabels.map(escapeRegExp).join("|");
  const re = new RegExp(`${escapeRegExp(label)}:\\s*(.+?)(?:\\s*(?:${stopPattern})\\s*:|$)`, "i");
  const match = fullText.match(re);
  const value = match ? match[1].trim() : "";
  return value ? value : null;
}

function extractLabeledNumber(fullText: string, label: string, unit: string): string | null {
  const match = fullText.match(new RegExp(`\\b${label}:\\s*([\\d.]+)\\s*${unit}`));
  return match ? match[1] : null;
}

// Extracts the first numbered line under page 1's "CONCLUSION" heading (e.g. "1. Normal
// Sinus Rhythm" -> "Normal Sinus Rhythm"). The Classification card renders a single line
// with no wrapping, so only the primary conclusion is used — matching what's shown today
// for any other single-line classification value.
function extractConclusionText(items: Array<{ str?: unknown }>): string | null {
  const conclusionIndex = items.findIndex(
    (item) => typeof item.str === "string" && item.str.trim().toUpperCase() === "CONCLUSION"
  );
  if (conclusionIndex === -1) return null;

  for (let i = conclusionIndex + 1; i < items.length; i++) {
    const str = items[i]?.str;
    if (typeof str !== "string") continue;
    const trimmed = str.trim();
    if (!trimmed) continue; // skip blank spacer runs between lines
    const numberedMatch = trimmed.match(/^\d+\.\s*(.+)/);
    return numberedMatch ? numberedMatch[1].trim() : null;
  }

  return null;
}

// Truncates text with an ellipsis so it fits maxWidth, rather than letting it overflow.
function truncateToWidth(text: string, maxWidth: number, targetFont: PDFFont, fontSize: number): string {
  if (targetFont.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;

  const ellipsis = "...";
  let low = 0;
  let high = text.length;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidate = text.slice(0, mid).trimEnd() + ellipsis;
    if (targetFont.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low === 0 ? ellipsis : text.slice(0, low).trimEnd() + ellipsis;
}

// Mattes a near-white background out to transparent so the signature doesn't paint
// a white box over the ECG grid lines/report content behind it.
async function matteWhiteBackground(pngBytes: Uint8Array): Promise<Uint8Array> {
  const blob = new Blob([pngBytes as unknown as BlobPart], { type: "image/png" });
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return pngBytes;

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const WHITE_THRESHOLD = 245;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] >= WHITE_THRESHOLD && data[i + 1] >= WHITE_THRESHOLD && data[i + 2] >= WHITE_THRESHOLD) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const outBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!outBlob) return pngBytes;

  return new Uint8Array(await outBlob.arrayBuffer());
}

/**
 * Creates a reviewed PDF by loading the original from URL and adding
 * a new page with doctor comments, signature, and review information.
 * The original ECG report remains unchanged on Page 1.
 * The healthcare professional review appears on a new Page 2.
 *
 * All processing happens in the browser.
 */
export async function createReviewedPdf(
  originalPdfUrl: string,
  options: {
    comments: string;
    doctorId: string;
    doctorName: string;
    licenseNumber?: string | null; // Doctor's license number
    specialization?: string | null; // Doctor's specialization
    signatureFile?: File | null;
    signatureDataUrl?: string | null; // Canvas data URL from drawing
    ecgData?: ECGRecord | null; // ECG data to add to page 1
    signatureUrl?: string | null; // Persisted signature URL, used only if no fresh file/drawing was provided
    hospitalName?: string | null; // Hospital name for header
    isReviewed?: boolean; // Whether report is reviewed for badge
    originalFileName?: string | null; // Original (pre-review) file name, used to derive the display Report ID
  }
): Promise<Blob> {
  const { comments, doctorId, doctorName, licenseNumber, specialization, signatureFile, signatureDataUrl, ecgData, signatureUrl, hospitalName, isReviewed = true, originalFileName } = options;

  // Debug logging for Bug 1 - patient data investigation
  console.log("PDF Generator - Raw ecgData received:", JSON.stringify(ecgData, null, 2));
  console.log("PDF Generator - patient fields:", {
    patientName: ecgData?.patient?.name,
    patientAge: ecgData?.patient?.age,
    patientGender: ecgData?.patient?.gender,
    recordId: ecgData?.recordId,
  });
  console.log("PDF Generator - metrics fields:", {
    observation: ecgData?.metrics?.observation,
    natureOfEcg: ecgData?.metrics?.natureOfEcg,
    classification: ecgData?.metrics?.classification,
  });

  // Fetch original PDF
  // Try to use our proxy first to avoid CORS issues
  let originalArrayBuffer: ArrayBuffer;

  try {
    // Extract key from URL
    // Format: https://bucket.s3.../key
    const urlObj = new URL(originalPdfUrl);
    const key = decodeURIComponent(urlObj.pathname.substring(1)); // Remove leading /

    // Fetch via proxy (returns base64 for PDFs)
    const base64Data = await fetchS3FileContent<string>(key);

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    originalArrayBuffer = bytes.buffer;

  } catch (proxyError) {
    console.warn("Proxy fetch failed, falling back to direct fetch:", proxyError);
    // Fallback to direct fetch
    const res = await fetch(originalPdfUrl);
    if (!res.ok) {
      throw new Error("Failed to download original PDF");
    }
    originalArrayBuffer = await res.arrayBuffer();
  }

  const pdfDoc = await PDFDocument.load(originalArrayBuffer);

  // Get the first page to use as a reference for page size
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // ==================== EXTRACT PATIENT/PARAMETER DATA FROM PAGE 1 ====================
  // Page 1 is the device's own printout, so it always carries the real patient and
  // measurement values for THIS report — sourcing page 2 from it (rather than the
  // separate JSON metadata, which has been missing/blank in practice) guarantees page 2
  // shows data for the same PDF currently being viewed.
  let page1Fields: {
    patientName?: string | null;
    patientAge?: string | null;
    patientGender?: string | null;
    heartRate?: string | null;
    prInterval?: string | null;
    qrsDuration?: string | null;
    qtInterval?: string | null;
    qtcInterval?: string | null;
    rrInterval?: string | null;
    ecgType?: string | null;
    conclusionText?: string | null;
  } = {};

  // Measured position of the literal "Doctor Sign:" text on page 1, in PDF user-space
  // coordinates (matches pdf-lib's coordinate system, so no flip is needed). We locate
  // this by content rather than assuming a fixed x/y, since the label's position is a
  // property of the device's template, not something safe to hardcode/eyeball.
  let doctorSignTextEnd: { x: number; y: number; fontSize: number } | null = null;
  // Measured baseline y of "Doctor Name:" (the row above), used only to cap the
  // signature's height so it can never reach into that row — independent of whatever
  // the doctor's actual name text is or how long/wrapped it is.
  let doctorNameTextY: number | null = null;

  try {
    const loadingTask = pdfjsLib.getDocument({ data: originalArrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    // Combine all text items into a single string
    const fullText = items.map((item) => item.str).join(" ");

    // Every label that can appear on this header line — used so each field's value
    // extraction stops at the NEXT known label, regardless of how the source PDF spaces
    // fields apart. Order doesn't matter here: it's only used as a set of stop boundaries.
    const PAGE1_LABELS = ["Name", "Age", "Gender", "ECG Type", "Date & Time", "HR", "RR", "PR", "QRS", "QTcF", "QTc", "QT"];
    const otherLabelsFor = (label: string) => PAGE1_LABELS.filter((l) => l !== label);

    // Format examples: "Name: John Doe", "Age: 45", "Gender: Male", "HR: 72 bpm", "RR: 833 ms"
    page1Fields = {
      patientName: extractLabeledText(fullText, "Name", otherLabelsFor("Name")),
      patientAge: extractLabeledText(fullText, "Age", otherLabelsFor("Age")),
      patientGender: extractLabeledText(fullText, "Gender", otherLabelsFor("Gender")),
      heartRate: extractLabeledNumber(fullText, "HR", "bpm"),
      prInterval: extractLabeledNumber(fullText, "PR", "ms"),
      qrsDuration: extractLabeledNumber(fullText, "QRS", "ms"),
      qtInterval: extractLabeledNumber(fullText, "QT", "ms"),
      qtcInterval: extractLabeledNumber(fullText, "QTc", "ms"),
      rrInterval: extractLabeledNumber(fullText, "RR", "ms"),
      ecgType: extractLabeledText(fullText, "ECG Type", otherLabelsFor("ECG Type")),
      conclusionText: extractConclusionText(items),
    };

    // Find the "Doctor Sign:" label. Prefer an exact single-item match (the common case
    // for device-generated templates); fall back to a substring match on one item.
    const signItem =
      items.find((item) => typeof item.str === "string" && item.str.trim().toLowerCase() === "doctor sign:") ||
      items.find((item) => typeof item.str === "string" && item.str.toLowerCase().includes("doctor sign"));

    if (signItem && Array.isArray(signItem.transform)) {
      const [, , , d, e, f] = signItem.transform;
      const textWidth = typeof signItem.width === "number" ? signItem.width : 0;
      // transform's e/f is already in PDF user space (bottom-left origin), same as pdf-lib.
      // transform's d component is this text run's font size (for upright, non-rotated text).
      const fontSize = Math.abs(d) || 8;
      doctorSignTextEnd = { x: e + textWidth, y: f, fontSize };
    } else {
      console.warn('Could not locate "Doctor Sign:" text on page 1 — falling back to an approximate position for the signature.');
    }

    // Find "Doctor Name:" purely to measure the gap to the row above — the name value
    // itself (and however long/wrapped it is) is never read or used for positioning.
    const nameItem =
      items.find((item) => typeof item.str === "string" && item.str.trim().toLowerCase() === "doctor name:") ||
      items.find((item) => typeof item.str === "string" && item.str.toLowerCase().includes("doctor name"));

    if (nameItem && Array.isArray(nameItem.transform)) {
      doctorNameTextY = nameItem.transform[5];
    }

    await pdf.destroy();
  } catch (extractError) {
    console.warn("Failed to extract text from PDF:", extractError);
    // Continue with empty extracted params - will fall back to "-"
  }

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // ==================== ADD CONTENT TO PAGE 1 ====================
  if (ecgData) {
    const pageMargin = 50;
    const cardWidth = 220;
    const cardX = width - pageMargin - cardWidth;
    let cardY = height - 200;

    // Color constants for page 1
    const page1NavyColor = rgb(0.105, 0.227, 0.36);
    const page1LightBgColor = rgb(0.956, 0.964, 0.972);
    const page1BorderColor = rgb(0.847, 0.871, 0.89);
    const page1TextColor = rgb(0.12, 0.16, 0.2);

    // Add CONCLUSION section if available
    if (ecgData.metrics.conclusions && ecgData.metrics.conclusions.length > 0) {
      const conclusionBoxHeight = 30 + (ecgData.metrics.conclusions.length * 14);

      firstPage.drawRectangle({
        x: cardX,
        y: cardY - conclusionBoxHeight,
        width: cardWidth,
        height: conclusionBoxHeight,
        color: rgb(1, 1, 1),
        borderColor: page1BorderColor,
        borderWidth: 1,
      });

      firstPage.drawText("CONCLUSION", {
        x: cardX + 10,
        y: cardY - 15,
        size: 11,
        font: boldFont,
        color: page1NavyColor,
      });

      let currentY = cardY - 35;
      ecgData.metrics.conclusions.forEach((conclusion: string, index: number) => {
        firstPage.drawText(`${index + 1}. ${conclusion}`, {
          x: cardX + 10,
          y: currentY,
          size: 10,
          font,
          color: page1TextColor,
        });
        currentY -= 14;
      });

      cardY -= conclusionBoxHeight + 20;
    }

    // Add ABNORMALITIES section if available
    if (ecgData.metrics.abnormalities && ecgData.metrics.abnormalities.length > 0) {
      const abnormalityBoxHeight = 30 + (ecgData.metrics.abnormalities.length * 14);

      firstPage.drawRectangle({
        x: cardX,
        y: cardY - abnormalityBoxHeight,
        width: cardWidth,
        height: abnormalityBoxHeight,
        color: page1LightBgColor,
        borderColor: page1BorderColor,
        borderWidth: 1,
      });

      firstPage.drawText("ABNORMALITIES", {
        x: cardX + 10,
        y: cardY - 15,
        size: 11,
        font: boldFont,
        color: page1NavyColor,
      });

      let currentY = cardY - 35;
      ecgData.metrics.abnormalities.forEach((abnormality: string, index: number) => {
        firstPage.drawText(`${index + 1}. ${abnormality}`, {
          x: cardX + 10,
          y: currentY,
          size: 10,
          font,
          color: page1TextColor,
        });
        currentY -= 14;
      });

      cardY -= abnormalityBoxHeight + 20;
    }

    // Add RECOMMENDATIONS section if available
    if (ecgData.metrics.recommendations && ecgData.metrics.recommendations.length > 0) {
      const recommendationBoxHeight = 30 + (ecgData.metrics.recommendations.length * 14);

      firstPage.drawRectangle({
        x: cardX,
        y: cardY - recommendationBoxHeight,
        width: cardWidth,
        height: recommendationBoxHeight,
        color: rgb(1, 1, 1),
        borderColor: page1BorderColor,
        borderWidth: 1,
      });

      firstPage.drawText("RECOMMENDATIONS", {
        x: cardX + 10,
        y: cardY - 15,
        size: 11,
        font: boldFont,
        color: page1NavyColor,
      });

      let currentY = cardY - 35;
      ecgData.metrics.recommendations.forEach((recommendation: string, index: number) => {
        firstPage.drawText(`${index + 1}. ${recommendation}`, {
          x: cardX + 10,
          y: currentY,
          size: 10,
          font,
          color: page1TextColor,
        });
        currentY -= 14;
      });
    }
  }

  // ==================== RESOLVE SIGNATURE (shared: page 1 label + page 2 physician block) ====================
  // Same signature is used in both places, so it's fetched/matted/embedded exactly once.
  let embeddedSignature: { image: Awaited<ReturnType<typeof pdfDoc.embedPng>> } | null = null;

  try {
    let rawSignatureBytes: Uint8Array | null = null;

    if (signatureDataUrl) {
      rawSignatureBytes = base64ToUint8Array(signatureDataUrl.split(",")[1]);
    } else if (signatureFile) {
      rawSignatureBytes = new Uint8Array(await signatureFile.arrayBuffer());
    } else if (signatureUrl) {
      try {
        const urlObj = new URL(signatureUrl);
        const key = decodeURIComponent(urlObj.pathname.substring(1));
        const base64Data = await fetchS3FileContent<string>(key);
        rawSignatureBytes = base64ToUint8Array(base64Data);
      } catch (proxyError) {
        console.warn("Proxy fetch failed for signature, falling back to direct fetch:", proxyError);
        const res = await fetch(signatureUrl);
        if (!res.ok) throw new Error("Failed to download signature image");
        rawSignatureBytes = new Uint8Array(await res.arrayBuffer());
      }
    }

    if (rawSignatureBytes) {
      const matted = await matteWhiteBackground(rawSignatureBytes);
      embeddedSignature = { image: await pdfDoc.embedPng(matted) };
    }
  } catch (sigError) {
    console.warn("Failed to process signature image:", sigError);
  }

  // ==================== ADD SIGNATURE TO PAGE 1 ====================
  // Render signature next to "Doctor Sign:" text on the original waveform page.
  // This is the one dynamic element on an otherwise-static device printout, so it must
  // render whenever a signature is available, even if text measurement above failed.
  if (embeddedSignature) {
    const { image: signatureImage } = embeddedSignature;

    // This device template packs "Doctor Name:" / "Doctor Sign:" only ~17pt apart
    // (measured), so sizing the signature off the spec's 300dpi/2481px reference
    // ratio (which implies ~90pt+ here) would overlap the line above. Size it relative
    // to the label's own measured font size instead, then — independently — cap it to
    // the actual measured gap to the "Doctor Name:" row, so the two rows can never
    // visually collide regardless of the device template's real line spacing. Nothing
    // here depends on the doctor's name value or its length — only on where the two
    // static labels themselves measure to.
    const labelFontSize = doctorSignTextEnd?.fontSize ?? 8;
    let signatureHeight = labelFontSize * 2.2;

    if (doctorSignTextEnd && doctorNameTextY !== null) {
      const gapToNameRow = doctorNameTextY - doctorSignTextEnd.y;
      if (gapToNameRow > 0) {
        signatureHeight = Math.min(signatureHeight, gapToNameRow * 0.8);
      }
    }

    const signatureWidth = (signatureImage.width / signatureImage.height) * signatureHeight;
    const horizontalGap = width * (37 / 2481);

    // X is anchored strictly to the end of the "Doctor Sign:" label — fixed regardless
    // of anything on the row above.
    const signatureX = doctorSignTextEnd ? doctorSignTextEnd.x + horizontalGap : 90;

    // Vertically center the signature on the label's own visual (cap-height) box rather
    // than just nudging down from its baseline.
    const labelVisualCenterY = doctorSignTextEnd ? doctorSignTextEnd.y + labelFontSize * 0.35 : 40;
    const signatureY = doctorSignTextEnd ? labelVisualCenterY - signatureHeight / 2 : 40;

    firstPage.drawImage(signatureImage, {
      x: signatureX,
      y: signatureY,
      width: signatureWidth,
      height: signatureHeight,
    });
  }

  // Create a new page for the healthcare professional review
  const reviewPage = pdfDoc.addPage([width, height]);

  // Color palette — matches the approved Canvas/Kotlin reference design
  const textPrimaryColor = rgb(0.067, 0.067, 0.067); // #111111
  const textSecondaryColor = rgb(0.533, 0.533, 0.533); // #888888
  const textMutedColor = rgb(0.667, 0.667, 0.667); // #AAAAAA
  const borderColor = rgb(0.878, 0.878, 0.878); // #E0E0E0
  const chipBgColor = rgb(0.961, 0.961, 0.961); // #F5F5F5
  const chipTextColor = rgb(0.2, 0.2, 0.2); // #333333
  const commentsTextColor = rgb(0.267, 0.267, 0.267); // #444444
  const greenBadgeColor = rgb(0.18, 0.49, 0.322); // #2E7D52 (also used for "normal" status)
  const greenBgColor = rgb(0.91, 0.961, 0.933); // #E8F5EE
  const blueAccentColor = rgb(0.102, 0.373, 0.659); // #1A5FA8 (classification accent)
  const statusWarnColor = rgb(0.961, 0.651, 0.137); // #F5A623
  const whiteColor = rgb(1, 1, 1);

  // The reference design was built for a 595x842pt (A4) canvas — this page already
  // is that size, but scale defensively in case a differently-sized source PDF is used.
  const layoutScale = Math.min(width / 595, height / 842);
  const px = (n: number) => n * layoutScale;
  const pt = px;

  // Cursor measured as distance from the TOP of the page (matches the reference
  // design's coordinate model), converted to pdf-lib's bottom-up space on draw.
  let y = 0;
  const toY = (fromTop: number) => height - fromTop;

  const roundedRectPath = (w: number, h: number, r: number): string => {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    return `M ${radius} 0 H ${w - radius} A ${radius} ${radius} 0 0 1 ${w} ${radius} V ${h - radius} A ${radius} ${radius} 0 0 1 ${w - radius} ${h} H ${radius} A ${radius} ${radius} 0 0 1 0 ${h - radius} V ${radius} A ${radius} ${radius} 0 0 1 ${radius} 0 Z`;
  };

  // Draws a rounded rect whose top-left corner is at (left, topFromTop).
  const drawRoundedRect = (
    left: number,
    topFromTop: number,
    w: number,
    h: number,
    radius: number,
    fill?: ReturnType<typeof rgb>,
    stroke?: ReturnType<typeof rgb>,
    strokeWidth = 1
  ) => {
    reviewPage.drawSvgPath(roundedRectPath(w, h, radius), {
      x: left,
      y: toY(topFromTop),
      ...(fill ? { color: fill } : {}),
      ...(stroke ? { borderColor: stroke, borderWidth: strokeWidth } : {}),
    });
  };

  const drawTextFromTop = (
    text: string,
    x: number,
    baselineFromTop: number,
    size: number,
    useFont: PDFFont,
    color: ReturnType<typeof rgb>
  ) => {
    reviewPage.drawText(text, { x, y: toY(baselineFromTop), size, font: useFont, color });
  };

  type ObservationRow = {
    name?: string;
    value?: string | number | null;
    range?: string;
  };

  const metrics = ecgData?.metrics;
  const intervals = metrics?.intervals;
  const rawMetrics = (metrics ?? {}) as Record<string, unknown>;
  const observationRows = Array.isArray(rawMetrics.observation)
    ? (rawMetrics.observation as ObservationRow[])
    : [];

  const normalizeObservationKey = (value: string): string =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "");

  const findObservationValue = (...aliases: string[]): string | null => {
    if (!observationRows.length) return null;

    const normalizedAliases = aliases.map(normalizeObservationKey);

    for (const row of observationRows) {
      const name = normalizeObservationKey(String(row?.name ?? ""));
      const value = row?.value;

      if (!name || value === undefined || value === null || String(value).trim() === "") {
        continue;
      }

      if (normalizedAliases.some((alias) => name === alias || name.includes(alias) || alias.includes(name))) {
        return String(value).trim();
      }
    }

    return null;
  };

  const formatMetricValue = (value: number | undefined, unit: string): string | null => {
    if (value === undefined || value === null || Number.isNaN(value)) return null;
    return `${value} ${unit}`;
  };

  const wrapText = (text: string, maxWidth: number, targetFont: typeof font, fontSize: number): string[] => {
    const paragraphs = text.split(/\r?\n/);
    const lines: string[] = [];

    paragraphs.forEach((paragraph) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);

      if (!words.length) {
        lines.push("");
        return;
      }

      let currentLine = words[0];

      for (let i = 1; i < words.length; i += 1) {
        const candidate = `${currentLine} ${words[i]}`;
        if (targetFont.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
          currentLine = candidate;
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }

      lines.push(currentLine);
    });

    return lines;
  };

  // ==================== OUTER CARD ====================
  const outerMargin = px(16);
  const cardL = outerMargin;
  const cardR = width - outerMargin;
  const cardTopFromTop = outerMargin;
  const cardBottomFromTop = height - outerMargin;
  drawRoundedRect(cardL, cardTopFromTop, cardR - cardL, cardBottomFromTop - cardTopFromTop, px(8), whiteColor, borderColor, px(1));

  const pad = px(16);
  const left = cardL + pad;
  const right = cardR - pad;
  y = cardTopFromTop + pad;

  // ==================== HEADER ====================
  drawTextFromTop("Healthcare Professional Review", left, y + pt(20), pt(20), boldFont, textPrimaryColor);

  // Status badge (conditional - only show if reviewed)
  if (isReviewed) {
    const badgePadH = px(10);
    const badgePadV = px(4);
    const badgeFontSize = pt(8);
    const badgeText = "REVIEWED";
    const badgeTextWidth = boldFont.widthOfTextAtSize(badgeText, badgeFontSize);
    const badgeW = badgeTextWidth + badgePadH * 2;
    const badgeH = pt(8) + badgePadV * 2 + px(2);
    const badgeL = right - badgeW;
    const badgeT = y;

    drawRoundedRect(badgeL, badgeT, badgeW, badgeH, px(4), greenBgColor, greenBadgeColor, px(1.5));
    drawTextFromTop(badgeText, badgeL + badgePadH, badgeT + badgePadV + pt(8), badgeFontSize, boldFont, greenBadgeColor);
  }

  y += pt(20) + px(4);

  // Subtitle (hospital name from data), truncated so a long name can't overflow the card
  const hospitalSubtitle = truncateToWidth(hospitalName || "Hospital Name", right - left, font, pt(9));
  drawTextFromTop(hospitalSubtitle, left, y + pt(9), pt(9), font, textSecondaryColor);

  y += pt(9) + px(10);

  // ==================== PATIENT/REPORT CHIP ROW ====================
  // Prefer the values printed on page 1 of THIS PDF — it's always populated for a given
  // report, whereas the separate JSON metadata has been missing/blank in practice. Fall
  // back to the JSON metadata only if page-1 extraction didn't find a field.
  const patientName = page1Fields.patientName || ecgData?.patient?.name || ecgData?.patient?.patient_name || "Patient";
  const patientAge = page1Fields.patientAge || ecgData?.patient?.age || ecgData?.patient?.patient_age || "--";
  const patientGender = page1Fields.patientGender || ecgData?.patient?.gender || ecgData?.patient?.patient_gender || "--";

  const reportId = originalFileName
    ? extractReportIdFromFileName(originalFileName) || "--"
    : stripDeviceIdPrefix(String(ecgData?.recordId || ecgData?.report_id || ecgData?.id || "--"), ecgData?.deviceId);

  const chips = [
    { label: "Patient", value: patientName },
    { label: "Age", value: `${patientAge}` },
    { label: "Gender", value: patientGender },
    { label: "Report ID", value: reportId },
  ];

  const chipFontSize = pt(8);
  const chipH = pt(8) + px(8) + px(2);
  const chipPadH = px(10);
  const chipPadV = px(4);
  const chipRadius = chipH / 2;
  const CHIP_VALUE_MAX_WIDTH = px(140); // long values (e.g. patient name) truncate rather than pushing later chips off-page

  let chipX = left;
  chips.forEach((chip) => {
    const truncatedValue = truncateToWidth(String(chip.value), CHIP_VALUE_MAX_WIDTH, font, chipFontSize);
    const chipText = `${chip.label}: ${truncatedValue}`;
    const chipTextWidth = font.widthOfTextAtSize(chipText, chipFontSize);
    const chipW = chipTextWidth + chipPadH * 2;

    drawRoundedRect(chipX, y, chipW, chipH, chipRadius, chipBgColor, borderColor, px(1));
    drawTextFromTop(chipText, chipX + chipPadH, y + chipPadV + pt(8), chipFontSize, font, chipTextColor);

    chipX += chipW + px(6);
  });

  y += chipH + px(14);

  // ==================== ECG PARAMETER MEASUREMENT - TILE GRID ====================
  drawTextFromTop("ECG Parameter Measurement", left, y + pt(12), pt(12), boldFont, textPrimaryColor);
  y += pt(12) + px(8);

  // Map parameters to tile-friendly format; only render tiles with a real measured value.
  // Values are read from page 1 of this same PDF (the device's own printout) first, since
  // that's always populated for a given report; the JSON observation array is a fallback.
  const parameterTiles = [
    { key: "heartRate", label: "Heart rate", value: page1Fields.heartRate || findObservationValue("heartRate", "heart rate"), unit: "bpm", ref: "60-100 bpm" },
    { key: "prInterval", label: "PR interval", value: page1Fields.prInterval || findObservationValue("prInterval", "pr interval"), unit: "ms", ref: "100-200 ms" },
    { key: "qrsDuration", label: "QRS duration", value: page1Fields.qrsDuration || findObservationValue("qrsDuration", "qrs duration"), unit: "ms", ref: "60-120 ms" },
    { key: "qtInterval", label: "QT interval", value: page1Fields.qtInterval || findObservationValue("qtInterval", "qt interval"), unit: "ms", ref: "300-450 ms" },
    { key: "qtcInterval", label: "QTc interval", value: page1Fields.qtcInterval || findObservationValue("qtcInterval", "qtc interval"), unit: "ms", ref: "300-450 ms" },
    { key: "rrInterval", label: "RR interval", value: page1Fields.rrInterval || findObservationValue("rrInterval", "rr interval"), unit: "ms", ref: "600-1200 ms" },
  ].filter((tile) => tile.value !== null);

  const gridCols = 3;
  const gridGutter = px(6);
  const gridTotalW = right - left;
  const colW = (gridTotalW - gridGutter * (gridCols - 1)) / gridCols;
  const tileCardH = pt(20) + pt(9) + pt(7) + px(24);

  // Render row-by-row so the running cursor (y) advances exactly once per row.
  for (let row = 0; row < Math.ceil(parameterTiles.length / gridCols); row++) {
    if (row > 0) y += gridGutter;

    for (let col = 0; col < gridCols; col++) {
      const index = row * gridCols + col;
      if (index >= parameterTiles.length) break;
      const tile = parameterTiles[index];

      const tileL = left + col * (colW + gridGutter);

      drawRoundedRect(tileL, y, colW, tileCardH, px(6), whiteColor, borderColor, px(1));

      let ty = y + px(8);
      drawTextFromTop(tile.label, tileL + px(10), ty + pt(8), pt(8), font, textSecondaryColor);
      ty += pt(8) + px(3);

      // Value font is intentionally smaller than the row height it's budgeted within
      // (pt(18)) — keeps the tile's size/layout unchanged while the digits render smaller.
      const valueText = `${tile.value} ${tile.unit}`;
      drawTextFromTop(valueText, tileL + px(10), ty + pt(18), pt(14), boldFont, textPrimaryColor);
      ty += pt(18) + px(2);

      drawTextFromTop(`Ref: ${tile.ref}`, tileL + px(10), ty + pt(7), pt(7), font, textMutedColor);
    }

    y += tileCardH;
  }

  y += px(14);

  // ==================== INTERPRETATION REPORT ====================
  drawTextFromTop("Interpretation Report", left, y + pt(12), pt(12), boldFont, textPrimaryColor);
  y += pt(12) + px(8);

  // Get interpretation data. Nature of ECG and Classification prefer page 1 of this same
  // PDF (the "ECG Type:" field and the numbered "CONCLUSION" lines respectively), falling
  // back to the JSON metadata. Missing fields render "NA" rather than a fabricated
  // clinical default — showing "Normal ECG"/"Normal sinus rhythm." when neither source
  // actually has data would misrepresent the report.
  const natureOfEcg = page1Fields.ecgType || ecgData?.metrics?.natureOfEcg || "NA";
  const natureStatus = ecgData?.metrics?.natureStatus || null;
  const symptoms = ecgData?.metrics?.symptoms || null;
  const classification = page1Fields.conclusionText || ecgData?.metrics?.classification || "NA";
  const suggestedActions = ecgData?.metrics?.suggestedActions || null;
  const clinicalComments = comments || "NA";

  const natureAccentColor =
    natureStatus === "normal" ? greenBadgeColor :
    natureStatus === "abnormal" ? statusWarnColor :
    textMutedColor; // neutral when status is unknown — don't imply "normal" for missing data

  const interpGutter = px(6);
  const interpHalfW = (right - left - interpGutter) / 2;
  const interpRowH = pt(10) + pt(8) + px(22);
  const rightColLeft = left + interpHalfW + interpGutter;

  const drawInterpCard = (
    cardLeft: number,
    cardTop: number,
    cardW: number,
    cardH: number,
    label: string,
    value: string,
    bold: boolean,
    accentColor: ReturnType<typeof rgb> | null
  ) => {
    drawRoundedRect(cardLeft, cardTop, cardW, cardH, px(6), whiteColor, borderColor, px(1));

    const accW = px(3);
    if (accentColor) {
      drawRoundedRect(cardLeft, cardTop + px(1), accW, cardH - px(2), px(3), accentColor);
    }

    const startX = cardLeft + (accentColor ? accW + px(11) : px(11));
    const padV = px(9);
    drawTextFromTop(label.toUpperCase(), startX, cardTop + padV + pt(8), pt(8), boldFont, textSecondaryColor);
    drawTextFromTop(value, startX, cardTop + padV + pt(8) + px(4) + pt(10), pt(10), bold ? boldFont : font, textPrimaryColor);
  };

  // Row 1: Nature of ECG (left) and Symptoms (right)
  const row1Y = y;
  drawInterpCard(left, row1Y, interpHalfW, interpRowH, "Nature of ECG", natureOfEcg, true, natureAccentColor);
  drawInterpCard(rightColLeft, row1Y, interpHalfW, interpRowH, "Symptoms", symptoms || "NA", false, null);
  y = row1Y + interpRowH + interpGutter;

  // Row 2: Classification (left) and Suggested actions (right)
  const row2Y = y;
  drawInterpCard(left, row2Y, interpHalfW, interpRowH, "Classification", classification, false, blueAccentColor);
  drawInterpCard(rightColLeft, row2Y, interpHalfW, interpRowH, "Suggested actions", suggestedActions || "NA", false, null);
  y = row2Y + interpRowH + interpGutter;

  // Row 3: Clinical comments (left) and physician/doctor card (right)
  const row3Y = y;
  const kotlinRow3H = pt(10) * 4 + px(36);

  // -- Clinical comments layout (computed before drawing so we know the required height) --
  const commentsPadH = px(11);
  const commentsPadV = px(9);
  const commentsFontSize = pt(10);
  const commentsLineSpacing = commentsFontSize * 1.3;
  const commentsLines = wrapText(clinicalComments, interpHalfW - commentsPadH * 2, font, commentsFontSize);
  const commentsBodyTopDelta = commentsPadV + pt(8) + px(6); // below the "CLINICAL COMMENTS" label
  const commentsRequiredHeight =
    commentsBodyTopDelta + commentsFontSize + Math.max(0, commentsLines.length - 1) * commentsLineSpacing + px(12);

  // -- Doctor card layout (computed before drawing; none of it depends on final card height) --
  const doctorPadH = px(11);
  const doctorPadV = px(9);
  const doctorCardRight = rightColLeft + interpHalfW;
  const trimmedDoctorName = doctorName.trim();
  // Recognize "Dr.", "Dr ", "Dr_", "Dr-" (case-insensitive) so login-style names like
  // "Dr_Divyansh" don't get double-prefixed into "Dr. Dr_Divyansh".
  const doctorNameText = /^dr[.\s_-]/i.test(trimmedDoctorName) ? trimmedDoctorName : `Dr. ${trimmedDoctorName}`;
  const doctorLicenseText = `Lic. No: ${licenseNumber || "—"}`;
  const doctorNameFontSize = pt(13);
  const doctorLicFontSize = pt(8);
  const doctorNameW = boldFont.widthOfTextAtSize(doctorNameText, doctorNameFontSize);
  const doctorLicW = font.widthOfTextAtSize(doctorLicenseText, doctorLicFontSize);
  const doctorAvailableInlineWidth = interpHalfW - doctorPadH * 2;
  const doctorNameBaselineDelta = doctorPadV + doctorNameFontSize;
  const doctorLicenseInline = doctorNameW + px(6) + doctorLicW <= doctorAvailableInlineWidth;
  const afterNameLineDelta = doctorLicenseInline ? doctorNameBaselineDelta : doctorNameBaselineDelta + pt(8) + px(2);
  const doctorSpecBaselineDelta = afterNameLineDelta + pt(8) + px(2);
  const doctorSigW = px(80);
  const doctorSigH = px(44);
  const doctorSigTopDelta = doctorSpecBaselineDelta + px(6);
  const doctorRevBaselineDelta = doctorSigTopDelta + doctorSigH + px(4) + pt(7);
  const doctorRequiredHeight = doctorRevBaselineDelta + px(9);

  const row3H = Math.max(kotlinRow3H, commentsRequiredHeight, isReviewed ? doctorRequiredHeight : 0);

  // Clinical comments card
  drawRoundedRect(left, row3Y, interpHalfW, row3H, px(6), whiteColor, borderColor, px(1));
  drawTextFromTop("CLINICAL COMMENTS", left + commentsPadH, row3Y + commentsPadV + pt(8), pt(8), boldFont, textSecondaryColor);
  commentsLines.forEach((line, index) => {
    const baselineFromTop = row3Y + commentsBodyTopDelta + commentsFontSize + index * commentsLineSpacing;
    drawTextFromTop(line, left + commentsPadH, baselineFromTop, commentsFontSize, font, commentsTextColor);
  });

  // Physician / doctor card
  if (isReviewed) {
    drawRoundedRect(rightColLeft, row3Y, interpHalfW, row3H, px(6), whiteColor, borderColor, px(1));

    // Name/license/specialty are left-aligned to the card's own left padding (matching
    // every other card in this section) rather than right-aligned, which otherwise reads
    // as a large empty margin before the name. Signature and "Reviewed on" stay as-is.
    const doctorContentX = rightColLeft + doctorPadH;

    const nameBaselineFromTop = row3Y + doctorNameBaselineDelta;
    if (doctorLicenseInline) {
      drawTextFromTop(doctorNameText, doctorContentX, nameBaselineFromTop, doctorNameFontSize, boldFont, textPrimaryColor);
      drawTextFromTop(doctorLicenseText, doctorContentX + doctorNameW + px(6), nameBaselineFromTop - pt(1), doctorLicFontSize, font, textSecondaryColor);
    } else {
      drawTextFromTop(doctorNameText, doctorContentX, nameBaselineFromTop, doctorNameFontSize, boldFont, textPrimaryColor);
      const licBaselineFromTop = row3Y + afterNameLineDelta;
      drawTextFromTop(doctorLicenseText, doctorContentX, licBaselineFromTop, doctorLicFontSize, font, textSecondaryColor);
    }

    // Hospital/organization the reviewing doctor belongs to (same source as the page header)
    const doctorHospitalText = hospitalName || "NA";
    const specialtyBaselineFromTop = row3Y + doctorSpecBaselineDelta;
    drawTextFromTop(doctorHospitalText, doctorContentX, specialtyBaselineFromTop, pt(8), font, textSecondaryColor);

    // Signature — fixed reserved slot regardless of whether a signature is on file,
    // so "Reviewed on" doesn't jump up/down between reports.
    const sigSlotL = doctorCardRight - doctorPadH - doctorSigW;
    const sigSlotTopFromTop = row3Y + doctorSigTopDelta;

    if (embeddedSignature) {
      const { image: signatureImage } = embeddedSignature;
      let displayW = doctorSigW;
      let displayH = (signatureImage.height / signatureImage.width) * displayW;
      if (displayH > doctorSigH) {
        displayH = doctorSigH;
        displayW = (signatureImage.width / signatureImage.height) * displayH;
      }
      const imgL = doctorCardRight - doctorPadH - displayW;
      const imgBottomFromTop = sigSlotTopFromTop + doctorSigH; // bottom-align within the slot
      reviewPage.drawImage(signatureImage, {
        x: imgL,
        y: toY(imgBottomFromTop),
        width: displayW,
        height: displayH,
      });
    } else {
      drawRoundedRect(sigSlotL, sigSlotTopFromTop, doctorSigW, doctorSigH, px(4), whiteColor, borderColor, px(1));
      drawTextFromTop("Signature pending", sigSlotL + px(6), sigSlotTopFromTop + doctorSigH / 2 + px(3), pt(7), font, textSecondaryColor);
    }

    // Reviewed on — this PDF is generated at the moment of submission, so "now" is correct.
    const now = new Date();
    const reviewedOnText = `Reviewed on: ${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`;
    const reviewedOnW = font.widthOfTextAtSize(reviewedOnText, pt(7));
    const reviewedOnBaselineFromTop = row3Y + doctorRevBaselineDelta;
    drawTextFromTop(reviewedOnText, doctorCardRight - doctorPadH - reviewedOnW, reviewedOnBaselineFromTop, pt(7), font, textSecondaryColor);
  }

  y = row3Y + row3H;

  // Footer is anchored to the bottom of the outer card, independent of how tall the
  // content above ended up (matches the reference design).
  const footerDividerFromTop = cardBottomFromTop - px(22);
  reviewPage.drawLine({
    start: { x: left, y: toY(footerDividerFromTop) },
    end: { x: right, y: toY(footerDividerFromTop) },
    thickness: px(0.8),
    color: borderColor,
  });

  const footerContentFromTop = cardBottomFromTop - px(18);
  const pageText = "Page 2 of 2";
  const pageFontSize = pt(8);
  const pageTextWidth = font.widthOfTextAtSize(pageText, pageFontSize);

  // Disclaimer text (left) — wrapped to whatever width is left after the page number,
  // so the two can never overlap regardless of how "Page X of Y" text changes length.
  const disclaimerText = "Medical guidance provided remotely is subject to clinical limitations. In case of emergency, visit the nearest hospital. Not for medico-legal purposes.";
  const disclaimerFontSize = pt(7);
  const disclaimerAvailableWidth = right - left - pageTextWidth - px(8);
  const disclaimerLines = wrapText(disclaimerText, disclaimerAvailableWidth, font, disclaimerFontSize);
  const disclaimerLineSpacing = disclaimerFontSize * 1.3;

  disclaimerLines.forEach((line, index) => {
    const baselineFromTop = footerContentFromTop + disclaimerFontSize + index * disclaimerLineSpacing;
    drawTextFromTop(line, left, baselineFromTop, disclaimerFontSize, font, textMutedColor);
  });

  // Page number (right)
  drawTextFromTop(pageText, right - pageTextWidth, footerContentFromTop, pageFontSize, font, textMutedColor);

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
}

