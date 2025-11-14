import React from "react";

interface ArmIconProps {
  className?: string;
}

export const ArmIcon: React.FC<ArmIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Record arm target – outer ring + inner core */}
    <circle cx={12} cy={12} r={9} />
    <circle cx={12} cy={12} r={5} fill="currentColor" />
  </svg>
);

