/**
 * Bloom Detection Hook - Mouse proximity and idle detection
 */

import { useEffect, useState } from 'react';
import { useBloomStore } from '@/store/bloomStore';

interface BloomDetectionConfig {
  idleTimeout?: number; // ms before considering idle
  proximityThreshold?: number; // px distance to trigger
}

export const useBloomDetection = (config: BloomDetectionConfig = {}) => {
  const { idleTimeout = 5000, proximityThreshold = 100 } = config;
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { setIdle, isIdle } = useBloomStore();
  
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    
    const resetIdleTimer = () => {
      // Reset idle state
      if (isIdle) {
        setIdle(false);
      }
      
      // Reset idle timer
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIdle(true);
      }, idleTimeout);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      resetIdleTimer();
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      resetIdleTimer();
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    
    // Start idle timer
    idleTimer = setTimeout(() => {
      setIdle(true);
    }, idleTimeout);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(idleTimer);
    };
  }, [idleTimeout, isIdle, setIdle]);
  
  return { mousePosition, isIdle };
};
