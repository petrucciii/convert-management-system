const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronPrint', {
  printPage: () => ipcRenderer.invoke('print:page'),
  savePagePdf: (defaultName) => ipcRenderer.invoke('print:save-pdf', defaultName),
});

contextBridge.exposeInMainWorld('electronConfig', {
  apiBaseUrl: process.env.ELECTRON_API_BASE_URL || null,
});
