// @/customers/components/CustomerFormDialog.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Customer } from '@/customers/types';
import * as syncService from '@/sync/syncService';
import { useAuthStore } from '@/store/authStore';
import { showErrorToast, showSuccessToast } from '@/lib/toast'; // Import toast service

interface CustomerFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onCustomerRegistered?: (customer: Customer) => void; // Callback after successful registration
  // customerToEdit?: Customer | null; // For future edit functionality
}

// Define the shape of the form data, excluding fields auto-generated or not directly edited
type CustomerFormData = Omit<Customer, 'id' | 'loyaltyPoints' | 'createdAt' | 'updatedAt' | 'memberCode' | 'branchId'> & {
  memberCode?: string; // Allow optional manual input of member code
  branchId?: string;
};

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  isOpen,
  setIsOpen,
  onCustomerRegistered,
  // customerToEdit
}) => {
  const { t } = useTranslation();
  const currentBranchId = useAuthStore((state) => state.currentBranchId);

  const initialFormData: CustomerFormData = {
    name: '',
    phone: '',
    email: '',
    address: '',
    memberCode: '', // Optional manual entry
    // branchId will be set from currentBranchId
  };
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Add effect to populate form if customerToEdit is provided (for future edit mode)
  // useEffect(() => {
  //   if (customerToEdit) {
  //     setFormData({ ...customerToEdit });
  //   } else {
  //     setFormData(initialFormData);
  //   }
  // }, [customerToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.phone.trim()) {
      showErrorToast('customerForm.errorNamePhoneRequired');
      setError(t('customerForm.errorNamePhoneRequired'));
      return;
    }
    // Basic phone validation (e.g., mostly digits, certain length) could be added
    // Example: if (!/^\d{10,15}$/.test(formData.phone)) { setError(t('customerForm.errorInvalidPhone')); return; }


    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        branchId: currentBranchId || undefined, // Add current branch ID
      };
      const newCustomer = await syncService.registerCustomer(payload);
      setIsSaving(false);
      setIsOpen(false);
      setFormData(initialFormData); // Reset form
      if (onCustomerRegistered) {
        onCustomerRegistered(newCustomer);
      }
      showSuccessToast('customerForm.successRegistered', { name: newCustomer.name });
    } catch (err: any) {
      setIsSaving(false);
      console.error("Failed to register customer:", err);
      let errorMessageKey = 'customerForm.errorGeneric';
      let errorOptions: any = { message: err.message };

      // Check for unique constraint errors (e.g., phone already exists)
      if (err.message && err.message.toLowerCase().includes('unique constraint failed: customers.phone')) {
        errorMessageKey = 'customerForm.errorPhoneExists';
        errorOptions = { phone: formData.phone };
      } else if (err.message && formData.memberCode && err.message.toLowerCase().includes('unique constraint failed: customers.membercode')) {
        errorMessageKey = 'customerForm.errorMemberCodeExists';
        errorOptions = { memberCode: formData.memberCode };
      }

      showErrorToast(errorMessageKey, errorOptions);
      setError(t(errorMessageKey, errorOptions)); // Also update the static error display
    }
  };

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isSaving) { setIsOpen(open); if (!open) { setFormData(initialFormData); setError(null); } } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          {/* TODO: Title for edit mode: t('customerForm.editTitle') */}
          <DialogTitle>{t('customerForm.addTitle')}</DialogTitle> {/* Add translation */}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}

          <div>
            <Label htmlFor="name">{t('customerForm.nameLabel')}</Label> {/* Add translation */}
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required className={commonInputClass} />
          </div>
          <div>
            <Label htmlFor="phone">{t('customerForm.phoneLabel')}</Label> {/* Add translation */}
            <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required className={commonInputClass} />
          </div>
          <div>
            <Label htmlFor="email">{t('customerForm.emailLabel')}</Label> {/* Add translation */}
            <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} className={commonInputClass} />
          </div>
          <div>
            <Label htmlFor="address">{t('customerForm.addressLabel')}</Label> {/* Add translation */}
            <Input id="address" name="address" value={formData.address || ''} onChange={handleChange} className={commonInputClass} />
          </div>
           <div>
            <Label htmlFor="memberCode">{t('customerForm.memberCodeLabelOptional')}</Label> {/* Add translation */}
            <Input id="memberCode" name="memberCode" value={formData.memberCode || ''} onChange={handleChange} className={commonInputClass} placeholder={t('customerForm.memberCodePlaceholder')}/> {/* Add translation */}
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>{t('cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('customerForm.savingButton') : t('customerForm.saveButton')} {/* Add translations */}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerFormDialog;
