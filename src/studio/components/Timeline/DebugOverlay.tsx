/**
 * Debug Overlay - Shows timeline internals for QA and development
 */

import { useEffect, useState } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { BBTConverter } from '@/studio/utils/BBTConversion';

interface DebugOverlayProps {
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
}

export function DebugOverlay({ bpm, timeSignature }: DebugOverlayProps) {
  const [visible, setVisible] = useState(false);
  const {
    currentTime,
    zoom,
    gridSnap,
    gridMode,
    snapMode,
    currentTool,
    scrollMode,
    autoScrollEnabled,
    centerPlayhead,
    loopEnabled,
    loopStart,
    loopEnd,
    isPlaying,
  } = useTimelineStore();

  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  // Toggle with Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setVisible(v => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // FPS counter
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;

    const tick = (time: number) => {
      frames++;
      if (time - lastTime >= 1000) {
        setFps(frames);
        setFrameCount(f => f + frames);
        frames = 0;
        lastTime = time;
      }
      requestAnimationFrame(tick);
    };

    const rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  if (!visible) return null;

  const converter = new BBTConverter(bpm, timeSignature);
  const bbt = converter.secondsToBBT(currentTime);
  const gridUnit = gridMode === 'adaptive' 
    ? converter.getAdaptiveGridUnit(zoom)
    : 'fixed';

  return (
    <div className="fixed top-4 right-4 z-[9999] glass border border-primary/50 rounded-lg p-4 font-mono text-xs w-80 shadow-xl">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <span className="font-bold text-primary">⚙️ DEBUG OVERLAY</span>
        <button 
          onClick={() => setVisible(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {/* Playhead */}
        <div className="space-y-1">
          <div className="text-primary font-semibold">PLAYHEAD</div>
          <div>Time: <span className="text-accent">{currentTime.toFixed(3)}s</span></div>
          <div>BBT: <span className="text-accent">{converter.formatBBT(bbt)}</span></div>
          <div>Samples: <span className="text-accent">{converter.secondsToSamples(currentTime)}</span></div>
          <div>Playing: <span className={isPlaying ? 'text-green-400' : 'text-red-400'}>
            {isPlaying ? '▶ YES' : '⏸ NO'}
          </span></div>
        </div>

        {/* Grid */}
        <div className="space-y-1 pt-2 border-t border-border/50">
          <div className="text-primary font-semibold">GRID</div>
          <div>Mode: <span className="text-accent">{gridMode}</span></div>
          <div>Unit: <span className="text-accent">{gridUnit}</span></div>
          <div>Snap: <span className={gridSnap ? 'text-green-400' : 'text-red-400'}>
            {gridSnap ? 'ON' : 'OFF'}
          </span></div>
          <div>Snap Mode: <span className="text-accent">{snapMode}</span></div>
        </div>

        {/* Loop */}
        <div className="space-y-1 pt-2 border-t border-border/50">
          <div className="text-primary font-semibold">LOOP</div>
          <div>Enabled: <span className={loopEnabled ? 'text-green-400' : 'text-red-400'}>
            {loopEnabled ? 'YES' : 'NO'}
          </span></div>
          {loopEnabled && (
            <>
              <div>Start: <span className="text-accent">{loopStart.toFixed(3)}s</span></div>
              <div>End: <span className="text-accent">{loopEnd.toFixed(3)}s</span></div>
              <div>Length: <span className="text-accent">{(loopEnd - loopStart).toFixed(3)}s</span></div>
            </>
          )}
        </div>

        {/* View */}
        <div className="space-y-1 pt-2 border-t border-border/50">
          <div className="text-primary font-semibold">VIEW</div>
          <div>Zoom: <span className="text-accent">{zoom.toFixed(1)}px/s</span></div>
          <div>Tool: <span className="text-accent">{currentTool}</span></div>
          <div>Follow: <span className="text-accent">{scrollMode}</span></div>
          <div>Auto-scroll: <span className={autoScrollEnabled ? 'text-green-400' : 'text-red-400'}>
            {autoScrollEnabled ? 'ON' : 'OFF'}
          </span></div>
          <div>Center: <span className={centerPlayhead ? 'text-green-400' : 'text-red-400'}>
            {centerPlayhead ? 'YES' : 'NO'}
          </span></div>
        </div>

        {/* Performance */}
        <div className="space-y-1 pt-2 border-t border-border/50">
          <div className="text-primary font-semibold">PERFORMANCE</div>
          <div>FPS: <span className={fps >= 60 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
            {fps}
          </span></div>
          <div>Total Frames: <span className="text-accent">{frameCount.toLocaleString()}</span></div>
        </div>

        <div className="pt-2 mt-2 border-t border-border/50 text-center text-muted-foreground">
          Press <kbd className="px-1 py-0.5 bg-secondary rounded">Ctrl+Shift+D</kbd> to toggle
        </div>
      </div>
    </div>
  );
}
