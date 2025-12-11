/**
 * External Plugin Test Button
 * 
 * Adds a test button to access the external plugin test harness.
 * Only visible in development mode.
 * 
 * Supports Flow by providing easy access to testing without disrupting workflow.
 */

import React, { useState } from 'react';
import { ExternalPluginTestHarness } from '../../plugins/external/test/ExternalPluginTestHarness';

interface ExternalPluginTestButtonProps {
  audioContext: AudioContext | null;
}

export const ExternalPluginTestButton: React.FC<ExternalPluginTestButtonProps> = ({ audioContext }) => {
  const [isTestOpen, setIsTestOpen] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsTestOpen(true)}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/30 rounded-lg text-purple-200 text-sm font-bold backdrop-blur-sm shadow-lg"
        title="Test External Plugin System"
      >
        🧪 Test External Plugins
      </button>
      
      {isTestOpen && (
        <ExternalPluginTestHarness
          audioContext={audioContext}
          onClose={() => setIsTestOpen(false)}
        />
      )}
    </>
  );
};









