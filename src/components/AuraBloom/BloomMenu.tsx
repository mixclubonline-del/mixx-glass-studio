/**
 * AURA BloomMenu Component
 * 
 * Unified glassmorphic petal-based radial menu for Flow DAW.
 * Supports two variants: 'home' (welcome screen) and 'tool' (floating hub).
 * Uses AURA Design System for consistent ethereal styling.
 */

import React, { useState, useCallback } from 'react';
import { Petal } from './Petal';
import { AuraCore } from './AuraCore';
import {
  // Tool menu icons
  SaveIcon,
  MixerIcon,
  PluginsIcon,
  ImportIcon,
  ExportIcon,
  SettingsIcon,
  SparkleIcon,
  HelpIcon,
  // Home menu icons
  PlusIcon,
  FolderIcon,
  GridIcon,
  GlobeIcon,
  UsersIcon,
  // Additional icons for variety
  RecordIcon,
  WaveformIcon,
  HeadphonesIcon,
  MagicWandIcon,
  PianoIcon,
} from './bloomIcons';
import { publishBloomSignal } from '../../state/flowSignals';
import { 
  AuraPalette, 
  AuraKeyframes,
  auraAlpha 
} from '../../theme/aura-tokens';

// Extract palette colors
const { violet, cyan, magenta, indigo, amber } = AuraPalette;

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: string;
  color?: string; // Optional custom color for the petal
}

// Icon size for consistent appearance
const ICON_SIZE = 24;

// Menu items for the in-app tool/editing mode (Floating Hub)
const TOOL_ITEMS: MenuItem[] = [
  { id: 'save', label: 'Save', icon: <SaveIcon size={ICON_SIZE} />, action: 'project:save', color: cyan.DEFAULT },
  { id: 'mixer', label: 'Mixer', icon: <MixerIcon size={ICON_SIZE} />, action: 'view:mixer', color: violet.DEFAULT },
  { id: 'plugins', label: 'Plugins', icon: <PluginsIcon size={ICON_SIZE} />, action: 'plugins:browser:open', color: magenta.DEFAULT },
  { id: 'import', label: 'Import', icon: <ImportIcon size={ICON_SIZE} />, action: 'importAudio', color: indigo.DEFAULT },
  { id: 'export', label: 'Export', icon: <ExportIcon size={ICON_SIZE} />, action: 'export:show', color: amber.DEFAULT },
  { id: 'record', label: 'Record', icon: <RecordIcon size={ICON_SIZE} />, action: 'transport:record', color: '#ef4444' },
  { id: 'ai', label: 'AI', icon: <SparkleIcon size={ICON_SIZE} />, action: 'ai:hub:open', color: cyan[400] },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={ICON_SIZE} />, action: 'settings:open', color: violet[400] },
];

// Menu items for the initial Home/Welcome experience - slightly larger icons
const HOME_ICON_SIZE = 28;
const HOME_ITEMS: MenuItem[] = [
  { id: 'new', label: 'New', icon: <PlusIcon size={HOME_ICON_SIZE} />, action: 'project:new', color: violet.DEFAULT },
  { id: 'open', label: 'Open', icon: <FolderIcon size={HOME_ICON_SIZE} />, action: 'project:open', color: cyan.DEFAULT },
  { id: 'learn', label: 'Learn', icon: <MagicWandIcon size={HOME_ICON_SIZE} />, action: 'learn:open', color: magenta.DEFAULT },
  { id: 'online', label: 'Online', icon: <GlobeIcon size={HOME_ICON_SIZE} />, action: 'online:connect', color: indigo.DEFAULT },
  { id: 'collab', label: 'Collab', icon: <UsersIcon size={HOME_ICON_SIZE} />, action: 'collab:start', color: amber.DEFAULT },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={HOME_ICON_SIZE} />, action: 'settings:open', color: violet[400] },
];

interface BloomMenuProps {
  /** 
   * 'home' = Large, inviting start screen experience 
   * 'tool' = Compact, functional in-app tool menu 
   */
  variant?: 'home' | 'tool';
  /** Dynamic contextual items - overrides default TOOL_ITEMS */
  items?: MenuItem[];
  /** Current bloom context for styling hints */
  context?: string;
  /** Override accent color (from ALS/context) */
  accentColor?: string;
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
  items,
  context,
  accentColor,
  onItemSelect,
  onEnterFlow,
  isOpen: controlledOpen,
  onOpenChange,
}) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [isCoreActive, setIsCoreActive] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false); 

  const isHome = variant === 'home';
  
  // Use dynamic items if provided, otherwise fall back to defaults
  const menuItems = items ?? (isHome ? HOME_ITEMS : TOOL_ITEMS);

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
  const petalOffset = isHome ? 65 : 30;

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
    <>
      {/* Inject AURA keyframe animations */}
      <style>{AuraKeyframes}</style>
      
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
            {/* Shimmer gradient for petal hover effect */}
            <linearGradient id="shimmer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="40%" stopColor="rgba(255, 255, 255, 0.1)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.25)" />
              <stop offset="60%" stopColor="rgba(255, 255, 255, 0.1)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            
            {/* Aurora gradient for ambient effects */}
            <radialGradient id="aurora-gradient" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor={auraAlpha(violet.DEFAULT, 0.15)} />
              <stop offset="40%" stopColor={auraAlpha(cyan.DEFAULT, 0.08)} />
              <stop offset="70%" stopColor={auraAlpha(magenta.DEFAULT, 0.05)} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            
            {/* Glow filter */}
            <filter id="petalGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>

        {/* Ambient aurora glow container */}
        <div 
          className="absolute pointer-events-none transition-all duration-1000"
          style={{
            inset: -80,
            background: `
              radial-gradient(ellipse 80% 60% at 30% 30%,
                ${auraAlpha(violet.DEFAULT, isOpen ? 0.12 : 0.05)} 0%,
                transparent 50%
              ),
              radial-gradient(ellipse 60% 80% at 70% 70%,
                ${auraAlpha(cyan.DEFAULT, isOpen ? 0.1 : 0.04)} 0%,
                transparent 50%
              ),
              radial-gradient(ellipse 70% 50% at 50% 60%,
                ${auraAlpha(magenta.DEFAULT, isOpen ? 0.08 : 0.03)} 0%,
                transparent 50%
              )
            `,
            filter: 'blur(30px)',
            animation: isOpen ? 'aura-breathe 6s ease-in-out infinite' : 'none',
          }}
        />

        {/* Render Petals */}
        {menuItems.map((item, index) => {
          const rotation = index * angleStep;
          
          // Fluid wave delay calculation
          const delay = isOpen 
            ? index * 40  
            : (totalItems - 1 - index) * 30;

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
              color={item.color}
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
    </>
  );
};

export default BloomMenu;
