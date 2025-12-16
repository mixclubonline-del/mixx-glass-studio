/**
 * AURA BloomMenu Component
 * 
 * Unified glassmorphic petal-based radial menu for Flow DAW.
 * Supports two variants: 'home' (welcome screen) and 'tool' (floating hub).
 * 
 * Ported from aura-bloom-menu standalone project with Flow integration.
 */

import React, { useState, useCallback } from 'react';
import { Petal } from './Petal';
import { AuraCore } from './AuraCore';
import {
  ExportIcon,
  SettingsIcon,
  HelpIcon,
  PlusIcon,
  FolderIcon,
  GridIcon,
  GlobeIcon,
  MixerIcon,
  SaveIcon,
  PluginsIcon,
  AIIcon,
  ImportIcon,
} from './bloomIcons';
import { publishBloomSignal } from '../../state/flowSignals';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: string;
}

// Menu items for the in-app tool/editing mode (Floating Hub)
const TOOL_ITEMS: MenuItem[] = [
  { id: 'save', label: 'Save', icon: <SaveIcon />, action: 'project:save' },
  { id: 'mixer', label: 'Mixer', icon: <MixerIcon />, action: 'view:mixer' },
  { id: 'plugins', label: 'Plugins', icon: <PluginsIcon />, action: 'plugins:browser:open' },
  { id: 'import', label: 'Import', icon: <ImportIcon />, action: 'importAudio' },
  { id: 'export', label: 'Export', icon: <ExportIcon />, action: 'export:show' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, action: 'settings:open' },
  { id: 'ai', label: 'AI', icon: <AIIcon />, action: 'ai:hub:open' },
  { id: 'help', label: 'Help', icon: <HelpIcon />, action: 'help:open' },
];

// Menu items for the initial Home/Welcome experience
const HOME_ITEMS: MenuItem[] = [
  { id: 'new', label: 'New Session', icon: <PlusIcon />, action: 'project:new' },
  { id: 'open', label: 'Open Session', icon: <FolderIcon />, action: 'project:open' },
  { id: 'suite', label: 'Suite', icon: <GridIcon />, action: 'suite:open' },
  { id: 'online', label: 'Online', icon: <GlobeIcon />, action: 'online:connect' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, action: 'settings:open' },
];

interface BloomMenuProps {
  /** 
   * 'home' = Large, inviting start screen experience 
   * 'tool' = Compact, functional in-app tool menu 
   */
  variant?: 'home' | 'tool';
  /** Callback when an item is clicked */
  onItemSelect?: (id: string, action?: string) => void;
  /** Callback when entering flow from welcome screen */
  onEnterFlow?: () => void;
  /** External control of open state */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

export const BloomMenu: React.FC<BloomMenuProps> = ({ 
  variant = 'tool', 
  onItemSelect,
  onEnterFlow,
  isOpen: controlledOpen,
  onOpenChange,
}) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [isCoreActive, setIsCoreActive] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false); 

  const isHome = variant === 'home';
  const menuItems = isHome ? HOME_ITEMS : TOOL_ITEMS;

  // Controlled vs uncontrolled open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = useCallback((open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  }, [onOpenChange]);

  // Spread the petals out more in home mode
  const petalOffset = isHome ? 60 : 25;

  const handlePetalClick = useCallback((item: MenuItem) => {
    console.log(`Petal clicked: ${item.id}`);
    setActiveItem(item.id);
    
    // Publish bloom signal to Flow's event system
    publishBloomSignal({
      source: isHome ? 'system' : 'bloom-floating',
      action: item.action || item.id,
      payload: { menuItem: item.id },
    });

    // Notify parent
    if (onItemSelect) {
      onItemSelect(item.id, item.action);
    }

    // Handle entering flow from welcome screen
    if (isHome && ['new', 'open', 'suite'].includes(item.id) && onEnterFlow) {
      setTimeout(() => {
        onEnterFlow();
      }, 400);
    }

    // Close menu after action (tool mode only)
    if (!isHome) {
      setTimeout(() => {
        setIsOpen(false);
      }, 300);
    }

    // Reset active item animation after a short delay
    setTimeout(() => setActiveItem(null), 200);
  }, [isHome, onEnterFlow, onItemSelect, setIsOpen]);

  const handleCoreClick = useCallback(() => {
    // Haptic feedback for core interaction
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
    
    console.log('Core clicked');
    setIsCoreActive(true);
    setIsOpen(!isOpen);
    setTimeout(() => setIsCoreActive(false), 200);
  }, [isOpen, setIsOpen]);

  // Calculate rotation step dynamically based on number of items
  const totalItems = menuItems.length;
  const angleStep = 360 / totalItems;

  return (
    <div className={`
      relative transition-transform duration-500 ease-out select-none
      ${isHome ? 'scale-100' : 'scale-[0.6] sm:scale-75 md:scale-100'} 
    `}
    style={{
      width: isHome ? '600px' : '500px',
      height: isHome ? '600px' : '500px',
    }}
    >
      {/* SVG Defs for Gradients and Filters - rendered once */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="petalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(100, 180, 255, 0.15)" />
            <stop offset="50%" stopColor="rgba(140, 160, 220, 0.12)" />
            <stop offset="100%" stopColor="rgba(180, 140, 220, 0.18)" />
          </linearGradient>
          <filter id="petalGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* Ambient glow container */}
      <div className={`absolute inset-[-50px] rounded-full bg-[radial-gradient(circle_at_center,rgba(100,150,255,0.08)_0%,transparent_60%)] pointer-events-none transition-opacity duration-1000 ${isOpen ? 'opacity-100' : 'opacity-40'}`} />

      {/* Render Petals */}
      {menuItems.map((item, index) => {
        const rotation = index * angleStep;
        
        // Fluid wave delay calculation
        const delay = isOpen 
          ? index * 35  
          : (totalItems - 1 - index) * 25;

        return (
          <Petal
            key={item.id}
            index={index}
            label={item.label}
            icon={item.icon}
            rotation={rotation}
            onClick={() => handlePetalClick(item)}
            isActive={activeItem === item.id}
            isOpen={isOpen}
            delay={delay}
            offset={petalOffset}
          />
        );
      })}

      {/* Center Core Hub - Ethereal AuraCore */}
      <AuraCore
        size={isHome ? 'large' : 'small'}
        isOpen={isOpen}
        isActive={isCoreActive}
        onClick={handleCoreClick}
      />
    </div>
  );
};

export default BloomMenu;

