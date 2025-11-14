import React from "react";

interface HushMeterIconProps {
  className?: string;
}

export const HushMeterIcon: React.FC<HushMeterIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="8" width="18" height="8" rx="1" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <path d="M 9 4 L 9 8" />
    <path d="M 15 4 L 15 8" />
    <path d="M 9 16 L 9 20" />
    <path d="M 15 16 L 15 20" />
  </svg>
);

