import React from "react";

interface PunchOutIconProps {
  className?: string;
}

export const PunchOutIcon: React.FC<PunchOutIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Punch-out region */}
    <rect x={7} y={7} width={10} height={10} rx={2} fill="currentColor" opacity={0.15} />
    <rect x={7} y={7} width={10} height={10} rx={2} />
    {/* Right boundary */}
    <line x1={15} y1={7} x2={15} y2={17} />
    {/* Arrow from region to right */}
    <path d="M15 12h4" />
    <path d="M17.5 10.5L19 12l-1.5 1.5" />
  </svg>
);

