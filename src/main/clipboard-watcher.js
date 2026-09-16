const { app, clipboard, nativeImage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const store = require('./store');

class ClipboardWatcher {
  constructor() {
    this.timer = null;
    this.lastImageHash = null;
    this.onNewSnipCallback = null;
  }

  getSnapVaultFolder() {
    const picturesDir = app.getPath('pictures');
    const snapVaultDir = path.join(picturesDir, 'SnapVault');
    if (!fs.existsSync(snapVaultDir)) {
      fs.mkdirSync(snapVaultDir, { recursive: true });
    }
    return snapVaultDir;
  }

  calculateHash(buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  init(onNewSnipCallback) {
    this.onNewSnipCallback = onNewSnipCallback;

    // Check if initial clipboard has an image, hash it so we don't duplicate on startup
    try {
      if (typeof clipboard.readImage === 'function') {
        const initialImg = clipboard.readImage();
        if (initialImg && typeof initialImg.isEmpty === 'function' && !initialImg.isEmpty()) {
          this.lastImageHash = this.calculateHash(initialImg.toPNG());
        }
      }
    } catch (e) {
      // clipboard might be locked by another process
    }

    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.checkClipboard();
    }, 1200);
  }

  checkClipboard() {
    const settings = store.get('settings') || {};
    if (!settings.autoSaveClipboard) return;

    try {
      const img = clipboard.readImage();
      if (img.isEmpty()) return;

      const pngBuffer = img.toPNG();
      if (!pngBuffer || pngBuffer.length === 0) return;

      const hash = this.calculateHash(pngBuffer);
      if (hash === this.lastImageHash) {
        return;
      }

      this.lastImageHash = hash;
      this.saveImage(pngBuffer, 'Auto-saved from clipboard');
    } catch (err) {
      console.error('Clipboard check error:', err);
    }
  }

  saveImage(pngBuffer, sourceDescription = 'Clipboard snip') {
    try {
      const folder = this.getSnapVaultFolder();
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const filename = `Snip_${timestamp}.png`;
      const filePath = path.join(folder, filename);

      fs.writeFileSync(filePath, pngBuffer);

      if (Notification.isSupported() && (store.get('settings') || {}).notifications !== false) {
        const notif = new Notification({
          title: 'SnapVault - Screenshot Captured',
          body: `${sourceDescription}: ${filename}`,
          silent: false
        });
        notif.show();
      }

      if (this.onNewSnipCallback) {
        this.onNewSnipCallback(filePath);
      }

      return filePath;
    } catch (err) {
      console.error('Failed to save clipboard snip:', err);
      return null;
    }
  }

  saveCurrentNow() {
    const img = clipboard.readImage();
    if (img.isEmpty()) return null;
    const pngBuffer = img.toPNG();
    return this.saveImage(pngBuffer, 'Manual clipboard capture');
  }

  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

module.exports = new ClipboardWatcher();
