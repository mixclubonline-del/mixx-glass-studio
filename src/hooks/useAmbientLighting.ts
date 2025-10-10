/**
 * React hook for subscribing to Ambient Engine updates
 */

import { useEffect, useState } from 'react';
import { ambientEngine, type AmbientState } from '@/ai/ambientEngine';

export const useAmbientLighting = () => {
  const [ambientState, setAmbientState] = useState<AmbientState>(
    ambientEngine.getState()
  );

  useEffect(() => {
    const unsubscribe = ambientEngine.subscribe((state) => {
      setAmbientState(state);
    });

    return unsubscribe;
  }, []);

  const lightingDirective = ambientEngine.getLightingDirective();

  return {
    ambientState,
    lightingDirective,
    mood: ambientState.mood,
    energy: ambientState.energy,
    primaryColor: ambientState.primaryColor,
    secondaryColor: ambientState.secondaryColor
  };
};
