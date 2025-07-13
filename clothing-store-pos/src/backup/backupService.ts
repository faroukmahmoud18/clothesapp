import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

const getDbPath = () => {
  return path.join(app.getPath('userData'), 'pos-database.db');
};

export const backupLocal = () => {
  const dbPath = getDbPath();
  const backupPath = path.join(app.getPath('downloads'), `backup-${new Date().getTime()}.db`);

  try {
    fs.copyFileSync(dbPath, backupPath);
    showSuccessToast(`Backup created at ${backupPath}`);
  } catch (error) {
    console.error('Failed to create local backup:', error);
    showErrorToast('Failed to create local backup.');
  }
};

export const restoreLocal = (backupPath: string) => {
  const dbPath = getDbPath();

  try {
    fs.copyFileSync(backupPath, dbPath);
    showSuccessToast('Backup restored successfully.');
  } catch (error) {
    console.error('Failed to restore local backup:', error);
    showErrorToast('Failed to restore local backup.');
  }
};
