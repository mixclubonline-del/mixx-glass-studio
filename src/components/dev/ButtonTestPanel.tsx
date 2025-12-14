/**
 * Button Test Panel
 * 
 * Visual test component to verify button styles are working.
 * Add this temporarily to your app to see if styles are applying.
 */

import React from 'react';

export const ButtonTestPanel: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 10000,
      padding: '20px',
      background: 'rgba(0,0,0,0.8)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <h3 style={{ color: 'white', margin: 0, fontSize: '14px' }}>Button Style Test</h3>
      
      <button className="button-mixx primary">
        Primary Button
      </button>
      
      <button className="button-mixx secondary">
        Secondary Button
      </button>
      
      <button className="button-mixx ghost">
        Ghost Button
      </button>
      
      <button className="button-mixx icon" aria-label="Test icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </button>
      
      <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
        If these buttons look styled, CSS is working.
        <br />
        Check console for polyfill status.
      </div>
    </div>
  );
};
