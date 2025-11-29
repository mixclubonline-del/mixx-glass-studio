import React, { useCallback, useEffect, useMemo } from "react";
import { publishAlsSignal, publishBloomSignal } from "../state/flowSignals";
import { deriveTrackALSFeedback } from "../utils/ALS";

interface FlowWelcomeHubProps {
  onEnterFlow: () => void;
}

const FlowWelcomeHub: React.FC<FlowWelcomeHubProps> = ({ onEnterFlow }) => {
  const idlePulse = useMemo(
    () =>
      deriveTrackALSFeedback({
        color: "purple",
        level: 0.32,
        volume: 0.68,
        lowBandEnergy: 0.15,
      }),
    []
  );

  const transitionPulse = useMemo(
    () =>
      deriveTrackALSFeedback({
        color: "purple",
        level: 0.58,
        transient: true,
        volume: 0.9,
        lowBandEnergy: 0.22,
      }),
    []
  );

  useEffect(() => {
    publishAlsSignal({
      source: "system",
      master: idlePulse,
      meta: {
        surface: "flow-welcome",
        stage: "focus",
      },
    });

    publishBloomSignal({
      source: "system",
      action: "flowWelcomeVisible",
      payload: {
        mantra: "Focus • Listen • Operate • Work",
      },
    });
  }, [idlePulse]);

  const handleEnter = useCallback(
    (trigger: "tap" | "key") => {
      publishBloomSignal({
        source: "system",
        action: "flowWelcomeEnter",
        payload: { trigger },
      });
      publishAlsSignal({
        source: "system",
        master: transitionPulse,
        meta: {
          surface: "flow-welcome",
          stage: "transition",
        },
      });
      onEnterFlow();
    },
    [onEnterFlow, transitionPulse]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleEnter("key");
      }
    },
    [handleEnter]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="flow-welcome-shell" role="presentation">
      <div className="flow-welcome-halo" aria-hidden="true" />
      <div className="flow-welcome-noise" aria-hidden="true" />
      <div
        className="flow-welcome-core"
        role="dialog"
        aria-labelledby="flow-welcome-title"
        aria-describedby="flow-welcome-subtitle flow-welcome-hint"
      >
        <div className="flow-welcome-lotus" aria-hidden="true">
          <svg viewBox="0 0 128 128" fill="none">
            <defs>
              <linearGradient id="flow-lotus-gradient" x1="12" y1="12" x2="116" y2="116" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E0E7FF" />
                <stop offset="1" stopColor="#A855F7" />
              </linearGradient>
            </defs>
            <path
              d="M64 16c12 12.2 18 28.2 18 40.4 0 5.24-.92 10.24-2.66 14.74 8.12-4.54 18.66-6.18 28.66-2.82-5.98 16.22-19.28 25.68-32.22 26.98 6.16 4.5 10.22 11.5 10.22 19.7-8.52 0-16.16-3.64-22-9.46-5.84 5.82-13.48 9.46-22 9.46 0-8.2 4.06-15.2 10.22-19.7-12.94-1.3-26.24-10.76-32.22-26.98 10-3.36 20.54-1.72 28.66 2.82A47.34 47.34 0 0 1 46 56.4C46 44.2 52 28.2 64 16Z"
              fill="url(#flow-lotus-gradient)"
            />
            <path
              d="M64 32c7.2 7.32 10.8 16.92 10.8 23.52s-2 11.3-5.24 15.3c-1.64 2.02-3.62 3.76-5.56 5.18-1.94-1.42-3.92-3.16-5.56-5.18C55.2 66.82 53.2 61.96 53.2 55.52 53.2 48.92 56.8 39.32 64 32Z"
              fill="rgba(255,255,255,0.85)"
            />
          </svg>
        </div>

        <h1 id="flow-welcome-title" className="flow-welcome-title">
          FLOW
        </h1>
        <p id="flow-welcome-subtitle" className="flow-welcome-mantra">
          Focus • Listen • Operate • Work
        </p>

        <button
          type="button"
          className="flow-welcome-button"
          onClick={() => handleEnter("tap")}
          aria-label="Enter the Flow studio"
        >
          Enter Studio Flow
        </button>
        <span id="flow-welcome-hint" className="flow-welcome-hint">
          Press Enter or speak “Prime, drop me in.”
        </span>
      </div>
    </div>
  );
};

FlowWelcomeHub.displayName = 'FlowWelcomeHub';

export default FlowWelcomeHub;




