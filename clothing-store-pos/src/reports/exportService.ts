// @/reports/exportService.ts
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // This is a plugin, and needs to be imported to extend jspdf
import { UserOptions } from 'jspdf-autotable'; // For typing autotable options
import { showSuccessToast, showErrorToast } from '@/lib/toast';

// --- Excel Export ---

/**
 * Exports an array of objects to an Excel file.
 * @param data The array of data objects.
 * @param fileName The desired name of the output file (without extension).
 * @param sheetName The name for the worksheet.
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1'): void => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    showSuccessToast(`Successfully exported ${fileName}.xlsx`);
  } catch (error) {
    console.error('[ExportService] Error exporting to Excel:', error);
    showErrorToast('Error exporting to Excel.');
  }
};

// --- PDF Export ---

// Extend the jspdf interface to include the autotable method for TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

// Store the font once loaded to avoid re-fetching and re-adding on every export
let arabicFontBase64: string | null = null;
const FONT_NAME = 'NotoSansArabic';
const FONT_FILE_PATH = '/assets/fonts/NotoSansArabic-Regular.ttf'; // Assumes public dir is root

const loadArabicFont = async (): Promise<string> => {
  if (arabicFontBase64) {
    return arabicFontBase64;
  }
  try {
    console.log(`[ExportService] Fetching font from: ${FONT_FILE_PATH}`);
    // Use fetch API to get the font file from the public assets directory
    const response = await fetch(FONT_FILE_PATH);
    if (!response.ok) {
      throw new Error(`Font file not found at ${FONT_FILE_PATH}. Status: ${response.statusText}`);
    }
    const fontBlob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        if (typeof base64data === 'string') {
          // The result includes the mime type header, e.g., "data:font/ttf;base64,..."
          // We need to strip this header for jspdf's addFileToVFS and addFont.
          const fontData = base64data.split(',')[1];
          arabicFontBase64 = fontData;
          resolve(fontData);
        } else {
          reject(new Error('Failed to read font file as base64 string.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(fontBlob);
    });
  } catch (error) {
    console.error('[ExportService] Critical error loading Arabic font:', error);
    // TODO: Show a user-facing error. PDF export with Arabic will not work without the font.
    // Throwing here will allow callers to catch and display an error.
    throw new Error('Could not load required font for PDF export. Please check that the font file exists at ' + FONT_FILE_PATH);
  }
};


/**
 * Exports data to a PDF file with support for Arabic text.
 * @param title The title of the report.
 * @param headers An array of strings for the table headers.
 * @param body An array of arrays for the table body data.
 * @param fileName The desired name of the output file (without extension).
 */
export const exportToPdf = async (
  title: string,
  headers: string[],
  body: any[][],
  fileName: string
): Promise<void> => {
  try {
    const fontData = await loadArabicFont(); // Ensure font is loaded
    const doc = new jsPDF();

    // Add font to the PDF virtual file system and set it
    const fontFileName = `${FONT_NAME}.ttf`;
    doc.addFileToVFS(fontFileName, fontData);
    doc.addFont(fontFileName, FONT_NAME, 'normal');
    doc.setFont(FONT_NAME);

    // --- Header ---
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`${new Date().toLocaleString()}`, 14, 30);

    // --- Table ---
    doc.autoTable({
      startY: 35,
      head: [headers],
      body: body,
      theme: 'grid',
      styles: {
        font: FONT_NAME, // CRITICAL: Apply the custom font to the table
        halign: 'center', // Center align headers
      },
      headStyles: {
        fillColor: [22, 160, 133], // Example header color
        textColor: 255,
        fontStyle: 'bold',
      },
      // For RTL text, jspdf-autotable doesn't have a simple RTL switch.
      // We can right-align the text in columns that contain Arabic.
      // A more robust solution might involve plugins or manually reversing text,
      // but for simple data display, right alignment is a good start.
      columnStyles: {
        // Example: If column 0 and 1 are Arabic text
        // 0: { halign: 'right' },
        // 1: { halign: 'right' },
      },
      didDrawPage: (data) => {
        // --- Footer ---
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`${fileName}.pdf`);
    showSuccessToast(`Successfully exported ${fileName}.pdf`);
  } catch (error) {
    console.error('[ExportService] Error exporting to PDF:', error);
    showErrorToast('Error exporting to PDF.');
  }
};
