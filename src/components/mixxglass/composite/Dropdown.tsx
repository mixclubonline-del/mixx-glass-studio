/**
 * MixxGlass Dropdown Component
 * 
 * Proprietary dropdown menu component with glass aesthetic.
 * Replaces Radix UI DropdownMenu components.
 */

import React, { useState, useRef, useEffect } from 'react';
import { getGlassSurface } from '../utils/glassStyles';
import { useFlowMotion } from '../hooks/useFlowMotion';
import { MixxGlassButton, type MixxGlassButtonProps } from '../primitives/Button';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../../design-system';

export interface MixxGlassDropdownItem {
  label: string;
  value?: string;
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export interface MixxGlassDropdownProps {
  trigger: React.ReactNode;
  items: MixxGlassDropdownItem[];
  onSelect?: (item: MixxGlassDropdownItem) => void;
  align?: 'left' | 'right' | 'center';
  side?: 'top' | 'bottom';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * MixxGlass Dropdown
 * 
 * Glass aesthetic dropdown menu with smooth animations.
 */
export const MixxGlassDropdown: React.FC<MixxGlassDropdownProps> = ({
  trigger,
  items,
  onSelect,
  align = 'left',
  side = 'bottom',
  open: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

  // Animated open state
  const animatedOpen = useFlowMotion(
    { opacity: open ? 1 : 0, scale: open ? 1 : 0.95 },
    { duration: 150, easing: 'ease-out' }
  );

  // Position dropdown
  useEffect(() => {
    if (!open || !dropdownRef.current || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdown = dropdownRef.current;

    if (side === 'bottom') {
      dropdown.style.top = `${triggerRect.bottom + 4}px`;
    } else {
      dropdown.style.bottom = `${window.innerHeight - triggerRect.top + 4}px`;
    }

    if (align === 'left') {
      dropdown.style.left = `${triggerRect.left}px`;
    } else if (align === 'right') {
      dropdown.style.right = `${window.innerWidth - triggerRect.right}px`;
    } else {
      dropdown.style.left = `${triggerRect.left + triggerRect.width / 2}px`;
      dropdown.style.transform = 'translateX(-50%)';
    }
  }, [open, align, side]);

  // Handle outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, setOpen]);

  const glassSurface = getGlassSurface({
    intensity: 'medium',
    border: true,
    glow: false,
  });

  const dropdownStyle: React.CSSProperties = composeStyles(
    glassSurface,
    layout.position.fixed,
    layout.zIndex.max,
    spacing.p(1),
    effects.border.radius.lg,
    transitions.transition.standard(['opacity', 'transform'], 150, 'ease-out'),
    {
      minWidth: '160px',
      opacity: animatedOpen.opacity,
      transform: `scale(${animatedOpen.scale})`,
      pointerEvents: open ? 'auto' : 'none',
    }
  );

  const handleItemClick = (item: MixxGlassDropdownItem) => {
    if (item.disabled || item.separator) return;
    item.onClick?.();
    onSelect?.(item);
    setOpen(false);
  };

  return (
    <div style={composeStyles(
      layout.position.relative,
      layout.display['inline-block']
    )}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer' }}
      >
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div ref={dropdownRef} style={dropdownStyle}>
          {items.map((item, index) => {
            if (item.separator) {
              return (
                <div
                  key={index}
                  style={composeStyles(
                    spacing.my(1),
                    spacing.mx(2),
                    {
                      height: '1px',
                      background: 'rgba(102, 140, 198, 0.45)',
                    }
                  )}
                  role="separator"
                />
              );
            }

            return (
              <button
                key={index}
                style={composeStyles(
                  layout.width.full,
                  typography.align('left'),
                  spacing.px(3),
                  spacing.py(2),
                  typography.size('sm'),
                  effects.border.radius.lg,
                  transitions.transition.colors(200),
                  {
                    color: item.disabled ? '#666' : '#e6f0ff',
                    opacity: item.disabled ? 0.5 : 1,
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    background: 'transparent',
                    border: 'none',
                  }
                )}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.background = 'rgba(9, 18, 36, 0.82)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MixxGlassDropdown;


