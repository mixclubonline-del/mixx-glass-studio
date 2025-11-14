import React from "react";

interface PunchInIconProps {
  className?: string;
}

export const PunchInIcon: React.FC<PunchInIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Punch-in region */}
    <rect x={7} y={7} width={10} height={10} rx={2} fill="currentColor" opacity={0.15} />
    <rect x={7} y={7} width={10} height={10} rx={2} />
    {/* Left boundary */}
    <line x1={9} y1={7} x2={9} y2={17} />
    {/* Arrow from left into region */}
    <path d="M5 12h4" />
    <path d="M6.5 10.5L5 12l1.5 1.5" />
  </svg>
);

