import React from "react";

interface TrimIconProps {
  className?: string;
}

export const TrimIcon: React.FC<TrimIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M 4 12 L 10 6" />
    <path d="M 20 12 L 14 6" />
    <line x1="10" y1="6" x2="14" y2="6" />
    <path d="M 4 12 L 10 18" />
    <path d="M 20 12 L 14 18" />
    <line x1="10" y1="18" x2="14" y2="18" />
  </svg>
);

