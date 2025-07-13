import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { QRCode } from 'qrcode.react';
import { Customer } from '../types';

interface CustomerQRCodeDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  customer: Customer | null;
}

const CustomerQRCodeDialog: React.FC<CustomerQRCodeDialogProps> = ({ isOpen, setIsOpen, customer }) => {
  const { t } = useTranslation();

  if (!customer) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('customerQRCode')}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <QRCode value={customer.memberCode || customer.phone} size={256} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerQRCodeDialog;
