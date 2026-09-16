import React from 'react';
import { 
  Layers, 
  Star, 
  Calendar, 
  Clipboard, 
  Settings, 
  Tag as TagIcon,
  HardDrive,
  Folder,
  Plus,
  Trash2
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  counts,
  tags,
  selectedTag,
  setSelectedTag,
  groups = [],
  selectedGroup,
  setSelectedGroup,
  groupCounts = {},
  onOpenCreateGroup,
  onDeleteGroup,
  onDropToGroup,
  onOpenSettings,
  totalSizeMb
}) {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, groupId) => {
    e.preventDefault();
    const filePath = e.dataTransfer.getData('text/plain');
    if (filePath && onDropToGroup) {
      onDropToGroup(groupId, filePath);
    }
  };

  return (
    <aside className="sidebar">
      {/* Primary Navigation */}
      <div className="nav-section">
        <div className="nav-section-title">Library</div>
        
        <button
          className={`nav-item ${activeTab === 'all' && !selectedTag && !selectedGroup ? 'active' : ''}`}
          onClick={() => { setActiveTab('all'); setSelectedTag(null); setSelectedGroup(null); }}
        >
          <div className="nav-item-left">
            <Layers size={16} />
            <span>All Screenshots</span>
          </div>
          <span className="nav-count">{counts.all}</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'favorites' && !selectedTag && !selectedGroup ? 'active' : ''}`}
          onClick={() => { setActiveTab('favorites'); setSelectedTag(null); setSelectedGroup(null); }}
        >
          <div className="nav-item-left">
            <Star size={16} />
            <span>Favorites</span>
          </div>
          <span className="nav-count">{counts.favorites}</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'today' && !selectedTag && !selectedGroup ? 'active' : ''}`}
          onClick={() => { setActiveTab('today'); setSelectedTag(null); setSelectedGroup(null); }}
        >
          <div className="nav-item-left">
            <Calendar size={16} />
            <span>Today</span>
          </div>
          <span className="nav-count">{counts.today}</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'clipboard' && !selectedTag && !selectedGroup ? 'active' : ''}`}
          onClick={() => { setActiveTab('clipboard'); setSelectedTag(null); setSelectedGroup(null); }}
        >
          <div className="nav-item-left">
            <Clipboard size={16} />
            <span>Clipboard Snips</span>
          </div>
          <span className="nav-count">{counts.clipboard}</span>
        </button>
      </div>

      {/* Groups / Playlists Section */}
      <div className="nav-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px' }}>
          <div className="nav-section-title">Playlists & Groups</div>
          <button
            type="button"
            className="btn-icon"
            style={{ width: '22px', height: '22px' }}
            onClick={onOpenCreateGroup}
            title="Create new group / playlist"
          >
            <Plus size={13} />
          </button>
        </div>

        {groups.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 12px' }}>
            No groups created yet. Click <span style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={onOpenCreateGroup}>+ New</span> to create one!
          </div>
        ) : (
          groups.map((group) => {
            const isGroupActive = selectedGroup === group.id;
            const count = groupCounts[group.id] || 0;

            return (
              <div
                key={group.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, group.id)}
                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              >
                <button
                  className={`nav-item ${isGroupActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedGroup(isGroupActive ? null : group.id);
                    setSelectedTag(null);
                    if (!isGroupActive) setActiveTab(null);
                  }}
                  style={{ paddingRight: '32px' }}
                >
                  <div className="nav-item-left" style={{ overflow: 'hidden' }}>
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: group.color || '#6366f1',
                        boxShadow: `0 0 8px ${group.color || '#6366f1'}`,
                        flexShrink: 0
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {group.name}
                    </span>
                  </div>
                  <span className="nav-count">{count}</span>
                </button>

                <button
                  className="btn-icon"
                  style={{
                    position: 'absolute',
                    right: '6px',
                    width: '20px',
                    height: '20px',
                    opacity: isGroupActive ? 0.8 : 0.3,
                    color: '#f87171'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete group "${group.name}"?`)) {
                      onDeleteGroup(group.id);
                    }
                  }}
                  title="Delete group"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Tags section if any */}
      {tags && tags.length > 0 && (
        <div className="nav-section">
          <div className="nav-section-title">Tags</div>
          {tags.map((tag) => (
            <button
              key={tag.name}
              className={`nav-item ${selectedTag === tag.name ? 'active' : ''}`}
              onClick={() => {
                setSelectedTag(selectedTag === tag.name ? null : tag.name);
                setSelectedGroup(null);
              }}
            >
              <div className="nav-item-left">
                <TagIcon size={14} />
                <span>#{tag.name}</span>
              </div>
              <span className="nav-count">{tag.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom Area */}
      <div className="sidebar-bottom">
        <div className="hotkey-pill">
          <span>Global Summon</span>
          <span className="kbd">Ctrl+Shift+S</span>
        </div>

        <button
          className="nav-item"
          onClick={onOpenSettings}
        >
          <div className="nav-item-left">
            <Settings size={16} />
            <span>Preferences & Watchers</span>
          </div>
        </button>

        <div style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <HardDrive size={13} />
          <span>{counts.all} items ({totalSizeMb} MB)</span>
        </div>
      </div>
    </aside>
  );
}
