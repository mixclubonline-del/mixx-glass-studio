import React from "react";

interface AddMidiPatternIconProps {
  className?: string;
}

export const AddMidiPatternIcon: React.FC<AddMidiPatternIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="15" y1="3" x2="15" y2="21" />
    <line x1="3" y1="15" x2="21" y2="15" />
  </svg>
);

