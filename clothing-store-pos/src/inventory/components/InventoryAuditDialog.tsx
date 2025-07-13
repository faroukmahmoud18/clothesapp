import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Product } from '@/pos/types';
import * as syncService from '@/sync/syncService';
import { showErrorToast } from '@/lib/toast';
import { Barcode } from 'lucide-react';

interface InventoryAuditDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onAuditComplete: () => void;
}

const InventoryAuditDialog: React.FC<InventoryAuditDialogProps> = ({ isOpen, setIsOpen, onAuditComplete }) => {
  const { t } = useTranslation();
  const [scannedProducts, setScannedProducts] = useState<Map<string, { product: Product, scannedQuantity: number }>>(new Map());
  const [barcode, setBarcode] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      barcodeInputRef.current?.focus();
    }
  }, [isOpen]);

  const handleBarcodeScan = async () => {
    if (!barcode) return;
    const product = await syncService.getProductById(barcode);
    if (product) {
      setScannedProducts(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(product.id);
        if (existing) {
          existing.scannedQuantity++;
        } else {
          newMap.set(product.id, { product, scannedQuantity: 1 });
        }
        return newMap;
      });
    } else {
      showErrorToast(t('productNotFound'));
    }
    setBarcode('');
  };

  const handleSaveAudit = async () => {
    const auditData = Array.from(scannedProducts.values()).map(({ product, scannedQuantity }) => ({
      productId: product.id,
      scannedQuantity,
    }));
    await syncService.saveInventoryAudit(auditData);
    onAuditComplete();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('inventoryAudit')}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Barcode className="h-6 w-6" />
          <Input
            ref={barcodeInputRef}
            type="text"
            placeholder={t('scanBarcode')}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBarcodeScan();
              }
            }}
          />
        </div>
        <div className="mt-4 h-64 overflow-y-auto">
          <ul>
            {Array.from(scannedProducts.values()).map(({ product, scannedQuantity }) => (
              <li key={product.id} className="flex justify-between">
                <span>{product.name}</span>
                <span>{scannedQuantity}</span>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
          <Button onClick={handleSaveAudit}>{t('saveAudit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryAuditDialog;
