/**
 * useVelvetMastering - React hook for worklet-based mastering
 * Phase 37: Connect VelvetRealtimeProcessor to Playback
 * 
 * Provides real-time mastering with AudioWorklet-based Five Pillars.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MasteringProfile, MASTERING_PROFILES } from '../types/sonic-architecture';
import {
  VelvetRealtimeProcessor,
  createVelvetRealtimeProcessor,
} from '../audio/VelvetRealtimeProcessor';

type MasterProfileKey = keyof typeof MASTERING_PROFILES;

export interface UseVelvetMasteringOptions {
  /** Audio context to use */
  audioContext: AudioContext | null;
  /** Initial profile key */
  initialProfile?: MasterProfileKey;
  /** Prefer worklets over Web Audio nodes */
  preferWorklets?: boolean;
  /** Called when connection to audio node changes */
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseVelvetMasteringResult {
  /** Input node to connect audio source */
  input: AudioNode | null;
  /** Output node to connect to destination */
  output: AudioNode | null;
  /** Whether mastering is initialized */
  initialized: boolean;
  /** Whether using AudioWorklets */
  usingWorklets: boolean;
  /** Whether mastering is bypassed */
  bypassed: boolean;
  /** Current profile key */
  profileKey: MasterProfileKey;
  /** Set bypass state */
  setBypass: (bypassed: boolean) => void;
  /** Set profile */
  setProfile: (key: MasterProfileKey) => void;
  /** Set master gain (0-1) */
  setMasterGain: (gain: number) => void;
  /** Connect source node */
  connectSource: (source: AudioNode) => void;
  /** Connect to destination */
  connectDestination: (destination: AudioNode) => void;
  /** Disconnect all */
  disconnect: () => void;
}

export function useVelvetMastering(
  options: UseVelvetMasteringOptions
): UseVelvetMasteringResult {
  const {
    audioContext,
    initialProfile = 'streaming',
    preferWorklets = true,
    onConnectionChange,
  } = options;

  const processorRef = useRef<VelvetRealtimeProcessor | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [usingWorklets, setUsingWorklets] = useState(false);
  const [bypassed, setBypassed] = useState(false);
  const [profileKey, setProfileKey] = useState<MasterProfileKey>(initialProfile);

  // Initialize processor
  useEffect(() => {
    if (!audioContext) {
      setInitialized(false);
      return;
    }

    let cancelled = false;

    const initProcessor = async () => {
      try {
        const profile = MASTERING_PROFILES[profileKey];
        const processor = await createVelvetRealtimeProcessor(audioContext, {
          profile,
          useWorklets: preferWorklets,
          onWorkletStatus: (using) => {
            if (!cancelled) {
              setUsingWorklets(using);
            }
          },
        });

        if (cancelled) {
          processor?.disconnect();
          return;
        }

        processorRef.current = processor;
        setInitialized(!!processor);
        setUsingWorklets(processor?.isUsingWorklets() ?? false);

        console.log('[useVelvetMastering] Initialized:', {
          usingWorklets: processor?.isUsingWorklets(),
          profile: profileKey,
        });
      } catch (error) {
        console.error('[useVelvetMastering] Init failed:', error);
        setInitialized(false);
      }
    };

    initProcessor();

    return () => {
      cancelled = true;
      processorRef.current?.disconnect();
      processorRef.current = null;
      setInitialized(false);
    };
  }, [audioContext, preferWorklets]); // Note: profileKey not in deps to avoid re-init

  // Handle bypass
  const handleSetBypass = useCallback((value: boolean) => {
    processorRef.current?.setBypass(value);
    setBypassed(value);
  }, []);

  // Handle profile change
  const handleSetProfile = useCallback((key: MasterProfileKey) => {
    const profile = MASTERING_PROFILES[key];
    processorRef.current?.setProfile(profile);
    setProfileKey(key);
  }, []);

  // Handle master gain
  const handleSetMasterGain = useCallback((gain: number) => {
    processorRef.current?.setMasterGain(gain);
  }, []);

  // Connect source
  const connectSource = useCallback((source: AudioNode) => {
    if (!processorRef.current) {
      console.warn('[useVelvetMastering] Not initialized');
      return;
    }
    source.connect(processorRef.current.input);
    onConnectionChange?.(true);
  }, [onConnectionChange]);

  // Connect to destination
  const connectDestination = useCallback((destination: AudioNode) => {
    if (!processorRef.current) {
      console.warn('[useVelvetMastering] Not initialized');
      return;
    }
    processorRef.current.output.connect(destination);
    onConnectionChange?.(true);
  }, [onConnectionChange]);

  // Disconnect all
  const disconnect = useCallback(() => {
    processorRef.current?.disconnect();
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  return {
    input: processorRef.current?.input ?? null,
    output: processorRef.current?.output ?? null,
    initialized,
    usingWorklets,
    bypassed,
    profileKey,
    setBypass: handleSetBypass,
    setProfile: handleSetProfile,
    setMasterGain: handleSetMasterGain,
    connectSource,
    connectDestination,
    disconnect,
  };
}

export default useVelvetMastering;
