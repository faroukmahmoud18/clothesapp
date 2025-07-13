import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Product } from '@/pos/types';
import JsBarcode from 'jsbarcode';

interface BarcodePrintingDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  productsToPrint: Product[];
}

const BarcodePrintingDialog: React.FC<BarcodePrintingDialogProps> = ({ isOpen, setIsOpen, productsToPrint }) => {
  const { t } = useTranslation();
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print Barcodes</title>');
        printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } .barcode-container { display: inline-block; text-align: center; margin: 10px; border: 1px solid #ccc; padding: 10px; } .barcode-svg { display: block; margin: 0 auto; } }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('printBarcodes')}</DialogTitle>
        </DialogHeader>
        <div ref={printAreaRef} className="p-4 grid grid-cols-3 gap-4">
          {productsToPrint.map(product => (
            <div key={product.id} className="barcode-container">
              <p>{product.name}</p>
              <svg className="barcode-svg" ref={el => {
                if (el) {
                  try {
                    JsBarcode(el, product.barcode || product.sku, {
                      format: "CODE128",
                      lineColor: "#000",
                      width: 2,
                      height: 50,
                      displayValue: true,
                      fontSize: 14,
                    });
                  } catch (e) {
                    console.error("JsBarcode error:", e);
                  }
                }
              }}></svg>
              <p>{product.sellingPrice.toFixed(2)} {t('currencyEGP')}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
          <Button onClick={handlePrint}>{t('print')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodePrintingDialog;
