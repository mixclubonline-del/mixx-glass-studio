import React from "react";

interface AutomationIconProps {
  className?: string;
}

export const AutomationIcon: React.FC<AutomationIconProps> = ({
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
    <path d="M 3 18 L 6 12 L 9 15 L 12 6 L 15 12 L 18 9 L 21 15" />
  </svg>
);

