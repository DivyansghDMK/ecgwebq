import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { fetchS3FileContent } from "@/api/ecgApi";

/**
 * Creates a reviewed PDF by loading the original from URL, adding
 * doctor comments and optional signature image on the last page.
 *
 * All processing happens in the browser.
 */
export async function createReviewedPdf(
  originalPdfUrl: string,
  options: {
    comments: string;
    doctorId: string;
    signatureFile?: File | null;
    signatureDataUrl?: string | null; // Canvas data URL from drawing
  }
): Promise<Blob> {
  const { comments, doctorId, signatureFile, signatureDataUrl } = options;

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
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width, height } = lastPage.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;

  // Draw a light separator line at the bottom
  lastPage.drawLine({
    start: { x: 40, y: 80 },
    end: { x: width - 40, y: 80 },
    color: rgb(0.7, 0.7, 0.7),
    thickness: 0.5,
  });

  // Doctor comments block
  const labelColor = rgb(0.25, 0.25, 0.25);
  const textColor = rgb(0.1, 0.1, 0.1);
  let cursorY = 70;

  lastPage.drawText("Doctor Comments:", {
    x: 40,
    y: cursorY,
    size: fontSize + 1,
    font,
    color: labelColor,
  });

  const wrapped = wrapText(comments || "-", 90);
  cursorY -= 14;
  lastPage.drawText(wrapped, {
    x: 40,
    y: cursorY,
    size: fontSize,
    font,
    color: textColor,
    lineHeight: 12,
  });

  // Doctor ID
  cursorY -= 40;
  lastPage.drawText(`Doctor ID: ${doctorId || "-"}`, {
    x: 40,
    y: cursorY,
    size: fontSize,
    font,
    color: textColor,
  });

  // Optional signature image on the right side (from file or canvas)
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
    const sigWidth = 120;
    const scale = sigWidth / signatureImage.width;
    const sigHeight = signatureImage.height * scale;

    lastPage.drawImage(signatureImage, {
      x: width - sigWidth - 40,
      y: cursorY - 10,
      width: sigWidth,
      height: sigHeight,
    });

    lastPage.drawText("Signature", {
      x: width - sigWidth - 40,
      y: cursorY - 16,
      size: fontSize,
      font,
      color: labelColor,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

function wrapText(text: string, maxCharsPerLine: number): string {
  if (!text) return "";
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    if ((current + " " + w).trim().length > maxCharsPerLine) {
      lines.push(current.trim());
      current = w;
    } else {
      current += " " + w;
    }
  }
  if (current.trim().length) {
    lines.push(current.trim());
  }
  return lines.join("\n");
}


