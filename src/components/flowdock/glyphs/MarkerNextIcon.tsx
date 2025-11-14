import React from "react";

interface MarkerNextIconProps {
  className?: string;
}

export const MarkerNextIcon: React.FC<MarkerNextIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Next marker: filled arrow + bar */}
    <path d="M7 6L15 12L7 18Z" fill="currentColor" />
    <line x1={17} y1={6} x2={17} y2={18} />
  </svg>
);

