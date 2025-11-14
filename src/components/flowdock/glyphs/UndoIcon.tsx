import React from "react";

interface UndoIconProps {
  className?: string;
}

export const UndoIcon: React.FC<UndoIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M 3 7 L 3 3 L 7 3" />
    <path d="M 21 12 A 9 9 0 0 0 6 5 L 3 8" />
  </svg>
);

