import React from "react";

interface RedoIconProps {
  className?: string;
}

export const RedoIcon: React.FC<RedoIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M 21 7 L 21 3 L 17 3" />
    <path d="M 3 12 A 9 9 0 0 1 18 5 L 21 8" />
  </svg>
);

