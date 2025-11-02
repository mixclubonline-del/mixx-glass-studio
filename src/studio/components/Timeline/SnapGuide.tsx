/**
 * Snap Guide - Visual snap indicators during drag operations
 */

import React from 'react';

interface SnapGuideProps {
  snapPositions: number[];
  zoom: number;
  height: number;
}

export const SnapGuide: React.FC<SnapGuideProps> = ({ snapPositions, zoom, height }) => {
  if (snapPositions.length === 0) return null;

  return (
    <>
      {snapPositions.map((position, i) => (
        <div
          key={i}
          className="absolute top-0 w-[2px] pointer-events-none animate-fade-in"
          style={{
            left: `${position * zoom}px`,
            height: `${height}px`,
            background: 'linear-gradient(180deg, hsl(var(--accent)) 0%, transparent 100%)',
            boxShadow: '0 0 8px hsl(var(--accent) / 0.5)'
          }}
        />
      ))}
    </>
  );
};
