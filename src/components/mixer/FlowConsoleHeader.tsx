/**
 * FLOW CONSOLE HEADER
 * 
 * Global console controls and view mode toggles.
 * Respects Flow Doctrine: ALS is law, Reductionist, Flow-conscious.
 */

import React from 'react';
import { hexToRgba } from '../../utils/ALS';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

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
      style={composeStyles(
        layout.position.relative,
        layout.flex.container('row'),
        layout.flex.align.center,
        layout.flex.justify.between,
        spacing.gap(6),
        spacing.px(6),
        spacing.py(4),
        effects.border.bottom(),
        effects.backdrop.blur('strong'),
        {
          borderBottom: '1px solid rgba(102, 140, 198, 0.6)',
          background: 'rgba(8,12,24,0.85)',
          ...(className ? { className } : {}),
        }
      )}
    >
      {/* Left: View Mode Toggles */}
      <div style={composeStyles(
        layout.flex.container('row'),
        layout.flex.align.center,
        spacing.gap(3)
      )}>
        <span style={composeStyles(
          typography.transform('uppercase'),
          typography.tracking.widest,
          {
            fontSize: '0.55rem',
            color: 'rgba(230, 240, 255, 0.55)',
          }
        )}>
          View
        </span>
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(1.5),
          spacing.p(1),
          effects.border.radius.xl,
          {
            border: '1px solid rgba(102, 140, 198, 0.7)',
            background: 'rgba(6,14,28,0.65)',
          }
        )}>
          {VIEW_MODE_DEFINITIONS.map(({ id, label, icon }) => {
            const isActive = viewMode === id;
            return (
              <button
                key={id}
                onClick={() => onViewModeChange(id)}
                style={composeStyles(
                  layout.position.relative,
                  spacing.px(4),
                  spacing.py(2),
                  effects.border.radius.lg,
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  transitions.transition.standard('all', 200, 'ease-out'),
                  {
                    fontSize: '0.48rem',
                    border: isActive ? '1px solid rgba(125, 211, 252, 0.7)' : '1px solid transparent',
                    background: isActive
                      ? 'rgba(16,50,95,0.8)'
                      : 'transparent',
                    color: isActive
                      ? 'rgba(207, 250, 254, 1)'
                      : 'rgba(230, 240, 255, 0.65)',
                    boxShadow: isActive
                      ? '0 0 12px rgba(56,189,248,0.4)'
                      : 'none',
                    cursor: 'pointer',
                  }
                )}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'rgba(207, 250, 254, 1)';
                    e.currentTarget.style.background = 'rgba(12,28,52,0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'rgba(230, 240, 255, 0.65)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span style={{ marginRight: '6px', fontSize: '0.65rem' }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: Console Stats */}
      <div style={composeStyles(
        layout.flex.container('row'),
        layout.flex.align.center,
        spacing.gap(6)
      )}>
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(3),
          typography.transform('uppercase'),
          typography.tracking.widest,
          {
            fontSize: '0.45rem',
            color: 'rgba(230, 240, 255, 0.6)',
          }
        )}>
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            spacing.gap(1.5)
          )}>
            <span style={{ color: 'rgba(230, 240, 255, 0.45)' }}>Tracks</span>
            <span style={composeStyles(
              typography.weight('semibold'),
              { color: '#e6f0ff' }
            )}>{trackCount}</span>
          </div>
          <div style={composeStyles(
            { height: '12px', width: '1px' },
            { background: 'rgba(102, 140, 198, 0.5)' }
          )} />
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            spacing.gap(1.5)
          )}>
            <span style={{ color: 'rgba(230, 240, 255, 0.45)' }}>Buses</span>
            <span style={composeStyles(
              typography.weight('semibold'),
              { color: '#e6f0ff' }
            )}>{busCount}</span>
          </div>
        </div>

        {masterFeedback && (
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            spacing.gap(3),
            spacing.px(4),
            spacing.py(2),
            effects.border.radius.xl,
            {
              border: '1px solid rgba(102, 140, 198, 0.6)',
              background: 'rgba(6,14,28,0.7)',
            }
          )}>
            <div style={composeStyles(
              layout.flex.container('col'),
              spacing.gap(0.5)
            )}>
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.42rem',
                  color: 'rgba(230, 240, 255, 0.55)',
                }
              )}>
                Master ALS
              </span>
              <span style={composeStyles(
                typography.weight('semibold'),
                {
                  fontSize: '0.65rem',
                  letterSpacing: '0.2em',
                  color: 'rgba(207, 250, 254, 1)',
                }
              )}>
                {temperature.toUpperCase()}
              </span>
            </div>
            <div style={composeStyles(
              { height: '32px', width: '1px' },
              { background: 'rgba(102, 140, 198, 0.4)' }
            )} />
            <div style={composeStyles(
              layout.flex.container('col'),
              spacing.gap(0.5)
            )}>
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.42rem',
                  color: 'rgba(230, 240, 255, 0.55)',
                }
              )}>
                Flow
              </span>
              <span style={composeStyles(
                typography.weight('semibold'),
                {
                  fontSize: '0.65rem',
                  letterSpacing: '0.2em',
                  color: '#e6f0ff',
                }
              )}>
                {Math.round(flow * 100)}%
              </span>
            </div>
            <div style={composeStyles(
              { height: '32px', width: '1px' },
              { background: 'rgba(102, 140, 198, 0.4)' }
            )} />
            <div style={composeStyles(
              layout.flex.container('col'),
              spacing.gap(0.5)
            )}>
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.42rem',
                  color: 'rgba(230, 240, 255, 0.55)',
                }
              )}>
                Pulse
              </span>
              <span style={composeStyles(
                typography.weight('semibold'),
                {
                  fontSize: '0.65rem',
                  letterSpacing: '0.2em',
                  color: '#e6f0ff',
                }
              )}>
                {Math.round(pulse * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Analyzer Tools */}
      {viewMode === 'analyzer' && onAnalyzerChange && (
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(2)
        )}>
          <span style={composeStyles(
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              fontSize: '0.45rem',
              color: 'rgba(230, 240, 255, 0.55)',
            }
          )}>
            Tool
          </span>
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            spacing.gap(1),
            spacing.p(0.5),
            effects.border.radius.lg,
            {
              border: '1px solid rgba(102, 140, 198, 0.7)',
              background: 'rgba(6,14,28,0.65)',
            }
          )}>
            {(['spectrum', 'correlation', 'lufs'] as const).map((analyzer) => {
              const isActive = selectedAnalyzer === analyzer;
              return (
                <button
                  key={analyzer}
                  onClick={() => onAnalyzerChange(isActive ? null : analyzer)}
                  style={composeStyles(
                    spacing.px(3),
                    spacing.py(1.5),
                    effects.border.radius.md,
                    typography.transform('uppercase'),
                    typography.tracking.widest,
                    transitions.transition.standard('all', 200, 'ease-out'),
                    {
                      fontSize: '0.45rem',
                      background: isActive
                        ? 'rgba(16,50,95,0.8)'
                        : 'transparent',
                      color: isActive
                        ? 'rgba(207, 250, 254, 1)'
                        : 'rgba(230, 240, 255, 0.65)',
                      boxShadow: isActive
                        ? '0 0 8px rgba(56,189,248,0.3)'
                        : 'none',
                      cursor: 'pointer',
                    }
                  )}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'rgba(207, 250, 254, 1)';
                      e.currentTarget.style.background = 'rgba(12,28,52,0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'rgba(230, 240, 255, 0.65)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {analyzer}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Gradient Overlay */}
      <div style={composeStyles(
        layout.position.absolute,
        { inset: 0 },
        { pointerEvents: 'none' }
      )}>
        <div style={composeStyles(
          layout.position.absolute,
          { left: 0, right: 0, top: 0 },
          {
            height: '4px',
            background: 'linear-gradient(to right, transparent, rgba(103, 232, 249, 0.2), transparent)',
          }
        )} />
      </div>
    </div>
  );
};

export default FlowConsoleHeader;





