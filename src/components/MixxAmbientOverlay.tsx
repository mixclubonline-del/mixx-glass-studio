/**
 * Mixx Ambient Overlay - Reactive lighting layer for the studio
 */

import { useAmbientLighting } from '@/hooks/useAmbientLighting';

export const MixxAmbientOverlay = () => {
  const { lightingDirective, mood, energy } = useAmbientLighting();

  const getAnimationClass = () => {
    switch (lightingDirective.mode) {
      case 'breathe':
        return 'animate-pulse';
      case 'pulse':
        return 'animate-[pulse_1s_ease-in-out_infinite]';
      case 'burst':
        return 'animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]';
      case 'ripple':
        return 'animate-[pulse_2s_ease-in-out_infinite]';
      default:
        return '';
    }
  };

  const gradientStyle = {
    background: `radial-gradient(circle at 50% 50%, ${lightingDirective.colors[0]}22 0%, ${lightingDirective.colors[1]}11 50%, transparent 100%)`,
    opacity: lightingDirective.intensity,
    transition: `all ${lightingDirective.speed}s ease-in-out`,
    animationDuration: `${lightingDirective.speed}s`
  };

  return (
    <>
      {/* Primary ambient layer */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 ${getAnimationClass()}`}
        style={gradientStyle}
        aria-hidden="true"
      />
      
      {/* Mood indicator (dev/debug) */}
      <div className="fixed bottom-4 left-4 glass-glow rounded-lg px-3 py-2 text-xs font-mono z-50 pointer-events-none">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: lightingDirective.colors[0] }}
          />
          <span className="text-muted-foreground">
            {mood} • {(energy * 100).toFixed(0)}% • {lightingDirective.mode}
          </span>
        </div>
      </div>
    </>
  );
};
