# SnapVault 📸
> **The Modern Windows Screenshot Manager & Instant Access Vault**

SnapVault is a high-performance Windows desktop application designed to keep all your screenshots organized, searchable, and instantly accessible.

---

## ✨ Features

- 🔍 **Auto-Watch Windows Screenshots**:
  - Automatically detects and organizes captures from Windows default directory (`Pictures\Screenshots`) taken with `Win + PrtScn` or `PrtScn`.
  - Supports adding custom watch directories.

- 📋 **Clipboard Snip Auto-Capture**:
  - Seamlessly captures snipped images from `Win + Shift + S` or the Snipping Tool.
  - Keeps a historical timeline of all your clips in a dedicated library so you never lose unsaved snips.

- ⚡ **Global Instant Summon (`Ctrl + Shift + S`)**:
  - Summon or minimize SnapVault from any application or game with a single global hotkey.

- 🗂️ **System Tray Integration**:
  - Runs quietly in the background without cluttering your taskbar.
  - Right-click tray menu for quick capture, opening folders, or toggling visibility.

- 🎨 **Glassmorphic Dark UI**:
  - Tailored dark mode aesthetic with translucent glass surfaces and vibrant glowing badges.
  - Grouping by **Today**, **Yesterday**, **This Week**, and **Earlier**.
  - Standard Grid and Compact Grid view toggles.

- 🚀 **One-Click Actions & Drag-and-Drop**:
  - One-click copy image back to clipboard with instant visual confirmation.
  - Native Windows file drag: Drag any screenshot directly out of SnapVault into Discord, Slack, Photoshop, or web browsers.
  - Show directly in Windows Explorer or open in Windows default viewer.
  - Delete with safe move to Windows Recycle Bin.

- 🔎 **Fast Search, Tags & Notes**:
  - Instant search (`Ctrl + F`) filtering by filename, custom tags (`#bug`, `#design`, `#receipt`), or custom notes.
  - Built-in High-Resolution Lightbox Inspector with zoom, pan, and details sidebar.

---

## 🛠️ Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **Windows 10 / 11**

### 2. Development Mode
```bash
# Run both Vite dev server and Electron
npm run dev
```

### 3. Production Build & Launch
```bash
# Build the React frontend
npm run build

# Launch the Electron app in production mode
npm start
```

### 4. Create Windows Executable (`.exe`)
```bash
# Generate both Portable and Setup Installer .exe
npm run dist

# Generate standalone Portable .exe (single file, no install)
npm run dist:portable

# Generate Setup Installer .exe (with Desktop & Start Menu shortcuts)
npm run dist:installer
```
Your compiled `.exe` files will be saved in the `release/` directory!

---

## ⌨️ Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Shift + S` | Toggle SnapVault window anywhere in Windows |
| `Win + Shift + S` | Windows Snip (Auto-captured by SnapVault into gallery) |
| `Win + PrtScn` | Fullscreen Windows capture (Auto-detected in gallery) |
| `Ctrl + F` | Focus search bar in SnapVault |
| `Left / Right Arrow` | Navigate previous / next screenshot in Lightbox |
| `Escape` | Close Lightbox or Settings modal |
