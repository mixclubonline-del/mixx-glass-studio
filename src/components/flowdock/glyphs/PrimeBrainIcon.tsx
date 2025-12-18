import React from "react";

interface PrimeBrainIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PrimeBrainIcon: React.FC<PrimeBrainIconProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    width="24"
    height="24"
  >
    <path d="M 12 2 A 3 3 0 0 1 15 5 A 3 3 0 0 1 12 8 A 3 3 0 0 1 9 5 A 3 3 0 0 1 12 2" />
    <path d="M 12 8 Q 8 10 6 12 Q 4 14 6 16 Q 8 18 12 18 Q 16 18 18 16 Q 20 14 18 12 Q 16 10 12 8" />
    <circle cx="12" cy="12" r="2" />
    <path d="M 12 18 L 12 22" />
    <path d="M 8 20 L 12 22 L 16 20" />
  </svg>
);

