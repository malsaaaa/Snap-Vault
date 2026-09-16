import React, { useRef, useEffect } from 'react';
import { Check, Plus, Folder } from 'lucide-react';

export default function GroupMenu({
  groups,
  screenshotGroups = [],
  onToggleGroup,
  onOpenCreateGroup,
  onClose
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: '38px',
        right: '0',
        zIndex: 150,
        width: '210px',
        background: 'rgba(15, 22, 36, 0.96)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-highlight)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
        Add to Group
      </div>

      {groups.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px', textAlign: 'center' }}>
          No groups yet
        </div>
      ) : (
        groups.map((group) => {
          const isSelected = screenshotGroups.includes(group.id);
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onToggleGroup(group.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: 'none',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: group.color || '#6366f1',
                    flexShrink: 0
                  }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {group.name}
                </span>
              </div>
              {isSelected && <Check size={13} color="#10b981" />}
            </button>
          );
        })
      )}

      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

      <button
        type="button"
        onClick={() => {
          onClose();
          onOpenCreateGroup();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          border: 'none',
          color: 'var(--accent-primary)',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <Plus size={13} />
        <span>Create New Group...</span>
      </button>
    </div>
  );
}
