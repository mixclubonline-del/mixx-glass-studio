// FlowIcons.tsx
// Master file containing ALL Flow icon components.
// Replace each <path /> with your actual SVG paths.

import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}

// Base Icon Wrapper
const BaseIcon: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 20,
  stroke = "currentColor",
  strokeWidth = 1.5,
  children,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

// -------------------------------------------------------------
// FLOW ICON SET — DROP YOUR REAL PATHS IN THE PLACEHOLDERS BELOW
// -------------------------------------------------------------

export const FlowIconA = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M4 4 L20 20" /> {/* replace */}
  </BaseIcon>
);

export const FlowIconB = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M4 20 L20 4" /> {/* replace */}
  </BaseIcon>
);

export const FlowIconC = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="8" /> {/* replace */}
  </BaseIcon>
);

export const FlowIconD = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M2 12 H22" /> {/* replace */}
  </BaseIcon>
);

export const FlowIconE = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 2 V22" /> {/* replace */}
  </BaseIcon>
);

export const FlowIconF = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M4 12 L12 4 L20 12 L12 20 Z" /> {/* replace */}
  </BaseIcon>
);

export const FlowIconG = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M6 6 H18 V18 H6 Z" /> {/* replace */}
  </BaseIcon>
);

export const FlowIconH = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M4 4 H20 V20 H4 Z" /> {/* replace */}
  </BaseIcon>
);

export const FlowIconI = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 6 L18 12 L12 18 L6 12 Z" /> {/* replace */}
  </BaseIcon>
);

export const FlowIconJ = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M4 12 Q12 2 20 12 Q12 22 4 12 Z" /> {/* replace */}
  </BaseIcon>
);

// -------------------------------------------------------------
// Make a single export bundle
// -------------------------------------------------------------

export const FlowIcons = {
  A: FlowIconA,
  B: FlowIconB,
  C: FlowIconC,
  D: FlowIconD,
  E: FlowIconE,
  F: FlowIconF,
  G: FlowIconG,
  H: FlowIconH,
  I: FlowIconI,
  J: FlowIconJ,
};

export default FlowIcons;

