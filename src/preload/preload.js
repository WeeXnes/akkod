const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('akkod', {
  platform: process.platform,
  getVersion: () => ipcRenderer.invoke('app:version'),
  saveFirstBackup: (json) => ipcRenderer.invoke('backup:first', String(json)),
  openBackups: () => ipcRenderer.invoke('backup:open'),
  saveFile: (name, content) => ipcRenderer.invoke('file:save', String(name), String(content)),
  openFile: () => ipcRenderer.invoke('file:open'),
  systemStatus: () => ipcRenderer.invoke('system:status'),
  installUdevRule: () => ipcRenderer.invoke('system:installUdev'),
  getAutostart: () => ipcRenderer.invoke('autostart:get'),
  setAutostart: (on) => ipcRenderer.invoke('autostart:set', !!on),
  onAutostartChanged: (fn) => {
    const handler = (_e, on) => fn(!!on);
    ipcRenderer.on('autostart:changed', handler);
    return () => ipcRenderer.removeListener('autostart:changed', handler);
  }
});
