import React from "react";
import type { DockMode } from "../../core/flowdock/types";
import { getDreamFadeTransition, getTransitionDuration } from "../../core/flowdock/dreamFade";
import { FLOW_DOCK_CONFIG } from "./FlowDockConfig";

interface FlowDockTransitionsProps {
  from: DockMode;
  to: DockMode;
  children: React.ReactNode;
}

export const FlowDockTransitions: React.FC<FlowDockTransitionsProps> = ({
  from,
  to,
  children,
}) => {
  const fromPriority = FLOW_DOCK_CONFIG.modes[from]?.behavior?.priority || 50;
  const toPriority = FLOW_DOCK_CONFIG.modes[to]?.behavior?.priority || 50;
  const duration = getTransitionDuration(fromPriority, toPriority);
  const transitionStyle = getDreamFadeTransition(duration, 0);

  return (
    <div
      className={`flow-dock-transition dream-fade from-${from} to-${to}`}
      style={transitionStyle}
    >
      {children}
    </div>
  );
};

