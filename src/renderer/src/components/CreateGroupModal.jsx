import React, { useState } from 'react';
import { X, FolderPlus, Palette } from 'lucide-react';

const PALETTE = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#3b82f6'  // Blue
];

export default function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), selectedColor);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-box" style={{ width: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderPlus size={18} color={selectedColor} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>New Group / Playlist</h3>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Group Name
            </label>
            <input
              type="text"
              autoFocus
              className="search-input"
              style={{ padding: '0 12px', height: '38px', fontSize: '14px' }}
              placeholder="e.g. Design Inspiration, Work, Receipts..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Accent Color
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: selectedColor === color ? '3px solid #ffffff' : '2px solid transparent',
                    cursor: 'pointer',
                    boxShadow: selectedColor === color ? `0 0 12px ${color}` : 'none',
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn-icon"
              style={{ width: 'auto', padding: '0 14px', height: '34px', fontSize: '12px' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ height: '34px', padding: '0 16px' }}
              disabled={!name.trim()}
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
