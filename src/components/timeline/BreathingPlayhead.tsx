/**
 * Breathing Playhead Component
 * 
 * Anchor-safe version that expands and contracts with ALS Pulse.
 * Stays perfectly aligned with timeline ruler, grid lines, clip edges.
 * NEVER touches Bloom, Dock, or HUD.
 * 
 * This is the Flow-accurate playhead that becomes a literal heartbeat of the session.
 */

import React, { useEffect, useState } from 'react';
import './BreathingPlayhead.css';

interface BreathingPlayheadProps {
  x: number; // Pixel offset for current playhead position
  pulse?: number; // Pulse % (0-100) from ALS
  className?: string;
}

declare global {
  interface Window {
    __als?: {
      pulse?: number;
      temperature?: string;
    };
  }
}

export function BreathingPlayhead({ x, pulse, className }: BreathingPlayheadProps) {
  const [currentPulse, setCurrentPulse] = useState(pulse ?? 0);
  
  // Sync with global ALS pulse if not provided
  useEffect(() => {
    if (pulse !== undefined) {
      setCurrentPulse(pulse);
      return;
    }
    
    // Read from global ALS
    const updatePulse = () => {
      const alsPulse = window.__als?.pulse || 0;
      setCurrentPulse(alsPulse);
    };
    
    // Initial update
    updatePulse();
    
    // Update every 30ms for smooth animation (matches Flow Pulse update rate)
    const interval = setInterval(updatePulse, 30);
    
    return () => clearInterval(interval);
  }, [pulse]);
  
  // Gentle vertical breath: scale from 1.0 to 1.35 (35% expansion at max pulse)
  const scale = 1 + (currentPulse / 100) * 0.35;
  
  // Glow intensity: 0-40px based on pulse
  const glow = currentPulse * 0.4;
  
  // Get thermal color based on temperature
  const getGlowColor = () => {
    const temp = window.__als?.temperature || 'cold';
    switch (temp) {
      case 'cold':
        return 'rgba(150, 120, 255, 0.65)';
      case 'warming':
        return 'rgba(150, 180, 255, 0.7)';
      case 'warm':
        return 'rgba(255, 200, 140, 0.75)';
      case 'hot':
        return 'rgba(255, 150, 110, 0.8)';
      case 'blazing':
        return 'rgba(255, 90, 90, 0.85)';
      default:
        return 'rgba(150, 120, 255, 0.65)';
    }
  };
  
  return (
    <div
      className={`flow-breathing-playhead ${className || ''}`}
      style={{
        transform: `translateX(${x}px) scaleY(${scale})`,
        boxShadow: `0 0 ${glow}px ${getGlowColor()}`,
      }}
    />
  );
}

