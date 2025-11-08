/**
 * Bloom Menu Item - Glassmorphic orbital menu item
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { MenuItem } from './types';

interface BloomMenuItemProps {
  item: MenuItem;
  x: number;
  y: number;
  angle: number;
  index: number;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export const BloomMenuItem: React.FC<BloomMenuItemProps> = ({
  item,
  x,
  y,
  angle,
  index,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  const getZoneColor = (angle: number) => {
    const normalized = ((angle + 90) % 360 + 360) % 360;
    if (normalized < 90) return 'var(--primary)';
    if (normalized < 180) return 'var(--accent)';
    if (normalized < 270) return 'var(--secondary)';
    return 'var(--primary)';
  };

  const zoneColor = getZoneColor(angle);

  return (
    <button
      className={cn(
        'bloom-menu-item-orbital',
        item.disabled && 'bloom-menu-item-disabled'
      )}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        animationDelay: `${index * 80}ms`,
        '--zone-color': zoneColor
      } as React.CSSProperties}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={item.disabled}
    >
      {/* Glassmorphic container */}
      <div className="bloom-item-glass-compact">
        {/* Border gradient */}
        <div 
          className="bloom-item-border-glow"
          style={{ 
            background: `linear-gradient(135deg, hsl(${zoneColor}), hsl(${zoneColor}) / 0.3)` 
          }}
        />
        
        {/* Icon */}
        {item.icon ? (
          <div className="bloom-item-icon-orbital">{item.icon}</div>
        ) : (
          <span className="bloom-item-text-orbital">{item.name.charAt(0)}</span>
        )}

        {/* Inner glow */}
        <div 
          className="bloom-item-inner-glow"
          style={{ 
            boxShadow: `inset 0 0 20px hsl(${zoneColor} / 0.2)` 
          }}
        />
      </div>

      {/* Label positioned outside */}
      <div className="bloom-item-label">
        {item.name}
      </div>
    </button>
  );
};
