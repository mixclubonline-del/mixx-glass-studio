import React from "react";

interface FitSelectionIconProps {
  className?: string;
}

export const FitSelectionIcon: React.FC<FitSelectionIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Selected region */}
    <rect x={7} y={7} width={10} height={10} fill="currentColor" opacity={0.2} />
    <rect x={7} y={7} width={10} height={10} />
    <path d="M 4 4 L 4 8" />
    <path d="M 4 4 L 8 4" />
    <path d="M 20 4 L 20 8" />
    <path d="M 20 4 L 16 4" />
    <path d="M 4 20 L 4 16" />
    <path d="M 4 20 L 8 20" />
    <path d="M 20 20 L 20 16" />
    <path d="M 20 20 L 16 20" />
  </svg>
);

