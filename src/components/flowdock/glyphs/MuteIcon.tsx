import React from "react";

interface MuteIconProps {
  className?: string;
}

export const MuteIcon: React.FC<MuteIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Speaker body – bold, DAW-style */}
    <path d="M11 5H7L4 8v8l3 3h4V5z" fill="currentColor" />
    {/* Speaker wave */}
    <path d="M15.5 8.5A3.5 3.5 0 0 1 19 12a3.5 3.5 0 0 1-3.5 3.5" />
    {/* Mute cross */}
    <line x1="17" y1="7" x2="21" y2="3" strokeWidth={2.5} />
    <line x1="17" y1="17" x2="21" y2="21" strokeWidth={2.5} />
  </svg>
);
