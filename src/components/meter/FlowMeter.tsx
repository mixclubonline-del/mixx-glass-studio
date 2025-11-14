import React from 'react';
import './FlowMeter.css';
import { useMeterEngine } from '../../hooks/useMeterEngine';

interface FlowMeterProps {
  audioNode?: AudioNode;
  width?: number;
  height?: number;
  isMaster?: boolean;
}

/**
 * FlowMeter v2.5
 *
 * - Peak + peak-hold
 * - Smoothed RMS body
 * - Transient shimmer
 * - Clip indication
 * - ALS Pulse-aware animation via useMeterEngine
 *
 * This is a self-contained visual meter that can be dropped into
 * channel strips, master strips, or debug views.
 */
export const FlowMeter: React.FC<FlowMeterProps> = ({
  audioNode,
  width = 24,
  height = 160,
  isMaster = false,
}) => {
  const { peak, rms, clipped, transient } = useMeterEngine(audioNode);

  return (
    <div
      className={`flow-meter ${isMaster ? 'master' : ''}`}
      style={{ width, height }}
    >
      <div
        className="rms-bar"
        style={{ height: `${rms * 100}%` }}
      />
      <div
        className={`peak-bar ${clipped ? 'clip' : ''}`}
        style={{ height: `${peak * 100}%` }}
      />
      {transient && <div className="transient-spark" />}
    </div>
  );
};


