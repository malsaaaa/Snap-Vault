import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderPlus, 
  Trash2, 
  FolderCheck, 
  Keyboard, 
  Bell, 
  Clipboard, 
  AppWindow 
} from 'lucide-react';

export default function SettingsModal({ onClose }) {
  const [settings, setSettings] = useState({
    autoSaveClipboard: true,
    minimizeToTrayOnClose: true,
    notifications: true,
    globalHotkey: 'CommandOrControl+Shift+S'
  });
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    if (window.snapAPI) {
      window.snapAPI.getSettings().then((s) => s && setSettings(s));
      window.snapAPI.getWatchFolders().then((f) => f && setFolders(f));
    }
  }, []);

  const handleToggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    if (window.snapAPI) {
      window.snapAPI.updateSettings(updated);
    }
  };

  const handleAddFolder = async () => {
    if (window.snapAPI) {
      const selected = await window.snapAPI.selectFolder();
      if (selected) {
        const updatedList = await window.snapAPI.addWatchFolder(selected);
        setFolders(updatedList);
      }
    }
  };

  const handleRemoveFolder = async (folderPath) => {
    if (window.snapAPI) {
      const updatedList = await window.snapAPI.removeWatchFolder(folderPath);
      setFolders(updatedList);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>SnapVault Preferences</h2>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Clipboard Watcher Toggle */}
          <div className="setting-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clipboard size={20} color="#6366f1" />
              <div>
                <div className="setting-text-title">Auto-Capture Clipboard Snips</div>
                <div className="setting-text-desc">
                  Automatically save screenshots snipped via <span className="kbd">Win + Shift + S</span> or <span className="kbd">PrtScn</span>
                </div>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.autoSaveClipboard}
                onChange={() => handleToggle('autoSaveClipboard')}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Minimize to Tray */}
          <div className="setting-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AppWindow size={20} color="#06b6d4" />
              <div>
                <div className="setting-text-title">Minimize to System Tray</div>
                <div className="setting-text-desc">Keep running in the background when the window is closed</div>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.minimizeToTrayOnClose}
                onChange={() => handleToggle('minimizeToTrayOnClose')}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Desktop Notifications */}
          <div className="setting-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bell size={20} color="#f59e0b" />
              <div>
                <div className="setting-text-title">Windows Notifications</div>
                <div className="setting-text-desc">Show a notification when a new screenshot is detected or saved</div>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={() => handleToggle('notifications')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Monitored Folders Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Monitored Screenshot Folders</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Folders continuously watched for image files</div>
            </div>
            <button className="btn-primary" onClick={handleAddFolder} style={{ height: '28px', fontSize: '11px' }}>
              <FolderPlus size={13} />
              <span>Add Folder</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
            {folders.map((folder, index) => (
              <div
                key={folder}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <FolderCheck size={15} color="#10b981" />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={folder}>
                    {folder}
                  </span>
                </div>
                {index >= 2 && (
                  <button
                    className="btn-icon"
                    style={{ width: '24px', height: '24px', color: '#f87171' }}
                    onClick={() => handleRemoveFolder(folder)}
                    title="Remove folder from watch list"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Global Hotkey Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <Keyboard size={20} color="#818cf8" />
          <div style={{ fontSize: '12px' }}>
            Press <span className="kbd">Ctrl + Shift + S</span> anywhere in Windows to instantly summon or hide SnapVault.
          </div>
        </div>
      </div>
    </div>
  );
}
