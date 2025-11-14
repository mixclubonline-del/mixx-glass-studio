import React from "react";

interface CountInIconProps {
  className?: string;
}

export const CountInIcon: React.FC<CountInIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Count-in clock */}
    <circle cx={12} cy={12} r={9} fill="currentColor" opacity={0.08} />
    <circle cx={12} cy={12} r={9} />
    {/* Hand */}
    <path d="M12 7v5l3 1.5" />
  </svg>
);

