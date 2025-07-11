// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

let dbPathGlobal: string | null = null;

ipcRenderer.on('db-path', (_event, path) => {
  console.log('[Preload] Received db-path:', path);
  dbPathGlobal = path;
});

contextBridge.exposeInMainWorld('electronApi', {
  getDbPath: () => dbPathGlobal,
  // Example of invoking a main process handler (not used for db-path yet, but good for reference)
  // invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});

// It's also common to expose specific functions rather than a generic invoke
// For example, if main process had a handler for 'get-user-data-path':
// contextBridge.exposeInMainWorld('electronPaths', {
//   getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
// });
