import React from "react";

interface ChordPaletteIconProps {
  className?: string;
}

export const ChordPaletteIcon: React.FC<ChordPaletteIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="10" y="3" width="6" height="6" rx="1" />
    <rect x="17" y="3" width="6" height="6" rx="1" />
    <rect x="3" y="10" width="6" height="6" rx="1" />
    <rect x="10" y="10" width="6" height="6" rx="1" />
    <rect x="17" y="10" width="6" height="6" rx="1" />
  </svg>
);

