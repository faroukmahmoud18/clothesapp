// @/printing/printerService.ts
import escpos from 'escpos';
import USB from 'escpos-usb'; // Or another transport like escpos.Network for network printers
import { Invoice, InvoiceItem } from '@/pos/types'; // Assuming your types are here
import i18n from '@/i18n'; // For localized text like "Thank You"

// Configuration for mock printing
const MOCK_PRINTING_MODE = true; // Set to false to attempt real printing

let device: USB | null = null;
let printer: escpos.Printer | null = null;

// Function to initialize the printer (simplified)
// In a real app, you might want to allow device selection or auto-detection.
export const initializePrinter = async (): Promise<boolean> => {
  if (MOCK_PRINTING_MODE) {
    console.log('[PrinterService] Initialized in MOCK printing mode.');
    return true;
  }

  if (printer && device?.device) { // Check if device is already open
    console.log('[PrinterService] Printer already initialized.');
    return true;
  }

  try {
    // Attempt to find the first available USB ESC/POS printer
    // VID and PID can be specified if known: new USB(0xVENDOR_ID, 0xPRODUCT_ID)
    const usbDevice = USB.getDevice(); // Gets the first device found
    if (!usbDevice) {
        console.error('[PrinterService] No USB ESC/POS printer found.');
        // alert(i18n.t('noPrinterFoundError')); // Add this translation
        return false;
    }
    device = new USB(usbDevice); // Use the found device
    printer = new escpos.Printer(device, { encoding: "GB18030" /* default */ });

    return new Promise((resolve, reject) => {
      if (!device) { // Should not happen if usbDevice was found
          console.error('[PrinterService] Device became null unexpectedly during initialization.');
          return reject(false);
      }
      device.open(function(error) {
        if (error) {
          console.error('[PrinterService] Error opening USB device:', error);
          // alert(i18n.t('printerConnectionError')); // Add this translation
          printer = null; // Ensure printer is null if open fails
          reject(false);
        } else {
          console.log('[PrinterService] Printer initialized successfully.');
          resolve(true);
        }
      });
    });

  } catch (error) {
    console.error('[PrinterService] Failed to initialize printer:', error);
    // alert(i18n.t('printerInitializationError')); // Add this translation
    device = null;
    printer = null;
    return false;
  }
};

const formatLine = (left: string, right: string, width = 32): string => {
  const spaces = Math.max(0, width - left.length - right.length);
  return `${left}${' '.repeat(spaces)}${right}`;
};

const formatReceipt = (p: escpos.Printer, invoiceData: Invoice) => {
  const storeName = i18n.t('storeName', { ns: 'receipt' }) || "My Clothing Store"; // Add to translations
  const thankYouMsg = i18n.t('thankYouMsg', { ns: 'receipt' }) || "Thank you for your purchase!";
  const currency = i18n.t('currencyEGP', {defaultValue: "EGP"}); // From common translations

  p.font('a')
   .align('ct')
   .style('bu')
   .size(1, 1)
   .text(storeName)
   .text('--------------------------------') // Separator
   .align('lt')
   .style('normal')
   .size(0,0) // Reset size to normal
   .text(i18n.t('invoiceIdLabel', {ns: 'receipt', defaultValue: 'Invoice ID:'}) + ` ${invoiceData.id}`)
   .text(i18n.t('dateLabel', {ns: 'receipt', defaultValue: 'Date:'}) + ` ${new Date(invoiceData.createdAt).toLocaleString()}`)
   // .text(i18n.t('cashierLabel', {ns: 'receipt', defaultValue: 'Cashier:'}) + ` ${invoiceData.cashierId || 'N/A'}`) // If available
   // .text(i18n.t('branchLabel', {ns: 'receipt', defaultValue: 'Branch:'}) + ` ${invoiceData.branchId || 'N/A'}`)   // If available
   .text('--------------------------------');

  // Items
  invoiceData.items.forEach((item: InvoiceItem) => {
    const itemNameShort = item.productName.substring(0, 20); // Keep item name brief for receipt
    const itemLineLeft = `${item.quantity}x ${itemNameShort}`;
    const itemLineRight = `${item.finalLineTotal.toFixed(2)}`;
    p.text(formatLine(itemLineLeft, itemLineRight));
    if (item.discountAmount && item.discountAmount > 0) {
        p.text(formatLine(`  (${i18n.t('discountLabel', {ns: 'receipt', defaultValue: 'Discount'})})`, `-${item.discountAmount.toFixed(2)}`));
    }
  });
  p.text('--------------------------------');

  // Totals
  p.align('rt'); // Right align totals
  p.text(formatLine(i18n.t('subtotalLabel', {ns: 'receipt', defaultValue: 'Subtotal:'}), `${invoiceData.subtotal.toFixed(2)} ${currency}`));
  if (invoiceData.invoiceDiscountAmount && invoiceData.invoiceDiscountAmount > 0) {
    p.text(formatLine(i18n.t('invoiceDiscountLabel', {ns: 'receipt', defaultValue: 'Invoice Discount:'}), `-${invoiceData.invoiceDiscountAmount.toFixed(2)} ${currency}`));
  }
  p.text(formatLine(i18n.t('taxTotalLabel', {ns: 'receipt', defaultValue: 'Tax:'}), `${invoiceData.taxTotal.toFixed(2)} ${currency}`));
  p.style('b').size(1,0) // Bold and slightly larger for grand total
   .text(formatLine(i18n.t('grandTotalLabel', {ns: 'receipt', defaultValue: 'Total:'}), `${invoiceData.grandTotal.toFixed(2)} ${currency}`))
   .style('normal').size(0,0);
  p.text('--------------------------------');

  // Payment Details
  p.align('lt');
  invoiceData.paymentMethods.forEach(pm => {
      p.text(i18n.t('paymentMethodLabel', { ns: 'receipt', defaultValue: 'Paid by'}) + ` ${pm.method}: ${pm.amount.toFixed(2)} ${currency}`);
  });
   if (invoiceData.changeDue && invoiceData.changeDue > 0) {
       p.text(i18n.t('changeDueLabel', {ns: 'receipt', defaultValue: 'Change:'}) + ` ${invoiceData.changeDue.toFixed(2)} ${currency}`);
   }

  // Footer
  p.feed(2) // Feed some lines
   .align('ct')
   .text(thankYouMsg)
   .feed(3) // Extra feed to allow tearing off
   .cut(); // Cut paper (if printer supports it)
};

export const printReceipt = async (invoiceData: Invoice): Promise<boolean> => {
  if (MOCK_PRINTING_MODE) {
    console.log('[PrinterService] MOCK PRINTING RECEIPT:');
    console.log('Store Name: My Clothing Store');
    console.log('--------------------------------');
    console.log(`Invoice ID: ${invoiceData.id}`);
    console.log(`Date: ${new Date(invoiceData.createdAt).toLocaleString()}`);
    console.log('--------------------------------');
    invoiceData.items.forEach(item => {
      console.log(formatLine(`${item.quantity}x ${item.productName.substring(0,20)}`, `${item.finalLineTotal.toFixed(2)}`));
       if (item.discountAmount && item.discountAmount > 0) {
        console.log(formatLine(`  (Discount)`, `-${item.discountAmount.toFixed(2)}`));
      }
    });
    console.log('--------------------------------');
    console.log(formatLine('Subtotal:', `${invoiceData.subtotal.toFixed(2)}`));
    if (invoiceData.invoiceDiscountAmount && invoiceData.invoiceDiscountAmount > 0) {
        console.log(formatLine('Invoice Discount:', `-${invoiceData.invoiceDiscountAmount.toFixed(2)}`));
    }
    console.log(formatLine('Tax:', `${invoiceData.taxTotal.toFixed(2)}`));
    console.log(formatLine('TOTAL:', `${invoiceData.grandTotal.toFixed(2)}`));
    console.log('--------------------------------');
    invoiceData.paymentMethods.forEach(pm => {
      console.log(`Paid by ${pm.method}: ${pm.amount.toFixed(2)}`);
    });
    if (invoiceData.changeDue && invoiceData.changeDue > 0) {
       console.log(`Change: ${invoiceData.changeDue.toFixed(2)}`);
    }
    console.log('--------------------------------');
    console.log('Thank you for your purchase!');
    console.log('[PrinterService] (End of Mock Receipt)');
    return true;
  }

  if (!printer || !device?.device) { // Also check if device is actually open/valid
    console.error('[PrinterService] Printer not initialized or device not open. Cannot print.');
    // alert(i18n.t('printerNotReadyError')); // Add this translation
    const initialized = await initializePrinter(); // Attempt to re-initialize
    if (!initialized || !printer || !device?.device) { // Check again after attempt
        console.error('[PrinterService] Re-initialization failed. Cannot print.');
        return false;
    }
  }

  return new Promise((resolve, reject) => {
    try {
      if (!device || !printer) throw new Error("Device or printer is null after initialization check."); // Should be caught by above

      device.open(function(error) { // Ensure device is open before printing
        if (error && error.message !== 'Device already open') { // Ignore "already open"
          console.error('[PrinterService] Error opening device for printing:', error);
          // alert(i18n.t('printerConnectionError'));
          return reject(false);
        }

        formatReceipt(printer, invoiceData); // Format and send commands

        printer.close().then(() => { // escpos-usb close is asynchronous
            console.log('[PrinterService] Receipt printed successfully and printer closed.');
            resolve(true);
        }).catch((err: any) => {
            console.error('[PrinterService] Error closing printer:', err);
            // Even if closing fails, printing might have succeeded. Consider how to handle.
            resolve(false); // Or true depending on desired behavior for close errors
        });
      });
    } catch (err) {
      console.error('[PrinterService] Error during printing process:', err);
      // alert(i18n.t('printingFailedError')); // Add this translation
      reject(false);
    }
  });
};

// Optional: Add a function to close the printer connection if kept open
export const closePrinter = async () => {
    if (MOCK_PRINTING_MODE) {
        console.log('[PrinterService] Mock mode: No printer to close.');
        return;
    }
    if (printer && device) { // Check both printer and device
        try {
            await printer.close(); // This now returns a Promise from escpos v3
            console.log('[PrinterService] Printer connection closed.');
            printer = null;
            device = null; // Assuming device is also "closed" or managed by printer.close()
        } catch (error) {
            console.error('[PrinterService] Error closing printer:', error);
        }
    }
};

// It might be good to initialize the printer when the app starts or when POS page loads.
// initializePrinter(); // Example: Call on app/module load
// However, USB device detection might be better on-demand or with explicit user action.
