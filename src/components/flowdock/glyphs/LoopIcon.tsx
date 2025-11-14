import React from "react";

interface LoopIconProps {
  className?: string;
}

export const LoopIcon: React.FC<LoopIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M 21.5 2.5 L 18.5 5.5 L 21.5 8.5" />
    <path d="M 2.5 21.5 L 5.5 18.5 L 2.5 15.5" />
    <path d="M 18.5 5.5 A 7.5 7.5 0 0 1 5.5 18.5" />
    <path d="M 5.5 18.5 A 7.5 7.5 0 0 1 18.5 5.5" />
  </svg>
);

