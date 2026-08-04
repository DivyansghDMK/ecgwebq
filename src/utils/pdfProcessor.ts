import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { fetchS3FileContent } from "@/api/ecgApi";
import { ECGRecord } from "@/api/types/ecg";
import * as pdfjsLib from "pdfjs-dist";

// Set up pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    signatureFile?: File | null;
    signatureDataUrl?: string | null; // Canvas data URL from drawing
    ecgData?: ECGRecord | null; // ECG data to add to page 1
  }
): Promise<Blob> {
  const { comments, doctorId, doctorName, signatureFile, signatureDataUrl, ecgData } = options;

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

  // ==================== EXTRACT ECG PARAMETERS FROM PAGE 1 ====================
  // Extract text content from page 1 to get RR, QTcF, RV5/SV1, RV5+SV1 values
  let extractedParams: {
    rr?: string;
    qtcf?: string;
    rv5sv1?: string;
    rv5plus?: string;
  } = {};

  try {
    const loadingTask = pdfjsLib.getDocument({ data: originalArrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    // Combine all text items into a single string
    const fullText = textContent.items.map((item: any) => item.str).join(" ");

    // Parse using regex patterns based on the known format
    // Format examples: "RR: 1000 ms", "QTcF: 360 ms", "RV5/SV1: 0.769/-0.506 mV", "RV5+SV1: 0.263 mV"
    const rrMatch = fullText.match(/RR:\s*([\d.]+\s*ms)/i);
    const qtcfMatch = fullText.match(/QTcF:\s*([\d.]+\s*ms)/i);
    const rv5sv1Match = fullText.match(/RV5\/SV1:\s*([-\d.\/]+\s*mV)/i);
    const rv5plusMatch = fullText.match(/RV5\+SV1:\s*([\d.]+\s*mV)/i);

    if (rrMatch) extractedParams.rr = rrMatch[1];
    if (qtcfMatch) extractedParams.qtcf = qtcfMatch[1];
    if (rv5sv1Match) extractedParams.rv5sv1 = rv5sv1Match[1];
    if (rv5plusMatch) extractedParams.rv5plus = rv5plusMatch[1];

    await pdf.destroy();
  } catch (extractError) {
    console.warn("Failed to extract text from PDF:", extractError);
    // Continue with empty extracted params - will fall back to "-"
  }

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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

  // Create a new page for the healthcare professional review
  const reviewPage = pdfDoc.addPage([width, height]);

  // Color constants
  const navyColor = rgb(0.105, 0.227, 0.36); // #1B3A5C
  const lightBgColor = rgb(0.956, 0.964, 0.972); // #F4F6F8
  const borderColor = rgb(0.847, 0.871, 0.89); // #D8DEE4
  const textColor = rgb(0.12, 0.16, 0.2); // #1F2933
  const mutedColor = rgb(0.353, 0.4, 0.447); // #5A6672
  const accentColor = rgb(0.18, 0.431, 0.557); // #2E6E8E
  const subtitleColor = rgb(0.788, 0.839, 0.878); // #C9D6E0

  const signatureBottomMargin = 60;
  const signatureBoxHeight = 90;
  const signatureHeadingGap = 25;
  const signatureY = signatureBottomMargin + signatureBoxHeight;

  let cursorY = height;

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

  // ==================== HEADER BANNER ====================
  const headerHeight = 78;
  cursorY -= headerHeight;

  // Navy background rectangle
  reviewPage.drawRectangle({
    x: 0,
    y: cursorY,
    width: width,
    height: headerHeight,
    color: navyColor,
  });

  // Title
  reviewPage.drawText("Healthcare Professional Review", {
    x: 50,
    y: cursorY + headerHeight - 25,
    size: 18,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Subtitle
  reviewPage.drawText("Deckmount Electronics Pvt Ltd | Rhythm Ultra ECG", {
    x: 50,
    y: cursorY + headerHeight - 45,
    size: 9,
    font,
    color: subtitleColor,
  });

  // ==================== DOCTOR INFORMATION CARD ====================
  cursorY -= 30; // 30pt below header

  const cardMargin = 50;
  const cardWidth = width - (cardMargin * 2);
  const cardHeight = 56; // Changed from 74 to 56
  const cardRadius = 6;
  const accentBarWidth = 4;

  // Light background card
  reviewPage.drawRectangle({
    x: cardMargin,
    y: cursorY - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: lightBgColor,
    borderColor: borderColor,
    borderWidth: 1,
  });

  // Accent bar on left edge
  reviewPage.drawRectangle({
    x: cardMargin,
    y: cursorY - cardHeight,
    width: accentBarWidth,
    height: cardHeight,
    color: accentColor,
  });

  // Doctor Name label and value (left side)
  const labelPadding = 18;
  const labelFontSize = 8.5;
  const valueFontSize = 11;

  reviewPage.drawText("DOCTOR NAME", {
    x: cardMargin + labelPadding,
    y: cursorY - 18,
    size: labelFontSize,
    font: boldFont,
    color: mutedColor,
  });

  reviewPage.drawText(doctorName || "-", {
    x: cardMargin + labelPadding,
    y: cursorY - 38,
    size: valueFontSize,
    font,
    color: textColor,
  });

  // Reviewed On label and value (right side, right-aligned)
  const reviewDate = new Date().toLocaleString();
  const reviewDateWidth = font.widthOfTextAtSize(reviewDate, valueFontSize);
  const reviewedOnLabelWidth = boldFont.widthOfTextAtSize("REVIEWED ON", labelFontSize);

  reviewPage.drawText("REVIEWED ON", {
    x: cardMargin + cardWidth - labelPadding - reviewedOnLabelWidth,
    y: cursorY - 18,
    size: labelFontSize,
    font: boldFont,
    color: mutedColor,
  });

  reviewPage.drawText(reviewDate, {
    x: cardMargin + cardWidth - labelPadding - reviewDateWidth,
    y: cursorY - 38,
    size: valueFontSize,
    font,
    color: textColor,
  });

  cursorY -= cardHeight;

  // ==================== HEALTHCARE PROFESSIONAL COMMENTS ====================
  cursorY -= 28; // 28pt below doctor card

  // Section heading
  reviewPage.drawText("Healthcare Professional Comments", {
    x: cardMargin,
    y: cursorY,
    size: 13,
    font: boldFont,
    color: navyColor,
  });

  cursorY -= 25;

  // Draw horizontal ruled lines (like notebook paper) - no outer box
  const ruledLineGap = 35;
  const ruledLineCount = 5;
  for (let i = 0; i < ruledLineCount; i++) {
    const lineY = cursorY - 20 - (i * ruledLineGap);
    reviewPage.drawLine({
      start: { x: cardMargin, y: lineY },
      end: { x: cardMargin + cardWidth, y: lineY },
      thickness: 1,
      color: borderColor,
    });
  }

  // Comments text - positioned above first ruled line
  const commentText = comments || "No comments provided.";
  reviewPage.drawText(commentText, {
    x: cardMargin + 16,
    y: cursorY - 12,
    size: 11,
    font,
    color: textColor,
  });

  // Calculate position after last ruled line
  const lastRuledLineY = cursorY - 20 - ((ruledLineCount - 1) * ruledLineGap);

  // ==================== DOCTOR SIGNATURE ====================
  // Position with 45pt gap after last ruled line
  const signatureGap = 45;
  const signatureSectionY = lastRuledLineY - signatureGap;

  // Section heading
  reviewPage.drawText("Doctor Signature", {
    x: cardMargin,
    y: signatureSectionY,
    size: 13,
    font: boldFont,
    color: navyColor,
  });

  // Signature box
  const sigBoxTop = signatureSectionY - 25 - signatureBoxHeight;
  reviewPage.drawRectangle({
    x: cardMargin,
    y: sigBoxTop,
    width: cardWidth,
    height: signatureBoxHeight,
    color: rgb(1, 1, 1),
    borderColor: borderColor,
    borderWidth: 1,
  });

  // Optional signature image (from file or canvas)
  let signatureImage: any = null;

  if (signatureFile) {
    const sigArrayBuffer = await signatureFile.arrayBuffer();
    const mime = signatureFile.type;
    if (mime === "image/png") {
      signatureImage = await pdfDoc.embedPng(sigArrayBuffer);
    } else {
      // Assume JPEG for other types
      signatureImage = await pdfDoc.embedJpg(sigArrayBuffer);
    }
  } else if (signatureDataUrl) {
    // Convert data URL to image
    const base64Data = signatureDataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    signatureImage = await pdfDoc.embedPng(bytes);
  }

  if (signatureImage) {
    // Target size ~168x60pt, preserving aspect ratio
    const targetWidth = 168;
    const scale = targetWidth / signatureImage.width;
    const sigHeight = signatureImage.height * scale;

    // Vertically center in signature box
    const sigY = sigBoxTop + (signatureBoxHeight / 2) - (sigHeight / 2);

    reviewPage.drawImage(signatureImage, {
      x: cardMargin + 16,
      y: sigY,
      width: targetWidth,
      height: sigHeight,
    });
  } else {
    // If no signature, show placeholder text centered in box
    reviewPage.drawText("(No signature provided)", {
      x: cardMargin + 16,
      y: sigBoxTop + (signatureBoxHeight / 2) - 6,
      size: 11,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
}

