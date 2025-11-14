import React from "react";

interface TimeStretchIconProps {
  className?: string;
}

export const TimeStretchIcon: React.FC<TimeStretchIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M 4 12 L 8 8" />
    <path d="M 4 12 L 8 16" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <path d="M 20 12 L 16 8" />
    <path d="M 20 12 L 16 16" />
  </svg>
);

