/**
 * LoudnessMeter - LUFS visualization component
 * Phase 25: React Integration Layer
 */

import React, { useMemo } from 'react';
import { useLoudnessMeters } from '../hooks/useLoudnessMeters';

interface LoudnessMeterProps {
  targetLUFS?: number;
  showTruePeak?: boolean;
  compact?: boolean;
  className?: string;
}

export function LoudnessMeter({
  targetLUFS = -14,
  showTruePeak = true,
  compact = false,
  className = '',
}: LoudnessMeterProps) {
  const { momentary, shortTerm, integrated, truePeak, formatted, isActive } = useLoudnessMeters();

  // Calculate meter position (0-100%) based on LUFS range (-60 to 0)
  const getMeterPercent = (lufs: number): number => {
    if (!isFinite(lufs)) return 0;
    // Map -60 to 0 LUFS → 0 to 100%
    return Math.max(0, Math.min(100, ((lufs + 60) / 60) * 100));
  };

  // Determine if value is over target (red zone)
  const isOverTarget = (lufs: number): boolean => {
    return isFinite(lufs) && lufs > targetLUFS;
  };

  // Determine if true peak is clipping
  const isClipping = useMemo(() => truePeak > -0.1, [truePeak]);

  if (compact) {
    return (
      <div className={`loudness-meter-compact ${className}`} style={styles.compact}>
        <div style={styles.compactValue}>
          <span style={styles.label}>LUFS</span>
          <span style={{
            ...styles.value,
            color: isOverTarget(integrated) ? '#ff4444' : '#00ff88',
          }}>
            {formatted.integrated}
          </span>
        </div>
        {showTruePeak && (
          <div style={styles.compactValue}>
            <span style={styles.label}>TP</span>
            <span style={{
              ...styles.value,
              color: isClipping ? '#ff4444' : '#aaaaaa',
            }}>
              {formatted.truePeak}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`loudness-meter ${className}`} style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>LOUDNESS</span>
        {!isActive && <span style={styles.inactive}>Inactive</span>}
      </div>

      {/* Momentary */}
      <div style={styles.meterRow}>
        <span style={styles.label}>M</span>
        <div style={styles.barContainer}>
          <div
            style={{
              ...styles.bar,
              width: `${getMeterPercent(momentary)}%`,
              backgroundColor: isOverTarget(momentary) ? '#ff4444' : '#00ff88',
            }}
          />
          <div
            style={{
              ...styles.targetLine,
              left: `${getMeterPercent(targetLUFS)}%`,
            }}
          />
        </div>
        <span style={styles.value}>{formatted.momentary}</span>
      </div>

      {/* Short-term */}
      <div style={styles.meterRow}>
        <span style={styles.label}>S</span>
        <div style={styles.barContainer}>
          <div
            style={{
              ...styles.bar,
              width: `${getMeterPercent(shortTerm)}%`,
              backgroundColor: isOverTarget(shortTerm) ? '#ff4444' : '#00cc66',
            }}
          />
          <div
            style={{
              ...styles.targetLine,
              left: `${getMeterPercent(targetLUFS)}%`,
            }}
          />
        </div>
        <span style={styles.value}>{formatted.shortTerm}</span>
      </div>

      {/* Integrated */}
      <div style={styles.meterRow}>
        <span style={styles.label}>I</span>
        <div style={styles.barContainer}>
          <div
            style={{
              ...styles.bar,
              width: `${getMeterPercent(integrated)}%`,
              backgroundColor: isOverTarget(integrated) ? '#ff4444' : '#0099ff',
            }}
          />
          <div
            style={{
              ...styles.targetLine,
              left: `${getMeterPercent(targetLUFS)}%`,
            }}
          />
        </div>
        <span style={{
          ...styles.value,
          fontWeight: 'bold',
        }}>
          {formatted.integrated}
        </span>
      </div>

      {/* True Peak */}
      {showTruePeak && (
        <div style={styles.meterRow}>
          <span style={styles.label}>TP</span>
          <div style={styles.barContainer}>
            <div
              style={{
                ...styles.bar,
                width: `${getMeterPercent(truePeak)}%`,
                backgroundColor: isClipping ? '#ff0000' : '#ffaa00',
              }}
            />
          </div>
          <span style={{
            ...styles.value,
            color: isClipping ? '#ff0000' : 'inherit',
          }}>
            {formatted.truePeak}
          </span>
        </div>
      )}

      {/* Target indicator */}
      <div style={styles.footer}>
        <span style={styles.targetLabel}>Target: {targetLUFS} LUFS</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '12px',
    fontFamily: 'monospace',
    fontSize: '12px',
    minWidth: '200px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  title: {
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: '1px',
  },
  inactive: {
    color: '#666666',
    fontSize: '10px',
  },
  meterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  label: {
    width: '20px',
    color: '#888888',
    fontSize: '10px',
  },
  barContainer: {
    flex: 1,
    height: '12px',
    backgroundColor: '#333333',
    borderRadius: '2px',
    position: 'relative',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 100ms ease-out',
  },
  targetLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: '#ffffff',
    opacity: 0.7,
  },
  value: {
    width: '45px',
    textAlign: 'right',
    color: '#cccccc',
  },
  footer: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #333333',
  },
  targetLabel: {
    color: '#666666',
    fontSize: '10px',
  },
  compact: {
    display: 'flex',
    gap: '12px',
    backgroundColor: '#1a1a1a',
    borderRadius: '4px',
    padding: '6px 10px',
    fontFamily: 'monospace',
    fontSize: '11px',
  },
  compactValue: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
};

export default LoudnessMeter;
