import React, { useState } from 'react';
import { 
  Star, 
  Copy, 
  Check, 
  FolderOpen, 
  Trash2, 
  FolderPlus,
  Image as ImageIcon,
  Edit2,
  X
} from 'lucide-react';

import SmartImage from './SmartImage';
import GroupMenu from './GroupMenu';

export default function ScreenshotGrid({
  screenshots,
  viewMode,
  groups = [],
  onSelectScreenshot,
  onToggleFavorite,
  onCopyToClipboard,
  onShowInFolder,
  onDelete,
  onRename,
  onToggleGroup,
  onOpenCreateGroup
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingCardName, setEditingCardName] = useState('');

  const handleCopy = (e, item) => {
    e.stopPropagation();
    onCopyToClipboard(item.path);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === item.id ? null : curr));
    }, 1800);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTime = (ms) => {
    if (!ms) return '';
    const d = new Date(ms);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group by relative date
  const groupScreenshots = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - 7 * 86400000;

    const buckets = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: []
    };

    for (const item of screenshots) {
      const time = item.birthtime || item.mtime;
      if (time >= today) {
        buckets.today.push(item);
      } else if (time >= yesterday) {
        buckets.yesterday.push(item);
      } else if (time >= sevenDaysAgo) {
        buckets.thisWeek.push(item);
      } else {
        buckets.earlier.push(item);
      }
    }

    return [
      { title: 'Today', items: buckets.today },
      { title: 'Yesterday', items: buckets.yesterday },
      { title: 'This Week', items: buckets.thisWeek },
      { title: 'Earlier', items: buckets.earlier }
    ].filter(g => g.items.length > 0);
  };

  const dateGroups = groupScreenshots();

  if (screenshots.length === 0) {
    return (
      <div className="empty-state">
        <ImageIcon className="empty-icon" />
        <div className="empty-title">No screenshots found</div>
        <p className="empty-desc">
          Screenshots taken with <span className="kbd">Win + PrtScn</span> or <span className="kbd">Win + Shift + S</span> will appear here automatically!
        </p>
      </div>
    );
  }

  return (
    <div className="gallery-scroll">
      {dateGroups.map((group) => (
        <div key={group.title} className="date-group">
          <div className="date-group-header">
            <h3 className="date-group-title">{group.title}</h3>
            <div className="date-group-line"></div>
            <span className="date-group-count">{group.items.length} items</span>
          </div>

          <div className={`screenshot-grid ${viewMode}`}>
            {group.items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="screenshot-card"
                  onClick={() => onSelectScreenshot(item)}
                  draggable
                  onDragStart={(e) => {
                    e.preventDefault();
                    if (window.snapAPI && window.snapAPI.startDrag) {
                      window.snapAPI.startDrag(item.path);
                    }
                  }}
                  title="Click to preview, or drag out to Discord/Explorer"
                >
                  <div className="card-thumb-wrap">
                    <SmartImage 
                      filePath={item.path} 
                      alt={item.name} 
                      className="card-thumb" 
                      loading="lazy" 
                    />

                    {/* Hover Overlay */}
                    <div className="card-overlay">
                      <div className="overlay-top" style={{ position: 'relative' }}>
                        {item.isClipboardSnip ? (
                          <span className="badge-source">Snip</span>
                        ) : <span />}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className={`action-round-btn ${item.groups && item.groups.length > 0 ? 'favorite-active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === item.id ? null : item.id);
                            }}
                            title="Add to Group / Playlist"
                          >
                            <FolderPlus size={14} />
                          </button>

                          <button
                            className={`action-round-btn ${item.isFavorite ? 'favorite-active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(item.path);
                            }}
                            title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star size={14} fill={item.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        {/* Group Selector Menu */}
                        {activeMenuId === item.id && (
                          <GroupMenu
                            groups={groups}
                            screenshotGroups={item.groups || []}
                            onToggleGroup={(groupId) => onToggleGroup(groupId, item.path)}
                            onOpenCreateGroup={onOpenCreateGroup}
                            onClose={() => setActiveMenuId(null)}
                          />
                        )}
                      </div>

                      <div className="overlay-bottom">
                        <button
                          className="action-pill-btn"
                          onClick={(e) => handleCopy(e, item)}
                          title="Copy image to Windows clipboard"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check size={13} color="#10b981" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          className="action-round-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onShowInFolder(item.path);
                          }}
                          title="Show in File Explorer"
                        >
                          <FolderOpen size={14} />
                        </button>

                        <button
                          className="action-round-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.path);
                          }}
                          title="Delete (Move to Recycle Bin)"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Metadata */}
                  <div className="card-info">
                    <div className="card-title-row">
                      {editingCardId === item.id ? (
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            autoFocus
                            className="search-input"
                            style={{ height: '26px', padding: '0 6px', fontSize: '11px', flex: 1 }}
                            value={editingCardName}
                            onChange={(e) => setEditingCardName(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                if (editingCardName.trim() && editingCardName.trim() !== item.name) {
                                  await onRename(item.path, editingCardName.trim());
                                }
                                setEditingCardId(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingCardId(null);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: '22px', height: '22px', color: '#10b981' }}
                            onClick={async () => {
                              if (editingCardName.trim() && editingCardName.trim() !== item.name) {
                                await onRename(item.path, editingCardName.trim());
                              }
                              setEditingCardId(null);
                            }}
                            title="Save name"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: '22px', height: '22px' }}
                            onClick={() => setEditingCardId(null)}
                            title="Cancel"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span 
                            className="card-filename" 
                            title={item.name}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingCardId(item.id);
                              setEditingCardName(item.name);
                            }}
                          >
                            {item.name}
                          </span>
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: '20px', height: '20px', opacity: 0.5 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCardId(item.id);
                              setEditingCardName(item.name);
                            }}
                            title="Rename"
                          >
                            <Edit2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="card-meta-row">
                      <span>{formatFileSize(item.size)}</span>
                      <span>{formatTime(item.birthtime || item.mtime)}</span>
                    </div>

                    {/* Group Badges */}
                    {item.groups && item.groups.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                        {item.groups.map((gId) => {
                          const g = groups.find(x => x.id === gId);
                          if (!g) return null;
                          return (
                            <span
                              key={g.id}
                              style={{
                                fontSize: '9px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: `${g.color || '#6366f1'}22`,
                                border: `1px solid ${g.color || '#6366f1'}55`,
                                color: g.color || '#a5b4fc'
                              }}
                            >
                              ● {g.name}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="tag-list">
                        {item.tags.map((t) => (
                          <span key={t} className="tag-chip">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
