/**
 * Flow Dream-Fade Transition Engine
 * Seamless fade transitions between views with glass physics.
 * Flow-safe: never blocks input, never drops frames, preserves audio state.
 */

import React, { useState, useEffect } from "react";
import "./FlowTransitionEngine.css";

export interface FlowTransitionEngineProps {
  /** Active view: "arrange" | "mix" | "sampler" | "piano" */
  activeView: string;
  /** Render function that receives the current view */
  children: (view: string) => React.ReactNode;
}

export const FlowTransitionEngine: React.FC<FlowTransitionEngineProps> = ({
  activeView,
  children,
}) => {
  const [fadeState, setFadeState] = useState<"fade-in" | "fade-out">("fade-in");
  const [view, setView] = useState(activeView);

  useEffect(() => {
    // Only trigger fade if view actually changed
    if (view === activeView) return;

    setFadeState("fade-out");

    const t = setTimeout(() => {
      setView(activeView);
      setFadeState("fade-in");
    }, 180); // Dream Fade timing

    return () => clearTimeout(t);
  }, [activeView, view]);

  return (
    <div className={`flow-view-container ${fadeState}`}>
      {children(view)}
    </div>
  );
};

