import React from "react";

interface PanIconProps {
  className?: string;
}

export const PanIcon: React.FC<PanIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="8" />
    <line x1="12" y1="4" x2="12" y2="20" />
    <path d="M 4 12 L 8 8" />
    <path d="M 4 12 L 8 16" />
    <path d="M 20 12 L 16 8" />
    <path d="M 20 12 L 16 16" />
  </svg>
);

