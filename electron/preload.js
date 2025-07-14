// preload.js
const { contextBridge, ipcRenderer } = require('electron')
console.log('Preload.js loaded successfully!')
contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer,
  getAssetPath: (relativePath) => {
    return path.resolve(__dirname, relativePath);
  },
  loginSuccess: (username) => ipcRenderer.invoke('login-success', username),
  getMemories: () => ipcRenderer.invoke('get-memories'),
  getMemoryByPassword: (password) => ipcRenderer.invoke('get-memory-by-password', password),
  addMemory: (title, content, password, unlockTime) => ipcRenderer.invoke('add-memory', title, content, password, unlockTime),
  closeWindow: () => ipcRenderer.send('close-window'),
  maximizeWindow: () => ipcRenderer.send('toggle-maximize'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  startDrag: () => ipcRenderer.send('start-drag'),
  openDevTools: () => ipcRenderer.send('open-dev-tools'),
  openFile: () => ipcRenderer.invoke('open-file'),
  openFolder: () => ipcRenderer.invoke(),
  getConfig: () => ipcRenderer.invoke('get-config'),
});
