// ======================================================================
// FlowPulseGraph – ALS Pulse Visualizer Line (Dock Attached)
// ======================================================================

import React from "react";

interface FlowPulseGraphProps {
  pulseHistory: number[];
}

export const FlowPulseGraph: React.FC<FlowPulseGraphProps> = () => {
  // Drawing routine can be added later – canvas is dock-attached and dev-only.
  return (
    <canvas
      id="flow-dock-pulse-graph"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "38px",
        pointerEvents: "none",
        opacity: 0.75,
        mixBlendMode: "screen",
      }}
    />
  );
};


