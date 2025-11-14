// ========================================================================
// FlowDock Debug Analytics (Pulse Mode Diagnostic Layer)
// Visible ONLY in dev when explicitly enabled via env flag.
// ========================================================================

import React from "react";

export interface FlowDockDebugALSState {
  pulse: number; // 0-1
  flow: number; // 0-1
  energy: string;
  hush: boolean;
  temperature: string;
  bpm: number;
  playing: boolean;
  phase: number;
}

export interface FlowDockDebugPulseState {
  glowStrength: number;
}

interface FlowDockDebugProps {
  als: FlowDockDebugALSState;
  pulse: FlowDockDebugPulseState;
}

export const FlowDockDebug: React.FC<FlowDockDebugProps> = ({ als, pulse }) => {
  return (
    <div
      style={{
        position: "absolute",
        right: "12px",
        bottom: "12px",
        padding: "8px 12px",
        fontSize: "11px",
        fontFamily: "monospace",
        color: "rgba(200,200,255,0.85)",
        background: "rgba(10,10,20,0.55)",
        border: "1px solid rgba(90,90,140,0.35)",
        borderRadius: "6px",
        backdropFilter: "blur(6px)",
        pointerEvents: "none",
        lineHeight: "1.35em",
        userSelect: "none",
      }}
    >
      <div>PULSE: {Math.round(als.pulse * 100)}%</div>
      <div>FLOW: {Math.round(als.flow * 100)}%</div>
      <div>PHASE: {als.phase.toFixed(3)}</div>
      <div>BPM: {als.bpm || "—"}</div>
      <div>ENERGY: {als.energy.toUpperCase()}</div>
      <div>TEMP: {als.temperature}</div>
      <div>HUSH: {als.hush ? "YES" : "NO"}</div>
      <div>PLAYING: {als.playing ? "YES" : "NO"}</div>
      <div>GLOW: {pulse.glowStrength.toFixed(3)}</div>
    </div>
  );
};


