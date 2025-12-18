import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { NexusRule, NexusContext, NexusTrigger, NexusAction } from './NexusTypes';
import { FourAnchors } from '../types/sonic-architecture';
import { VelvetLoudnessMetrics } from '../audio/VelvetLoudnessMeter';
import { useTimelineStore } from '../state/timelineStore';

const NexusLogicContext = createContext<NexusContext | undefined>(undefined);

export const useNexusLogic = () => {
  const context = useContext(NexusLogicContext);
  if (!context) {
    throw new Error('useNexusLogic must be used within a NexusLogicProvider');
  }
  return context;
};

interface NexusLogicProviderProps {
  children: React.ReactNode;
  transportTime: number;
  isPlaying: boolean;
  onAction: (action: NexusAction) => void;
  masterAnalysis?: FourAnchors | null;
  loudnessMetrics?: VelvetLoudnessMetrics | null;
  bpm: number;
}

export const NexusLogicProvider: React.FC<NexusLogicProviderProps> = ({
  children,
  transportTime,
  isPlaying,
  onAction,
  masterAnalysis,
  loudnessMetrics,
  bpm,
}) => {
  const { markers, clips } = useTimelineStore();
  const [rules, setRules] = useState<NexusRule[]>([]);
  const [trends, setTrends] = useState<Record<string, 'UP' | 'DOWN' | 'STABLE'>>({});
  const [registers, setRegisters] = useState<Record<string, any>>({});
  const intentsRef = useRef<Set<string>>(new Set());
  const metricHistoryRef = useRef<Record<string, { time: number; value: number }[]>>({});
  const lastEvaluatedTimeRef = useRef<number>(0);

  // Phase 7: Intent Registry
  const registerIntent = useCallback((intent: string) => {
    intentsRef.current.add(intent);
    // Intents last for 5 seconds by default if not cleared
    setTimeout(() => {
      intentsRef.current.delete(intent);
    }, 5000);
    console.log(`[Nexus] Intent registered: ${intent}`);
  }, []);

  const setRegister = useCallback((key: string, value: any) => {
    setRegisters(prev => ({ ...prev, [key]: value }));
    console.log(`[Nexus] Register updated: ${key} = ${value}`);
  }, []);

  // Phase 6: Metric History Tracking & Trend Calculation
  useEffect(() => {
    if (!masterAnalysis && !loudnessMetrics) return;
    const now = transportTime;
    
    const updateHistory = (type: string, val: number) => {
      if (!metricHistoryRef.current[type]) metricHistoryRef.current[type] = [];
      const history = metricHistoryRef.current[type];
      history.push({ time: now, value: val });
      
      if (history.length > 50) {
        metricHistoryRef.current[type] = history.filter(h => now - h.time < 10);
      }
    };

    if (loudnessMetrics) {
      updateHistory('LUFS_INTEGRATED', loudnessMetrics.integratedLUFS);
      updateHistory('LUFS_MOMENTARY', loudnessMetrics.momentaryLUFS);
    }
    if (masterAnalysis) {
      updateHistory('BODY', masterAnalysis.body);
      updateHistory('PRESENCE', masterAnalysis.soul);
      updateHistory('AIRINESS', masterAnalysis.air);
      if ((masterAnalysis as any).transientDensity) {
        updateHistory('TRANSIENT_DENSITY', (masterAnalysis as any).transientDensity);
      }
    }

    // Calculate Trends every second or so
    const calculateTrend = (type: string) => {
      const history = metricHistoryRef.current[type] || [];
      if (history.length < 10) return 'STABLE';
      
      const recent = history.slice(-5);
      const past = history.slice(-15, -10);
      
      if (past.length === 0) return 'STABLE';

      const recentAvg = recent.reduce((sum, h) => sum + h.value, 0) / recent.length;
      const pastAvg = past.reduce((sum, h) => sum + h.value, 0) / past.length;
      const diff = recentAvg - pastAvg;

      // Thresholds based on metric type
      const threshold = (type.includes('LUFS')) ? 0.3 : 1.5;
      
      if (diff > threshold) return 'UP';
      if (diff < -threshold) return 'DOWN';
      return 'STABLE';
    };

    setTrends({
      LUFS_INTEGRATED: calculateTrend('LUFS_INTEGRATED') as any,
      PRESENCE: calculateTrend('PRESENCE') as any,
      AIRINESS: calculateTrend('AIRINESS') as any,
      BODY: calculateTrend('BODY') as any,
      TRANSIENT_DENSITY: calculateTrend('TRANSIENT_DENSITY') as any,
    });

  }, [transportTime, masterAnalysis, loudnessMetrics]);

  const addRule = useCallback((rule: NexusRule) => {
    // Initialize adaptation state
    const adaptiveRule = {
      ...rule,
      confidenceScore: rule.confidenceScore ?? 1.0,
      enabled: rule.enabled ?? true
    };
    setRules((prev) => [...prev, adaptiveRule]);
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  // Phase 6: User-Override Learning
  const rejectRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newScore = Math.max(0, (r.confidenceScore ?? 1.0) - 0.2);
          return { 
            ...r, 
            confidenceScore: newScore,
            // Inhibit for 30 seconds
            suppressUntil: Date.now() + 30000,
            // Auto-disable if confidence is critically low
            enabled: newScore > 0.3 ? r.enabled : false
          };
        }
        return r;
      })
    );
    console.log(`[Nexus] Rule ${id} rejected. Confidence decreased.`);
  }, []);

  // Evaluation Loop
  useEffect(() => {
    if (!isPlaying) return;

    const secondsPerBeat = 60 / bpm;
    const currentBeat = Math.floor(transportTime / secondsPerBeat);
    
    // Revised Helper for Phase 7: Synapse Evaluation
    const evaluateTrigger = (trigger: NexusTrigger, rule: NexusRule): boolean => {
      let triggered = false;
      const { lastFired, suppressUntil } = rule;

      // Phase 6: Inhibition Logic
      if (suppressUntil && Date.now() < suppressUntil) return false;

      // Phase 7: Register Condition Check
      if (trigger.params.register) {
        const val = registers[trigger.params.register];
        if (val !== trigger.params.registerValue) return false;
      }

      switch (trigger.type) {
        case 'AGENT_INTENT': {
          if (trigger.params.intent) {
            triggered = intentsRef.current.has(trigger.params.intent);
          }
          break;
        }
        case 'BEAT': {
          const targetBeat = trigger.params.beat ?? 0;
          
          // Phase 6: Organic Variance (Non-deterministic Timing)
          const jitter = trigger.params.variance ? (Math.random() - 0.5) * 2 * trigger.params.variance * 200 : 0;
          const leadTimeSeconds = ((trigger.params.leadTimeMs ?? 0) + jitter) / 1000;
          
          const targetTime = targetBeat * secondsPerBeat;
          
          if (transportTime >= targetTime - leadTimeSeconds && 
              transportTime < targetTime + 0.1 && 
              lastFired !== targetBeat) {
            triggered = true;
          }
          break;
        }
        case 'SONIC_METRIC': {
          if (!masterAnalysis && !loudnessMetrics) return false;
          
          let currentValue = 0;
          const { metricType, threshold, operator, snapToGrid, deltaThreshold, deltaWindowMs } = trigger.params;
          const type = metricType || 'LUFS_INTEGRATED';
          
          if (type === 'LUFS_INTEGRATED') currentValue = loudnessMetrics?.integratedLUFS ?? -Infinity;
          else if (type === 'LUFS_MOMENTARY') currentValue = loudnessMetrics?.momentaryLUFS ?? -Infinity;
          else if (type === 'BODY') currentValue = masterAnalysis?.body ?? 0;
          else if (type === 'PRESENCE') currentValue = masterAnalysis?.soul ?? 0;
          else if (type === 'AIRINESS') currentValue = masterAnalysis?.air ?? 0;
          else if (type === 'TRANSIENT_DENSITY') currentValue = (masterAnalysis as any)?.transientDensity ?? 0;

          // Phase 6: Trend-Based Differential Analysis
          if (deltaThreshold && deltaWindowMs) {
            const history = metricHistoryRef.current[type] || [];
            const lookbackTime = transportTime - (deltaWindowMs / 1000);
            const pastEntry = history.slice().reverse().find(h => h.time <= lookbackTime);
            
            if (pastEntry) {
              const delta = currentValue - pastEntry.value;
              triggered = Math.abs(delta) >= deltaThreshold;
            }
          } else {
            // Standard static threshold
            const thresh = threshold ?? 0;
            if (operator === '>') triggered = currentValue > thresh;
            else if (operator === '<') triggered = currentValue < thresh;
            else if (operator === '>=') triggered = currentValue >= thresh;
          }

          if (triggered && snapToGrid) {
            const isOnBeat = Math.abs(transportTime % secondsPerBeat) < 0.05;
            if (!isOnBeat) triggered = false;
          }

          if (triggered && lastFired && Date.now() - (lastFired as number) < 500) {
            triggered = false;
          }
          break;
        }
        case 'ARRANGEMENT_LOOKAHEAD': {
          const { lookaheadMs, targetMarker, eventType } = trigger.params;
          const lookaheadSec = (lookaheadMs ?? 0) / 1000;
          
          if (eventType === 'MARKER') {
            const upcomingMarker = markers.find(m => {
              const timeToEvent = m.time - transportTime;
              const matchesName = targetMarker ? m.name === targetMarker : true;
              return timeToEvent > 0 && timeToEvent <= lookaheadSec && matchesName;
            });
            
            if (upcomingMarker) {
              const markerKey = `marker-${upcomingMarker.id}`;
              if (lastFired !== markerKey) {
                triggered = true;
                // We'll store the object ID in lastFired to avoid repeat triggers for the same event
                (rule as any)._lookaheadId = markerKey;
              }
            }
          } else if (eventType === 'CLIP_START' || eventType === 'CLIP_END') {
            const upcomingClip = clips.find(c => {
              const eventTime = eventType === 'CLIP_START' ? c.start : (c.start + c.duration);
              const timeToEvent = eventTime - transportTime;
              return timeToEvent > 0 && timeToEvent <= lookaheadSec;
            });
            
            if (upcomingClip) {
              const clipKey = `clip-${eventType}-${upcomingClip.id}`;
              if (lastFired !== clipKey) {
                triggered = true;
                (rule as any)._lookaheadId = clipKey;
              }
            }
          }
          break;
        }
        default:
          break;
      }
      return triggered;
    };

    rules.forEach((rule) => {
      if (!rule.enabled) return;

      const { trigger } = rule;
      let triggered = evaluateTrigger(trigger, rule);

      // Phase 5/6: Multi-Trigger Logic (AND/OR)
      if (trigger.params.secondaryTrigger && trigger.params.logicType) {
        const secondaryTriggered = evaluateTrigger(trigger.params.secondaryTrigger, rule);
        
        if (trigger.params.logicType === 'AND') {
          triggered = triggered && secondaryTriggered;
        } else if (trigger.params.logicType === 'OR') {
          triggered = triggered || secondaryTriggered;
        }
      }

      if (triggered) {
        // Phase 9: Dynamic Expression Evaluation for Registers
        const evaluateExpression = (expr: string, contextVal: any): any => {
          try {
            // Simple expression evaluator (e.g. "x * 0.5")
            // In a production app, we'd use a safer sandboxed parser
            const fn = new Function('x', 'registers', 'metrics', `return ${expr}`);
            return fn(contextVal, registers, { 
              lufs: loudnessMetrics?.integratedLUFS ?? 0,
              presence: masterAnalysis?.soul ?? 0
            });
          } catch (e) {
            console.error('[Nexus] Expression eval failed:', expr, e);
            return contextVal;
          }
        };

        // Handle Phase 7/9 Actions locally
        const performAction = (action: NexusAction) => {
          const { registerKey, registerValue, expression } = action.params;
          
          if (registerKey) {
            let finalVal = registerValue;
            if (expression) {
              const currentVal = registers[registerKey] ?? 0;
              finalVal = evaluateExpression(expression, currentVal);
            }
            setRegister(registerKey, finalVal);
          }

          // Phase 9: Engine Steering (Quantum Core / Five Pillars)
          if (action.type === 'QUANTUM_STEER' && action.params.engine) {
            console.log(`[Nexus] Steering ${action.params.engine}:${action.params.parameter} via ${action.params.expression || action.params.value}`);
            window.dispatchEvent(new CustomEvent('nexus:engine:steer', {
              detail: {
                engine: action.params.engine,
                parameter: action.params.parameter,
                value: action.params.value,
                expression: action.params.expression
              }
            }));
          }

          onAction(action);
        };

        if (rule.action.params.delayMs) {
          setTimeout(() => performAction(rule.action), rule.action.params.delayMs);
        } else {
          performAction(rule.action);
        }
        
        // lastFired timestamp: use beat for BEAT triggers, lookaheadId for lookahead, wall clock otherwise
        let timestamp: any = Date.now();
        if (trigger.type === 'BEAT') {
          timestamp = trigger.params.beat ?? currentBeat;
        } else if (trigger.type === 'ARRANGEMENT_LOOKAHEAD') {
          timestamp = (rule as any)._lookaheadId || Date.now();
        }

        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, lastFired: timestamp } : r))
        );
      }
    });

    lastEvaluatedTimeRef.current = transportTime;
  }, [transportTime, isPlaying, rules, onAction, masterAnalysis, loudnessMetrics, bpm, registers]);

  return (
    <NexusLogicContext.Provider value={{ 
      rules, 
      addRule, 
      removeRule, 
      toggleRule,
      rejectRule,
      registers,
      setRegister,
      registerIntent,
      markers,
      clips,
      masterAnalysis,
      loudnessMetrics,
      trends,
      transportTime,
      bpm
    } as any}>
      {children}
    </NexusLogicContext.Provider>
  );
};
