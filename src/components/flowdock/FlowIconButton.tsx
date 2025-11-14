import React from "react";
import { GLYPH_MAP } from "./glyphs";

interface FlowIconButtonProps {
  id: string;
}

export const FlowIconButton: React.FC<FlowIconButtonProps> = ({ id }) => {
  const Icon = GLYPH_MAP[id as keyof typeof GLYPH_MAP];

  if (!Icon) return null;

  return (
    <button className="flow-icon-btn" title={id}>
      <Icon className={`flow-glyph flow-glyph-${id}`} />
    </button>
  );
};

