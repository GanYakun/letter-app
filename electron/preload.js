// preload.js
const { contextBridge, ipcRenderer } = require('electron')
console.log('Preload.js loaded successfully!')
contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer,
  getConfig: () => ipcRenderer.invoke('get-config'),
});
