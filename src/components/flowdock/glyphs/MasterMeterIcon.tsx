import React from "react";

interface MasterMeterIconProps {
  className?: string;
}

export const MasterMeterIcon: React.FC<MasterMeterIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="7" y1="8" x2="7" y2="16" />
    <line x1="12" y1="6" x2="12" y2="18" />
    <line x1="17" y1="10" x2="17" y2="16" />
  </svg>
);

