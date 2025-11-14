// ======================================================================
// PrimeBrain Debug Overlay – LLM Decision Heatmap (Dock-adjacent)
// Dev-only: gated by env flags in host components.
// ======================================================================

import React from "react";

export interface PrimeBrainDebugProps {
  brain: {
    intent?: string;
    confidence?: number;
    flowMode?: string;
    bloomReady?: boolean;
    lastAction?: string;
    predictedNext?: string;
  };
}

export const PrimeBrainDebug: React.FC<PrimeBrainDebugProps> = ({ brain }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "12px",
        right: "12px",
        background: "rgba(15,15,25,0.65)",
        padding: "12px",
        borderRadius: "10px",
        color: "rgba(240,240,255,0.9)",
        fontFamily: "monospace",
        fontSize: "12px",
        lineHeight: "1.4em",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(120,120,180,0.35)",
        pointerEvents: "none",
      }}
    >
      <div>🧠 PrimeBrain Debug</div>
      <div>Intent: {brain.intent ?? "—"}</div>
      <div>
        Confidence:{" "}
        {brain.confidence !== undefined
          ? `${Math.round(brain.confidence * 100)}%`
          : "—"}
      </div>
      <div>Flow Mode: {brain.flowMode ?? "—"}</div>
      <div>Bloom Ready: {brain.bloomReady ? "YES" : "NO"}</div>
      <div>Last Action: {brain.lastAction ?? "—"}</div>
      <div>Next Prediction: {brain.predictedNext ?? "—"}</div>
    </div>
  );
};


