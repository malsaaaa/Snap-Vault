const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('snapAPI', {
  getScreenshots: () => ipcRenderer.invoke('screenshots:get'),
  toggleFavorite: (filePath) => ipcRenderer.invoke('screenshot:toggleFavorite', filePath),
  setTags: (filePath, tags) => ipcRenderer.invoke('screenshot:setTags', { filePath, tags }),
  setNote: (filePath, note) => ipcRenderer.invoke('screenshot:setNote', { filePath, note }),
  renameScreenshot: (filePath, newName) => ipcRenderer.invoke('screenshot:rename', { filePath, newName }),
  deleteScreenshot: (filePath) => ipcRenderer.invoke('screenshot:delete', filePath),
  copyToClipboard: (filePath) => ipcRenderer.invoke('screenshot:copyToClipboard', filePath),
  showInFolder: (filePath) => ipcRenderer.invoke('screenshot:showInFolder', filePath),
  openImage: (filePath) => ipcRenderer.invoke('screenshot:openImage', filePath),
  readDataUrl: (filePath) => ipcRenderer.invoke('screenshot:readDataUrl', filePath),
  startDrag: (filePath) => ipcRenderer.send('screenshot:startDrag', filePath),
  saveClipboardNow: () => ipcRenderer.invoke('clipboard:saveNow'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  selectFolder: () => ipcRenderer.invoke('folders:select'),
  addWatchFolder: (folderPath) => ipcRenderer.invoke('folders:add', folderPath),
  removeWatchFolder: (folderPath) => ipcRenderer.invoke('folders:remove', folderPath),
  getWatchFolders: () => ipcRenderer.invoke('folders:get'),
  
  // Groups & Playlists
  getGroups: () => ipcRenderer.invoke('groups:get'),
  createGroup: (name, color) => ipcRenderer.invoke('groups:create', { name, color }),
  deleteGroup: (groupId) => ipcRenderer.invoke('groups:delete', groupId),
  renameGroup: (groupId, name, color) => ipcRenderer.invoke('groups:rename', { groupId, name, color }),
  addToGroup: (groupId, filePath) => ipcRenderer.invoke('groups:addToGroup', { groupId, filePath }),
  removeFromGroup: (groupId, filePath) => ipcRenderer.invoke('groups:removeFromGroup', { groupId, filePath }),
  setScreenshotGroups: (filePath, groupIds) => ipcRenderer.invoke('groups:setScreenshotGroups', { filePath, groupIds }),
  
  windowControl: (action) => ipcRenderer.send('window:control', action),
  
  onScreenshotsUpdated: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('screenshots:updated', handler);
    return () => ipcRenderer.removeListener('screenshots:updated', handler);
  },
  onScreenshotAdded: (callback) => {
    const handler = (event, filePath) => callback(filePath);
    ipcRenderer.on('screenshot:added', handler);
    return () => ipcRenderer.removeListener('screenshot:added', handler);
  }
});
