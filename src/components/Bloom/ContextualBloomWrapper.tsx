/**
 * Contextual Bloom Wrapper - HOC that adds bloom behavior to any component
 */

import React, { useEffect, useRef, useState } from 'react';
import { useBloomStore } from '@/store/bloomStore';
import { cn } from '@/lib/utils';

interface BloomConfig {
  triggerZone: 'top' | 'bottom' | 'left' | 'right' | 'always';
  idleOpacity?: number;
  activeOpacity?: number;
  blurAmount?: number;
  springConfig?: {
    stiffness: number;
    damping: number;
  };
  className?: string;
  preferenceKey?: string; // for learning user behavior
}

interface ContextualBloomWrapperProps {
  config: BloomConfig;
  children: React.ReactNode;
}

export const ContextualBloomWrapper: React.FC<ContextualBloomWrapperProps> = ({
  config,
  children
}) => {
  const {
    triggerZone,
    idleOpacity = 0.2,
    activeOpacity = 1,
    blurAmount = 8,
    className = '',
    preferenceKey
  } = config;
  
  const { zones, isIdle, ultraMinimalMode, updatePreference } = useBloomStore();
  const [isVisible, setIsVisible] = useState(triggerZone === 'always');
  const startTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    if (triggerZone === 'always') {
      setIsVisible(true);
      return;
    }
    
    const zone = zones[triggerZone];
    const shouldBeVisible = zone.isActive || !isIdle;
    
    if (shouldBeVisible !== isVisible) {
      setIsVisible(shouldBeVisible);
      
      // Track preference if key provided
      if (preferenceKey && shouldBeVisible) {
        startTimeRef.current = Date.now();
      } else if (preferenceKey && !shouldBeVisible) {
        const duration = Date.now() - startTimeRef.current;
        updatePreference(preferenceKey, duration);
      }
    }
  }, [zones, triggerZone, isIdle, isVisible, preferenceKey, updatePreference]);
  
  // Ultra minimal mode overrides everything
  if (ultraMinimalMode && triggerZone !== 'always') {
    return null;
  }
  
  const currentOpacity = isVisible ? activeOpacity : idleOpacity;
  const currentBlur = isVisible ? 0 : blurAmount;
  
  return (
    <div
      className={cn(
        'transition-all duration-400 ease-out',
        isVisible ? 'bloom-enter' : '',
        className
      )}
      style={{
        opacity: currentOpacity,
        filter: `blur(${currentBlur}px)`,
        pointerEvents: currentOpacity < 0.5 ? 'none' : 'auto',
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      {children}
    </div>
  );
};
