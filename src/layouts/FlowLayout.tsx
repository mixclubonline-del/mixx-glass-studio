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
 * 
 * Adaptive: Layout adapts to platform, screen size, and orientation.
 */

import React from 'react';
import { useAdaptiveLayout, getAdaptiveLayoutCSS } from '../core/responsive/useAdaptiveLayout';
import './FlowLayout.css';

interface FlowLayoutProps {
  children: React.ReactNode;
  bloomHUD?: React.ReactNode;
  dock?: React.ReactNode;
  header?: React.ReactNode;
}

export function FlowLayout({ children, bloomHUD, dock, header }: FlowLayoutProps) {
  const layoutConfig = useAdaptiveLayout();
  const adaptiveCSS = getAdaptiveLayoutCSS(layoutConfig);

  return (
    <div 
      className="flow-root"
      style={adaptiveCSS}
      data-layout-mode={layoutConfig.mode}
      data-platform={layoutConfig.platform}
      data-orientation={layoutConfig.orientation}
    >
      {/* Header (Prime Brain ALS Bar) */}
      {header && (
        <div className="flow-header">
          {header}
        </div>
      )}
      
      {/* Bloom HUD Zone (Top) */}
      {layoutConfig.showBloom && bloomHUD && (
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
      {layoutConfig.showDock && dock && (
        <div className="flow-dock">
          {dock}
        </div>
      )}
    </div>
  );
}

