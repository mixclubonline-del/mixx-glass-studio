/**
 * Professional Bloom HUD Component
 * 
 * Polished, accessible Bloom HUD with keyboard navigation.
 * Consolidates peripheral actions into a single, performant interface.
 */

import React, { useState, useEffect, useRef } from 'react';
import { SaveIcon, LoadIcon, XIcon } from '../icons';

export interface BloomAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  action: () => void;
  shortcut?: string;
  accentColor?: string;
}

interface ProfessionalBloomHUDProps {
  isOpen: boolean;
  onClose: () => void;
  actions: BloomAction[];
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

const ProfessionalBloomHUD: React.FC<ProfessionalBloomHUDProps> = ({
  isOpen,
  onClose,
  actions,
  position,
  onPositionChange,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter actions by search query
  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredActions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredActions[selectedIndex]) {
        e.preventDefault();
        filteredActions[selectedIndex].action();
        onClose();
      } else if (e.key === '/' || e.key === 'Meta+k' || e.key === 'Control+k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredActions, onClose]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultPosition = position || { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={containerRef}
        className="bloom-hud-container"
        style={{
          position: 'absolute',
          left: `${defaultPosition.x}px`,
          top: `${defaultPosition.y}px`,
          transform: 'translate(-50%, -50%)',
          width: 'min(480px, 90vw)',
          maxHeight: 'min(600px, 80vh)',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.7), var(--glass-tint))',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(10px) saturate(120%)',
          WebkitBackdropFilter: 'blur(10px) saturate(120%)',
          boxShadow: 'var(--elevation-shadow)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--ink-foreground)',
              margin: 0,
            }}
          >
            Bloom Menu
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.3)',
              border: '1px solid var(--glass-border)',
              color: 'var(--muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            }}
          >
            <XIcon className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-4 h-4"
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--muted)',
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.4)',
                border: '1px solid var(--glass-border)',
                fontSize: '14px',
                color: 'var(--ink-foreground)',
                outline: 'none',
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedIndex(0);
                }
              }}
            />
          </div>
        </div>

        {/* Actions list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {filteredActions.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: '14px',
              }}
            >
              No actions found
            </div>
          ) : (
            filteredActions.map((action, index) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  action.action();
                  onClose();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background:
                    selectedIndex === index
                      ? 'rgba(139,123,255,0.15)'
                      : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                onFocus={() => setSelectedIndex(index)}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: action.accentColor
                      ? `${action.accentColor}20`
                      : 'rgba(139,123,255,0.1)',
                    color: action.accentColor || 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  {action.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--ink-foreground)',
                      marginBottom: '2px',
                    }}
                  >
                    {action.label}
                  </div>
                  {action.description && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--muted)',
                      }}
                    >
                      {action.description}
                    </div>
                  )}
                </div>
                {action.shortcut && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--muted)',
                      fontFamily: 'monospace',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(0,0,0,0.1)',
                    }}
                  >
                    {action.shortcut}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--glass-border)',
            fontSize: '11px',
            color: 'var(--muted)',
            textAlign: 'center',
          }}
        >
          Use ↑↓ to navigate, Enter to select, Esc to close
        </div>
      </div>
    </div>
  );
};

export default ProfessionalBloomHUD;
