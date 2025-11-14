import React from "react";

interface ArpIconProps {
  className?: string;
}

export const ArpIcon: React.FC<ArpIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M 3 20 L 6 12 L 9 16 L 12 8 L 15 12 L 18 6 L 21 14" />
  </svg>
);

