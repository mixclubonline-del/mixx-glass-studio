/**
 * Flow Pulse Bar Visualizer
 * 
 * Part B of Full Flow Physiology Expansion Pack.
 * The "heartbeat of Flow" - visual pulse indicator above timeline.
 * 
 * Every beat, ambient change, or sample load sends a pulse through the UI.
 */

import React, { useEffect, useState } from 'react';
import './FlowPulseBar.css';

interface FlowPulseBarProps {
  pulse?: number; // Pulse % (0-100)
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

export function FlowPulseBar({ pulse, className }: FlowPulseBarProps) {
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
    
    // Update every 30ms for smooth animation
    const interval = setInterval(updatePulse, 30);
    
    return () => clearInterval(interval);
  }, [pulse]);
  
  // Get thermal color for pulse bar
  const getThermalColor = () => {
    const temp = window.__als?.temperature || 'cold';
    switch (temp) {
      case 'cold':
        return 'linear-gradient(90deg, #78a0ff, #96b4ff, #b4c8ff)';
      case 'warming':
        return 'linear-gradient(90deg, #96b4ff, #b4c8ff, #d2dcff)';
      case 'warm':
        return 'linear-gradient(90deg, #ffb478, #ffc896, #ffdcb4)';
      case 'hot':
        return 'linear-gradient(90deg, #ff785a, #ff9678, #ffb496)';
      case 'blazing':
        return 'linear-gradient(90deg, #ff4646, #ff6464, #ff8282)';
      default:
        return 'linear-gradient(90deg, #a280ff, #d478ff, #ff85c0)';
    }
  };
  
  return (
    <div className={`flow-pulse-bar ${className || ''}`}>
      <div
        className="pulse-fill"
        style={{
          width: `${Math.min(100, Math.max(0, currentPulse))}%`,
          background: getThermalColor(),
        }}
      />
    </div>
  );
}

