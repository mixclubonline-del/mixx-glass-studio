/**
 * Playhead Pulse Component
 * 
 * Part A of Flow Physiology Expansion Pack.
 * Breathing playback head that expands and contracts based on ALS Pulse.
 * 
 * This turns the playhead into a living heartbeat of the session —
 * the same way Ableton's transport LED blinks, but 10x more elegant, more Flow.
 */

import React, { useEffect, useState } from 'react';
import './PlayheadPulse.css';

interface PlayheadPulseProps {
  pulse?: number; // Pulse % (0-100) from ALS
  className?: string;
}

// Window interface extensions moved to src/types/globals.d.ts

export function PlayheadPulse({ pulse, className }: PlayheadPulseProps) {
  const [currentPulse, setCurrentPulse] = useState(pulse || 0);
  
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
  
  // Calculate breathing scale (1.0 to 1.35 based on pulse)
  const scale = 1 + (currentPulse / 100) * 0.35;
  
  // Calculate glow intensity (0-40px based on pulse)
  const glow = currentPulse * 0.4;
  
  // Get thermal color based on temperature
  const getGlowColor = () => {
    const temp = window.__als?.temperature || 'cold';
    switch (temp) {
      case 'cold':
        return 'rgba(120, 160, 255, 0.65)';
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
      className={`playhead-pulse ${className || ''}`}
      style={{
        transform: `scaleY(${scale})`,
        boxShadow: `0 0 ${glow}px ${getGlowColor()}`,
      }}
    />
  );
}

