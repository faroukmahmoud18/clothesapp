import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Customer } from '../types';
import * as syncService from '@/sync/syncService';

interface PointHistoryDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  customer: Customer | null;
}

const PointHistoryDialog: React.FC<PointHistoryDialogProps> = ({ isOpen, setIsOpen, customer }) => {
  const { t } = useTranslation();
  const [pointHistory, setPointHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      const fetchPointHistory = async () => {
        setIsLoading(true);
        const history = await syncService.getPointHistory(customer.id);
        setPointHistory(history);
        setIsLoading(false);
      };
      fetchPointHistory();
    }
  }, [isOpen, customer]);

  if (!customer) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('pointHistoryFor', { name: customer.name })}</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <p>{t('loadingPointHistory')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('activity')}</TableHead>
                  <TableHead className="text-right">{t('points')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pointHistory.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(entry.date).toLocaleString()}</TableCell>
                    <TableCell>{entry.activity}</TableCell>
                    <TableCell className="text-right">{entry.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PointHistoryDialog;
