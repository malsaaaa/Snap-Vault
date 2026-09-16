const { app } = require('electron');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const store = require('./store');

class ScreenshotWatcher {
  constructor() {
    this.watcher = null;
    this.onUpdateCallback = null;
    this.monitoredFolders = [];
    this.debounceTimeout = null;
  }

  getSnapVaultFolder() {
    const picturesDir = app.getPath('pictures');
    const snapVaultDir = path.join(picturesDir, 'SnapVault');
    if (!fs.existsSync(snapVaultDir)) {
      fs.mkdirSync(snapVaultDir, { recursive: true });
    }
    return snapVaultDir;
  }

  getDefaultWindowsScreenshotFolder() {
    const picturesDir = app.getPath('pictures');
    const screenshotsDir = path.join(picturesDir, 'Screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    return screenshotsDir;
  }

  getMonitoredFolders() {
    const folders = [
      this.getDefaultWindowsScreenshotFolder(),
      this.getSnapVaultFolder()
    ];
    const custom = store.get('customWatchFolders') || [];
    for (const f of custom) {
      if (fs.existsSync(f) && !folders.includes(f)) {
        folders.push(f);
      }
    }
    return folders;
  }

  init(onUpdateCallback) {
    this.onUpdateCallback = onUpdateCallback;
    this.monitoredFolders = this.getMonitoredFolders();

    if (this.watcher) {
      this.watcher.close();
    }

    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp'];

    this.watcher = chokidar.watch(this.monitoredFolders, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      depth: 0,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      },
      ignoreInitial: false
    });

    const triggerUpdate = (eventType, filePath) => {
      if (filePath) {
        const ext = path.extname(filePath).toLowerCase();
        if (!validExtensions.includes(ext)) return;
      }
      if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        if (this.onUpdateCallback) {
          this.onUpdateCallback(eventType, filePath);
        }
      }, 250);
    };

    this.watcher
      .on('add', (filePath) => triggerUpdate('add', filePath))
      .on('change', (filePath) => triggerUpdate('change', filePath))
      .on('unlink', (filePath) => triggerUpdate('unlink', filePath))
      .on('error', (error) => console.error('Watcher error:', error));

    console.log('Watching screenshot folders:', this.monitoredFolders);
  }

  refreshFolders() {
    this.init(this.onUpdateCallback);
  }

  getAllScreenshots() {
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp'];
    const results = [];
    const seenPaths = new Set();
    const folders = this.getMonitoredFolders();

    for (const folder of folders) {
      if (!fs.existsSync(folder)) continue;
      try {
        const files = fs.readdirSync(folder);
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (!validExtensions.includes(ext)) continue;

          const fullPath = path.join(folder, file);
          if (seenPaths.has(fullPath)) continue;
          seenPaths.add(fullPath);

          try {
            const stats = fs.statSync(fullPath);
            if (!stats.isFile()) continue;

            const isClip = folder === this.getSnapVaultFolder();
            results.push({
              id: fullPath,
              path: fullPath,
              name: file,
              size: stats.size,
              birthtime: stats.birthtimeMs || stats.mtimeMs,
              mtime: stats.mtimeMs,
              isFavorite: store.isFavorite(fullPath),
              tags: store.getTags(fullPath),
              note: store.getNote(fullPath),
              groups: store.getScreenshotGroups(fullPath),
              isClipboardSnip: isClip,
              folder: folder
            });
          } catch (e) {
            // file might be locked or deleted
          }
        }
      } catch (err) {
        console.error('Error reading folder:', folder, err);
      }
    }

    // Sort newest first
    results.sort((a, b) => b.birthtime - a.birthtime);
    return results;
  }
}

module.exports = new ScreenshotWatcher();
