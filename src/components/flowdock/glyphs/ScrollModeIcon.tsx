import React from "react";

interface ScrollModeIconProps {
  className?: string;
}

export const ScrollModeIcon: React.FC<ScrollModeIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M 12 2 L 12 22" />
    <path d="M 2 12 L 12 7 L 22 12 L 12 17 Z" />
  </svg>
);

