import React from "react";

interface GainLineIconProps {
  className?: string;
}

export const GainLineIcon: React.FC<GainLineIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <path d="M 6 8 L 9 12 L 6 16" />
    <path d="M 18 8 L 15 12 L 18 16" />
  </svg>
);

