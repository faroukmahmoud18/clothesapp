import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { backupLocal, restoreLocal, backupToGoogleDrive } from '@/backup/backupService';

const BackupPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{t('backupAndRestore')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('localBackup')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={backupLocal}>{t('createBackup')}</Button>
          <Button onClick={restoreLocal}>{t('restoreBackup')}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('cloudBackup')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={backupToGoogleDrive}>{t('backupToGoogleDrive')}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('cloudBackup')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={backupToGoogleDrive}>{t('backupToGoogleDrive')}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupPage;
