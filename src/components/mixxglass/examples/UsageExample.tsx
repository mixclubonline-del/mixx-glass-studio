/**
 * MixxGlass Components Usage Examples
 * 
 * Demonstrates how to use MixxGlass components in the Studio.
 * This file can be used as a reference for migration.
 */

import React, { useState } from 'react';
import {
  MixxGlassButton,
  MixxGlassSlider,
  MixxGlassInput,
  MixxGlassToggle,
  MixxGlassFader,
  MixxGlassMeter,
} from '../index';

/**
 * Example: Using MixxGlass components in a mixer channel strip
 */
export const MixxGlassChannelStripExample: React.FC = () => {
  const [volume, setVolume] = useState(0.75);
  const [pan, setPan] = useState(0.0);
  const [mute, setMute] = useState(false);
  const [solo, setSolo] = useState(false);
  const [trackName, setTrackName] = useState('Track 1');
  const [level, setLevel] = useState(0.6);
  const [peak, setPeak] = useState(0.8);

  return (
    <div className="flex flex-col gap-4 p-4 bg-glass-surface rounded-xl border border-glass-border">
      {/* Track Header */}
      <div className="flex items-center gap-2">
        <MixxGlassInput
          value={trackName}
          onChange={(e) => setTrackName(e.target.value)}
          size="sm"
          variant="glass"
        />
        <MixxGlassToggle
          checked={mute}
          onChange={setMute}
          alsChannel="pressure"
          size="sm"
          label="M"
        />
        <MixxGlassToggle
          checked={solo}
          onChange={setSolo}
          alsChannel="momentum"
          size="sm"
          label="S"
        />
      </div>

      {/* Meter */}
      <div className="flex gap-1">
        <MixxGlassMeter
          level={level}
          peak={peak}
          alsChannel="pressure"
          height={120}
          width={6}
        />
        <MixxGlassMeter
          level={level}
          peak={peak}
          alsChannel="pressure"
          height={120}
          width={6}
        />
      </div>

      {/* Fader */}
      <MixxGlassFader
        value={volume}
        onChange={setVolume}
        alsChannel="momentum"
        alsIntensity={level}
        height={150}
        showDB={true}
        showTemperature={false}
      />

      {/* Pan */}
      <MixxGlassSlider
        value={(pan + 1) / 2} // Convert -1 to 1 range to 0 to 1
        onChange={(val) => setPan(val * 2 - 1)}
        alsChannel="harmony"
        orientation="horizontal"
        size="sm"
      />

      {/* Controls */}
      <div className="flex gap-2">
        <MixxGlassButton
          variant="secondary"
          size="sm"
          alsChannel="momentum"
          alsValue={0.5}
        >
          EQ
        </MixxGlassButton>
        <MixxGlassButton
          variant="secondary"
          size="sm"
          alsChannel="pressure"
          alsValue={0.3}
        >
          Sends
        </MixxGlassButton>
      </div>
    </div>
  );
};

/**
 * Example: Simple form with MixxGlass components
 */
export const MixxGlassFormExample: React.FC = () => {
  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [intensity, setIntensity] = useState(0.5);

  return (
    <div className="flex flex-col gap-4 p-6 bg-glass-surface rounded-xl">
      <MixxGlassInput
        type="text"
        placeholder="Enter name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        size="md"
      />

      <MixxGlassToggle
        checked={enabled}
        onChange={setEnabled}
        alsChannel="momentum"
        label="Enable Feature"
      />

      <MixxGlassSlider
        value={intensity}
        onChange={setIntensity}
        alsChannel="pressure"
        showValue={false} // No raw numbers
      />

      <MixxGlassButton
        variant="primary"
        alsChannel="momentum"
        alsValue={enabled ? intensity : 0}
        disabled={!enabled}
      >
        Submit
      </MixxGlassButton>
    </div>
  );
};

export default MixxGlassChannelStripExample;



