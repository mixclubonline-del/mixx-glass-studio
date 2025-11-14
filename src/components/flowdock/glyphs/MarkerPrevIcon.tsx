import React from "react";

interface MarkerPrevIconProps {
  className?: string;
}

export const MarkerPrevIcon: React.FC<MarkerPrevIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Previous marker: bar + filled arrow */}
    <line x1={7} y1={6} x2={7} y2={18} />
    <path d="M17 6L9 12L17 18Z" fill="currentColor" />
  </svg>
);

