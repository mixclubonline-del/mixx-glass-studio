import React from "react";

interface RoutingIconProps {
  className?: string;
}

export const RoutingIcon: React.FC<RoutingIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="18" r="3" />
    <line x1="9" y1="6" x2="15" y2="6" />
    <line x1="6" y1="9" x2="6" y2="15" />
    <line x1="18" y1="9" x2="18" y2="15" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);

