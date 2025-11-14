import React, { useEffect, useState, useRef } from "react";
import { detectIntent } from "../../core/flowdock/intentEngine";
import { applyModeOverride } from "../../core/flowdock/modePriority";
import {
  getALSGlowState,
  getPrimeBrainState,
  formatGuidanceForDock,
  getDreamFadeTransition,
  setGhostLayer,
  updateGhostLayer,
  getGhostLayer,
  getDockState,
  getDockHeight,
  toggleDockState,
  handleDockDrag,
  initGamepad,
  pollGamepad,
  cleanupGamepad,
} from "../../core/flowdock";
import { FLOW_DOCK_CONFIG } from "./FlowDockConfig";
import { DockCluster } from "./DockCluster";
import { FlowDockTransitions } from "./FlowDockTransitions";
import type { DockMode } from "../../core/flowdock/types";
import "./FlowDock.css";

export const FlowDockManager: React.FC = () => {
  const [mode, setMode] = useState<DockMode>("nav");
  const [prevMode, setPrevMode] = useState<DockMode>("nav");
  const [alsGlow, setAlsGlow] = useState(getALSGlowState());
  const [primeBrain, setPrimeBrain] = useState(getPrimeBrainState());
  const [dockState, setDockState] = useState(getDockState());
  const [ghostMode, setGhostMode] = useState(getGhostLayer());
  const dragStartRef = useRef<{ y: number; timestamp: number } | null>(null);

  // Initialize gamepad on mount
  useEffect(() => {
    initGamepad();
    return () => cleanupGamepad();
  }, []);

  // Intent detection + mode override
  useEffect(() => {
    const interval = setInterval(() => {
      const detected = detectIntent();
      const finalMode = applyModeOverride(detected);
      
      if (finalMode !== mode) {
        setGhostLayer(mode); // Set ghost layer before transition
        setPrevMode(mode);
        setMode(finalMode);
      }
    }, 75);

    return () => clearInterval(interval);
  }, [mode]);

  // ALS glow sync (60fps)
  useEffect(() => {
    const interval = setInterval(() => {
      setAlsGlow(getALSGlowState());
    }, 16);

    return () => clearInterval(interval);
  }, []);

  // Prime Brain sync
  useEffect(() => {
    const interval = setInterval(() => {
      setPrimeBrain(getPrimeBrainState());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Ghost mode animation
  useEffect(() => {
    const interval = setInterval(() => {
      const ghost = updateGhostLayer();
      setGhostMode(ghost);
    }, 16);

    return () => clearInterval(interval);
  }, []);

  // Gamepad polling
  useEffect(() => {
    const interval = setInterval(() => {
      const actions = pollGamepad();
      actions.forEach((action) => {
        if (action === "toggleDock") {
          const newState = toggleDockState();
          setDockState(newState);
        }
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Dock drag handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("flow-dock")) {
      dragStartRef.current = { y: e.clientY, timestamp: Date.now() };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragStartRef.current) return;
    
    const newState = handleDockDrag(dragStartRef.current.y, e.clientY);
    if (newState) {
      setDockState(newState);
      dragStartRef.current = null;
    }
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const config = FLOW_DOCK_CONFIG.modes[mode];
  const dockHeight = getDockHeight(dockState);
  const transitionStyle = getDreamFadeTransition(150, 0);

  return (
    <div className="flow-dock-wrapper">
      {/* Prime Brain Overlay */}
      {primeBrain.showOverlay && (
        <div className="flow-dock-prime-brain-overlay">
          {formatGuidanceForDock(primeBrain.guidance)}
        </div>
      )}

      {/* Ghost Mode Layer */}
      {ghostMode && (
        <div
          className={`flow-dock-ghost dock-mode-${ghostMode.mode}`}
          style={{ opacity: ghostMode.opacity }}
        >
          <DockCluster position="left" items={FLOW_DOCK_CONFIG.modes[ghostMode.mode].clusters.left} />
          <DockCluster position="center" items={FLOW_DOCK_CONFIG.modes[ghostMode.mode].clusters.center} />
          <DockCluster position="right" items={FLOW_DOCK_CONFIG.modes[ghostMode.mode].clusters.right} />
        </div>
      )}

      {/* Main Dock */}
      <FlowDockTransitions from={prevMode} to={mode}>
        <div
          className={`flow-dock dock-mode-${mode} dock-state-${dockState}`}
          style={{
            height: `${dockHeight}px`,
            ...transitionStyle,
            boxShadow: `inset 0 0 ${20 + alsGlow.glowIntensity * 30}px ${alsGlow.glowColor}`,
          }}
          onMouseDown={handleMouseDown}
        >
          {/* ALS Pulse Glow Line */}
          <div
            className="flow-dock-pulse-line"
            style={{
              width: `${alsGlow.pulse * 100}%`,
              background: alsGlow.glowColor,
              opacity: alsGlow.glowIntensity,
            }}
          />

          <DockCluster position="left" items={config.clusters.left} />
          <DockCluster position="center" items={config.clusters.center} />
          <DockCluster position="right" items={config.clusters.right} />
        </div>
      </FlowDockTransitions>
    </div>
  );
};

