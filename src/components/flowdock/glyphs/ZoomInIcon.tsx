import React from "react";

interface ZoomInIconProps {
  className?: string;
}

export const ZoomInIcon: React.FC<ZoomInIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Lens with soft fill for Apple-glass feel */}
    <circle cx={11} cy={11} r={7} fill="currentColor" opacity={0.12} />
    <circle cx={11} cy={11} r={7} />
    {/* Handle */}
    <line x1={16} y1={16} x2={21} y2={21} />
    {/* Plus */}
    <line x1={11} y1={8} x2={11} y2={14} />
    <line x1={8} y1={11} x2={14} y2={11} />
  </svg>
);

