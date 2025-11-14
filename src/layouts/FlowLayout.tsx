/**
 * Flow Layout Container
 * 
 * Permanent anchoring system for Flow's geometry.
 * Creates a three-tier cockpit:
 * - Flow HUD (top): Bloom lives here
 * - Timeline (middle): Protected creative zone
 * - Flow Dock (bottom): Never moves
 * 
 * This turns Flow into a real instrument, not a webpage.
 */

import React from 'react';
import './FlowLayout.css';

interface FlowLayoutProps {
  children: React.ReactNode;
  bloomHUD?: React.ReactNode;
  dock?: React.ReactNode;
  header?: React.ReactNode;
}

export function FlowLayout({ children, bloomHUD, dock, header }: FlowLayoutProps) {
  return (
    <div className="flow-root">
      {/* Header (Prime Brain ALS Bar) */}
      {header && (
        <div className="flow-header">
          {header}
        </div>
      )}
      
      {/* Bloom HUD Zone (Top) */}
      {bloomHUD && (
        <div className="flow-hud">
          <div className="bloom-anchor">
            {bloomHUD}
          </div>
        </div>
      )}
      
      {/* Timeline Zone (Middle - Protected Creative Zone) */}
      <div className="flow-content">
        {children}
      </div>
      
      {/* Dock Zone (Bottom - Never Moves) */}
      {dock && (
        <div className="flow-dock">
          {dock}
        </div>
      )}
    </div>
  );
}

