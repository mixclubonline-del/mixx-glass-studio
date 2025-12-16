/**
 * AuraBloom Test Button
 * 
 * Dev-only button to access the BloomMenu test page.
 */

import React, { useState } from 'react';
import { BloomMenu } from '../AuraBloom';

export const AuraBloomTestButton: React.FC = () => {
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [variant, setVariant] = useState<'home' | 'tool'>('home');

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsTestOpen(true)}
        style={{
          position: 'fixed',
          bottom: 60,
          right: 16,
          zIndex: 9999,
          padding: '10px 16px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))',
          border: '1px solid rgba(139, 92, 246, 0.5)',
          color: '#a78bfa',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
        }}
        title="Test AURA Bloom System"
      >
        🌸 Test Bloom
      </button>
      
      {isTestOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 10000,
            background: 'linear-gradient(135deg, #0a0a12 0%, #12101a 50%, #0d0b14 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Ambient background glow */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 800,
                height: 800,
                background: 'rgba(30, 58, 138, 0.1)',
                borderRadius: '50%',
                filter: 'blur(100px)',
              }}
            />
          </div>

          {/* Controls */}
          <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10001, display: 'flex', gap: 12 }}>
            <button
              onClick={() => setVariant(v => v === 'home' ? 'tool' : 'home')}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Switch to {variant === 'home' ? 'Tool' : 'Home'}
            </button>
            <button
              onClick={() => setIsTestOpen(false)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* BloomMenu */}
          <BloomMenu 
            key={variant}
            variant={variant}
            onItemSelect={(id, action) => {
              console.log(`Selected: ${id}, Action: ${action}`);
            }}
            onEnterFlow={() => {
              console.log('Entering Flow!');
              setVariant('tool');
            }}
          />

          {/* Footer */}
          <div style={{ 
            position: 'absolute', 
            bottom: 20, 
            color: 'rgba(255,255,255,0.2)', 
            fontSize: 11, 
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}>
            Aura Interface System • {variant === 'home' ? 'System Ready' : 'Session Active'}
          </div>
        </div>
      )}
    </>
  );
};

export default AuraBloomTestButton;
