import React from "react";

interface RecordIconProps {
  className?: string;
}

export const RecordIcon: React.FC<RecordIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <circle cx="12" cy="12" r="6" />
  </svg>
);

