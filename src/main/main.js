const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, shell, clipboard, nativeImage, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const watcher = require('./watcher');
const clipboardWatcher = require('./clipboard-watcher');
const store = require('./store');

let mainWindow = null;
let tray = null;
app.isQuitting = false;

const { pathToFileURL } = require('url');

// Register custom protocol for local image loading
protocol.registerSchemesAsPrivileged([
  { 
    scheme: 'snap', 
    privileges: { 
      bypassCSP: true, 
      standard: true, 
      secure: true, 
      supportFetchAPI: true,
      corsEnabled: true
    } 
  }
]);

function createTrayIcon() {
  // A clean 32x32 PNG data URL representing a sleek purple camera / snapshot aperture
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="#6366f1"/>
    <circle cx="16" cy="17" r="6" fill="none" stroke="#ffffff" stroke-width="2.2"/>
    <path d="M10 11 L13 8 L19 8 L22 11 Z" fill="#ffffff"/>
    <rect x="7" y="11" width="18" height="13" rx="2.5" fill="none" stroke="#ffffff" stroke-width="2.2"/>
    <circle cx="21" cy="14" r="1.2" fill="#ffffff"/>
  </svg>`;
  return nativeImage.createFromBuffer(Buffer.from(svg));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 880,
    minHeight: 620,
    frame: false,
    backgroundColor: '#0b0f17',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      webSecurity: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    const loadDevServer = () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.loadURL('http://localhost:5173').catch(() => {
        setTimeout(loadDevServer, 400);
      });
    };
    loadDevServer();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    const settings = store.get('settings') || {};
    if (!app.isQuitting && settings.minimizeToTrayOnClose !== false) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function toggleWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    if (mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      mainWindow.focus();
    }
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function setupTray() {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('SnapVault - Screenshot Manager');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open SnapVault',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Capture From Clipboard',
      click: () => {
        const saved = clipboardWatcher.saveCurrentNow();
        if (saved && mainWindow) {
          mainWindow.webContents.send('screenshots:updated');
        }
      }
    },
    {
      label: 'Open Screenshots Folder',
      click: () => {
        const folder = watcher.getDefaultWindowsScreenshotFolder();
        shell.openPath(folder);
      }
    },
    { type: 'separator' },
    {
      label: 'Quit SnapVault',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    toggleWindow();
  });
}

function registerShortcuts() {
  globalShortcut.unregisterAll();
  const settings = store.get('settings') || {};
  const hotkey = settings.globalHotkey || 'CommandOrControl+Shift+S';

  try {
    const registered = globalShortcut.register(hotkey, () => {
      toggleWindow();
    });
    if (!registered) {
      console.warn('Failed to register global hotkey:', hotkey);
    }
  } catch (err) {
    console.error('Error registering global shortcut:', err);
  }
}

// Setup IPC Handlers
function setupIPC() {
  // Window controls
  ipcMain.on('window:control', (event, action) => {
    if (!mainWindow) return;
    if (action === 'minimize') mainWindow.minimize();
    if (action === 'maximize') {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
    if (action === 'close') {
      mainWindow.close();
    }
  });

  // Screenshots query
  ipcMain.handle('screenshots:get', async () => {
    return watcher.getAllScreenshots();
  });

  // Favorite toggle
  ipcMain.handle('screenshot:toggleFavorite', async (event, filePath) => {
    return store.toggleFavorite(filePath);
  });

  // Tags
  ipcMain.handle('screenshot:setTags', async (event, { filePath, tags }) => {
    store.setTags(filePath, tags);
    return true;
  });

  // Note
  ipcMain.handle('screenshot:setNote', async (event, { filePath, note }) => {
    store.setNote(filePath, note);
    return true;
  });

  // Groups & Playlists
  ipcMain.handle('groups:get', async () => {
    return store.getGroups();
  });

  ipcMain.handle('groups:create', async (event, { name, color }) => {
    return store.createGroup(name, color);
  });

  ipcMain.handle('groups:delete', async (event, groupId) => {
    return store.deleteGroup(groupId);
  });

  ipcMain.handle('groups:rename', async (event, { groupId, name, color }) => {
    return store.renameGroup(groupId, name, color);
  });

  ipcMain.handle('groups:addToGroup', async (event, { groupId, filePath }) => {
    return store.addToGroup(groupId, filePath);
  });

  ipcMain.handle('groups:removeFromGroup', async (event, { groupId, filePath }) => {
    return store.removeFromGroup(groupId, filePath);
  });

  ipcMain.handle('groups:setScreenshotGroups', async (event, { filePath, groupIds }) => {
    return store.setScreenshotGroups(filePath, groupIds);
  });

  // Rename Screenshot
  ipcMain.handle('screenshot:rename', async (event, { filePath, newName }) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }

      const dir = path.dirname(filePath);
      const originalExt = path.extname(filePath);

      let cleanName = newName.trim().replace(/[<>:"/\\|?*]/g, '');
      if (!cleanName) {
        return { success: false, error: 'Filename cannot be empty or contain invalid characters' };
      }

      if (!path.extname(cleanName)) {
        cleanName = `${cleanName}${originalExt}`;
      }

      const newPath = path.join(dir, cleanName);

      if (newPath.toLowerCase() !== filePath.toLowerCase() && fs.existsSync(newPath)) {
        return { success: false, error: 'A file with this name already exists' };
      }

      fs.renameSync(filePath, newPath);
      store.migrateFilePath(filePath, newPath);

      return {
        success: true,
        oldPath: filePath,
        newPath: newPath,
        newName: cleanName
      };
    } catch (err) {
      console.error('Rename error:', err);
      return { success: false, error: err.message };
    }
  });

  // Delete
  ipcMain.handle('screenshot:delete', async (event, filePath) => {
    try {
      await shell.trashItem(filePath);
      return { success: true };
    } catch (err) {
      console.error('Delete error:', err);
      return { success: false, error: err.message };
    }
  });

  // Copy to clipboard
  ipcMain.handle('screenshot:copyToClipboard', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const image = nativeImage.createFromPath(filePath);
        clipboard.writeImage(image);
        return { success: true };
      }
      return { success: false, error: 'File not found' };
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return { success: false, error: err.message };
    }
  });

  // Show in Explorer
  ipcMain.handle('screenshot:showInFolder', async (event, filePath) => {
    shell.showItemInFolder(filePath);
    return true;
  });

  // Open with system default viewer
  ipcMain.handle('screenshot:openImage', async (event, filePath) => {
    shell.openPath(filePath);
    return true;
  });

  // Read data URL as reliable fallback
  ipcMain.handle('screenshot:readDataUrl', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
        const mime = ext === 'jpg' ? 'jpeg' : ext;
        const buf = fs.readFileSync(filePath);
        return `data:image/${mime};base64,${buf.toString('base64')}`;
      }
    } catch (err) {
      console.error('Read data URL error:', err);
    }
    return null;
  });

  // Drag-and-drop to external apps
  ipcMain.on('screenshot:startDrag', (event, filePath) => {
    if (fs.existsSync(filePath)) {
      const icon = nativeImage.createFromPath(filePath).resize({ width: 64, height: 64 });
      event.sender.startDrag({
        file: filePath,
        icon: icon
      });
    }
  });

  // Clipboard manual save
  ipcMain.handle('clipboard:saveNow', async () => {
    return clipboardWatcher.saveCurrentNow();
  });

  // Settings
  ipcMain.handle('settings:get', async () => {
    return store.get('settings');
  });

  ipcMain.handle('settings:update', async (event, newSettings) => {
    const updated = store.updateSettings(newSettings);
    registerShortcuts();
    return updated;
  });

  // Watch Folders
  ipcMain.handle('folders:get', async () => {
    return watcher.getMonitoredFolders();
  });

  ipcMain.handle('folders:select', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Folder to Watch for Screenshots'
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('folders:add', async (event, folderPath) => {
    if (!folderPath) return false;
    const current = store.get('customWatchFolders') || [];
    if (!current.includes(folderPath)) {
      current.push(folderPath);
      store.set('customWatchFolders', current);
      watcher.refreshFolders();
    }
    return watcher.getMonitoredFolders();
  });

  ipcMain.handle('folders:remove', async (event, folderPath) => {
    const current = store.get('customWatchFolders') || [];
    const filtered = current.filter(f => f !== folderPath);
    store.set('customWatchFolders', filtered);
    watcher.refreshFolders();
    return watcher.getMonitoredFolders();
  });
}

// App lifecycle
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Protocol handler to stream local files safely
    protocol.handle('snap', (request) => {
      try {
        const parsedUrl = new URL(request.url);
        let filePath = parsedUrl.searchParams.get('path');
        if (!filePath) {
          let raw = decodeURIComponent(parsedUrl.pathname);
          if (process.platform === 'win32' && raw.startsWith('/')) raw = raw.slice(1);
          filePath = raw;
        }
        if (filePath && fs.existsSync(filePath)) {
          return require('electron').net.fetch(pathToFileURL(filePath).toString());
        }
      } catch (err) {
        console.error('Protocol handle error:', err);
      }
      return new Response('Not found', { status: 404 });
    });

    createWindow();
    setupTray();
    registerShortcuts();
    setupIPC();

    // Start folder watcher
    watcher.init((eventType, filePath) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('screenshots:updated');
        if (eventType === 'add' && filePath) {
          mainWindow.webContents.send('screenshot:added', filePath);
        }
      }
    });

    // Start clipboard watcher
    clipboardWatcher.init((filePath) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('screenshots:updated');
        mainWindow.webContents.send('screenshot:added', filePath);
      }
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    clipboardWatcher.destroy();
  });
}
