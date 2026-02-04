/**
 * PDF Generation Utility
 * Generates PDF from report data - uses exact same data as displayed on UI
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Report } from '../types/reports';

export async function generatePDFfromElement(elementOrId: HTMLElement | string): Promise<Blob> {
  const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!element) {
    throw new Error('Report element not found');
  }

  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const headerHeight = 12;
  const footerHeight = 10;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin + headerHeight;

  const ds = (element as HTMLElement).dataset || {};
  pdf.setFontSize(12);
  pdf.setTextColor('#111827');
  pdf.setFont('helvetica', 'bold');
  pdf.text('ECG Clinical Report', margin, margin + 6);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const metaLine = [
    ds.reportId ? `Report ID: ${ds.reportId}` : '',
    ds.reportName ? `Patient: ${ds.reportName}` : '',
    ds.deviceId ? `Device ID: ${ds.deviceId}` : ''
  ].filter(Boolean).join('   ');
  if (metaLine) {
    pdf.text(metaLine, margin, margin + 10);
  }

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2 - headerHeight - footerHeight;

  while (heightLeft > 0) {
    pdf.addPage();
    pdf.setFontSize(12);
    pdf.setTextColor('#111827');
    pdf.setFont('helvetica', 'bold');
    pdf.text('ECG Clinical Report', margin, margin + 6);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    if (metaLine) {
      pdf.text(metaLine, margin, margin + 10);
    }
    position = margin + headerHeight - heightLeft;
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2 - headerHeight - footerHeight;
  }

  const totalPages = (pdf as any).getNumberOfPages ? (pdf as any).getNumberOfPages() : 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor('#6b7280');
    pdf.setFont('helvetica', 'normal');
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fmt = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
    pdf.text(`Generated: ${fmt} ${tz}   Version: v1.0`, margin, pageHeight - 8);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 22, pageHeight - 8);
  }

  return pdf.output('blob');
}

/**
 * Generate PDF from report data
 * This function uses the exact same data structure as displayed on the UI
 * @param report - Report data (same as displayed on UI)
 * @returns Promise with PDF blob
 */
export async function generateReportPDF(report: Report): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add a new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000') => {
    checkNewPage(fontSize * 0.5);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = pdf.splitTextToSize(String(text || ''), contentWidth);
    lines.forEach((line: string) => {
      checkNewPage(fontSize * 0.5);
      pdf.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 2; // Add spacing after text
  };

  // Title
  pdf.setFontSize(20);
  pdf.setTextColor('#1e40af');
  pdf.setFont('helvetica', 'bold');
  pdf.text('Report Details', margin, yPosition);
  yPosition += 10;

  // Divider line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Report Information Section
  pdf.setFontSize(14);
  pdf.setTextColor('#374151');
  pdf.setFont('helvetica', 'bold');
  pdf.text('Report Information', margin, yPosition);
  yPosition += 8;

  // Report fields - using exact same data structure
  const fields = [
    { label: 'Report ID', value: report.id },
    { label: 'Name', value: report.name },
    { label: 'Phone Number', value: report.phoneNumber },
    { label: 'Device ID', value: report.deviceId },
    { label: 'Date', value: report.date ? new Date(report.date).toLocaleString() : 'N/A' },
    { label: 'Type', value: report.type || 'N/A' },
    { label: 'Size', value: report.size || 'N/A' },
  ];

  pdf.setFontSize(10);
  pdf.setTextColor('#000000');
  pdf.setFont('helvetica', 'normal');

  fields.forEach((field) => {
    checkNewPage(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${field.label}:`, margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    const valueX = margin + 50;
    const valueText = String(field.value || 'N/A');
    const valueLines = pdf.splitTextToSize(valueText, contentWidth - 50);
    pdf.text(valueLines, valueX, yPosition);
    yPosition += Math.max(5, valueLines.length * 5);
  });

  // Add any additional fields from the report object
  const additionalFields = Object.keys(report).filter(
    (key) => !['id', 'name', 'phoneNumber', 'deviceId', 'date', 'type', 'size', 's3Key'].includes(key)
  );

  if (additionalFields.length > 0) {
    yPosition += 5;
    checkNewPage(10);
    pdf.setFontSize(14);
    pdf.setTextColor('#374151');
    pdf.setFont('helvetica', 'bold');
    pdf.text('Additional Information', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor('#000000');
    pdf.setFont('helvetica', 'normal');

    additionalFields.forEach((key) => {
      checkNewPage(6);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${key.charAt(0).toUpperCase() + key.slice(1)}:`, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      const valueX = margin + 50;
      const value = report[key];
      const valueText = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || 'N/A');
      const valueLines = pdf.splitTextToSize(valueText, contentWidth - 50);
      pdf.text(valueLines, valueX, yPosition);
      yPosition += Math.max(5, valueLines.length * 5);
    });
  }

  // Footer
  const totalPages = (pdf as any).getNumberOfPages ? (pdf as any).getNumberOfPages() : 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor('#6b7280');
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Generated on ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 10
    );
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 10
    );
  }

  // Convert to blob
  const pdfBlob = pdf.output('blob');
  return pdfBlob;
}

/**
 * Download PDF file
 * @param blob - PDF blob
 * @param filename - Filename for download
 */
export function downloadPDF(blob: Blob, filename: string = 'report.pdf'): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create object URL for PDF preview
 * @param blob - PDF blob
 * @returns Object URL string
 */
export function createPDFPreviewURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

