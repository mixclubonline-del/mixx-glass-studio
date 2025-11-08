/**
 * Bloom HUD - Radial menu system for quick access to DAW features
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MenuItem, MenuConfig } from './types';
import { ChevronLeft, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    setIsMenuOpen(prev => !prev);
    if (isMenuOpen) {
      setTimeout(() => setMenuPath(['main']), 300);
    }
  };

  const handleBackClick = () => {
    setMenuPath(prev => prev.slice(0, -1));
  };

  const handleMouseEnter = (e: React.MouseEvent, description: string | undefined) => {
    if (description) {
      setTooltip({ content: description, x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
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

  const radius = useMemo(() => {
    const itemCount = currentMenu?.items.length || 0;
    if (itemCount === 0) return 100;

    const isLargeScreen = window.innerWidth > 768;
    const baseRadius = isLargeScreen ? 140 : 110;
    const baseItemCount = 6;
    const factor = isLargeScreen ? 12 : 10;
    const dynamicRadius = baseRadius + (itemCount - baseItemCount) * factor;

    const minRadius = isLargeScreen ? 120 : 100;
    const maxRadius = isLargeScreen ? 180 : 140;

    return Math.max(minRadius, Math.min(dynamicRadius, maxRadius));
  }, [currentMenu]);

  const isSubMenu = menuPath.length > 1;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMenuOpen && e.target === e.currentTarget) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  const handleMouseMoveGlobal = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUpGlobal = () => {
    setIsDragging(false);
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
      className="relative flex items-center justify-center" 
      onMouseMove={handleMouseMove}
      style={{ 
        width: radius * 2.5, 
        height: radius * 2.5,
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : isMenuOpen ? 'default' : 'grab'
      }}
    >
      <div
        className={cn(
          'bloom-dial',
          isMenuOpen && 'bloom-dial-open',
          isSubMenu && 'bloom-dial-submenu',
          isDragging && 'bloom-dial-dragging'
        )}
        onClick={isSubMenu ? handleBackClick : handleCoreClick}
        onMouseDown={handleMouseDown}
      >
        {isSubMenu ? (
          <ChevronLeft className="w-6 h-6" />
        ) : (
          <div className="bloom-dial-icon">
            <div className="bloom-dial-ring" />
            <div className="bloom-dial-ring bloom-dial-ring-delayed" />
          </div>
        )}
      </div>

      {isMenuOpen && currentMenu && (
        <>
          {currentMenu.items.map((item, index) => {
            const angle = (index / currentMenu.items.length) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <button
                key={`${item.name}-${index}`}
                className={cn(
                  'bloom-item',
                  item.disabled && 'bloom-item-disabled'
                )}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  animationDelay: `${index * 50}ms`
                }}
                onClick={() => handleItemClick(item)}
                onMouseEnter={(e) => handleMouseEnter(e, item.description)}
                onMouseLeave={handleMouseLeave}
                disabled={item.disabled}
              >
                {item.icon ? (
                  <div className="bloom-item-icon">{item.icon}</div>
                ) : (
                  <span className="bloom-item-text">{item.name}</span>
                )}
              </button>
            );
          })}
        </>
      )}

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
