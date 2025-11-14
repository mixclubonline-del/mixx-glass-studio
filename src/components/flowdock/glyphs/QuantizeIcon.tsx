import React from "react";

interface QuantizeIconProps {
  className?: string;
}

export const QuantizeIcon: React.FC<QuantizeIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="4" height="4" />
    <rect x="10" y="3" width="4" height="4" />
    <rect x="17" y="3" width="4" height="4" />
    <rect x="3" y="10" width="4" height="4" />
    <rect x="10" y="10" width="4" height="4" />
    <rect x="17" y="10" width="4" height="4" />
    <rect x="3" y="17" width="4" height="4" />
    <rect x="10" y="17" width="4" height="4" />
    <rect x="17" y="17" width="4" height="4" />
  </svg>
);

