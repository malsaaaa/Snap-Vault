import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScreenshotGrid from './components/ScreenshotGrid';
import LightboxModal from './components/LightboxModal';
import SettingsModal from './components/SettingsModal';
import CreateGroupModal from './components/CreateGroupModal';
import { CheckCircle, ArrowUpDown } from 'lucide-react';

export default function App() {
  const [screenshots, setScreenshots] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, icon = null) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const loadScreenshots = useCallback(async () => {
    if (window.snapAPI) {
      try {
        const list = await window.snapAPI.getScreenshots();
        setScreenshots(list || []);
      } catch (err) {
        console.error('Failed to load screenshots:', err);
      }
    }
  }, []);

  const loadGroups = useCallback(async () => {
    if (window.snapAPI && window.snapAPI.getGroups) {
      try {
        const grps = await window.snapAPI.getGroups();
        setGroups(grps || []);
      } catch (err) {
        console.error('Failed to load groups:', err);
      }
    }
  }, []);

  useEffect(() => {
    loadScreenshots();
    loadGroups();

    if (window.snapAPI) {
      const unsubUpdate = window.snapAPI.onScreenshotsUpdated(() => {
        loadScreenshots();
      });

      const unsubAdd = window.snapAPI.onScreenshotAdded((filePath) => {
        loadScreenshots();
        const filename = filePath.split(/[/\\]/).pop();
        showToast(`New screenshot captured: ${filename}`);
      });

      return () => {
        if (unsubUpdate) unsubUpdate();
        if (unsubAdd) unsubAdd();
      };
    }
  }, [loadScreenshots, loadGroups]);

  // Handle Hotkeys (Ctrl+F for search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered and Sorted Screenshots calculation
  const filteredScreenshots = useMemo(() => {
    const now = new Date();
    const todayTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // 1. Filter
    const filtered = screenshots.filter((item) => {
      // Group filter (playlist)
      if (selectedGroup) {
        if (!item.groups || !item.groups.includes(selectedGroup)) return false;
      } else {
        // Tab filter (only if not viewing a specific custom group)
        if (activeTab === 'favorites' && !item.isFavorite) return false;
        if (activeTab === 'today') {
          const itemTime = item.birthtime || item.mtime;
          if (itemTime < todayTimestamp) return false;
        }
        if (activeTab === 'clipboard' && !item.isClipboardSnip) return false;
      }

      // Tag filter
      if (selectedTag) {
        if (!item.tags || !item.tags.includes(selectedTag)) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(query);
        const noteMatch = item.note && item.note.toLowerCase().includes(query);
        const tagMatch = item.tags && item.tags.some(t => t.toLowerCase().includes(query));
        if (!nameMatch && !noteMatch && !tagMatch) return false;
      }

      return true;
    });

    // 2. Sort
    return [...filtered].sort((a, b) => {
      const timeA = a.birthtime || a.mtime || 0;
      const timeB = b.birthtime || b.mtime || 0;

      switch (sortBy) {
        case 'date-asc':
          return timeA - timeB;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'size-desc':
          return (b.size || 0) - (a.size || 0);
        case 'size-asc':
          return (a.size || 0) - (b.size || 0);
        case 'date-desc':
        default:
          return timeB - timeA;
      }
    });
  }, [screenshots, activeTab, selectedTag, selectedGroup, searchQuery, sortBy]);

  // Aggregate counts, groupCounts and tags
  const { counts, groupCounts, tagList, totalSizeMb } = useMemo(() => {
    const now = new Date();
    const todayTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let favCount = 0;
    let todayCount = 0;
    let clipCount = 0;
    let totalBytes = 0;
    const tagMap = {};
    const grpCountMap = {};

    for (const item of screenshots) {
      totalBytes += item.size || 0;
      if (item.isFavorite) favCount++;
      const itemTime = item.birthtime || item.mtime;
      if (itemTime >= todayTimestamp) todayCount++;
      if (item.isClipboardSnip) clipCount++;

      if (item.tags) {
        for (const t of item.tags) {
          tagMap[t] = (tagMap[t] || 0) + 1;
        }
      }

      if (item.groups) {
        for (const g of item.groups) {
          grpCountMap[g] = (grpCountMap[g] || 0) + 1;
        }
      }
    }

    const tagsArray = Object.keys(tagMap).map(k => ({ name: k, count: tagMap[k] }));

    return {
      counts: {
        all: screenshots.length,
        favorites: favCount,
        today: todayCount,
        clipboard: clipCount
      },
      groupCounts: grpCountMap,
      tagList: tagsArray,
      totalSizeMb: (totalBytes / (1024 * 1024)).toFixed(1)
    };
  }, [screenshots]);

  // Group Management Handlers
  const handleCreateGroup = async (name, color) => {
    if (window.snapAPI && window.snapAPI.createGroup) {
      const newGroup = await window.snapAPI.createGroup(name, color);
      if (newGroup) {
        setGroups(prev => [...prev, newGroup]);
        setSelectedGroup(newGroup.id);
        setActiveTab(null);
        setSelectedTag(null);
        showToast(`Created group "${newGroup.name}"`);
      }
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.snapAPI && window.snapAPI.deleteGroup) {
      await window.snapAPI.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (selectedGroup === groupId) {
        setSelectedGroup(null);
        setActiveTab('all');
      }
      loadScreenshots();
      showToast('Group deleted');
    }
  };

  const handleToggleGroup = async (groupId, filePath) => {
    const item = screenshots.find(s => s.path === filePath);
    if (!item || !window.snapAPI) return;

    const currentGroups = item.groups || [];
    let updatedGroups;
    if (currentGroups.includes(groupId)) {
      updatedGroups = currentGroups.filter(id => id !== groupId);
    } else {
      updatedGroups = [...currentGroups, groupId];
    }

    await window.snapAPI.setScreenshotGroups(filePath, updatedGroups);
    setScreenshots(prev => prev.map(s => 
      s.path === filePath ? { ...s, groups: updatedGroups } : s
    ));

    if (selectedScreenshot && selectedScreenshot.path === filePath) {
      setSelectedScreenshot(prev => ({ ...prev, groups: updatedGroups }));
    }

    const targetGroup = groups.find(g => g.id === groupId);
    const grpName = targetGroup ? targetGroup.name : 'group';
    showToast(updatedGroups.includes(groupId) ? `Added to "${grpName}"` : `Removed from "${grpName}"`);
  };

  const handleDropToGroup = async (groupId, filePath) => {
    const item = screenshots.find(s => s.path === filePath);
    if (!item || !window.snapAPI) return;

    const currentGroups = item.groups || [];
    if (!currentGroups.includes(groupId)) {
      const updatedGroups = [...currentGroups, groupId];
      await window.snapAPI.setScreenshotGroups(filePath, updatedGroups);
      setScreenshots(prev => prev.map(s => 
        s.path === filePath ? { ...s, groups: updatedGroups } : s
      ));

      const targetGroup = groups.find(g => g.id === groupId);
      const grpName = targetGroup ? targetGroup.name : 'group';
      showToast(`Added to "${grpName}"`);
    }
  };

  // Action handlers
  const handleToggleFavorite = async (filePath) => {
    if (window.snapAPI) {
      const isFav = await window.snapAPI.toggleFavorite(filePath);
      setScreenshots(prev => prev.map(item => 
        item.path === filePath ? { ...item, isFavorite: isFav } : item
      ));
      if (selectedScreenshot && selectedScreenshot.path === filePath) {
        setSelectedScreenshot(prev => ({ ...prev, isFavorite: isFav }));
      }
      showToast(isFav ? 'Added to favorites' : 'Removed from favorites');
    }
  };

  const handleCopyToClipboard = async (filePath) => {
    if (window.snapAPI) {
      const res = await window.snapAPI.copyToClipboard(filePath);
      if (res && res.success) {
        showToast('Image copied to clipboard!');
      }
    }
  };

  const handleShowInFolder = (filePath) => {
    if (window.snapAPI) {
      window.snapAPI.showInFolder(filePath);
    }
  };

  const handleOpenImage = (filePath) => {
    if (window.snapAPI) {
      window.snapAPI.openImage(filePath);
    }
  };

  const handleDelete = async (filePath) => {
    if (window.snapAPI) {
      const res = await window.snapAPI.deleteScreenshot(filePath);
      if (res && res.success) {
        setScreenshots(prev => prev.filter(i => i.path !== filePath));
        showToast('Moved to Recycle Bin');
      }
    }
  };

  const handleRename = async (filePath, newName) => {
    if (!window.snapAPI || !newName || !newName.trim()) return false;
    const res = await window.snapAPI.renameScreenshot(filePath, newName.trim());
    if (res && res.success) {
      setScreenshots(prev => prev.map(item => 
        item.path === filePath 
          ? { ...item, id: res.newPath, path: res.newPath, name: res.newName }
          : item
      ));

      if (selectedScreenshot && selectedScreenshot.path === filePath) {
        setSelectedScreenshot(prev => ({
          ...prev,
          id: res.newPath,
          path: res.newPath,
          name: res.newName
        }));
      }

      showToast(`Renamed to "${res.newName}"`);
      return true;
    } else {
      showToast(res?.error || 'Failed to rename screenshot');
      return false;
    }
  };

  const handleUpdateTags = async (filePath, newTags) => {
    if (window.snapAPI) {
      await window.snapAPI.setTags(filePath, newTags);
      setScreenshots(prev => prev.map(item => 
        item.path === filePath ? { ...item, tags: newTags } : item
      ));
      if (selectedScreenshot && selectedScreenshot.path === filePath) {
        setSelectedScreenshot(prev => ({ ...prev, tags: newTags }));
      }
    }
  };

  const handleUpdateNote = async (filePath, newNote) => {
    if (window.snapAPI) {
      await window.snapAPI.setNote(filePath, newNote);
      setScreenshots(prev => prev.map(item => 
        item.path === filePath ? { ...item, note: newNote } : item
      ));
      if (selectedScreenshot && selectedScreenshot.path === filePath) {
        setSelectedScreenshot(prev => ({ ...prev, note: newNote }));
      }
    }
  };

  const handleCaptureClipboard = async () => {
    if (window.snapAPI) {
      const res = await window.snapAPI.saveClipboardNow();
      if (res) {
        showToast('Captured clipboard snip!');
        loadScreenshots();
      } else {
        showToast('No image currently in clipboard');
      }
    }
  };

  const handleOpenFolder = () => {
    if (window.snapAPI) {
      window.snapAPI.getWatchFolders().then((folders) => {
        if (folders && folders.length > 0) {
          window.snapAPI.showInFolder(folders[0]);
        }
      });
    }
  };

  const handleWindowControl = (action) => {
    if (window.snapAPI) {
      window.snapAPI.windowControl(action);
    }
  };

  // Lightbox Next/Prev navigation
  const currentIndex = selectedScreenshot 
    ? filteredScreenshots.findIndex(s => s.id === selectedScreenshot.id) 
    : -1;
  const hasNext = currentIndex >= 0 && currentIndex < filteredScreenshots.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) setSelectedScreenshot(filteredScreenshots[currentIndex + 1]);
  };
  const handlePrev = () => {
    if (hasPrev) setSelectedScreenshot(filteredScreenshots[currentIndex - 1]);
  };

  const currentGroupObj = groups.find(g => g.id === selectedGroup);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onCaptureClipboard={handleCaptureClipboard}
        onOpenFolder={handleOpenFolder}
        onWindowControl={handleWindowControl}
      />

      {/* Main Body */}
      <div className="main-layout">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={counts}
          tags={tagList}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          groups={groups}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          groupCounts={groupCounts}
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          onDeleteGroup={handleDeleteGroup}
          onDropToGroup={handleDropToGroup}
          onOpenSettings={() => setIsSettingsOpen(true)}
          totalSizeMb={totalSizeMb}
        />

        {/* Content Area */}
        <main className="content-area">
          <div className="content-subheader">
            <div className="subheader-title-row">
              <h2 className="subheader-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedGroup && currentGroupObj && (
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: currentGroupObj.color || '#6366f1',
                      boxShadow: `0 0 10px ${currentGroupObj.color || '#6366f1'}`
                    }}
                  />
                )}
                {selectedGroup && currentGroupObj ? currentGroupObj.name : (
                  selectedTag ? `#${selectedTag}` : (
                    activeTab === 'all' ? 'All Screenshots' :
                    activeTab === 'favorites' ? 'Favorites' :
                    activeTab === 'today' ? "Today's Captures" : 'Clipboard Snips'
                  )
                )}
              </h2>
              <span className="subheader-subtitle">
                {filteredScreenshots.length} {filteredScreenshots.length === 1 ? 'screenshot' : 'screenshots'}
              </span>
            </div>

            {/* Sorting controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpDown size={14} color="var(--text-muted)" />
              <select
                className="search-input"
                style={{
                  height: '30px',
                  width: 'auto',
                  padding: '0 8px 0 10px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                title="Sort screenshots"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="size-desc">Largest Size</option>
                <option value="size-asc">Smallest Size</option>
              </select>
            </div>
          </div>

          {/* Screenshot Grid */}
          <ScreenshotGrid
            screenshots={filteredScreenshots}
            viewMode={viewMode}
            groups={groups}
            onSelectScreenshot={setSelectedScreenshot}
            onToggleFavorite={handleToggleFavorite}
            onCopyToClipboard={handleCopyToClipboard}
            onShowInFolder={handleShowInFolder}
            onDelete={handleDelete}
            onRename={handleRename}
            onToggleGroup={handleToggleGroup}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          />
        </main>
      </div>

      {/* Lightbox Modal */}
      {selectedScreenshot && (
        <LightboxModal
          screenshot={selectedScreenshot}
          groups={groups}
          onClose={() => setSelectedScreenshot(null)}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onToggleFavorite={handleToggleFavorite}
          onCopyToClipboard={handleCopyToClipboard}
          onShowInFolder={handleShowInFolder}
          onOpenImage={handleOpenImage}
          onDelete={handleDelete}
          onRename={handleRename}
          onUpdateTags={handleUpdateTags}
          onUpdateNote={handleUpdateNote}
          onToggleGroup={handleToggleGroup}
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        />
      )}

      {/* Create Group Modal */}
      {isCreateGroupOpen && (
        <CreateGroupModal
          onClose={() => setIsCreateGroupOpen(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <CheckCircle size={16} color="#10b981" />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
