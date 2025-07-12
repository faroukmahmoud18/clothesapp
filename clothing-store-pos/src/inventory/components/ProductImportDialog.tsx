// @/inventory/components/ProductImportDialog.tsx
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // May not be needed if using native file input styling
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { UploadCloudIcon, FileTextIcon, AlertCircleIcon } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Product } from '@/pos/types';
import * as syncService from '@/sync/syncService';
import { showErrorToast, showSuccessToast, showInfoToast } from '@/lib/toast';

interface ProductImportDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onImportCompleted?: () => void; // Callback after import process finishes
}

const ProductImportDialog: React.FC<ProductImportDialogProps> = ({ isOpen, setIsOpen, onImportCompleted }) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // States for pre-import summary
  const [fileNameForSummary, setFileNameForSummary] = useState<string>('');
  const [totalRowsRead, setTotalRowsRead] = useState(0);
  const [validProductsToImport, setValidProductsToImport] = useState<Array<Omit<Product, 'id'>>>([]);
  const [rowsWithErrors, setRowsWithErrors] = useState<Array<{rowIndex: number, rowData: any, errors: string[]}>>([]);
  const [showSummary, setShowSummary] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Define expected headers (ensure keys used in validateRow match these after parsing)
  // PapaParse with header:true will use first row as keys.
  // XLSX.utils.sheet_to_json also uses first row as keys by default.
  // It's crucial the template CSV/Excel has these exact header names.
  const EXPECTED_CSV_HEADERS_MAP: Record<string, keyof Product | string> = {
    "SKU": "sku",
    "Name": "name",
    "Barcode": "barcode",
    "Category": "category",
    "Purchase Price": "purchasePrice",
    "Selling Price": "sellingPrice",
    "Stock Quantity": "stockQuantity",
    "Low Stock Threshold": "lowStockThreshold",
    "Tax Rate": "taxRate", // Expected as 0.14 for 14%
    "Image URL": "imageUrl",
    "Product Type ID": "productTypeId",
    "Supplier ID": "supplierId",
    "Branch ID": "branchId",
    "Notes": "notes"
  };
  // Required headers in the file
  const REQUIRED_FILE_HEADERS = ["SKU", "Name", "Selling Price"];


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setProcessingError(null);
    setShowSummary(false);
    setValidProductsToImport([]);
    setRowsWithErrors([]);
    setTotalRowsRead(0);
    setFileNameForSummary('');

    if (file) {
      if (!/\.(csv|xls|xlsx)$/i.test(file.name)) {
        setProcessingError(t('productImportDialog.errorInvalidFileType'));
        setSelectedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      setFileNameForSummary(file.name);
    } else {
      setSelectedFile(null);
    }
  };

  const validateRow = (rowData: any, rowIndex: number): { productData?: Partial<Omit<Product, 'id'>>, errors: string[] } => {
    const errors: string[] = [];
    const productData: Partial<Omit<Product, 'id'>> = {};

    // Access rowData using the expected header names from the file
    const getVal = (header: string) => rowData[header];

    // SKU (Required)
    const sku = getVal("SKU") ? String(getVal("SKU")).trim() : "";
    if (!sku) errors.push(t('productImportValidation.skuRequired'));
    else productData.sku = sku;

    // Name (Required)
    const name = getVal("Name") ? String(getVal("Name")).trim() : "";
    if (!name) errors.push(t('productImportValidation.nameRequired'));
    else productData.name = name;

    // Selling Price (Required, number, >= 0)
    const sellingPriceStr = getVal("Selling Price");
    const sellingPrice = parseFloat(String(sellingPriceStr));
    if (sellingPriceStr === undefined || sellingPriceStr === '' || isNaN(sellingPrice) || sellingPrice < 0) {
      errors.push(t('productImportValidation.sellingPriceInvalid'));
    } else {
      productData.sellingPrice = sellingPrice;
    }

    // Optional fields & type conversions
    if (getVal("Barcode")) productData.barcode = String(getVal("Barcode")).trim();
    if (getVal("Category")) productData.category = String(getVal("Category")).trim();

    const purchasePriceStr = getVal("Purchase Price");
    if (purchasePriceStr !== undefined && purchasePriceStr !== '') {
      const purchasePrice = parseFloat(String(purchasePriceStr));
      if (isNaN(purchasePrice) || purchasePrice < 0) errors.push(t('productImportValidation.purchasePriceInvalid'));
      else productData.purchasePrice = purchasePrice;
    }

    const stockQuantityStr = getVal("Stock Quantity");
    if (stockQuantityStr !== undefined && stockQuantityStr !== '') {
      const stockQuantity = parseInt(String(stockQuantityStr), 10);
      if (isNaN(stockQuantity) || stockQuantity < 0) errors.push(t('productImportValidation.stockQuantityInvalid'));
      else productData.stockQuantity = stockQuantity;
    } else {
      productData.stockQuantity = 0; // Default if empty
    }

    const lowStockStr = getVal("Low Stock Threshold");
    if (lowStockStr !== undefined && lowStockStr !== '') {
      const lowStockThreshold = parseInt(String(lowStockStr), 10);
      if (isNaN(lowStockThreshold) || lowStockThreshold < 0) errors.push(t('productImportValidation.lowStockThresholdInvalid'));
      else productData.lowStockThreshold = lowStockThreshold;
    }

    const taxRateStr = getVal("Tax Rate");
    if (taxRateStr !== undefined && taxRateStr !== '') {
      const taxRate = parseFloat(String(taxRateStr));
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 1) errors.push(t('productImportValidation.taxRateInvalidFormat')); // 0-1 range
      else productData.taxRate = taxRate;
    }

    if (getVal("Image URL")) productData.imageUrl = String(getVal("Image URL")).trim();
    if (getVal("Product Type ID")) productData.productTypeId = String(getVal("Product Type ID")).trim();
    if (getVal("Supplier ID")) productData.supplierId = String(getVal("Supplier ID")).trim();
    if (getVal("Branch ID")) productData.branchId = String(getVal("Branch ID")).trim();
    if (getVal("Notes")) productData.notes = String(getVal("Notes")).trim();

    return { productData: errors.length === 0 ? productData as Omit<Product, 'id'> : undefined, errors };
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      setProcessingError(t('productImportDialog.errorNoFileSelected'));
      return;
    }
    setIsProcessing(true);
    setProcessingError(null);
    setShowSummary(false);
    setValidProductsToImport([]);
    setRowsWithErrors([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        let parsedRowsArray: any[] = [];

        if (selectedFile.name.endsWith('.csv')) {
          const result = Papa.parse(data as string, { header: true, skipEmptyLines: true, trimHeaders: true });
          if (result.errors.length > 0) {
            console.warn("CSV Parsing errors:", result.errors);
            // Potentially take the first error:
            // throw new Error(`CSV Parsing Error: ${result.errors[0].message}`);
          }
          parsedRowsArray = result.data;
        } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          parsedRowsArray = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
          throw new Error(t('productImportDialog.errorInvalidFileType'));
        }

        setTotalRowsRead(parsedRowsArray.length);
        if (parsedRowsArray.length === 0) {
            setProcessingError(t('productImportDialog.errorEmptyFile')); // Add translation
            setIsProcessing(false);
            return;
        }

        // Header Validation
        const fileHeaders = Object.keys(parsedRowsArray[0]);
        const missingHeaders = REQUIRED_FILE_HEADERS.filter(h => !fileHeaders.includes(h));
        if (missingHeaders.length > 0) {
            setProcessingError(t('productImportDialog.errorMissingRequiredHeaders', { headers: missingHeaders.join(', ') })); // Add translation
            setIsProcessing(false);
            return;
        }

        const tempValidProducts: Array<Omit<Product, 'id'>> = [];
        const tempRowsWithErrors: Array<{rowIndex: number, rowData: any, errors: string[]}> = [];

        parsedRowsArray.forEach((row, index) => {
          const { productData, errors } = validateRow(row, index + 1);
          if (errors.length > 0) {
            tempRowsWithErrors.push({ rowIndex: index + 2, rowData: row, errors });
          } else if (productData) {
            // Ensure all required fields for Product (even if not in CSV) are defaulted if necessary
            const completeProductData: Omit<Product, 'id'> = {
                name: '', // Will be overwritten by productData.name
                sku: '',   // Will be overwritten
                sellingPrice: 0, // Will be overwritten
                category: '',
                purchasePrice: 0,
                stockQuantity: 0,
                ...productData // Spread validated data
            };
            tempValidProducts.push(completeProductData);
          }
        });

        setValidProductsToImport(tempValidProducts);
        setRowsWithErrors(tempRowsWithErrors);
        setShowSummary(true);

      } catch (err: any) {
        console.error("Error processing file:", err);
        setProcessingError(t('productImportDialog.errorProcessingFile', { message: err.message }));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
        console.error("Error reading file:", reader.error);
        setProcessingError(t('productImportDialog.errorReadingFile'));
        setIsProcessing(false);
    };

    if (selectedFile.name.endsWith('.csv')) {
        reader.readAsText(selectedFile);
    } else {
        reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleImportValidatedProducts = async () => {
    if (validProductsToImport.length === 0) {
      showErrorToast('productImportDialog.noValidProductsToImport');
      return;
    }
    setIsProcessing(true); // Consider a separate isImporting state
    setProcessingError(null);
    // setImportSummary(null); // Clear previous summary or update it

    try {
      // Type assertion needed as syncService.addProductsBatch expects Omit<Product, 'id' | 'branchId'> & { branchId?: string }
      // and validProductsToImport is Array<Omit<Product, 'id'>>
      // The Omit<Product, 'id'> should be compatible if all fields are there.
      // We need to ensure the objects in validProductsToImport match the input type for addProductsBatch.
      // The validateRow function produces Omit<Product, 'id'> which is fine.
      const result = await syncService.addProductsBatch(validProductsToImport);

      // Update summary based on import result
      let summaryMsg = t('productImportDialog.importResult', { // Add translation
        success: result.successCount,
        total: validProductsToImport.length
      });
      if (result.errorCount > 0) {
        summaryMsg += ` ${t('productImportDialog.importResultWithErrors', { errors: result.errorCount })}`; // Add translation
        // Could update rowsWithErrors state here if service returns detailed errors
        // For now, just a general message.
        console.error("Import errors:", result.errors);
      }
      showInfoToast(summaryMsg); // Use info toast for the summary message
      // setImportSummary(summaryMsg); // If you want to display it in the dialog before closing

      if (onImportCompleted) onImportCompleted(); // This could trigger a list refresh
      setIsOpen(false); // Close dialog

    } catch (err: any) {
      console.error("Failed to import products batch:", err);
      setProcessingError(t('productImportDialog.errorDuringImport', { message: err.message })); // Add translation
      // setImportSummary(t('productImportDialog.errorDuringImport', { message: err.message }));
    } finally {
      setIsProcessing(false); // Reset processing state
      // Reset file selection and summary details for next import
      setSelectedFile(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      setShowSummary(false);
      setValidProductsToImport([]);
      setRowsWithErrors([]);
      setTotalRowsRead(0);
      setFileNameForSummary('');
    }
  };

  const handleDialogClose = () => {
    if (isProcessing) return; // Prevent closing while processing
    setSelectedFile(null);
    setProcessingError(null);
    // setImportSummary(null);
    // setParsedRows([]);
    // setValidProducts([]);
    // setProductsWithErrors([]);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('productImportDialog.title')}</DialogTitle> {/* Add translation */}
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* File Upload Section */}
          <div>
            <Label htmlFor="product-import-file" className="mb-2 block font-medium">
              {t('productImportDialog.selectFileLabel')} {/* Add translation */}
            </Label>
            <div className="flex items-center space-x-2">
                <Input
                    id="product-import-file"
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
            </div>
            {selectedFile && (
              <div className="mt-3 flex items-center text-sm text-muted-foreground">
                <FileTextIcon className="mr-2 h-4 w-4" />
                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
            {processingError && (
                <p className="mt-2 text-sm text-destructive flex items-center">
                    <AlertCircleIcon className="mr-1 h-4 w-4"/> {processingError}
                </p>
            )}
          </div>

          {/* Download Template Link */}
          <div>
            <a
              href="/templates/product_import_template.csv" // TODO: Create and place this template file in public/templates
              download="product_import_template.csv"
              className="text-sm text-primary hover:underline"
            >
              {t('productImportDialog.downloadTemplateLink')}
            </a>
            <p className="text-xs text-muted-foreground mt-1">
              {t('productImportDialog.templateInstructions')}
            </p>
          </div>

          {/* File Processing Button - only show if file selected and not yet processed or summary shown */}
          {selectedFile && !showSummary && (
            <Button
                type="button"
                onClick={handleProcessFile}
                disabled={isProcessing}
                className="w-full mt-4"
            >
                {isProcessing ? t('productImportDialog.processingButton') : t('productImportDialog.processFileButton')}
            </Button>
          )}

          {/* Pre-import Summary & Error Display Area */}
          {showSummary && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>{t('productImportDialog.summaryTitle')} - {fileNameForSummary}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>{t('productImportDialog.totalRowsRead', { count: totalRowsRead })}</p>
                <p className="text-green-600">{t('productImportDialog.validRows', { count: validProductsToImport.length })}</p>
                <p className={rowsWithErrors.length > 0 ? "text-destructive" : ""}>
                  {t('productImportDialog.rowsWithErrors', { count: rowsWithErrors.length })}
                </p>

                {rowsWithErrors.length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-semibold text-sm mb-1">{t('productImportDialog.errorsFoundTitle')}</h4>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-muted/50 text-xs">
                      {rowsWithErrors.map((item, index) => (
                        <div key={index} className="mb-2 pb-1 border-b border-dashed">
                          <p><strong>{t('productImportDialog.rowNumber', { number: item.rowIndex })}:</strong></p>
                          <pre className="whitespace-pre-wrap break-all text-xs opacity-75">{JSON.stringify(item.rowData, null, 2)}</pre>
                          <ul className="list-disc list-inside text-destructive">
                            {item.errors.map((err, i) => <li key={i}>{err}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isProcessing}>
            {t('cancel')}
          </Button>
          {/* Conditionally show Process File or Import Products button */}
          {!showSummary && selectedFile && (
             <Button
                type="button"
                onClick={handleProcessFile}
                disabled={isProcessing}
            >
                {isProcessing ? t('productImportDialog.processingButton') : t('productImportDialog.processFileButton')}
            </Button>
          )}
          {showSummary && validProductsToImport.length > 0 && (
            <Button
              type="button"
              onClick={handleImportValidatedProducts}
              disabled={isProcessing} // This state should be for the actual import process
            >
              {isProcessing /* TODO: use a specific isImporting state */
                ? t('productImportDialog.importingButton') /* Add translation */
                : t('productImportDialog.importButton', { count: validProductsToImport.length }) /* Add translation */}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportDialog;
