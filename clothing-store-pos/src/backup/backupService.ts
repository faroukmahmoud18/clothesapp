import { app, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { google } from 'googleapis';

const getDbPath = () => {
  return path.join(app.getPath('userData'), 'pos-database.db');
};

export const backupLocal = () => {
  const dbPath = getDbPath();
  dialog.showSaveDialog({
    title: 'Save Backup',
    defaultPath: `backup-${new Date().getTime()}.db`,
  }).then(({ filePath }) => {
    if (filePath) {
      try {
        fs.copyFileSync(dbPath, filePath);
        showSuccessToast(`Backup created at ${filePath}`);
      } catch (error) {
        console.error('Failed to create local backup:', error);
        showErrorToast('Failed to create local backup.');
      }
    }
  });
};

export const restoreLocal = () => {
  const dbPath = getDbPath();
  dialog.showOpenDialog({
    title: 'Restore Backup',
    properties: ['openFile'],
  }).then(({ filePaths }) => {
    if (filePaths && filePaths.length > 0) {
      const backupPath = filePaths[0];
      try {
        fs.copyFileSync(backupPath, dbPath);
        showSuccessToast('Backup restored successfully.');
      } catch (error) {
        console.error('Failed to restore local backup:', error);
        showErrorToast('Failed to restore local backup.');
      }
    }
  });
};

export const backupToGoogleDrive = async () => {
  const dbPath = getDbPath();
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });
  const fileName = `backup-${new Date().getTime()}.db`;
  const media = {
    mimeType: 'application/vnd.sqlite3',
    body: fs.createReadStream(dbPath),
  };
  try {
    await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'application/vnd.sqlite3',
      },
      media,
    });
    showSuccessToast('Backup to Google Drive successful.');
  } catch (error) {
    console.error('Failed to backup to Google Drive:', error);
    showErrorToast('Failed to backup to Google Drive.');
  }
};
