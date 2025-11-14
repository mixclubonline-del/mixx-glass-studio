import React from "react";

interface InsertsIconProps {
  className?: string;
}

export const InsertsIcon: React.FC<InsertsIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="6" width="4" height="12" rx="1" />
    <rect x="10" y="6" width="4" height="12" rx="1" />
    <rect x="16" y="6" width="4" height="12" rx="1" />
  </svg>
);

