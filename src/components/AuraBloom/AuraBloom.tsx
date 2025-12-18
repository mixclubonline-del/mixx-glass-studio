/**
 * AuraBloom Component
 * 
 * Main orchestrating component for the AURA Bloom menu system.
 * Arranges 8 petals around a central core with glassmorphic styling.
 * 
 * Replaces both FlowWelcomeHub and BloomFloatingHub with a unified system.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AuraCore } from './AuraCore';
import { AuraPetal } from './AuraPetal';
import { 
  AuraPetalConfig, 
  menuConfigs, 
  welcomePetals, 
  floatingPetals 
} from './petalConfigs';
import { useFlowContext } from '../../state/flowContextService';
import { publishBloomSignal } from '../../state/flowSignals';
import { bloomChargeFromFlow } from '../../core/bloom/bloomCharge';
import {
  SaveIcon,
  LoadIcon,
  MixerIcon,
  SparklesIcon,
  SlidersIcon,
  PlusIcon,
  BrainIcon,
  DownloadIcon,
} from '../icons';
import './AuraBloom.css';

export type AuraBloomMode = 'welcome' | 'floating' | 'compact';

interface AuraBloomProps {
  mode: AuraBloomMode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onAction?: (action: string, payload?: unknown) => void;
  onEnterFlow?: () => void;
  customPetals?: AuraPetalConfig[];
}

// Icon mapping for petals
const PETAL_ICONS: Record<string, React.ReactNode> = {
  newProject: <PlusIcon className="w-5 h-5" />,
  openProject: <LoadIcon className="w-5 h-5" />,
  templates: <SlidersIcon className="w-5 h-5" />,
  recent: <LoadIcon className="w-5 h-5" />,
  cloud: <DownloadIcon className="w-5 h-5" />,
  settings: <SlidersIcon className="w-5 h-5" />,
  help: <BrainIcon className="w-5 h-5" />,
  about: <SparklesIcon className="w-5 h-5" />,
  save: <SaveIcon className="w-5 h-5" />,
  mixer: <MixerIcon className="w-5 h-5" />,
  plugins: <SparklesIcon className="w-5 h-5" />,
  import: <LoadIcon className="w-5 h-5" />,
  export: <DownloadIcon className="w-5 h-5" />,
  ai: <BrainIcon className="w-5 h-5" />,
  master: <SlidersIcon className="w-5 h-5" />,
  browser: <SparklesIcon className="w-5 h-5" />,
  favorites: <SparklesIcon className="w-5 h-5" />,
  back: <LoadIcon className="w-5 h-5" />,
};

export const AuraBloom: React.FC<AuraBloomProps> = ({
  mode,
  isOpen: controlledOpen,
  onOpenChange,
  position,
  onPositionChange,
  onAction,
  onEnterFlow,
  customPetals,
}) => {
  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(mode === 'welcome');
  const [activeMenu, setActiveMenu] = useState<string>(mode === 'welcome' ? 'welcome' : 'main');
  const [hoveredPetal, setHoveredPetal] = useState<AuraPetalConfig | null>(null);

  // Flow context for bloom charge
  const flowContext = useFlowContext();
  
  // Derive bloom charge from flow state
  const bloomCharge = useMemo(() => {
    if (typeof window === 'undefined' || !(window as any).__als) {
      return 0.5;
    }
    const als = (window as any).__als;
    const flow = als.flow || 0;
    const temp = als.temperature || 'cold';
    return bloomChargeFromFlow(flow, temp);
  }, [flowContext]);

  const temperature = useMemo(() => {
    if (typeof window === 'undefined' || !(window as any).__als) {
      return 'cold';
    }
    return (window as any).__als.temperature || 'cold';
  }, [flowContext]);

  // Controlled vs uncontrolled open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = useCallback((open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  }, [onOpenChange]);

  // Get current petals
  const petals = useMemo(() => {
    if (customPetals) return customPetals;
    const config = menuConfigs[activeMenu];
    return config?.items || (mode === 'welcome' ? welcomePetals : floatingPetals);
  }, [activeMenu, customPetals, mode]);

  // Petal radius based on mode
  const petalRadius = useMemo(() => {
    if (mode === 'welcome') return 160;
    if (mode === 'compact') return 100;
    return 130;
  }, [mode]);

  // Handle petal click
  const handlePetalClick = useCallback((config: AuraPetalConfig) => {
    // Publish bloom signal
    publishBloomSignal({
      source: mode === 'welcome' ? 'system' : 'bloom-floating',
      action: config.action || config.id,
      payload: config.payload,
    });

    // Handle submenu navigation
    if (config.subMenu && menuConfigs[config.subMenu]) {
      setActiveMenu(config.subMenu);
      return;
    }

    // Handle action callback
    if (onAction && config.action) {
      onAction(config.action, config.payload);
    }

    // Special handling for welcome mode entry
    if (mode === 'welcome' && config.action === 'project:new' && onEnterFlow) {
      onEnterFlow();
    }
    if (mode === 'welcome' && config.action === 'project:open' && onEnterFlow) {
      onEnterFlow();
    }

    // Close menu after action (except for submenus)
    if (!config.subMenu && mode !== 'welcome') {
      setIsOpen(false);
    }
  }, [mode, onAction, onEnterFlow, setIsOpen]);

  // Handle core toggle
  const handleToggle = useCallback(() => {
    const currentMenu = menuConfigs[activeMenu];
    if (isOpen && currentMenu?.parent) {
      // Go back to parent menu
      setActiveMenu(currentMenu.parent);
    } else {
      setIsOpen(!isOpen);
    }
    setHoveredPetal(null);
  }, [activeMenu, isOpen, setIsOpen]);

  // Welcome mode is always open
  useEffect(() => {
    if (mode === 'welcome') {
      setInternalOpen(true);
    }
  }, [mode]);

  const containerClass = `aura-bloom aura-bloom--${mode}`;

  return (
    <div
      className={containerClass}
      style={mode === 'floating' && position ? {
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      } : undefined}
    >
      <div className="aura-bloom__container">
        {/* Tooltip */}
        {hoveredPetal && (
          <div className="aura-tooltip">
            <div className="aura-tooltip__title">{hoveredPetal.label}</div>
            {hoveredPetal.description && (
              <div className="aura-tooltip__description">
                {hoveredPetal.description}
              </div>
            )}
          </div>
        )}

        {/* Petals */}
        {petals.map((petal, index) => (
          <AuraPetal
            key={petal.id}
            config={petal}
            index={index}
            total={petals.length}
            radius={isOpen ? petalRadius : 0}
            isOpen={isOpen}
            isHovered={hoveredPetal?.id === petal.id}
            onHover={setHoveredPetal}
            onClick={handlePetalClick}
            icon={PETAL_ICONS[petal.id]}
          />
        ))}

        {/* Core */}
        <AuraCore
          label="AURA"
          isOpen={isOpen}
          onToggle={handleToggle}
          onClick={handleToggle}
          isActive={false}
          size={mode === 'welcome' ? 'large' : 'small'}
        />
      </div>
    </div>
  );
};

export default AuraBloom;
