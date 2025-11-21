/**
 * Audio Status Indicator
 * 
 * Shows AudioContext state and provides device selection.
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

import React, { useState, useEffect } from 'react';
import AudioDeviceSelector from './AudioDeviceSelector';
import { ensureAudioContextResumed, getAudioContextStateMessage, needsUserInteraction } from '../utils/audioDeviceManager';

interface AudioStatusIndicatorProps {
  audioContext: AudioContext | null;
  masterInput?: AudioNode | null;
  onResume?: () => Promise<void>;
}

export const AudioStatusIndicator: React.FC<AudioStatusIndicatorProps> = ({
  audioContext,
  masterInput,
  onResume,
}) => {
  const [showDevices, setShowDevices] = useState(false);
  const [contextState, setContextState] = useState<string>('unknown');

  useEffect(() => {
    if (!audioContext) {
      setContextState('unknown');
      return;
    }

    setContextState(audioContext.state);

    const updateState = () => setContextState(audioContext.state);
    audioContext.addEventListener('statechange', updateState);

    return () => {
      audioContext.removeEventListener('statechange', updateState);
    };
  }, [audioContext]);

  const handleResume = async () => {
    if (audioContext && audioContext.state === 'suspended') {
      const resumed = await ensureAudioContextResumed(audioContext);
      if (resumed && onResume) {
        await onResume();
      }
    }
  };

  const stateColor =
    contextState === 'running'
      ? 'text-green-400'
      : contextState === 'suspended'
      ? 'text-yellow-400'
      : contextState === 'closed'
      ? 'text-red-400'
      : 'text-ink/60';

  const stateIcon =
    contextState === 'running' ? '🔊' : contextState === 'suspended' ? '⏸️' : '❌';

  const [isResuming, setIsResuming] = useState(false);

  const handleMainButtonClick = async (e: React.MouseEvent) => {
    // If suspended, resume audio immediately (primary action)
    if (contextState === 'suspended') {
      e.stopPropagation();
      setIsResuming(true);
      try {
        await handleResume();
        // Small delay to show feedback
        setTimeout(() => setIsResuming(false), 500);
      } catch (error) {
        setIsResuming(false);
        console.error('[AUDIO STATUS] Failed to resume:', error);
      }
      // Don't toggle dropdown when resuming
      return;
    }
    // Otherwise, toggle device selector (secondary action)
    setShowDevices(!showDevices);
  };

  return (
    <div className="relative">
      <button
        onClick={handleMainButtonClick}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
          contextState === 'suspended'
            ? 'border-yellow-400/40 bg-yellow-400/10 hover:bg-yellow-400/20 cursor-pointer'
            : 'border-white/10 bg-white/5 hover:bg-white/10'
        } ${isResuming ? 'animate-pulse' : ''}`}
        title={getAudioContextStateMessage(audioContext)}
      >
        <span className={stateColor}>{stateIcon}</span>
        <span className="text-ink/80 capitalize">{contextState}</span>
        {needsUserInteraction(audioContext) && (
          <span className="text-[10px] text-yellow-400 font-medium">Click to enable</span>
        )}
      </button>

      {showDevices && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-white/10 bg-glass-surface p-4 shadow-lg">
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-ink">Audio Status</h3>
            <p className="text-xs text-ink/60">{getAudioContextStateMessage(audioContext)}</p>
            {contextState === 'suspended' && (
              <button
                onClick={handleResume}
                className="mt-2 rounded bg-cyan-500/20 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/30"
              >
                Resume Audio
              </button>
            )}
          </div>
          <AudioDeviceSelector />
        </div>
      )}
    </div>
  );
};

export default AudioStatusIndicator;

