/**
 * AuraBloom Test Page
 * 
 * Isolated preview of the new AURA Bloom system.
 * Showcases both Welcome and Floating modes.
 */

import React, { useState } from 'react';
import { AuraBloom } from '../components/AuraBloom';

export const AuraBloomTestPage: React.FC = () => {
  const [mode, setMode] = useState<'welcome' | 'floating'>('welcome');
  const [position, setPosition] = useState({ x: 400, y: 400 });
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleAction = (action: string, payload?: unknown) => {
    setLastAction(`${action} ${payload ? JSON.stringify(payload) : ''}`);
    console.log('Bloom action:', action, payload);
  };

  const handleEnterFlow = () => {
    setMode('floating');
    setLastAction('Entered Flow!');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1033 50%, #0f0f1a 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* Header Controls */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 2000,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setMode('welcome')}
          style={{
            padding: '10px 20px',
            borderRadius: 12,
            border: mode === 'welcome' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.2)',
            background: mode === 'welcome' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0,0,0,0.3)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            backdropFilter: 'blur(10px)',
          }}
        >
          Welcome Mode
        </button>
        <button
          onClick={() => setMode('floating')}
          style={{
            padding: '10px 20px',
            borderRadius: 12,
            border: mode === 'floating' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.2)',
            background: mode === 'floating' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0,0,0,0.3)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            backdropFilter: 'blur(10px)',
          }}
        >
          Floating Mode
        </button>
        
        {lastAction && (
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(34, 211, 238, 0.15)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              fontSize: 12,
              color: '#22d3ee',
            }}
          >
            Action: {lastAction}
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          zIndex: 2000,
          padding: 16,
          borderRadius: 12,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          fontSize: 12,
          maxWidth: 300,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#8b5cf6' }}>
          AURA Bloom Test
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          • Click petals to trigger actions<br/>
          • Hover to see glow effects<br/>
          • In floating mode, drag the core to reposition<br/>
          • Click core to open/close menu
        </div>
      </div>

      {/* AuraBloom Component */}
      {mode === 'welcome' ? (
        <AuraBloom
          mode="welcome"
          onAction={handleAction}
          onEnterFlow={handleEnterFlow}
        />
      ) : (
        <AuraBloom
          mode="floating"
          position={position}
          onPositionChange={setPosition}
          onAction={handleAction}
        />
      )}
    </div>
  );
};

export default AuraBloomTestPage;
