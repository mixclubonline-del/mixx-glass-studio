/**
 * useAnimatePresence Hook
 * 
 * Replacement for Framer Motion's AnimatePresence.
 * Handles enter/exit animations for conditional rendering.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useFlowMotion } from './useFlowMotion';

export interface AnimatePresenceConfig {
  initial?: boolean;
  exitBeforeEnter?: boolean;
  mode?: 'wait' | 'sync';
}

export interface UseAnimatePresenceOptions {
  isVisible: boolean;
  initial?: { opacity?: number; scale?: number; x?: number; y?: number };
  animate?: { opacity?: number; scale?: number; x?: number; y?: number };
  exit?: { opacity?: number; scale?: number; x?: number; y?: number };
  transition?: { duration?: number; easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' };
  onExitComplete?: () => void;
}

/**
 * Hook for handling enter/exit animations
 * Replaces AnimatePresence + motion component pattern
 */
export function useAnimatePresence({
  isVisible,
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  exit = { opacity: 0 },
  transition = { duration: 300, easing: 'ease-out' },
  onExitComplete,
}: UseAnimatePresenceOptions) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isExiting, setIsExiting] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsExiting(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      setIsExiting(true);
      const duration = transition.duration || 300;
      timeoutRef.current = window.setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
        onExitComplete?.();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, transition.duration, onExitComplete]);

  // Determine which animation state to use
  const targetState = isExiting ? exit : (isVisible ? animate : initial);
  
  // Normalize state to ensure all properties are defined
  const normalizedState = {
    opacity: targetState.opacity ?? 1,
    scale: targetState.scale ?? 1,
    x: targetState.x ?? 0,
    y: targetState.y ?? 0,
  };
  
  // Use useFlowMotion for smooth animation
  const animatedStyle = useFlowMotion(
    normalizedState,
    {
      duration: transition.duration || 300,
      easing: transition.easing || 'ease-out',
    }
  );

  return {
    shouldRender,
    style: {
      opacity: animatedStyle.opacity,
      transform: [
        animatedStyle.scale !== 1 && `scale(${animatedStyle.scale})`,
        animatedStyle.x !== 0 && `translateX(${animatedStyle.x}px)`,
        animatedStyle.y !== 0 && `translateY(${animatedStyle.y}px)`,
      ].filter(Boolean).join(' ') || undefined,
    },
  };
}

/**
 * AnimatePresence Component
 * 
 * Drop-in replacement for Framer Motion's AnimatePresence
 */
export interface AnimatePresenceProps {
  children: React.ReactNode;
  mode?: 'wait' | 'sync';
  initial?: boolean;
}

export const AnimatePresence: React.FC<AnimatePresenceProps> = ({
  children,
  mode = 'sync',
  initial = true,
}) => {
  // For sync mode, just render children
  // Individual components handle their own animations via useAnimatePresence
  return <React.Fragment>{children}</React.Fragment>;
};


