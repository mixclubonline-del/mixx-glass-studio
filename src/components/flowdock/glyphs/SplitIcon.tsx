import React from "react";

interface SplitIconProps {
  className?: string;
}

export const SplitIcon: React.FC<SplitIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M 6 8 L 12 12 L 6 16" />
    <path d="M 18 8 L 12 12 L 18 16" />
  </svg>
);

