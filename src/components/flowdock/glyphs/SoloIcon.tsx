import React from "react";

interface SoloIconProps {
  className?: string;
}

export const SoloIcon: React.FC<SoloIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Speaker body – same base as mute, but without cross */}
    <path d="M11 5H7L4 8v8l3 3h4V5z" fill="currentColor" />
    {/* Solo focus ring */}
    <path d="M15.5 8.5A3.5 3.5 0 0 1 19 12a3.5 3.5 0 0 1-3.5 3.5" />
    {/* Solo indicator */}
    <rect x={17} y={10} width={4} height={4} rx={1} fill="currentColor" />
  </svg>
);

