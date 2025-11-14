import React from "react";

interface SendsIconProps {
  className?: string;
}

export const SendsIcon: React.FC<SendsIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M 4 12 L 20 4" />
    <path d="M 4 12 L 20 20" />
    <circle cx="4" cy="12" r="2" />
    <circle cx="20" cy="4" r="2" />
    <circle cx="20" cy="20" r="2" />
  </svg>
);

