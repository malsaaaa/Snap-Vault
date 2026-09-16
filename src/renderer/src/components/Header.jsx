import React from 'react';
import { 
  Camera, 
  Search, 
  X, 
  LayoutGrid, 
  Grid2x2, 
  ClipboardPaste, 
  Minus, 
  Square, 
  X as CloseIcon,
  FolderOpen
} from 'lucide-react';

export default function Header({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onCaptureClipboard,
  onOpenFolder,
  onWindowControl
}) {
  return (
    <header className="header-bar drag-region">
      {/* Brand */}
      <div className="brand-section no-drag">
        <div className="brand-logo">
          <Camera size={18} strokeWidth={2.4} />
        </div>
        <div className="brand-name">
          SnapVault
          <span className="brand-badge">Windows</span>
        </div>
      </div>

      {/* Center Search */}
      <div className="search-container no-drag">
        <Search size={15} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search by filename, tag, or date (Ctrl+F)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="search-clear" 
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Right Actions & Window Controls */}
      <div className="header-actions no-drag">
        <button 
          className="btn-primary"
          onClick={onCaptureClipboard}
          title="Save current image in clipboard to SnapVault"
        >
          <ClipboardPaste size={14} />
          <span>Save Clipboard</span>
        </button>

        <button 
          className="btn-icon" 
          onClick={onOpenFolder}
          title="Open Screenshots folder in Windows Explorer"
        >
          <FolderOpen size={16} />
        </button>

        <button
          className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
          title="Standard Grid View"
        >
          <LayoutGrid size={16} />
        </button>

        <button
          className={`btn-icon ${viewMode === 'compact' ? 'active' : ''}`}
          onClick={() => setViewMode('compact')}
          title="Compact Grid View"
        >
          <Grid2x2 size={16} />
        </button>

        {/* Windows titlebar buttons */}
        <div className="window-controls">
          <button 
            className="btn-window" 
            onClick={() => onWindowControl('minimize')}
            title="Minimize to Tray"
          >
            <Minus size={14} />
          </button>
          <button 
            className="btn-window" 
            onClick={() => onWindowControl('maximize')}
            title="Maximize"
          >
            <Square size={12} />
          </button>
          <button 
            className="btn-window close" 
            onClick={() => onWindowControl('close')}
            title="Close to Tray"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
