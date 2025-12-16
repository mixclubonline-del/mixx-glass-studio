/**
 * AuraWelcome Component
 * 
 * Full-screen welcome experience using BloomMenu.
 * Replaces FlowWelcomeHub as the app entry point.
 */

import React, { useEffect } from 'react';
import { BloomMenu } from './BloomMenu';
import { publishBloomSignal, publishAlsSignal } from '../../state/flowSignals';

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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0a12] via-[#12101a] to-[#0d0b14]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[100px] animate-pulse" 
          style={{ animationDuration: '6s' }}
        />
      </div>
      
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
      <footer className="absolute bottom-6 text-white/20 text-xs tracking-widest uppercase pointer-events-none">
        AURA Interface System • System Ready
      </footer>
    </div>
  );
};

export default AuraWelcome;
