// ======================================================================
// ALS Event Logger – Scrolling Dock HUD (Dev-only)
// ======================================================================

import React from "react";

interface ALSEventLogProps {
  logs: string[];
}

export const ALSEventLog: React.FC<ALSEventLogProps> = ({ logs }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: "12px",
        bottom: "58px",
        width: "260px",
        height: "180px",
        overflowY: "hidden",
        color: "rgba(180,190,255,0.85)",
        fontFamily: "monospace",
        fontSize: "11px",
        lineHeight: "1.25em",
        background: "rgba(8,8,16,0.55)",
        border: "1px solid rgba(70,70,120,0.3)",
        borderRadius: "8px",
        padding: "8px",
        backdropFilter: "blur(6px)",
        pointerEvents: "none",
      }}
    >
      {logs.slice(-16).map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
};


