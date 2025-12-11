/**
 * Flow Loop Hook
 * 
 * The canonical 7-step behavior loop that runs every 30-50ms.
 * This is the brainstem of Mixx Club Studio.
 * 
 * Loop steps:
 * 1. Prime Brain senses inputs
 * 2. Behavior Engine interprets
 * 3. ALS displays brain state
 * 4. Bloom prepares context
 * 5. Session Core adjusts logic
 * 6. UI reacts (via React)
 * 7. Prime Brain receives ALS feedback
 */

import { useEffect } from 'react';
import { usePrimeBrain } from './PrimeBrainContext';
import { useALS } from './ALSContext';
import { useSessionCore } from './SessionCoreContext';
import { useBloom } from './BloomContext';
import { gatherSessionSignals } from './gatherSessionSignals';
import { pruneEvents } from './pruneEvents';
import { usePerformanceMode } from '../performance/usePerformanceMode';
import { usePunchMode } from '../performance/punchMode';
import { useAutoPunch } from '../performance/autoPunch';
import { getBestTake } from '../performance/compBrain';
import { hasAudioPlaying, isActuallyPlaying } from './audioLevelDetector';
import { flowLoopLearning, recordActionFromSignals } from './flowLoopLearning';

const LOOP_INTERVAL_MS = 40; // ~25fps, smooth but not excessive

/**
 * Flow Loop Hook - runs the canonical 7-step behavior loop.
 * No parameters needed - reads from window.__mixx_* globals.
 */
export function useFlowLoop() {
  const primeBrain = usePrimeBrain();
  const als = useALS();
  const sessionCore = useSessionCore();
  const bloom = useBloom();
  const performanceMode = usePerformanceMode();
  const punchMode = usePunchMode();
  const autoPunch = useAutoPunch();
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Prune events first to keep memory usage constant and performance smooth
      pruneEvents();
      
      // Step 0: Check for actual audio (contextual awareness)
      // Get master analyser from window global (set by App.tsx)
      const masterAnalyser = (window as any).__mixx_masterAnalyser as AnalyserNode | null;
      const hasAudio = hasAudioPlaying(masterAnalyser);
      
      // Step 1: Sense session signals (reads from window.__mixx_* globals)
      const signals = gatherSessionSignals();
      
      // Contextual check: Only process if there's actual audio OR editing/recording activity
      // This ensures components are contextual - they only show values when there's real activity
      const isActive = hasAudio || signals.editing || signals.recording || signals.armedTrack;
      
      // Step 2: Prime Brain interprets (behavior engine computes automatically)
      // But only if there's actual activity (audio or user interaction)
      if (isActive) {
        primeBrain.updateFromSession(signals);
      } else {
        // No audio and no activity - reset to idle state
        primeBrain.updateFromSession({
          ...signals,
          playing: false, // Override playback state if no actual audio
        });
      }
      
      let brainState = primeBrain.state;
      
      // Record actions for learning (after brain state is computed)
      if (isActive) {
        recordActionFromSignals({
          ...signals,
          flow: brainState.flow,
          pulse: brainState.pulse,
          tension: brainState.tension,
          mode: brainState.mode,
        });
      }
      
      // Contextual adjustment: If no audio, reduce all values proportionally
      if (!hasAudio && signals.playing) {
        // Playback is "active" but no audio - reduce values
        brainState = {
          ...brainState,
          flow: brainState.flow * 0.3,
          pulse: brainState.pulse * 0.3,
          momentum: brainState.momentum * 0.3,
          tension: brainState.tension * 0.5,
        };
      }
      
      // Comping Brain feedback (if best take exists, subtly influence ALS)
      const bestTake = getBestTake();
      if (bestTake && bestTake.score >= 0.6) {
        // Better takes make ALS "greener" (warmer flow, higher pulse)
        // Score 0.6-1.0 maps to subtle ALS boost
        const scoreBoost = (bestTake.score - 0.6) * 0.5; // Max +20% boost
        als.setState({
          flow: Math.min(brainState.flow + scoreBoost, 1.0), // Warmer flow
          pulse: Math.min(brainState.pulse + (scoreBoost * 0.5), 1.0), // Slight pulse increase
          tension: brainState.tension, // Keep tension unchanged
          momentum: brainState.momentum,
          hushFlags: brainState.hushWarnings,
        });
      }
      
      // Auto-Punch prediction (if active, subtly influence ALS)
      if (autoPunch.autoPunch) {
        // Auto-arm punch engine preparation (via Session Core)
        // ALS behavior: subtle pulse increase, flow boost, slight tension
        als.setState({
          flow: Math.max(brainState.flow, 0.65), // Minimum 65% flow
          pulse: Math.min(brainState.pulse + 0.1, 1.0), // +10% pulse
          tension: Math.min(brainState.tension + 0.05, 1.0), // +5% tension
          momentum: brainState.momentum,
          hushFlags: brainState.hushWarnings,
        });
      }
      
      // Punch Mode takes highest precedence - override mode if punch detected
      if (punchMode.isPunch) {
        brainState = {
          ...brainState,
          mode: 'punch',
        };
      }
      
      // Punch Mode adaptations (highest priority)
      if (punchMode.isPunch) {
        // ALS becomes vocal punch meter
        // Flow warms by +15%, pulse quickens, tension rises to editing sweet spot
        als.setState({
          flow: Math.max(brainState.flow + 0.15, 0.7), // Minimum 70% flow
          pulse: Math.min(brainState.pulse + 0.15, 1.0), // Quickened pulse
          tension: Math.min(brainState.tension + 0.2, 0.85), // Editing sweet spot
          momentum: brainState.momentum,
          hushFlags: brainState.hushWarnings,
        });
        
        // Bloom stays hidden and quiet in Punch Mode
        // Don't prepare Bloom context - keep it completely silent
      } else if (performanceMode.isPerformance) {
        // Performance Mode adaptations
        // ALS becomes vocal meter + stability bar
        // Flow ≈ emotional steadiness, Pulse ≈ anticipation/breath control
        als.setState({
          flow: Math.max(brainState.flow, 0.55), // Minimum flow for stability
          pulse: performanceMode.isHushActive 
            ? Math.min(brainState.pulse + 0.1, 1.0) // Increase pulse on noise
            : brainState.pulse,
          tension: performanceMode.isHushActive
            ? Math.min(brainState.tension + 0.15, 1.0) // Increase tension on noise
            : brainState.tension,
          momentum: brainState.momentum,
          hushFlags: brainState.hushWarnings,
        });
        
        // Bloom stays silent in Performance Mode (quiet control room)
        // Don't prepare Bloom context - keep it quiet
      } else {
        // Normal mode: ALS displays brain state (passive, only displays)
        // But only if there's actual audio or activity
        if (isActive) {
          als.setState({
            flow: brainState.flow,
            pulse: brainState.pulse,
            tension: brainState.tension,
            momentum: brainState.momentum,
            hushFlags: brainState.hushWarnings,
          });
          
          // Step 4: Bloom prepares context (pre-charge, doesn't open)
          // Get learned patterns and predictions
          const commonActions = flowLoopLearning.getCommonActions(10);
          const predictions = flowLoopLearning.predictNextActions({
            flow: brainState.flow,
            pulse: brainState.pulse,
            tension: brainState.tension,
            mode: brainState.mode,
          }, 5);
          
          bloom.prepare({
            mode: brainState.mode,
            flow: brainState.flow,
            pulse: brainState.pulse,
            tension: brainState.tension,
            commonActions,
            predictions,
          });
        } else {
          // No audio and no activity - reset ALS to zero
          als.setState({
            flow: 0,
            pulse: 0,
            tension: 0,
            momentum: 0,
            hushFlags: [],
          });
          
          // Also reset window.__als global to ensure UI components see zero values
          if (typeof window !== 'undefined') {
            window.__als = window.__als || {
              flow: 0,
              temperature: 'cold',
              guidance: '',
              pulse: 0,
            };
            window.__als.pulse = 0;
            window.__als.flow = 0;
            window.__als.temperature = 'cold';
            (window.__als as any).momentum = 0;
            (window.__als as any).pressure = 0;
            (window.__als as any).harmony = 0;
          }
        }
      }
      
      // Step 5: Session Core adapts behavior (includes Performance Mode settings)
      sessionCore.applyBrainState(brainState);
      
      // Prepare auto-punch region if predicted (via Session Core)
      if (autoPunch.autoPunch && sessionCore.preparePunchRegion) {
        sessionCore.preparePunchRegion(autoPunch.autoPunch.start, autoPunch.autoPunch.end);
      }
      
      // Step 6: UI reacts via normal React updates (arrange, mixer, piano roll)
      // This happens automatically through React's rendering cycle
      
      // Step 7: Prime Brain receives ALS sensory feedback
      primeBrain.updateFromALS({
        flow: als.state.flow,
        pulse: als.state.pulse,
        tension: als.state.tension,
      });
    }, LOOP_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, [primeBrain, als, sessionCore, bloom, performanceMode, punchMode, autoPunch]);
}
