import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  FolderOpen, 
  ExternalLink, 
  Trash2, 
  Star, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Tag as TagIcon,
  FileText,
  FolderPlus,
  Edit2
} from 'lucide-react';

import SmartImage from './SmartImage';
import GroupMenu from './GroupMenu';

export default function LightboxModal({
  screenshot,
  groups = [],
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  onToggleFavorite,
  onCopyToClipboard,
  onShowInFolder,
  onOpenImage,
  onDelete,
  onRename,
  onUpdateTags,
  onUpdateNote,
  onToggleGroup,
  onOpenCreateGroup
}) {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(screenshot?.tags || []);
  const [note, setNote] = useState(screenshot?.note || '');
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  useEffect(() => {
    setZoom(1);
    setCopied(false);
    setTags(screenshot?.tags || []);
    setNote(screenshot?.note || '');
    setIsRenaming(false);
    setRenameInput(screenshot?.name || '');
  }, [screenshot?.id]);

  useEffect(() => {
    setZoom(1);
    setCopied(false);
    setTags(screenshot?.tags || []);
    setNote(screenshot?.note || '');
  }, [screenshot?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrev, onNext, onPrev, onClose]);

  if (!screenshot) return null;

  const handleSaveRename = async () => {
    if (renameInput.trim() && renameInput.trim() !== screenshot.name) {
      const ok = await onRename(screenshot.path, renameInput.trim());
      if (ok) setIsRenaming(false);
    } else {
      setIsRenaming(false);
    }
  };

  const handleCopy = () => {
    onCopyToClipboard(screenshot.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (cleanTag && !tags.includes(cleanTag)) {
        const newTags = [...tags, cleanTag];
        setTags(newTags);
        onUpdateTags(screenshot.path, newTags);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    onUpdateTags(screenshot.path, newTags);
  };

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNote(val);
    onUpdateNote(screenshot.path, val);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {/* Main Viewer */}
        <div className="lightbox-image-viewer">
          <SmartImage
            filePath={screenshot.path}
            alt={screenshot.name}
            className="lightbox-img"
            style={{ transform: `scale(${zoom})` }}
            onLoad={(e) => {
              setDimensions({
                width: e.target.naturalWidth,
                height: e.target.naturalHeight
              });
            }}
          />

          {/* Zoom Controls Pill */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '6px 12px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <button
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}
              title="Zoom out"
            >
              <ZoomOut size={15} />
            </button>
            <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', minWidth: '40px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              onClick={() => setZoom(z => Math.min(3, z + 0.2))}
              title="Zoom in"
            >
              <ZoomIn size={15} />
            </button>
            <button
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              onClick={() => setZoom(1)}
              title="Reset Zoom"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Navigation Arrows */}
          {hasPrev && (
            <button className="lightbox-nav-btn prev" onClick={onPrev} title="Previous Screenshot (Left Arrow)">
              <ChevronLeft size={24} />
            </button>
          )}

          {hasNext && (
            <button className="lightbox-nav-btn next" onClick={onNext} title="Next Screenshot (Right Arrow)">
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Sidebar Info & Tools */}
        <div className="lightbox-sidebar">
          <div className="lightbox-sidebar-header">
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Inspector</h3>
            <button className="btn-icon" onClick={onClose} title="Close (Esc)">
              <X size={18} />
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-primary" 
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={handleCopy}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Image!' : 'Copy to Clipboard'}</span>
            </button>

            <button
              className={`btn-icon ${screenshot.isFavorite ? 'active' : ''}`}
              onClick={() => onToggleFavorite(screenshot.path)}
              title="Favorite"
            >
              <Star size={16} fill={screenshot.isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Metadata Section */}
          <div className="detail-row">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="detail-label">Filename</span>
              {!isRenaming && (
                <button
                  type="button"
                  className="btn-icon"
                  style={{ width: '22px', height: '22px' }}
                  onClick={() => {
                    setRenameInput(screenshot.name);
                    setIsRenaming(true);
                  }}
                  title="Rename screenshot"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>

            {isRenaming ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <input
                  type="text"
                  autoFocus
                  className="search-input"
                  style={{ height: '30px', padding: '0 8px', fontSize: '12px' }}
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setIsRenaming(false);
                  }}
                />
                <button
                  type="button"
                  className="btn-icon"
                  style={{ width: '28px', height: '28px', color: '#10b981' }}
                  onClick={handleSaveRename}
                  title="Save (Enter)"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  style={{ width: '28px', height: '28px' }}
                  onClick={() => setIsRenaming(false)}
                  title="Cancel (Esc)"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span
                className="detail-value"
                style={{ cursor: 'pointer' }}
                onDoubleClick={() => {
                  setRenameInput(screenshot.name);
                  setIsRenaming(true);
                }}
                title="Double-click or click pencil to rename"
              >
                {screenshot.name}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="detail-row">
              <span className="detail-label">Resolution</span>
              <span className="detail-value mono">
                {dimensions.width ? `${dimensions.width} × ${dimensions.height}` : 'Loading...'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Size</span>
              <span className="detail-value mono">{formatFileSize(screenshot.size)}</span>
            </div>
          </div>

          <div className="detail-row">
            <span className="detail-label">Captured Date</span>
            <span className="detail-value mono">
              {new Date(screenshot.birthtime || screenshot.mtime).toLocaleString()}
            </span>
          </div>

          {/* Groups & Playlists Section */}
          <div className="detail-row" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="detail-label">Playlists & Groups</span>
              <button
                type="button"
                className="btn-icon"
                style={{ width: '22px', height: '22px' }}
                onClick={() => setShowGroupMenu(!showGroupMenu)}
                title="Add to group"
              >
                <FolderPlus size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
              {(!screenshot.groups || screenshot.groups.length === 0) ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not in any group</span>
              ) : (
                screenshot.groups.map((gId) => {
                  const g = groups.find(x => x.id === gId);
                  if (!g) return null;
                  return (
                    <span
                      key={g.id}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: `${g.color || '#6366f1'}25`,
                        border: `1px solid ${g.color || '#6366f1'}66`,
                        color: g.color || '#a5b4fc',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer'
                      }}
                      onClick={() => onToggleGroup(g.id, screenshot.path)}
                      title="Click to remove from group"
                    >
                      ● {g.name}
                      <X size={11} />
                    </span>
                  );
                })
              )}
            </div>

            {showGroupMenu && (
              <GroupMenu
                groups={groups}
                screenshotGroups={screenshot.groups || []}
                onToggleGroup={(groupId) => onToggleGroup(groupId, screenshot.path)}
                onOpenCreateGroup={onOpenCreateGroup}
                onClose={() => setShowGroupMenu(false)}
              />
            )}
          </div>

          {/* Tags Section */}
          <div className="detail-row">
            <span className="detail-label">Tags</span>
            <div className="tag-list" style={{ marginTop: '4px' }}>
              {tags.map((t) => (
                <span 
                  key={t} 
                  className="tag-chip"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  onClick={() => handleRemoveTag(t)}
                  title="Click to remove tag"
                >
                  #{t}
                  <X size={10} />
                </span>
              ))}
            </div>
            <input
              type="text"
              className="search-input"
              style={{ height: '30px', marginTop: '6px', padding: '0 10px' }}
              placeholder="Add tag and press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
          </div>

          {/* Notes Section */}
          <div className="detail-row">
            <span className="detail-label">Note</span>
            <textarea
              className="search-input"
              style={{
                height: '80px',
                padding: '8px 10px',
                resize: 'none',
                marginTop: '4px',
                lineHeight: '1.4'
              }}
              placeholder="Add quick notes or context about this screenshot..."
              value={note}
              onChange={handleNoteChange}
            />
          </div>

          {/* Bottom Actions */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="nav-item"
              onClick={() => onShowInFolder(screenshot.path)}
              style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="nav-item-left">
                <FolderOpen size={15} />
                <span>Show in File Explorer</span>
              </div>
            </button>

            <button
              className="nav-item"
              onClick={() => onOpenImage(screenshot.path)}
              style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="nav-item-left">
                <ExternalLink size={15} />
                <span>Open in Default App</span>
              </div>
            </button>

            <button
              className="nav-item"
              onClick={() => {
                onDelete(screenshot.path);
                onClose();
              }}
              style={{ padding: '8px 10px', color: '#f87171', background: 'rgba(248, 113, 113, 0.08)' }}
            >
              <div className="nav-item-left">
                <Trash2 size={15} />
                <span>Move to Recycle Bin</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
