// ======================================================================
// ALS Sync Monitor – Transport Phase/Drift Engine (Dev-only)
// ======================================================================

import React from "react";

interface ALSSyncState {
  phase: number;
  driftMs: number;
  tempoLinked: boolean;
  pulseRatio: number;
}

interface ALSSyncMonitorProps {
  sync: ALSSyncState;
}

export const ALSSyncMonitor: React.FC<ALSSyncMonitorProps> = ({ sync }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "10px 16px",
        fontFamily: "monospace",
        fontSize: "12px",
        color: "rgba(220,220,255,0.9)",
        background: "rgba(15,15,30,0.55)",
        border: "1px solid rgba(90,90,150,0.35)",
        borderRadius: "8px",
        backdropFilter: "blur(8px)",
        pointerEvents: "none",
      }}
    >
      <div>Phase: {sync.phase.toFixed(3)}</div>
      <div>Drift: {sync.driftMs.toFixed(2)}ms</div>
      <div>Tempo Link: {sync.tempoLinked ? "YES" : "NO"}</div>
      <div>Pulse Ratio: {sync.pulseRatio.toFixed(2)}</div>
    </div>
  );
};


