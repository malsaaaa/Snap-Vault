const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class Store {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.storePath = path.join(this.userDataPath, 'snapvault-data.json');
    this.data = this.loadData();
  }

  getDefaults() {
    return {
      favorites: [],
      tags: {},      // filePath -> string[]
      notes: {},     // filePath -> string
      collections: [ // default collections
        { id: 'all', name: 'All Screenshots', icon: 'Layers' },
        { id: 'favorites', name: 'Favorites', icon: 'Star' },
        { id: 'today', name: 'Today', icon: 'Calendar' },
        { id: 'clipboard', name: 'Clipboard Snips', icon: 'Clipboard' }
      ],
      groups: [],     // array of { id, name, color, createdAt }
      groupItems: {}, // groupId -> string[] of filePaths
      customWatchFolders: [],
      settings: {
        autoSaveClipboard: true,
        globalHotkey: 'CommandOrControl+Shift+S',
        minimizeToTrayOnClose: true,
        startAtLogin: false,
        notifications: true,
        viewMode: 'grid', // 'grid' or 'compact' or 'list'
        sortBy: 'date-desc' // 'date-desc', 'date-asc', 'name-asc', 'name-desc', 'size-desc'
      }
    };
  }

  loadData() {
    try {
      if (fs.existsSync(this.storePath)) {
        const fileContent = fs.readFileSync(this.storePath, 'utf8');
        const parsed = JSON.parse(fileContent);
        return { ...this.getDefaults(), ...parsed };
      }
    } catch (err) {
      console.error('Error loading store data:', err);
    }
    return this.getDefaults();
  }

  saveData() {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving store data:', err);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.saveData();
  }

  toggleFavorite(filePath) {
    const favs = new Set(this.data.favorites || []);
    if (favs.has(filePath)) {
      favs.delete(filePath);
    } else {
      favs.add(filePath);
    }
    this.data.favorites = Array.from(favs);
    this.saveData();
    return this.data.favorites.includes(filePath);
  }

  isFavorite(filePath) {
    return (this.data.favorites || []).includes(filePath);
  }

  setTags(filePath, tags) {
    if (!this.data.tags) this.data.tags = {};
    this.data.tags[filePath] = Array.isArray(tags) ? tags : [];
    this.saveData();
  }

  getTags(filePath) {
    return (this.data.tags && this.data.tags[filePath]) || [];
  }

  setNote(filePath, note) {
    if (!this.data.notes) this.data.notes = {};
    this.data.notes[filePath] = note;
    this.saveData();
  }

  getNote(filePath) {
    return (this.data.notes && this.data.notes[filePath]) || '';
  }

  migrateFilePath(oldPath, newPath) {
    // 1. Favorites
    if (this.data.favorites && this.data.favorites.includes(oldPath)) {
      this.data.favorites = this.data.favorites.map(p => p === oldPath ? newPath : p);
    }

    // 2. Tags
    if (this.data.tags && this.data.tags[oldPath]) {
      this.data.tags[newPath] = this.data.tags[oldPath];
      delete this.data.tags[oldPath];
    }

    // 3. Notes
    if (this.data.notes && this.data.notes[oldPath]) {
      this.data.notes[newPath] = this.data.notes[oldPath];
      delete this.data.notes[oldPath];
    }

    // 4. Group items
    if (this.data.groupItems) {
      for (const groupId in this.data.groupItems) {
        if (Array.isArray(this.data.groupItems[groupId])) {
          this.data.groupItems[groupId] = this.data.groupItems[groupId].map(p => p === oldPath ? newPath : p);
        }
      }
    }

    this.saveData();
  }

  // --- Group / Playlist Methods ---
  getGroups() {
    return this.data.groups || [];
  }

  createGroup(name, color = '#6366f1') {
    if (!this.data.groups) this.data.groups = [];
    if (!this.data.groupItems) this.data.groupItems = {};
    
    const id = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newGroup = {
      id,
      name: name.trim() || 'Untitled Group',
      color: color || '#6366f1',
      createdAt: Date.now()
    };
    this.data.groups.push(newGroup);
    this.data.groupItems[id] = [];
    this.saveData();
    return newGroup;
  }

  deleteGroup(groupId) {
    if (this.data.groups) {
      this.data.groups = this.data.groups.filter(g => g.id !== groupId);
    }
    if (this.data.groupItems && this.data.groupItems[groupId]) {
      delete this.data.groupItems[groupId];
    }
    this.saveData();
    return true;
  }

  renameGroup(groupId, newName, newColor) {
    if (!this.data.groups) return false;
    const group = this.data.groups.find(g => g.id === groupId);
    if (group) {
      if (newName) group.name = newName.trim();
      if (newColor) group.color = newColor;
      this.saveData();
      return group;
    }
    return null;
  }

  addToGroup(groupId, filePath) {
    if (!this.data.groupItems) this.data.groupItems = {};
    if (!this.data.groupItems[groupId]) this.data.groupItems[groupId] = [];
    if (!this.data.groupItems[groupId].includes(filePath)) {
      this.data.groupItems[groupId].push(filePath);
      this.saveData();
    }
    return true;
  }

  removeFromGroup(groupId, filePath) {
    if (this.data.groupItems && this.data.groupItems[groupId]) {
      this.data.groupItems[groupId] = this.data.groupItems[groupId].filter(p => p !== filePath);
      this.saveData();
    }
    return true;
  }

  getScreenshotGroups(filePath) {
    const matched = [];
    if (!this.data.groupItems) return matched;
    for (const [groupId, files] of Object.entries(this.data.groupItems)) {
      if (Array.isArray(files) && files.includes(filePath)) {
        matched.push(groupId);
      }
    }
    return matched;
  }

  setScreenshotGroups(filePath, groupIds) {
    if (!this.data.groupItems) this.data.groupItems = {};
    const targetSet = new Set(groupIds || []);

    // Ensure all groups exist in groupItems
    for (const group of (this.data.groups || [])) {
      if (!this.data.groupItems[group.id]) {
        this.data.groupItems[group.id] = [];
      }
      const files = this.data.groupItems[group.id];
      const hasFile = files.includes(filePath);

      if (targetSet.has(group.id) && !hasFile) {
        files.push(filePath);
      } else if (!targetSet.has(group.id) && hasFile) {
        this.data.groupItems[group.id] = files.filter(f => f !== filePath);
      }
    }
    this.saveData();
    return this.getScreenshotGroups(filePath);
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveData();
    return this.data.settings;
  }
}

module.exports = new Store();
