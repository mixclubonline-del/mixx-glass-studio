import React from "react";

interface AutoPunchIconProps {
  className?: string;
}

export const AutoPunchIcon: React.FC<AutoPunchIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Auto-punch region */}
    <rect x={7} y={7} width={10} height={10} rx={2} fill="currentColor" opacity={0.15} />
    <rect x={7} y={7} width={10} height={10} rx={2} />
    {/* Left and right boundaries */}
    <line x1={9} y1={7} x2={9} y2={17} />
    <line x1={15} y1={7} x2={15} y2={17} />
    {/* Arrows on both sides */}
    <path d="M5 12h4" />
    <path d="M6.5 10.5L5 12l1.5 1.5" />
    <path d="M15 12h4" />
    <path d="M17.5 10.5L19 12l-1.5 1.5" />
  </svg>
);

