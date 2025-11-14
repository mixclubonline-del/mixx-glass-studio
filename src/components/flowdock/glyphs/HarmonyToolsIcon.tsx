import React from "react";

interface HarmonyToolsIconProps {
  className?: string;
}

export const HarmonyToolsIcon: React.FC<HarmonyToolsIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="9" cy="12" r="3" />
    <circle cx="15" cy="12" r="3" />
    <path d="M 9 12 L 15 12" />
  </svg>
);

