import React from "react";

interface ConsolidateIconProps {
  className?: string;
}

export const ConsolidateIcon: React.FC<ConsolidateIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="8" width="6" height="8" />
    <rect x="9" y="6" width="6" height="10" />
    <rect x="15" y="4" width="6" height="12" />
  </svg>
);

