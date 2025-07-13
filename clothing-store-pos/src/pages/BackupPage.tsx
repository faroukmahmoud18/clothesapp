import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { backupLocal, restoreLocal } from '@/backup/backupService';
import { showErrorToast } from '@/lib/toast';

const BackupPage: React.FC = () => {
  const { t } = useTranslation();
  const [restorePath, setRestorePath] = useState('');

  const handleRestore = () => {
    if (restorePath) {
      restoreLocal(restorePath);
    } else {
      showErrorToast('Please select a backup file to restore.');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{t('backupAndRestore')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('localBackup')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={backupLocal}>{t('createBackup')}</Button>
          <div className="flex items-center gap-2">
            <input
              type="file"
              onChange={(e) => setRestorePath(e.target.files?.[0]?.path || '')}
            />
            <Button onClick={handleRestore} disabled={!restorePath}>
              {t('restoreBackup')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupPage;
