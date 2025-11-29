/**
 * FLOW CONSOLE HEADER
 * 
 * Global console controls and view mode toggles.
 * Respects Flow Doctrine: ALS is law, Reductionist, Flow-conscious.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { hexToRgba } from '../../utils/ALS';

export type ConsoleViewMode = 'strips' | 'matrix' | 'analyzer' | 'compact';

interface FlowConsoleHeaderProps {
  viewMode: ConsoleViewMode;
  onViewModeChange: (mode: ConsoleViewMode) => void;
  trackCount: number;
  busCount: number;
  masterFeedback?: {
    temperature: string;
    flow: number;
    pulse: number;
  };
  selectedAnalyzer?: 'spectrum' | 'correlation' | 'lufs' | null;
  onAnalyzerChange?: (analyzer: 'spectrum' | 'correlation' | 'lufs' | null) => void;
  collapsedGroups?: Set<string>;
  onToggleGroup?: (groupId: string) => void;
  className?: string;
}

const VIEW_MODE_DEFINITIONS: Array<{ id: ConsoleViewMode; label: string; icon: string }> = [
  { id: 'strips', label: 'Strips', icon: '■' },
  { id: 'matrix', label: 'Matrix', icon: '▦' },
  { id: 'analyzer', label: 'Analyzer', icon: '◉' },
  { id: 'compact', label: 'Compact', icon: '▣' },
];

export const FlowConsoleHeader: React.FC<FlowConsoleHeaderProps> = ({
  viewMode,
  onViewModeChange,
  trackCount,
  busCount,
  masterFeedback,
  selectedAnalyzer,
  onAnalyzerChange,
  collapsedGroups,
  onToggleGroup,
  className = '',
}) => {
  const temperature = masterFeedback?.temperature ?? 'cold';
  const flow = masterFeedback?.flow ?? 0;
  const pulse = masterFeedback?.pulse ?? 0;

  return (
    <div
      className={`relative flex items-center justify-between gap-6 border-b border-glass-border/60 bg-[rgba(8,12,24,0.85)] px-6 py-4 backdrop-blur-xl ${className}`}
    >
      {/* Left: View Mode Toggles */}
      <div className="flex items-center gap-3">
        <span className="text-[0.55rem] uppercase tracking-[0.4em] text-ink/55">
          View
        </span>
        <div className="flex items-center gap-1.5 rounded-xl border border-glass-border/70 bg-[rgba(6,14,28,0.65)] p-1">
          {VIEW_MODE_DEFINITIONS.map(({ id, label, icon }) => {
            const isActive = viewMode === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.94 }}
                onClick={() => onViewModeChange(id)}
                className={`relative rounded-lg px-4 py-2 text-[0.48rem] uppercase tracking-[0.35em] transition-all ${
                  isActive
                    ? 'border-cyan-300/70 bg-[rgba(16,50,95,0.8)] text-cyan-100 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                    : 'border-transparent text-ink/65 hover:text-cyan-100 hover:bg-[rgba(12,28,52,0.5)]'
                }`}
                style={{
                  border: isActive ? '1px solid rgba(125, 211, 252, 0.7)' : '1px solid transparent',
                }}
              >
                <span className="mr-1.5 text-[0.65rem]">{icon}</span>
                {label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Center: Console Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 text-[0.45rem] uppercase tracking-[0.3em] text-ink/60">
          <div className="flex items-center gap-1.5">
            <span className="text-ink/45">Tracks</span>
            <span className="font-semibold text-ink">{trackCount}</span>
          </div>
          <div className="h-3 w-px bg-glass-border/50" />
          <div className="flex items-center gap-1.5">
            <span className="text-ink/45">Buses</span>
            <span className="font-semibold text-ink">{busCount}</span>
          </div>
        </div>

        {masterFeedback && (
          <div className="flex items-center gap-3 rounded-xl border border-glass-border/60 bg-[rgba(6,14,28,0.7)] px-4 py-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.42rem] uppercase tracking-[0.3em] text-ink/55">
                Master ALS
              </span>
              <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-cyan-100">
                {temperature.toUpperCase()}
              </span>
            </div>
            <div className="h-8 w-px bg-glass-border/40" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.42rem] uppercase tracking-[0.3em] text-ink/55">
                Flow
              </span>
              <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-ink">
                {Math.round(flow * 100)}%
              </span>
            </div>
            <div className="h-8 w-px bg-glass-border/40" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.42rem] uppercase tracking-[0.3em] text-ink/55">
                Pulse
              </span>
              <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-ink">
                {Math.round(pulse * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Analyzer Tools */}
      {viewMode === 'analyzer' && onAnalyzerChange && (
        <div className="flex items-center gap-2">
          <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/55">
            Tool
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-glass-border/70 bg-[rgba(6,14,28,0.65)] p-0.5">
            {(['spectrum', 'correlation', 'lufs'] as const).map((analyzer) => {
              const isActive = selectedAnalyzer === analyzer;
              return (
                <motion.button
                  key={analyzer}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onAnalyzerChange(isActive ? null : analyzer)}
                  className={`rounded-md px-3 py-1.5 text-[0.45rem] uppercase tracking-[0.3em] transition-all ${
                    isActive
                      ? 'bg-[rgba(16,50,95,0.8)] text-cyan-100 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                      : 'text-ink/65 hover:text-cyan-100 hover:bg-[rgba(12,28,52,0.5)]'
                  }`}
                >
                  {analyzer}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      </div>
    </div>
  );
};

export default FlowConsoleHeader;



