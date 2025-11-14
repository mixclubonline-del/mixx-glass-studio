import React from "react";

interface FitIconProps {
  className?: string;
}

export const FitIcon: React.FC<FitIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Full view frame with subtle fill */}
    <rect x={4} y={4} width={16} height={16} rx={2} fill="currentColor" opacity={0.08} />
    <rect x={4} y={4} width={16} height={16} rx={2} />
    {/* Inset guide line to suggest full fit */}
    <line x1={7} y1={12} x2={17} y2={12} />
  </svg>
);

