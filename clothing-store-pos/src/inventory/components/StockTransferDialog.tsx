import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Product } from '@/pos/types';

interface StockTransferDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onTransferComplete: () => void;
}

const StockTransferDialog: React.FC<StockTransferDialogProps> = ({ isOpen, setIsOpen, onTransferComplete }) => {
  const { t } = useTranslation();
  const [fromBranch, setFromBranch] = useState('');
  const [toBranch, setToBranch] = useState('');
  const [productsToTransfer, setProductsToTransfer] = useState<{ product: Product, quantity: number }[]>([]);

  const handleSaveTransfer = () => {
    // Here you would typically save the stock transfer to the database.
    // This is a placeholder for that functionality.
    console.log('Stock transfer:', { fromBranch, toBranch, productsToTransfer });
    onTransferComplete();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('stockTransfer')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder={t('fromBranch')} value={fromBranch} onChange={(e) => setFromBranch(e.target.value)} />
          <Input placeholder={t('toBranch')} value={toBranch} onChange={(e) => setToBranch(e.target.value)} />
        </div>
        {/* Add a product selection and quantity input here */}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
          <Button onClick={handleSaveTransfer}>{t('saveTransfer')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockTransferDialog;
