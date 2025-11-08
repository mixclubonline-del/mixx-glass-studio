/**
 * Bloom HUD - Radial menu system for quick access to DAW features
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MenuItem, MenuConfig } from './types';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BloomOrbitalRings } from './BloomOrbitalRings';
import { BloomCentralOrb } from './BloomCentralOrb';
import { BloomMenuItem } from './BloomMenuItem';

export interface BloomHUDProps {
  size?: 'small' | 'medium' | 'large';
  menuConfig: MenuConfig;
  onAction: (actionName: string, payload?: any) => void;
}

export const BloomHUD: React.FC<BloomHUDProps> = ({
  size = 'medium',
  menuConfig,
  onAction
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState<string[]>(['main']);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
  const allMenuItemsRef = useRef<Map<string, MenuItem>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load favorites and position from localStorage
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('mixxclub_bloom_favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
      
      const storedPosition = localStorage.getItem('mixxclub_bloom_position');
      if (storedPosition) {
        setPosition(JSON.parse(storedPosition));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  // Save favorites and position to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mixxclub_bloom_favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('mixxclub_bloom_position', JSON.stringify(position));
    } catch (error) {
      console.error('Error saving position:', error);
    }
  }, [position]);

  // Build flat map of all menu items
  useEffect(() => {
    const newMap = new Map<string, MenuItem>();
    Object.entries(menuConfig).forEach(([menuKey, menu]) => {
      menu.items.forEach(item => {
        const uniqueKey = `${menuKey}:${item.name}`;
        newMap.set(uniqueKey, item);
      });
    });
    allMenuItemsRef.current = newMap;
  }, [menuConfig]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;

    if (item.action) {
      item.action();
      if (item.name !== 'Favorites') {
        onAction(item.name);
      }
      setIsMenuOpen(false);
      setTimeout(() => setMenuPath(['main']), 300);
    } else if (item.subMenu) {
      setMenuPath(prev => [...prev, item.subMenu as string]);
    }
  };

  const handleCoreClick = () => {
    if (!isDragging) {
      setIsMenuOpen(prev => !prev);
      if (isMenuOpen) {
        setTimeout(() => setMenuPath(['main']), 300);
      }
    }
  };

  const handleBackClick = () => {
    if (!isDragging) {
      setMenuPath(prev => prev.slice(0, -1));
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, description: string | undefined, index: number) => {
    setHoveredIndex(index);
    if (description) {
      setTooltip({ content: description, x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip) {
      setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
    }
  };

  const finalMenuConfig = useMemo(() => {
    const favs = favorites.map(favName => allMenuItemsRef.current.get(favName)).filter((item): item is MenuItem => !!item);
    return {
      ...menuConfig,
      favorites: {
        parent: 'main',
        items: favs
      }
    };
  }, [favorites, menuConfig]);

  const currentMenuKey = menuPath[menuPath.length - 1];
  const currentMenu = finalMenuConfig[currentMenuKey];
  const parentMenuKey = currentMenu?.parent;
  const parentMenuTitle = parentMenuKey ? finalMenuConfig[parentMenuKey]?.items.find(item => item.subMenu === currentMenuKey)?.name : 'CORE';

  // Multi-ring configuration
  const rings = useMemo(() => {
    const itemCount = currentMenu?.items.length || 0;
    if (itemCount <= 4) return [110];
    if (itemCount <= 8) return [110, 170];
    return [100, 140, 190];
  }, [currentMenu]);

  const primaryRing = rings[rings.length - 1];

  const isSubMenu = menuPath.length > 1;

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on the orb itself, not on menu items
    if (e.target === e.currentTarget || e.currentTarget.classList.contains('bloom-central-orb')) {
      e.stopPropagation();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  const handleMouseMoveGlobal = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUpGlobal = () => {
    if (isDragging) {
      setTimeout(() => setIsDragging(false), 50);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMoveGlobal);
      document.addEventListener('mouseup', handleMouseUpGlobal);
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveGlobal);
        document.removeEventListener('mouseup', handleMouseUpGlobal);
      };
    }
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="bloom-orbital-container" 
      onMouseMove={handleMouseMove}
      style={{ 
        width: primaryRing * 2.5, 
        height: primaryRing * 2.5,
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none'
      }}
    >
      {/* Orbital rings */}
      <BloomOrbitalRings isOpen={isMenuOpen} rings={rings} />

      {/* Central orb */}
      <BloomCentralOrb
        isOpen={isMenuOpen}
        isSubMenu={isSubMenu}
        onClick={isSubMenu ? handleBackClick : handleCoreClick}
        onMouseDown={handleMouseDown}
        icon={isSubMenu ? <ChevronLeft className="w-6 h-6" /> : undefined}
        isDragging={isDragging}
      />

      {/* Menu items */}
      {isMenuOpen && currentMenu && (
        <>
          {currentMenu.items.map((item, index) => {
            const angle = (index / currentMenu.items.length) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle) * primaryRing;
            const y = Math.sin(angle) * primaryRing;

            return (
              <BloomMenuItem
                key={`${item.name}-${index}`}
                item={item}
                x={x}
                y={y}
                angle={(angle * 180) / Math.PI}
                index={index}
                onClick={() => handleItemClick(item)}
                onMouseEnter={(e) => handleMouseEnter(e, item.description, index)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="bloom-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y + 20}px`,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};
