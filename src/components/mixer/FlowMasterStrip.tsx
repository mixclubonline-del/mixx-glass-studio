import React, { useMemo, useEffect, useState } from 'react';
import { MixxGlassSlider, MixxGlassFader, MixxGlassMeter, useFlowMotion, usePulseAnimation } from '../mixxglass';
import {
  MIXER_STRIP_MAX_WIDTH,
  MIXER_STRIP_MIN_WIDTH,
  MIXER_STRIP_WIDTH,
} from './mixerConstants';
import { deriveTrackALSFeedback, hexToRgba } from '../../utils/ALS';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';
import { LoudnessMeter } from '../LoudnessMeter';
import { useMasterChain } from '../../hooks/useMasterChain';
import { MasteringProfile, PROFILE_INFO } from '../../types/rust-audio';
import { useLoudnessMeters } from '../../hooks/useLoudnessMeters';
import { rustMasterBridge } from '../../audio/RustMasterBridge';
import './FlowMasterStrip.css';
import ExportModal from '../modals/ExportModal';

interface FlowMasterStripProps {
  volume: number;
  onVolumeChange: (value: number) => void;
  balance: number;
  onBalanceChange: (value: number) => void;
  analysis: { level: number; transient: boolean; waveform: Uint8Array };
  stageHeight: number;
  meterHeight: number;
  faderHeight: number;
}

const MASTER_PRIMARY = '#ede9fe';
const MASTER_GLOW = '#f5d0fe';

// Mastering profile names
const PROFILE_NAMES = ['Streaming', 'Club', 'Broadcast', 'Vinyl', 'Audiophile'];

// Component for pulsing labels
const PulsingLabels: React.FC<{ labels: string[] }> = ({ labels }) => {
  const pulseOpacity = usePulseAnimation(0.6, 1, 2400, 'ease-in-out');
  return (
    <div className="master-strip-labels">
      {labels.map((label) => (
        <span
          key={label}
          className="pulsing-label"
          style={{ opacity: pulseOpacity }}
        >
          {label}
        </span>
      ))}
    </div>
  );
};

// Component for pulsing background
const PulsingBackground: React.FC<{ color: string; intensity: number }> = ({ color, intensity }) => {
  const pulseOpacity = usePulseAnimation(0.6, 1, 2800, 'ease-in-out');
  return (
    <div
      className="pulsing-background"
      style={{
        background: `linear-gradient(135deg, ${hexToRgba(
          color,
          0.25 + intensity * 0.3
        )} 0%, transparent 70%)`,
        opacity: pulseOpacity,
      }}
    />
  );
};

// Component for pulsing flow indicator
const PulsingFlowIndicator: React.FC<{ flow: number }> = ({ flow }) => {
  const pulseOpacity = usePulseAnimation(0.6, 1, 2200, 'ease-in-out');
  return (
    <div className="flow-indicator-track">
      <div
        className="flow-indicator-fill"
        style={{
          width: `${flow * 100}%`,
          background: `linear-gradient(90deg, ${hexToRgba(
            MASTER_PRIMARY,
            0.8
          )}, ${hexToRgba(MASTER_GLOW, 0.45)})`,
          boxShadow: `0 0 14px ${hexToRgba(MASTER_GLOW, 0.35)}`,
          opacity: pulseOpacity,
        }}
      />
    </div>
  );
};

const FlowMasterStrip: React.FC<FlowMasterStripProps> = ({
  volume,
  onVolumeChange,
  balance,
  onBalanceChange,
  analysis,
  stageHeight,
  meterHeight,
  faderHeight,
}) => {
  const masterFeedback = useMemo(() => {
    return deriveTrackALSFeedback({
      level: analysis?.level ?? 0,
      transient: analysis?.transient ?? false,
      volume,
      color: 'purple',
    });
  }, [analysis?.level, analysis?.transient, volume]);

  // Master chain state (Phase 29)
  const { initialize, setProfile, profile, initialized } = useMasterChain(48000);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Audio export modal state (Phase 32)
  const [showExportModal, setShowExportModal] = useState(false);

  // Initialize master chain on mount
  useEffect(() => {
    initialize(MasteringProfile.Streaming);
  }, [initialize]);

  // Animated entrance
  const entranceStyle = useFlowMotion(
    { opacity: 1, scale: 1 },
    { duration: 350, easing: 'ease-out' }
  );

  return (
    <div
      style={composeStyles(
        layout.position.relative,
        layout.flex.container('col'),
        layout.overflow.hidden,
        effects.shadow.glass('medium'),
        effects.border.radius['2xl'],
        {
          background: 'rgba(9, 18, 36, 0.82)',
          border: '1px solid rgba(102, 140, 198, 0.45)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          color: '#e6f0ff',
          height: `${stageHeight}px`,
          width: `${MIXER_STRIP_WIDTH}px`,
          minWidth: `${MIXER_STRIP_MIN_WIDTH}px`,
          maxWidth: `${MIXER_STRIP_MAX_WIDTH}px`,
          opacity: entranceStyle.opacity,
          transform: `scale(${entranceStyle.scale})`,
        }
      )}
    >
      <div style={composeStyles(
        layout.position.relative,
        { flexShrink: 0, height: '72px' },
        { borderBottom: '1px solid rgba(102, 140, 198, 0.7)' }
      )}>
        <PulsingBackground
          color={masterFeedback.color}
          intensity={masterFeedback.intensity}
        />
        <div style={composeStyles(
          layout.position.relative,
          layout.zIndex[10],
          spacing.px(3),
          spacing.pt(3),
          layout.flex.container('col'),
          spacing.gap(1)
        )}>
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            layout.flex.justify.between
          )}>
            <span style={composeStyles(
              typography.transform('uppercase'),
              typography.tracking.widest,
              {
                fontSize: '0.75rem', // 12px professional
                color: 'rgba(230, 240, 255, 0.95)',
              }
            )}>Master</span>
            <span style={composeStyles(
              typography.transform('uppercase'),
              typography.tracking.widest,
              {
                fontSize: '0.6875rem', // 11px minimum
                color: 'rgba(230, 240, 255, 0.75)',
              }
            )}>{initialized ? PROFILE_NAMES[profile] : 'Init...'}</span>
          </div>
          {/* Profile Selector (Phase 29) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{
                background: 'rgba(14,32,62,0.8)',
                border: '1px solid rgba(102, 140, 198, 0.4)',
                borderRadius: '4px',
                padding: '4px 8px',
                color: '#e6f0ff',
                fontSize: '10px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {PROFILE_NAMES[profile]} ▼
            </button>
            {showProfileDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 50,
                background: 'rgba(9,18,36,0.95)',
                border: '1px solid rgba(102, 140, 198, 0.5)',
                borderRadius: '4px',
                minWidth: '100px',
                marginTop: '2px',
              }}>
                {PROFILE_NAMES.map((name, idx) => (
                  <button
                    key={name}
                    onClick={() => {
                      setProfile(idx as MasteringProfile);
                      setShowProfileDropdown(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '6px 10px',
                      background: idx === profile ? 'rgba(102, 140, 198, 0.3)' : 'transparent',
                      border: 'none',
                      color: '#e6f0ff',
                      fontSize: '10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LUFS Metering (Phase 29) */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(102, 140, 198, 0.3)' }}>
        <LoudnessMeter compact targetLUFS={PROFILE_INFO[profile]?.lufs ?? -14} />
      </div>

      {/* Export Button (Phase 32) */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(102, 140, 198, 0.3)' }}>
        <button
          onClick={() => setShowExportModal(true)}
          className="export-button"
        >
          ⬇ Export
        </button>
      </div>

      <div style={composeStyles(
        layout.flex.container('col'),
        { flex: 1 },
        spacing.px(3),
        spacing.py(4),
        spacing.gap(3)
      )}>
        <div style={composeStyles(
          layout.width.full,
          layout.flex.container('row'),
          layout.flex.align.end,
          layout.flex.justify.center,
          { height: `${meterHeight}px` }
        )}>
          <MixxGlassMeter
            level={Math.min(1, Math.max(0, analysis?.level ?? 0))}
            peak={Math.min(1, Math.max(analysis?.level ?? 0, masterFeedback.intensity))}
            transient={analysis?.transient ?? false}
            alsChannel="pressure"
            color={masterFeedback.color}
            glowColor={masterFeedback.glowColor}
            height={meterHeight}
            width={44}
          />
        </div>

        <div style={composeStyles(
          layout.width.full,
          { height: `${faderHeight}px` }
        )}>
          <MixxGlassFader
            value={volume}
            onChange={onVolumeChange}
            alsChannel="momentum"
            alsIntensity={masterFeedback.intensity}
            trackColor={MASTER_PRIMARY}
            glowColor={MASTER_GLOW}
            name="fader-master"
            height={faderHeight}
            showDB={true}
          />
        </div>

        <div style={composeStyles(
          layout.flex.container('col'),
          spacing.gap(2)
        )}>
          <div style={layout.position.relative}>
            <MixxGlassSlider
              value={(balance + 1) / 2} // Convert -1 to 1 range to 0 to 1
              onChange={(normalized) => onBalanceChange(normalized * 2 - 1)} // Convert back
              min={0}
              max={1}
              step={0.01}
              alsChannel="harmony"
              size="sm"
            />
            <span style={composeStyles(
              layout.position.absolute,
              transitions.transform.combine('translateX(-50%)'),
              {
                bottom: '-20px',
                left: '50%',
                fontSize: '10px',
                color: 'rgba(156, 163, 175, 0.8)',
                fontWeight: 600,
              }
            )}>Balance</span>
          </div>
          <PulsingFlowIndicator flow={masterFeedback.flow} />
        </div>

        {/* Native Engine Status & SIMD Toggle (Phase 32 & 34) */}
        <NativeEngineStatus />
      </div>

      {/* Export Modal (Phase 32) */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
};

// Native Engine Status Component (Phase 32, 34 & 40)
const NativeEngineStatus: React.FC = () => {
  const { integrated: rustIntegrated, isActive: rustActive } = useLoudnessMeters();
  const [simdEnabled, setSimdEnabledState] = useState(true);
  const [workletActive, setWorkletActive] = useState(false);
  const [wasmActive, setWasmActive] = useState(false);
  const [currentProfile, setCurrentProfile] = useState('STREAM');

  useEffect(() => {
    const syncSimd = async () => {
      const enabled = await rustMasterBridge.getSimdEnabled();
      setSimdEnabledState(enabled);
    };
    syncSimd();

    // Check Worklet status - detect if AudioWorklet is supported and active
    const checkWorklet = () => {
      const hasWorklet = typeof AudioWorkletNode !== 'undefined' && typeof AudioContext !== 'undefined';
      setWorkletActive(hasWorklet);
    };
    checkWorklet();

    // Check WASM status - detect if WASM DSP modules are loaded
    const checkWasm = async () => {
      try {
        // Check if WASM is available
        const wasmSupported = typeof WebAssembly !== 'undefined';
        setWasmActive(wasmSupported);
      } catch {
        setWasmActive(false);
      }
    };
    checkWasm();

    // Subscribe to profile changes
    const updateProfile = async () => {
      // Get current profile from master chain
      try {
        const meters = await rustMasterBridge.getMeters();
        if (meters?.profile) {
          const names = ['STREAM', 'CLUB', 'BCAST', 'VINYL', 'AUDIO'];
          const idx = typeof meters.profile === 'number' ? meters.profile : 0;
          setCurrentProfile(names[idx] || 'STREAM');
        }
      } catch {
        // Keep default
      }
    };
    updateProfile();
  }, []);

  const toggleSimd = async () => {
    const newState = !simdEnabled;
    setSimdEnabledState(newState);
    await rustMasterBridge.setSimdEnabled(newState);
  };

  return (
    <div className="native-engine-section">
      <div className="native-engine-header">
        <span className="native-engine-label">NATIVE ENGINE</span>
        <div className={`native-engine-indicator ${rustActive ? 'native-engine-indicator--active' : ''}`} />
      </div>
      <div className="native-engine-status-row">
        <div className="native-engine-lufs-display">
          <span className={`native-engine-lufs-value ${rustActive ? 'native-engine-lufs-value--active' : ''}`}>
            {rustActive ? (rustIntegrated === -Infinity ? '-∞' : rustIntegrated.toFixed(1)) : '--.-'}
          </span>
          <span className="native-engine-lufs-label">LUFS</span>
        </div>
        <button
          className={`simd-toggle-button ${simdEnabled ? 'simd-toggle-button--enabled' : ''}`}
          onClick={toggleSimd}
          title={simdEnabled ? 'SIMD Optimizations Enabled (High Performance)' : 'SIMD Optimizations Disabled (High Stability)'}
        >
          {simdEnabled ? 'SIMD ON' : 'SIMD OFF'}
        </button>
      </div>
      {/* Phase 40: Status Indicators */}
      <div className="engine-status-row">
        <div className="status-indicator" title="AudioWorklet Status">
          <div className={`status-dot ${workletActive ? 'status-dot--active' : ''}`} />
          <span className={`status-label ${workletActive ? 'status-label--active' : ''}`}>WKL</span>
        </div>
        <div className="status-indicator" title="WASM DSP Status">
          <div className={`status-dot status-dot--wasm ${wasmActive ? 'status-dot--active' : ''}`} />
          <span className={`status-label ${wasmActive ? 'status-label--active' : ''}`}>WASM</span>
        </div>
        <div className="profile-badge" title="Current Mastering Profile">
          {currentProfile}
        </div>
      </div>
    </div>
  );
};


// Export Modal Wrapper for FlowMasterStrip
const ExportModalWrapper: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => {
  if (!show) return null;
  return <ExportModal onClose={onClose} />;
};

export default FlowMasterStrip;
