/**
 * AuraCore Component
 * 
 * The central hub of the bloom menu - an ethereal, living orb
 * with layered aurora effects, rich multi-color blending, and pulsing energy.
 * 
 * AURA Color Palette:
 * - Violet (#8B5CF6) - Primary mystical/creative
 * - Cyan (#22D3EE) - Flow/technology  
 * - Magenta (#EC4899) - Energy/warmth
 * - Amber (#F59E0B) - Premium/golden
 * - Indigo (#6366F1) - Deep/spiritual
 */

import React, { memo } from 'react';

interface AuraCoreProps {
  /** Size variant */
  size?: 'large' | 'small';
  /** Whether the menu is expanded */
  isOpen: boolean;
  /** Whether currently being pressed */
  isActive: boolean;
  /** Click handler */
  onClick: () => void;
  /** Optional label override */
  label?: string;
}

export const AuraCore: React.FC<AuraCoreProps> = memo(({
  size = 'large',
  isOpen,
  isActive,
  onClick,
  label = 'AURA',
}) => {
  const isLarge = size === 'large';
  const coreSize = isLarge ? 160 : 120;
  
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
              rgba(139, 92, 246, ${isOpen ? 0.2 : 0.12}) 0%,
              transparent 60%
            ),
            radial-gradient(ellipse 70% 60% at 70% 80%,
              rgba(236, 72, 153, ${isOpen ? 0.15 : 0.08}) 0%,
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
              rgba(34, 211, 238, ${isOpen ? 0.18 : 0.1}) 0%,
              transparent 50%
            ),
            radial-gradient(ellipse 60% 50% at 20% 70%,
              rgba(99, 102, 241, ${isOpen ? 0.15 : 0.08}) 0%,
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
              rgba(245, 158, 11, ${isOpen ? 0.1 : 0.05}) 0%,
              transparent 40%
            )
          `,
          filter: 'blur(30px)',
          animation: 'aura-pulse-slow 6s ease-in-out infinite',
        }}
      />

      {/* ===== AURORA WISPS (Rotating Color Streams) ===== */}
      
      {/* Wisp 1 - Primary rainbow rotation */}
      <div 
        className="absolute rounded-full pointer-events-none overflow-hidden"
        style={{
          inset: -30,
          animation: 'spin 25s linear infinite',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(
              from 0deg,
              transparent 0%,
              rgba(139, 92, 246, 0.35) 8%,
              rgba(236, 72, 153, 0.25) 16%,
              transparent 24%,
              transparent 33%,
              rgba(34, 211, 238, 0.3) 41%,
              rgba(99, 102, 241, 0.25) 49%,
              transparent 57%,
              transparent 66%,
              rgba(245, 158, 11, 0.2) 74%,
              rgba(139, 92, 246, 0.25) 82%,
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
          animation: 'spin 18s linear infinite reverse',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(
              from 60deg,
              transparent 0%,
              rgba(236, 72, 153, 0.3) 12%,
              transparent 25%,
              transparent 40%,
              rgba(34, 211, 238, 0.25) 55%,
              transparent 70%,
              transparent 85%,
              rgba(245, 158, 11, 0.2) 95%,
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
              border: '1px dashed rgba(139, 92, 246, 0.3)',
              animation: 'spin 30s linear infinite',
            }}
          />
          
          {/* Middle dotted ring - cyan */}
          <div 
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -20,
              border: '1px dotted rgba(34, 211, 238, 0.25)',
              animation: 'spin 22s linear infinite reverse',
            }}
          />
          
          {/* Inner solid ring - magenta glow */}
          <div 
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -8,
              border: '1px solid rgba(236, 72, 153, 0.15)',
              boxShadow: '0 0 10px rgba(236, 72, 153, 0.2)',
              animation: 'spin 35s linear infinite',
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
              rgba(139, 92, 246, 0.2) 0%, 
              transparent 35%
            ),
            radial-gradient(circle at 20% 80%, 
              rgba(34, 211, 238, 0.15) 0%, 
              transparent 30%
            ),
            radial-gradient(circle at 80% 20%, 
              rgba(236, 72, 153, 0.12) 0%, 
              transparent 30%
            ),
            radial-gradient(circle at center, 
              rgba(25, 20, 50, 0.95) 0%, 
              rgba(10, 10, 25, 0.98) 100%
            )
          `,
          boxShadow: `
            inset 0 0 30px rgba(139, 92, 246, ${isOpen ? 0.35 : 0.2}),
            inset 0 0 60px rgba(34, 211, 238, ${isOpen ? 0.15 : 0.08}),
            inset 0 0 40px rgba(236, 72, 153, ${isOpen ? 0.1 : 0.05}),
            0 0 50px rgba(139, 92, 246, ${isOpen ? 0.5 : 0.25}),
            0 0 80px rgba(34, 211, 238, ${isOpen ? 0.25 : 0.12}),
            0 0 100px rgba(236, 72, 153, ${isOpen ? 0.15 : 0.08})
          `,
          border: `1px solid rgba(255, 255, 255, ${isOpen ? 0.35 : 0.18})`,
          backdropFilter: 'blur(20px)',
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
                rgba(139, 92, 246, 0.5) 0%,
                rgba(236, 72, 153, 0.3) 30%,
                rgba(34, 211, 238, 0.2) 60%,
                transparent 100%
              )
            `,
            filter: 'blur(10px)',
            animation: 'aura-core-pulse 3s ease-in-out infinite',
          }}
        />
        
        {/* Secondary inner glow - amber/gold */}
        <div 
          className="absolute rounded-full"
          style={{
            inset: '30%',
            background: `
              radial-gradient(circle at 60% 70%,
                rgba(245, 158, 11, 0.25) 0%,
                transparent 60%
              )
            `,
            filter: 'blur(8px)',
            animation: 'aura-core-pulse 4s ease-in-out infinite reverse',
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
              rgba(139, 92, 246, 0.3) 0%, 
              rgba(236, 72, 153, 0.15) 50%,
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
          border: `1px solid rgba(139, 92, 246, ${isOpen ? 0.5 : 0.3})`,
          boxShadow: `
            0 0 15px rgba(139, 92, 246, ${isOpen ? 0.4 : 0.2}),
            0 0 8px rgba(34, 211, 238, ${isOpen ? 0.3 : 0.15}),
            inset 0 0 15px rgba(236, 72, 153, ${isOpen ? 0.2 : 0.1})
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
            textShadow: `
              0 0 15px rgba(139, 92, 246, 0.9),
              0 0 30px rgba(236, 72, 153, 0.5),
              0 0 45px rgba(34, 211, 238, 0.4),
              0 0 60px rgba(245, 158, 11, 0.25)
            `,
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
              color: 'rgba(167, 139, 250, 0.7)',
              textShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
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
              rgba(139, 92, 246, 0.5) 0%, 
              rgba(236, 72, 153, 0.3) 40%,
              rgba(34, 211, 238, 0.2) 70%,
              transparent 100%
            )`,
            animation: 'aura-ripple 0.6s ease-out forwards',
          }}
        />
      )}

      {/* ===== CSS KEYFRAMES ===== */}
      <style>{`
        @keyframes aura-drift {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.8; 
          }
          25% { 
            transform: translate(5px, -5px) scale(1.05); 
          }
          50% { 
            transform: translate(-3px, 3px) scale(1.02); 
            opacity: 1; 
          }
          75% { 
            transform: translate(-5px, -3px) scale(0.98); 
          }
        }
        
        @keyframes aura-pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.9; }
        }
        
        @keyframes aura-core-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
          50% { transform: scale(1.15) rotate(10deg); opacity: 0.9; }
        }
        
        @keyframes aura-ripple {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

AuraCore.displayName = 'AuraCore';

export default AuraCore;
