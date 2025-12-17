/**
 * AuraWelcome Component
 * 
 * Full-screen welcome experience using BloomMenu.
 * Replaces FlowWelcomeHub as the app entry point.
 * Uses the AURA Design System tokens.
 */

import React, { useEffect } from 'react';
import { BloomMenu } from './BloomMenu';
import { publishBloomSignal, publishAlsSignal } from '../../state/flowSignals';
import { 
  AuraColors, 
  AuraGradients, 
  AuraKeyframes,
  auraAlpha,
  AuraPalette 
} from '../../theme/aura-tokens';

interface AuraWelcomeProps {
  onEnterFlow: () => void;
}

export const AuraWelcome: React.FC<AuraWelcomeProps> = ({ onEnterFlow }) => {
  // Publish visibility signals on mount
  useEffect(() => {
    publishAlsSignal({
      source: 'system',
      meta: {
        surface: 'aura-welcome',
        stage: 'focus',
      },
    });

    publishBloomSignal({
      source: 'system',
      action: 'auraWelcomeVisible',
      payload: {
        mantra: 'Focus • Listen • Operate • Work',
      },
    });
  }, []);

  const handleEnterFlow = () => {
    // Publish transition signals
    publishBloomSignal({
      source: 'system',
      action: 'auraWelcomeEnter',
      payload: { trigger: 'bloom' },
    });

    publishAlsSignal({
      source: 'system',
      meta: {
        surface: 'aura-welcome',
        stage: 'complete',
      },
    });

    onEnterFlow();
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, 
          ${AuraColors.space} 0%, 
          ${AuraColors.night} 50%, 
          ${AuraColors.twilight} 100%
        )`,
      }}
    >
      {/* Inject AURA keyframes */}
      <style>{AuraKeyframes}</style>

      {/* Ambient background nebula */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 30%,
              ${auraAlpha(AuraPalette.violet.DEFAULT, 0.08)} 0%,
              transparent 50%
            ),
            radial-gradient(ellipse 60% 80% at 80% 70%,
              ${auraAlpha(AuraPalette.cyan.DEFAULT, 0.06)} 0%,
              transparent 50%
            ),
            radial-gradient(ellipse 70% 50% at 50% 80%,
              ${auraAlpha(AuraPalette.magenta.DEFAULT, 0.04)} 0%,
              transparent 50%
            )
          `,
        }}
      />
      
      {/* Animated central glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle,
            ${auraAlpha(AuraPalette.indigo.DEFAULT, 0.12)} 0%,
            ${auraAlpha(AuraPalette.violet.DEFAULT, 0.06)} 40%,
            transparent 70%
          )`,
          filter: 'blur(60px)',
          animation: 'aura-breathe 6s ease-in-out infinite',
        }}
      />
      
      {/* BloomMenu in home variant */}
      <main className="relative z-10">
        <BloomMenu 
          variant="home"
          onEnterFlow={handleEnterFlow}
          onItemSelect={(id, action) => {
            console.log(`Welcome action: ${id} -> ${action}`);
          }}
        />
      </main>
      
      {/* Footer */}
      <footer 
        className="absolute bottom-6 text-xs tracking-widest uppercase pointer-events-none"
        style={{
          color: auraAlpha(AuraPalette.violet[300], 0.4),
        }}
      >
        AURA Interface System • System Ready
      </footer>
    </div>
  );
};

export default AuraWelcome;
