/**
 * AuraCore Component
 * 
 * The central hub of the bloom menu - an ethereal, living orb
 * with layered aurora effects, rich multi-color blending, and pulsing energy.
 * 
 * Uses the AURA Design System tokens for consistent styling.
 */

import React, { memo } from 'react';
import { 
  AuraPalette, 
  AuraEffects, 
  AuraKeyframes,
  auraAlpha 
} from '../../theme/aura-tokens';

// Extract palette colors for readability
const { violet, cyan, magenta, amber, indigo } = AuraPalette;

interface AuraCoreProps {
  /** Size variant */
  size?: 'large' | 'small';
  /** Whether the menu is expanded */
  isOpen: boolean;
  /** Whether currently being pressed */
  isActive: boolean;
  /** Click handler */
  onClick: () => void;
  /** Toggle handler */
  onToggle?: () => void;
  /** Optional label override */
  label?: string;
}

export const AuraCore: React.FC<AuraCoreProps> = memo(({
  size = 'small',
  isOpen,
  isActive,
  onClick,
  onToggle,
  label = 'AURA',
}) => {
  const isLarge = size === 'large';
  const coreSize = isLarge ? 160 : 120;
  
  // Dynamic opacity based on open state
  const openAlpha = isOpen ? 1 : 0.6;
  const closedAlpha = isOpen ? 0.6 : 1;
  
  return (
    <div 
      className={`
        absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
        z-50 cursor-pointer select-none
        transition-transform duration-300 ease-out
        ${isActive ? 'scale-95' : 'hover:scale-[1.02]'}
      `}
      style={{
        width: coreSize,
        height: coreSize,
      }}
      onClick={onClick}
    >
      {/* ===== OUTERMOST NEBULA AURA ===== */}
      
      {/* Nebula layer 1 - Violet/Magenta blend */}
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -100,
          background: `
            radial-gradient(ellipse 60% 80% at 30% 20%,
              ${auraAlpha(violet.DEFAULT, isOpen ? 0.2 : 0.12)} 0%,
              transparent 60%
            ),
            radial-gradient(ellipse 70% 60% at 70% 80%,
              ${auraAlpha(magenta.DEFAULT, isOpen ? 0.15 : 0.08)} 0%,
              transparent 50%
            )
          `,
          filter: 'blur(40px)',
          animation: 'aura-drift 8s ease-in-out infinite',
        }}
      />
      
      {/* Nebula layer 2 - Cyan/Indigo blend */}
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -80,
          background: `
            radial-gradient(ellipse 50% 70% at 80% 30%,
              ${auraAlpha(cyan.DEFAULT, isOpen ? 0.18 : 0.1)} 0%,
              transparent 50%
            ),
            radial-gradient(ellipse 60% 50% at 20% 70%,
              ${auraAlpha(indigo.DEFAULT, isOpen ? 0.15 : 0.08)} 0%,
              transparent 50%
            )
          `,
          filter: 'blur(35px)',
          animation: 'aura-drift 10s ease-in-out infinite reverse',
        }}
      />
      
      {/* Nebula layer 3 - Amber/Gold accent */}
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -60,
          background: `
            radial-gradient(ellipse 40% 50% at 50% 20%,
              ${auraAlpha(amber.DEFAULT, isOpen ? 0.1 : 0.05)} 0%,
              transparent 40%
            )
          `,
          filter: 'blur(30px)',
          animation: 'aura-pulse 6s ease-in-out infinite',
        }}
      />

      {/* ===== AURORA WISPS (Rotating Color Streams) ===== */}
      
      {/* Wisp 1 - Primary rainbow rotation */}
      <div 
        className="absolute rounded-full pointer-events-none overflow-hidden"
        style={{
          inset: -30,
          animation: 'aura-spin 25s linear infinite',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(
              from 0deg,
              transparent 0%,
              ${auraAlpha(violet.DEFAULT, 0.35)} 8%,
              ${auraAlpha(magenta.DEFAULT, 0.25)} 16%,
              transparent 24%,
              transparent 33%,
              ${auraAlpha(cyan.DEFAULT, 0.3)} 41%,
              ${auraAlpha(indigo.DEFAULT, 0.25)} 49%,
              transparent 57%,
              transparent 66%,
              ${auraAlpha(amber.DEFAULT, 0.2)} 74%,
              ${auraAlpha(violet.DEFAULT, 0.25)} 82%,
              transparent 90%,
              transparent 100%
            )`,
            filter: 'blur(18px)',
            opacity: isOpen ? 0.9 : 0.5,
            transition: 'opacity 0.5s ease',
          }}
        />
      </div>
      
      {/* Wisp 2 - Secondary counter-rotation */}
      <div 
        className="absolute rounded-full pointer-events-none overflow-hidden"
        style={{
          inset: -15,
          animation: 'aura-spin-reverse 18s linear infinite',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(
              from 60deg,
              transparent 0%,
              ${auraAlpha(magenta.DEFAULT, 0.3)} 12%,
              transparent 25%,
              transparent 40%,
              ${auraAlpha(cyan.DEFAULT, 0.25)} 55%,
              transparent 70%,
              transparent 85%,
              ${auraAlpha(amber.DEFAULT, 0.2)} 95%,
              transparent 100%
            )`,
            filter: 'blur(12px)',
            opacity: isOpen ? 0.7 : 0.35,
            transition: 'opacity 0.5s ease',
          }}
        />
      </div>

      {/* ===== ROTATING ETHEREAL RINGS ===== */}
      
      {!isOpen && isLarge && (
        <>
          {/* Outer dashed ring - violet */}
          <div 
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -32,
              border: AuraEffects.rings.dashed.violet,
              animation: 'aura-spin 30s linear infinite',
            }}
          />
          
          {/* Middle dotted ring - cyan */}
          <div 
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -20,
              border: AuraEffects.rings.dotted.cyan,
              animation: 'aura-spin-reverse 22s linear infinite',
            }}
          />
          
          {/* Inner solid ring - magenta glow */}
          <div 
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -8,
              border: AuraEffects.rings.solid.magenta,
              boxShadow: AuraEffects.rings.glow.magenta,
              animation: 'aura-spin 35s linear infinite',
            }}
          />
        </>
      )}

      {/* ===== MAIN GLASS ORB ===== */}
      
      <div 
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 25% 20%, 
              rgba(255, 255, 255, 0.3) 0%, 
              transparent 30%
            ),
            radial-gradient(circle at 75% 80%, 
              ${auraAlpha(violet.DEFAULT, 0.2)} 0%, 
              transparent 35%
            ),
            radial-gradient(circle at 20% 80%, 
              ${auraAlpha(cyan.DEFAULT, 0.15)} 0%, 
              transparent 30%
            ),
            radial-gradient(circle at 80% 20%, 
              ${auraAlpha(magenta.DEFAULT, 0.12)} 0%, 
              transparent 30%
            ),
            radial-gradient(circle at center, 
              rgba(25, 20, 50, 0.95) 0%, 
              rgba(10, 10, 25, 0.98) 100%
            )
          `,
          boxShadow: `
            inset 0 0 30px ${auraAlpha(violet.DEFAULT, isOpen ? 0.35 : 0.2)},
            inset 0 0 60px ${auraAlpha(cyan.DEFAULT, isOpen ? 0.15 : 0.08)},
            inset 0 0 40px ${auraAlpha(magenta.DEFAULT, isOpen ? 0.1 : 0.05)},
            0 0 50px ${auraAlpha(violet.DEFAULT, isOpen ? 0.5 : 0.25)},
            0 0 80px ${auraAlpha(cyan.DEFAULT, isOpen ? 0.25 : 0.12)},
            0 0 100px ${auraAlpha(magenta.DEFAULT, isOpen ? 0.15 : 0.08)}
          `,
          border: `1px solid rgba(255, 255, 255, ${isOpen ? 0.35 : 0.18})`,
          backdropFilter: AuraEffects.glass.backdropFilterHeavy,
          transition: 'all 0.5s ease',
        }}
      >
        {/* Inner energy core - multi-color pulsing */}
        <div 
          className="absolute rounded-full"
          style={{
            inset: '20%',
            background: `
              radial-gradient(circle at 40% 30%,
                ${auraAlpha(violet.DEFAULT, 0.5)} 0%,
                ${auraAlpha(magenta.DEFAULT, 0.3)} 30%,
                ${auraAlpha(cyan.DEFAULT, 0.2)} 60%,
                transparent 100%
              )
            `,
            filter: 'blur(10px)',
            animation: 'aura-pulse 3s ease-in-out infinite',
          }}
        />
        
        {/* Secondary inner glow - amber/gold */}
        <div 
          className="absolute rounded-full"
          style={{
            inset: '30%',
            background: `
              radial-gradient(circle at 60% 70%,
                ${auraAlpha(amber.DEFAULT, 0.25)} 0%,
                transparent 60%
              )
            `,
            filter: 'blur(8px)',
            animation: 'aura-pulse 4s ease-in-out infinite reverse',
          }}
        />
        
        {/* Top highlight arc */}
        <div 
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '6%',
            left: '12%',
            width: '45%',
            height: '28%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            filter: 'blur(3px)',
            borderRadius: '50%',
          }}
        />
        
        {/* Bottom right color accent */}
        <div 
          className="absolute rounded-full pointer-events-none"
          style={{
            bottom: '12%',
            right: '8%',
            width: '35%',
            height: '25%',
            background: `linear-gradient(315deg, 
              ${auraAlpha(violet.DEFAULT, 0.3)} 0%, 
              ${auraAlpha(magenta.DEFAULT, 0.15)} 50%,
              transparent 100%
            )`,
            filter: 'blur(8px)',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* ===== INNER DECORATIVE RING ===== */}
      
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '12%',
          border: `1px solid ${auraAlpha(violet.DEFAULT, isOpen ? 0.5 : 0.3)}`,
          boxShadow: `
            0 0 15px ${auraAlpha(violet.DEFAULT, isOpen ? 0.4 : 0.2)},
            0 0 8px ${auraAlpha(cyan.DEFAULT, isOpen ? 0.3 : 0.15)},
            inset 0 0 15px ${auraAlpha(magenta.DEFAULT, isOpen ? 0.2 : 0.1)}
          `,
          transition: 'all 0.5s ease',
        }}
      />

      {/* ===== TEXT LABEL ===== */}
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <span 
          className="font-semibold tracking-[0.35em] pl-1"
          style={{
            fontSize: isLarge ? 28 : 22,
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: AuraEffects.textGlow.aura,
            transition: 'all 0.3s ease',
          }}
        >
          {label}
        </span>
        
        {/* Subtitle for home mode */}
        {isLarge && !isOpen && (
          <span 
            className="text-[9px] uppercase tracking-[0.3em] mt-1"
            style={{
              color: auraAlpha(violet[400], 0.7),
              textShadow: `0 0 10px ${auraAlpha(violet.DEFAULT, 0.5)}`,
            }}
          >
            Start
          </span>
        )}
      </div>

      {/* ===== RIPPLE EFFECT ON CLICK ===== */}
      {isActive && (
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, 
              ${auraAlpha(violet.DEFAULT, 0.5)} 0%, 
              ${auraAlpha(magenta.DEFAULT, 0.3)} 40%,
              ${auraAlpha(cyan.DEFAULT, 0.2)} 70%,
              transparent 100%
            )`,
            animation: 'aura-ripple 0.6s ease-out forwards',
          }}
        />
      )}

      {/* ===== KEYFRAME ANIMATIONS ===== */}
      <style>{AuraKeyframes}</style>
    </div>
  );
});

AuraCore.displayName = 'AuraCore';

export default AuraCore;
