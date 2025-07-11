// @/customers/components/SelectCustomerDialog.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Customer } from '@/customers/types';
import * as syncService from '@/sync/syncService';
import { useCartStore } from '@/store/cartStore'; // To call setActiveCustomer
import CustomerFormDialog from './CustomerFormDialog'; // To open for new customer
import { SearchIcon, UserPlus2Icon } from 'lucide-react';

interface SelectCustomerDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onCustomerSelected?: (customer: Customer) => void; // Optional callback
}

const SelectCustomerDialog: React.FC<SelectCustomerDialogProps> = ({ isOpen, setIsOpen, onCustomerSelected }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);

  const setActiveCustomerInCart = useCartStore((state) => state.setActiveCustomer);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog is closed
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
      return;
    }

    // Optionally, fetch all or recent customers when dialog opens without search query
    // For now, we'll require a search to populate.
    // Or fetch some initial list:
    // handleSearchCustomers();
  }, [isOpen]);

  const handleSearchCustomers = async () => {
    if (!searchQuery.trim() && searchResults.length === 0) { // Avoid searching empty if results already there
        // Potentially fetch all customers if search is empty, or a default list
        // For now, let's clear results if search is cleared
        setSearchResults([]);
        setError(null);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const customers = await syncService.getCustomers(searchQuery.trim());
      setSearchResults(customers);
      if (customers.length === 0) {
        setError(t('selectCustomerDialog.noCustomersFound')); // Add translation
      }
    } catch (err: any) {
      console.error("Failed to search customers:", err);
      setError(t('selectCustomerDialog.errorSearching', { message: err.message })); // Add translation
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setActiveCustomerInCart(customer.id);
    if (onCustomerSelected) {
      onCustomerSelected(customer);
    }
    setIsOpen(false); // Close this dialog
  };

  const handleOpenNewCustomerForm = () => {
    setIsCustomerFormOpen(true);
  };

  const handleNewCustomerRegistered = (newCustomer: Customer) => {
    // Automatically select the newly registered customer
    handleSelectCustomer(newCustomer);
    // No need to close CustomerFormDialog here as it closes itself on successful save
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('selectCustomerDialog.title')}</DialogTitle> {/* Add translation */}
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex gap-2 items-center">
              <div className="relative flex-grow">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('selectCustomerDialog.searchPlaceholder')} {/* Add translation */}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomers()}
                />
              </div>
              <Button onClick={handleSearchCustomers} disabled={isLoading}>
                {isLoading ? t('selectCustomerDialog.searchingButton') : t('selectCustomerDialog.searchButton')} {/* Add translations */}
              </Button>
              <Button variant="outline" onClick={handleOpenNewCustomerForm} title={t('selectCustomerDialog.addNewButtonTitle')}>
                <UserPlus2Icon className="mr-2 h-4 w-4" /> {t('selectCustomerDialog.addNewButton')} {/* Add translations */}
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {searchResults.length > 0 && !isLoading && (
              <div className="max-h-60 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('customerForm.nameLabel')}</TableHead>
                      <TableHead>{t('customerForm.phoneLabel')}</TableHead>
                      <TableHead>{t('customerForm.memberCodeLabelOptional')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.memberCode || '-'}</TableCell>
                        <TableCell>
                          <Button variant="link" size="sm" onClick={() => handleSelectCustomer(customer)}>
                            {t('selectCustomerDialog.selectButton')} {/* Add translation */}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {searchResults.length === 0 && !error && !isLoading && searchQuery.trim() !== '' && (
                 <p className="text-center text-muted-foreground">{t('selectCustomerDialog.noCustomersFoundForQuery', { query: searchQuery })}</p> // Add translation
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t('cancel')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding a new customer */}
      <CustomerFormDialog
        isOpen={isCustomerFormOpen}
        setIsOpen={setIsCustomerFormOpen}
        onCustomerRegistered={handleNewCustomerRegistered}
      />
    </>
  );
};

export default SelectCustomerDialog;
