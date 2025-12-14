/**
 * Professional Bloom HUD Component
 * 
 * Polished, accessible Bloom HUD with keyboard navigation.
 * Consolidates peripheral actions into a single, performant interface.
 */

import React, { useState, useEffect, useRef } from 'react';
import { SaveIcon, LoadIcon, XIcon } from '../icons';
import { AuraColors, AuraEffects } from '../../theme/aura-tokens';
import { hexToRgba } from '../../utils/ALS';

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
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
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
          width: 'min(520px, 90vw)',
          maxHeight: 'min(640px, 80vh)',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${hexToRgba(AuraColors.space, 0.95)}, ${hexToRgba(AuraColors.twilight, 0.9)})`,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: `${AuraEffects.glow.lg}, 0 20px 50px rgba(0,0,0,0.5)`,
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
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-violet-500 to-blue-500 rounded-full" />
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#fff',
                  margin: 0,
                  letterSpacing: '0.05em',
                }}
              >
                AURA Command
              </h2>
          </div>
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
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            <XIcon className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
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
              className="w-5 h-5"
              style={{
                position: 'absolute',
                left: '12px',
                color: 'rgba(255,255,255,0.4)',
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
                padding: '12px 16px 12px 42px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '15px',
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                  e.target.style.borderColor = AuraColors.violet;
                  e.target.style.boxShadow = `0 0 0 1px ${AuraColors.violet}`;
              }}
              onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
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
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
          }}
        >
          {filteredActions.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.3)',
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
                  gap: '14px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background:
                    selectedIndex === index
                      ? `linear-gradient(90deg, ${hexToRgba(AuraColors.violet, 0.15)}, rgba(0,0,0,0))`
                      : 'transparent',
                  border: selectedIndex === index ? `1px solid ${hexToRgba(AuraColors.violet, 0.3)}` : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                onFocus={() => setSelectedIndex(index)}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: action.accentColor
                      ? `${action.accentColor}20`
                      : 'rgba(255,255,255,0.1)',
                    color: action.accentColor || AuraColors.violet,
                    flexShrink: 0,
                    boxShadow: selectedIndex === index ? `0 0 12px ${hexToRgba(action.accentColor || AuraColors.violet, 0.3)}` : 'none',
                  }}
                >
                  {action.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: selectedIndex === index ? '#fff' : 'rgba(255,255,255,0.9)',
                      marginBottom: '2px',
                    }}
                  >
                    {action.label}
                  </div>
                  {action.description && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.5)',
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
                      color: 'rgba(255,255,255,0.4)',
                      fontFamily: 'monospace',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
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
            padding: '12px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
            <span>AURA v1.0</span>
            <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalBloomHUD;
