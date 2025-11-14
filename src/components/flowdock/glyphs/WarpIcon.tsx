import React from "react";

interface WarpIconProps {
  className?: string;
}

export const WarpIcon: React.FC<WarpIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M 3 12 Q 6 6 12 6 Q 18 6 21 12 Q 18 18 12 18 Q 6 18 3 12" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

