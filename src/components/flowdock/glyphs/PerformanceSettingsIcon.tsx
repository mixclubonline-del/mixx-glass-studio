import React from "react";

interface PerformanceSettingsIconProps {
  className?: string;
}

export const PerformanceSettingsIcon: React.FC<PerformanceSettingsIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M 12 1 L 12 3" />
    <path d="M 12 21 L 12 23" />
    <path d="M 4.22 4.22 L 5.64 5.64" />
    <path d="M 18.36 18.36 L 19.78 19.78" />
    <path d="M 1 12 L 3 12" />
    <path d="M 21 12 L 23 12" />
    <path d="M 4.22 19.78 L 5.64 18.36" />
    <path d="M 18.36 5.64 L 19.78 4.22" />
  </svg>
);

