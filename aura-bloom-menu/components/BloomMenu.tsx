import React, { useState } from 'react';
import { Petal } from './Petal';
import {
  BrushIcon,
  LayersIcon,
  AdjustIcon,
  FiltersIcon,
  ExportIcon,
  SettingsIcon,
  HelpIcon,
  ShareIcon,
  PlusIcon,
  FolderIcon,
  GridIcon,
  GlobeIcon
} from './icons';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// Menu items for the in-app tool/editing mode
const TOOL_ITEMS: MenuItem[] = [
  { id: 'brush', label: 'Brush', icon: <BrushIcon /> },
  { id: 'layers', label: 'Layers', icon: <LayersIcon /> },
  { id: 'adjust', label: 'Adjust', icon: <AdjustIcon /> },
  { id: 'filters', label: 'Filters', icon: <FiltersIcon /> },
  { id: 'export', label: 'Export', icon: <ExportIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  { id: 'help', label: 'Help', icon: <HelpIcon /> },
  { id: 'share', label: 'Share', icon: <ShareIcon /> },
];

// Menu items for the initial Home/Welcome experience
const HOME_ITEMS: MenuItem[] = [
  { id: 'new', label: 'New Session', icon: <PlusIcon /> },
  { id: 'open', label: 'Open Session', icon: <FolderIcon /> },
  { id: 'suite', label: 'Suite', icon: <GridIcon /> },
  { id: 'online', label: 'Online', icon: <GlobeIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

interface BloomMenuProps {
  /** 
   * 'home' = Large, inviting start screen experience 
   * 'tool' = Compact, functional in-app tool menu 
   */
  variant?: 'home' | 'tool';
  /** Callback when an item is clicked */
  onItemSelect?: (id: string) => void;
}

export const BloomMenu: React.FC<BloomMenuProps> = ({ variant = 'tool', onItemSelect }) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [isCoreActive, setIsCoreActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false); 
  const [rippleKey, setRippleKey] = useState(0);

  const isHome = variant === 'home';
  const menuItems = isHome ? HOME_ITEMS : TOOL_ITEMS;

  // Spread the petals out more in home mode
  const petalOffset = isHome ? 60 : 25;

  const handlePetalClick = (id: string) => {
    console.log(`Petal clicked: ${id}`);
    setActiveItem(id);
    
    // Notify parent
    if (onItemSelect) {
      onItemSelect(id);
    }

    // Reset active item animation after a short delay
    setTimeout(() => setActiveItem(null), 200);
  };

  const handleCoreClick = () => {
    // Haptic feedback for core interaction
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
    
    console.log('Core clicked');
    setIsCoreActive(true);
    setRippleKey(prev => prev + 1);
    setIsOpen(prev => !prev);
    setTimeout(() => setIsCoreActive(false), 200);
  };

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
            onClick={() => handlePetalClick(item.id)}
            isActive={activeItem === item.id}
            isOpen={isOpen}
            delay={delay}
            offset={petalOffset}
          />
        );
      })}

      {/* Center Core Hub */}
      <div 
        className={`
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
          rounded-full z-50 cursor-pointer
          flex items-center justify-center
          transition-all ease-out
          backdrop-blur-2xl
          ${isHome ? 'w-[160px] h-[160px]' : 'w-[120px] h-[120px]'}
          ${isCoreActive 
            ? 'duration-100 scale-95 brightness-125 border-white/60 shadow-[0_0_50px_rgba(140,180,255,0.8),inset_0_0_30px_rgba(140,180,255,0.5)] bg-[radial-gradient(circle_at_center,rgba(230,240,255,0.4)_0%,rgba(160,140,255,0.3)_40%,rgba(90,60,190,0.5)_100%)] animate-pulse' 
            : isOpen
              ? 'duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2),inset_0_0_30px_rgba(255,255,255,0.15)] hover:scale-105 hover:shadow-[0_15px_50px_rgba(0,0,0,0.3),inset_0_0_40px_rgba(255,255,255,0.2)] bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_100%)] border border-white/40'
              : `duration-1000 ${isHome 
                  ? 'shadow-[0_0_50px_rgba(100,160,255,0.25),inset_0_0_40px_rgba(100,160,255,0.15)] bg-[radial-gradient(circle_at_center,rgba(60,60,100,0.3)_0%,rgba(20,20,45,0.4)_100%)] border border-white/20 hover:drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]' 
                  : 'shadow-[0_0_30px_rgba(100,150,255,0.1),inset_0_0_20px_rgba(100,150,255,0.05)] bg-[radial-gradient(circle_at_center,rgba(40,40,80,0.4)_0%,rgba(20,20,40,0.6)_100%)] border border-white/10'
                } hover:scale-[1.02] hover:opacity-100`
          }
        `}
        onClick={handleCoreClick}
      >
        {/* === HOME MODE CLOSED AURA EFFECTS === */}
        {isHome && !isOpen && (
           <>
            {/* Outer Rotating Ring 1 (Slow, Clockwise) - Refined for elegance */}
            <div className="absolute -inset-8 rounded-full border border-indigo-200/20 border-dashed animate-[spin_30s_linear_infinite] pointer-events-none" />
            
            {/* Outer Rotating Ring 2 (Medium, Counter-Clockwise) - Refined for contrast */}
            <div className="absolute -inset-4 rounded-full border border-blue-300/20 border-dotted animate-[spin_24s_linear_infinite_reverse] pointer-events-none" />

            {/* Inner Breathing Glow Ring - Soft and inviting */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-indigo-400/30 to-purple-400/0 blur-md animate-pulse-slow pointer-events-none" />
            
            {/* Pulsing Nebula Effect - Softer, wider, and more ethereal */}
            <div className="absolute -inset-32 rounded-full bg-[radial-gradient(closest-side,rgba(60,80,220,0.12)_0%,rgba(100,60,200,0.1)_50%,transparent_100%)] blur-[60px] animate-[pulse_6s_ease-in-out_infinite] pointer-events-none" />
           </>
        )}

        {/* === HOME MODE OPEN AURA EFFECTS === */}
        {isHome && isOpen && (
           <>
            {/* Outer Rotating Ring (Very Slow, Clockwise) - Subtle container for the open state */}
            <div className="absolute -inset-6 rounded-full border border-indigo-200/5 border-dashed animate-[spin_45s_linear_infinite] pointer-events-none" />
            
            {/* Inner Ring (Counter-Clockwise) */}
            <div className="absolute -inset-2 rounded-full border border-blue-200/10 border-dotted animate-[spin_35s_linear_infinite_reverse] pointer-events-none" />

            {/* Inner Breathing Glow Ring */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-indigo-400/10 to-purple-400/0 blur-md animate-pulse-slow pointer-events-none" />
            
            {/* Pulsing Nebula Effect - Reduced intensity and slower pulse */}
            <div className="absolute -inset-24 rounded-full bg-[radial-gradient(closest-side,rgba(70,90,230,0.06)_0%,rgba(110,70,210,0.03)_60%,transparent_100%)] blur-[40px] animate-[pulse_8s_ease-in-out_infinite] pointer-events-none" />
           </>
        )}

        {/* Ripple Effect */}
        {rippleKey > 0 && (
          <div
            key={rippleKey}
            className="absolute inset-0 rounded-full bg-indigo-400/60 z-0 animate-ping pointer-events-none"
            style={{
              animationDuration: '0.8s',
              animationIterationCount: 1,
            }}
          />
        )}

        <div className="flex flex-col items-center justify-center relative z-10">
            <span className={`
                font-semibold text-white/90 drop-shadow-[0_0_20px_rgba(150,200,255,0.6)] 
                transition-all duration-300
                ${isHome ? 'text-[28px] tracking-[0.35em] pl-1' : 'text-[22px] tracking-[0.25em]'}
                ${isOpen ? 'opacity-100' : 'opacity-80'}
            `}>
            AURA
            </span>
            {isHome && (
                <span className={`text-[9px] uppercase tracking-[0.3em] text-blue-200/50 mt-1 transition-opacity duration-500 ${isOpen ? 'opacity-0' : 'opacity-100'}`}>
                    Start
                </span>
            )}
        </div>
      </div>
    </div>
  );
};