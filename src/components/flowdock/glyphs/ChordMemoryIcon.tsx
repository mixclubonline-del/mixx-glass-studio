import React from "react";

interface ChordMemoryIconProps {
  className?: string;
}

export const ChordMemoryIcon: React.FC<ChordMemoryIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M 7 11 L 7 7 A 5 5 0 0 1 17 7 L 17 11" />
    <circle cx="12" cy="16" r="1" />
  </svg>
);

