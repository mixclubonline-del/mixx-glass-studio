import React from "react";

interface RepeatRateIconProps {
  className?: string;
}

export const RepeatRateIcon: React.FC<RepeatRateIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M 17 1 L 21 5 L 17 9" />
    <path d="M 3 11 L 3 15 A 9 9 0 0 0 18 20 L 21 17" />
    <path d="M 21 13 L 21 9 A 9 9 0 0 0 6 4 L 3 7" />
  </svg>
);

